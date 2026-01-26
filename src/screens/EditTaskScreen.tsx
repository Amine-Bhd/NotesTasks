import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  KeyboardAvoidingView,
  Text,
  Modal,
  ScrollView
} from 'react-native';
import { useStore } from '../store/useStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Check, ArrowLeft, Trash2, StickyNote, Plus, ExternalLink, X } from 'lucide-react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function EditTaskScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { tasks, notes, addTask, updateTask, deleteTask, linkNoteToTask, unlinkNoteFromTask } = useStore();
  
  const taskId = (route.params as any)?.taskId;
  const parentTaskId = (route.params as any)?.parentTaskId;
  const existingTask = tasks.find(t => t.id === taskId);

  const [title, setTitle] = useState(existingTask?.title || '');
  const [isNotePickerVisible, setIsNotePickerVisible] = useState(false);

  const linkedNote = notes.find(n => n.id === existingTask?.linkedNoteId);

  const handleSave = () => {
    if (!title.trim()) return;

    if (existingTask) {
      updateTask(taskId, { title });
    } else {
      addTask({
        id: uuidv4(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
        parentTaskId: parentTaskId,
      });
    }
    navigation.goBack();
  };

  const handleLinkNote = (noteId: string) => {
    if (taskId) {
      linkNoteToTask(noteId, taskId);
    }
    setIsNotePickerVisible(false);
  };

  const handleUnlinkNote = () => {
    if (linkedNote) {
      unlinkNoteFromTask(linkedNote.id);
    }
  };

  const handleDelete = () => {
    if (existingTask) {
      deleteTask(taskId);
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {existingTask && (
            <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
              <Trash2 color="#FF3B30" size={24} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
            <Check color="#007AFF" size={24} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>
        <TextInput
          style={styles.titleInput}
          placeholder="Task title"
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        {existingTask && (
          <View style={styles.linkingSection}>
            <Text style={styles.sectionTitle}>Linked Note</Text>
            {linkedNote ? (
              <View style={styles.linkedItemCard}>
                <StickyNote color="#007AFF" size={20} />
                <Text style={styles.linkedItemTitle} numberOfLines={1}>
                  {linkedNote.title}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Notes' })}>
                  <ExternalLink color="#007AFF" size={18} style={styles.linkActionIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUnlinkNote}>
                  <X color="#FF3B30" size={18} style={styles.linkActionIcon} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addLinkButton}
                onPress={() => setIsNotePickerVisible(true)}
              >
                <Plus color="#007AFF" size={20} />
                <Text style={styles.addLinkText}>Link to Note</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <Modal
        visible={isNotePickerVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link to Note</Text>
              <TouchableOpacity onPress={() => setIsNotePickerVisible(false)}>
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {notes.filter(n => !n.linkedTaskId).map((note) => (
                <TouchableOpacity 
                  key={note.id} 
                  style={styles.pickerItem}
                  onPress={() => handleLinkNote(note.id)}
                >
                  <StickyNote color="#666" size={18} />
                  <Text style={styles.pickerItemText}>{note.title}</Text>
                </TouchableOpacity>
              ))}
              {notes.filter(n => !n.linkedTaskId).length === 0 && (
                <Text style={styles.emptyText}>No unlinked notes available.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 20,
  },
  linkingSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  linkedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    padding: 12,
    borderRadius: 8,
  },
  linkedItemTitle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  linkActionIcon: {
    marginLeft: 10,
  },
  addLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addLinkText: {
    color: '#007AFF',
    marginLeft: 5,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    marginLeft: 15,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
  },
});
