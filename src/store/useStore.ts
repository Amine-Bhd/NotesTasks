import { create } from 'zustand';
import { Note, Task } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
  notes: Note[];
  tasks: Task[];
  fetchData: () => Promise<void>;
  addNote: (note: Note) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  linkNoteToTask: (noteId: string, taskId: string) => Promise<void>;
  unlinkNoteFromTask: (noteId: string) => Promise<void>;
  getSubtasks: (parentId: string) => Task[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  notes: [],
  tasks: [],
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  fetchData: async () => {
    try {
      const { data: notes, error: notesError } = await supabase.from('notes').select('*');
      if (notesError) {
        console.warn('Error fetching notes:', notesError.message);
      } else if (notes) {
        set({ notes });
      }

      const { data: tasks, error: tasksError } = await supabase.from('tasks').select('*');
      if (tasksError) {
        console.warn('Error fetching tasks:', tasksError.message);
      } else if (tasks) {
        set({ tasks });
      }
    } catch (e) {
      console.warn('Unexpected error fetching data:', e);
    }
  },

  addNote: async (note) => {
    const { error } = await supabase.from('notes').insert([note]);
    if (!error) set((state) => ({ notes: [...state.notes, note] }));
  },

  updateNote: async (id, updatedNote) => {
    const { error } = await supabase.from('notes').update(updatedNote).eq('id', id);
    if (!error)
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, ...updatedNote } : n)),
      }));
  },

  deleteNote: async (id) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error)
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        tasks: state.tasks.map((t) => (t.linkedNoteId === id ? { ...t, linkedNoteId: undefined } : t)),
      }));
  },

  addTask: async (task) => {
    const { error } = await supabase.from('tasks').insert([task]);
    if (!error) set((state) => ({ tasks: [...state.tasks, task] }));
  },

  updateTask: async (id, updatedTask) => {
    // Optimistic update first (complex logic needs local state handling before async)
    
    // Check if we are toggling completion
    if (updatedTask.completed !== undefined) {
      const state = get();
      const task = state.tasks.find(t => t.id === id);
      
      if (task) {
        // If marking as completed
        if (updatedTask.completed === true) {
           // Find all subtasks
           const subtasks = state.tasks.filter(t => t.parentTaskId === id);
           
           if (subtasks.length > 0) {
             // Snapshot current states
             const snapshot: Record<string, boolean> = {};
             subtasks.forEach(sub => {
               snapshot[sub.id] = sub.completed;
             });
             
             // Update parent with snapshot and completed=true
             // And update all subtasks to completed=true
             
             // 1. Update Parent
             const { error: pError } = await supabase.from('tasks').update({ 
               ...updatedTask, 
               previousSubtaskStates: snapshot 
             }).eq('id', id);

             if (!pError) {
               // 2. Update Subtasks
               const subtaskIds = subtasks.map(t => t.id);
               await supabase.from('tasks').update({ completed: true }).in('id', subtaskIds);
               
               // Update local state
               set((state) => ({
                 tasks: state.tasks.map((t) => {
                   if (t.id === id) return { ...t, ...updatedTask, previousSubtaskStates: snapshot };
                   if (t.parentTaskId === id) return { ...t, completed: true };
                   return t;
                 }),
               }));
               return; // Exit as we handled everything
             }
           }
        } 
        // If marking as uncompleted (undo)
        else if (updatedTask.completed === false) {
           // Check for snapshot
           if (task.previousSubtaskStates) {
             const snapshot = task.previousSubtaskStates;
             
             // 1. Update Parent (clear snapshot)
             const { error: pError } = await supabase.from('tasks').update({ 
               ...updatedTask, 
               previousSubtaskStates: null 
             }).eq('id', id);
             
             if (!pError) {
               // 2. Restore Subtasks individually (Supabase doesn't support bulk update with different values easily in one call, so we iterate or use a stored procedure. Iterating for prototype)
               // Actually, iterating is slow. But for a prototype, it's fine.
               
               const updates = Object.entries(snapshot).map(([subId, wasCompleted]) => 
                 supabase.from('tasks').update({ completed: wasCompleted }).eq('id', subId)
               );
               await Promise.all(updates);

               // Update local state
               set((state) => ({
                 tasks: state.tasks.map((t) => {
                   if (t.id === id) return { ...t, ...updatedTask, previousSubtaskStates: undefined };
                   if (snapshot[t.id] !== undefined) return { ...t, completed: snapshot[t.id] };
                   return t;
                 }),
               }));
               return;
             }
           }
        }
      }
    }

    // Default simple update
    const { error } = await supabase.from('tasks').update(updatedTask).eq('id', id);
    if (!error) {
      set((state) => {
        let newTasks = state.tasks.map((t) => (t.id === id ? { ...t, ...updatedTask } : t));
        
        // Logic: If a subtask changes completion, check if parent needs to update
        if (updatedTask.completed !== undefined) {
           const currentTask = newTasks.find(t => t.id === id);
           if (currentTask && currentTask.parentTaskId) {
             const parentId = currentTask.parentTaskId;
             const siblingTasks = newTasks.filter(t => t.parentTaskId === parentId);
             const allSiblingsDone = siblingTasks.every(t => t.completed);
             
             // If all siblings are done, mark parent as done
             if (allSiblingsDone) {
                // We need to update parent in DB and State
                // For the "undo" logic: if auto-completed, maybe we don't snapshot? 
                // Or we snapshot as if they were all false? 
                // The prompt says "keeping the clicked by error thing". 
                // If I click parent -> all children check (snapshot taken). Unclick parent -> restore.
                // If I check all children -> parent checks. 
                // If I then uncheck parent -> should it uncheck all children? Yes, consistent with "parent uncheck -> restore".
                // But what to restore? The state BEFORE parent was checked.
                // If parent was checked because all children were checked, the state before was "all children checked".
                // That implies unchecking parent would essentially do nothing or just uncheck parent?
                // Standard behavior: Unchecking parent unchecks all children.
                // So if auto-completed, we essentially consider it a "fresh" complete with all children true.
                
                // Let's just update the parent status for now.
                supabase.from('tasks').update({ completed: true }).eq('id', parentId).then();
                newTasks = newTasks.map(t => t.id === parentId ? { ...t, completed: true } : t);
             } 
             // Optional: If any sibling is NOT done, should parent be unchecked?
             // Usually yes for a strict tree.
             else {
                const parent = newTasks.find(t => t.id === parentId);
                if (parent && parent.completed) {
                   supabase.from('tasks').update({ completed: false }).eq('id', parentId).then();
                   newTasks = newTasks.map(t => t.id === parentId ? { ...t, completed: false } : t);
                }
             }
           }
        }
        return { tasks: newTasks };
      });
    }
  },

  deleteTask: async (id) => {
    const allTaskIdsToDelete = new Set([id]);
    const findSubtaskIds = (parentId: string) => {
      get().tasks.forEach(t => {
        if (t.parentTaskId === parentId) {
          allTaskIdsToDelete.add(t.id);
          findSubtaskIds(t.id);
        }
      });
    };
    findSubtaskIds(id);

    const { error } = await supabase.from('tasks').delete().in('id', Array.from(allTaskIdsToDelete));
    if (!error)
      set((state) => ({
        tasks: state.tasks.filter((t) => !allTaskIdsToDelete.has(t.id)),
        notes: state.notes.map((n) => (n.linkedTaskId && allTaskIdsToDelete.has(n.linkedTaskId) ? { ...n, linkedTaskId: undefined } : n)),
      }));
  },

  linkNoteToTask: async (noteId, taskId) => {
    const { error: nError } = await supabase.from('notes').update({ linkedTaskId: taskId }).eq('id', noteId);
    const { error: tError } = await supabase.from('tasks').update({ linkedNoteId: noteId }).eq('id', taskId);
    
    if (!nError && !tError) {
      set((state) => ({
        notes: state.notes.map((n) => n.id === noteId ? { ...n, linkedTaskId: taskId } : n),
        tasks: state.tasks.map((t) => t.id === taskId ? { ...t, linkedNoteId: noteId } : t),
      }));
    }
  },

  unlinkNoteFromTask: async (noteId) => {
    const note = get().notes.find((n) => n.id === noteId);
    const taskId = note?.linkedTaskId;

    const { error: nError } = await supabase.from('notes').update({ linkedTaskId: null }).eq('id', noteId);
    let tError = null;
    if (taskId) {
      const { error } = await supabase.from('tasks').update({ linkedNoteId: null }).eq('id', taskId);
      tError = error;
    }

    if (!nError && !tError) {
      set((state) => ({
        notes: state.notes.map((n) => n.id === noteId ? { ...n, linkedTaskId: undefined } : n),
        tasks: state.tasks.map((t) => t.id === taskId ? { ...t, linkedNoteId: undefined } : t),
      }));
    }
  },

  getSubtasks: (parentId) => get().tasks.filter(t => t.parentTaskId === parentId),
}));
