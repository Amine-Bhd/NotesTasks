import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useStore } from '../store/useStore';
import { Plus, LogOut, CheckCircle2, Circle, ListTodo } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export default function NotesScreen() {
  const { notes, tasks, isDarkMode } = useStore();
  const navigation = useNavigation<any>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
      },
      headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => supabase.auth.signOut()} 
          style={{ marginRight: 15 }}
        >
          <LogOut size={20} color="#FF3B30" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isDarkMode]);

  const getLinkedTask = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note?.linkedTaskId) return null;
    return tasks.find(t => t.id === note.linkedTaskId);
  };

  return (
    <View style={[styles.container, isDarkMode ? styles.darkContainer : undefined]}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const linkedTask = getLinkedTask(item.id);
          
          return (
            <TouchableOpacity 
              style={[styles.noteItem, isDarkMode ? styles.darkNoteItem : undefined]}
              onPress={() => navigation.navigate('EditNote', { noteId: item.id })}
            >
              <View style={styles.noteHeader}>
                <Text style={[styles.noteTitle, isDarkMode ? styles.darkText : undefined]}>{item.title}</Text>
                {linkedTask && (
                  <TouchableOpacity 
                    style={[styles.linkedTaskBadge, linkedTask.completed ? styles.taskCompletedBadge : styles.taskActiveBadge]}
                    onPress={() => navigation.navigate('Main', { screen: 'Tasks', params: { highlightTaskId: linkedTask.id } })}
                  >
                    {linkedTask.completed ? (
                      <CheckCircle2 size={16} color="#FFF" />
                    ) : (
                      <ListTodo size={16} color="#FFF" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <Text numberOfLines={2} style={[styles.noteContent, isDarkMode ? styles.darkSubtext : undefined]}>{item.content}</Text>
              <Text style={styles.noteDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={isDarkMode ? styles.darkSubtext : undefined}>No notes yet. Create one!</Text>
          </View>
        }
      />
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('EditNote')}
      >
        <Plus color="white" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#000000',
  },
  noteItem: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  darkNoteItem: {
    backgroundColor: '#1C1C1E',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginRight: 10,
  },
  linkedTaskBadge: {
    padding: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskActiveBadge: {
    backgroundColor: '#007AFF',
  },
  taskCompletedBadge: {
    backgroundColor: '#4CD964',
  },
  darkText: {
    color: '#FFFFFF',
  },
  noteContent: {
    color: '#666',
    marginBottom: 5,
  },
  darkSubtext: {
    color: '#8E8E93',
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
