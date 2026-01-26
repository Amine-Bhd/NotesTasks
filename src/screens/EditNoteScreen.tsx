import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Text,
  Modal,
  Linking,
  Alert
} from 'react-native';
import { useStore } from '../store/useStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Check, ArrowLeft, Trash2, Link as LinkIcon, Plus, ExternalLink, X, ListTodo, Pencil, Eye } from 'lucide-react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Hyperlink, Task } from '../types';
import NoteContent from '../components/NoteContent';

export default function EditNoteScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { notes, tasks, addNote, updateNote, deleteNote, linkNoteToTask, unlinkNoteFromTask } = useStore();
  
  const noteId = (route.params as any)?.noteId;
  const existingNote = notes.find(n => n.id === noteId);

  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [hyperlinks, setHyperlinks] = useState<Hyperlink[]>(existingNote?.hyperlinks || []);
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [isTaskPickerVisible, setIsTaskPickerVisible] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  
  // Default to View mode if note exists, Edit mode if new
  const [isEditMode, setIsEditMode] = useState(!existingNote);

  const linkedTask = tasks.find(t => t.id === existingNote?.linkedTaskId);

  const handleSave = () => {
    if (!title.trim()) return;

    if (existingNote) {
      updateNote(noteId, { title, content, hyperlinks });
    } else {
      addNote({
        id: uuidv4(),
        title,
        content,
        hyperlinks,
        createdAt: new Date().toISOString(),
      });
    }
    navigation.goBack();
  };
  
  // Save without exiting
  const handleQuickSave = () => {
     if (existingNote && title.trim()) {
       updateNote(noteId, { title, content, hyperlinks });
     }
  };

  const toggleMode = () => {
    if (isEditMode) {
      handleQuickSave(); // Save changes when switching to View
    }
    setIsEditMode(!isEditMode);
  };

  const handleLinkTask = (taskId: string) => {
    if (noteId) {
      linkNoteToTask(noteId, taskId);
    }
    setIsTaskPickerVisible(false);
  };

  const handleUnlinkTask = () => {
    if (noteId) {
      unlinkNoteFromTask(noteId);
    }
  };

  const addHyperlink = () => {
    if (!newLinkUrl.trim()) return;
    
    const newLink: Hyperlink = {
      id: uuidv4(),
      url: newLinkUrl,
      title: newLinkTitle || newLinkUrl,
      referenceNumber: hyperlinks.length + 1,
    };
    
    setHyperlinks([...hyperlinks, newLink]);
    setNewLinkUrl('');
    setNewLinkTitle('');
    setIsLinkModalVisible(false);
  };

  const removeHyperlink = (id: string) => {
    const updatedLinks = hyperlinks.filter(l => l.id !== id)
      .map((l, index) => ({ ...l, referenceNumber: index + 1 }));
    setHyperlinks(updatedLinks);
  };

  const insertReference = (refNum: number) => {
    if (isEditMode) {
      setContent(content + ` [${refNum}]`);
    } else {
      // In view mode, maybe scroll to reference? 
      // For now, switch to edit mode to insert? No, that's confusing.
      // Just show alert or ignore.
      Alert.alert("Info", "Switch to Edit Mode to insert reference.");
    }
  };

  const openLink = async (url: string) => {
    let targetUrl = url;
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      targetUrl = 'https://' + url;
    }

    const supported = await Linking.canOpenURL(targetUrl);
    if (supported) {
      await Linking.openURL(targetUrl);
    } else {
      Alert.alert("Error", "Cannot open this URL: " + targetUrl);
    }
  };

  const handleDelete = () => {
    if (existingNote) {
      deleteNote(noteId);
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
           <TouchableOpacity onPress={toggleMode} style={styles.iconButton}>
            {isEditMode ? (
              <Eye color="#007AFF" size={24} />
            ) : (
              <Pencil color="#007AFF" size={24} />
            )}
          </TouchableOpacity>
          {existingNote && (
            <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
              <Trash2 color="#FF3B30" size={24} />
            </TouchableOpacity>
          )}
          {isEditMode && (
            <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
              <Check color="#007AFF" size={24} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ScrollView style={styles.content}>
        {isEditMode ? (
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            multiline
          />
        ) : (
          <Text style={styles.titleText}>{title}</Text>
        )}

        {isEditMode ? (
          <TextInput
            style={styles.contentInput}
            placeholder="Start typing..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        ) : (
          <View style={styles.contentView}>
            <NoteContent content={content} hyperlinks={hyperlinks} />
          </View>
        )}

        {existingNote && (
          <View style={styles.linkingSection}>
            <Text style={styles.sectionTitle}>Linked Task</Text>
            {linkedTask ? (
              <View style={styles.linkedItemCard}>
                <ListTodo color="#007AFF" size={20} />
                <Text style={styles.linkedItemTitle} numberOfLines={1}>
                  {linkedTask.title}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Tasks' })}>
                  <ExternalLink color="#007AFF" size={18} style={styles.linkActionIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUnlinkTask}>
                  <X color="#FF3B30" size={18} style={styles.linkActionIcon} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addLinkButton}
                onPress={() => setIsTaskPickerVisible(true)}
              >
                <Plus color="#007AFF" size={20} />
                <Text style={styles.addLinkText}>Link to Task</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.linksSection}>
          <View style={styles.linksHeader}>
            <Text style={styles.sectionTitle}>Links</Text>
            <TouchableOpacity 
              style={styles.addLinkButton}
              onPress={() => setIsLinkModalVisible(true)}
            >
              <Plus color="#007AFF" size={20} />
              <Text style={styles.addLinkText}>Add Link</Text>
            </TouchableOpacity>
          </View>
          
          {hyperlinks.map((link) => (
            <View key={link.id} style={styles.linkItem}>
              <TouchableOpacity 
                style={styles.linkRef}
                onPress={() => insertReference(link.referenceNumber)}
              >
                <Text style={styles.linkRefText}>[{link.referenceNumber}]</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.linkInfo}
                onPress={() => openLink(link.url)}
                onLongPress={() => Platform.OS !== 'web' && Alert.alert(link.title || "Link", link.url)}
                // @ts-ignore
                title={link.url}
              >
                <Text style={styles.linkTitle} numberOfLines={1}>{link.title}</Text>
                <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openLink(link.url)}>
                <ExternalLink color="#007AFF" size={20} style={styles.linkActionIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeHyperlink(link.id)}>
                <X color="#FF3B30" size={20} style={styles.linkActionIcon} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={isLinkModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Hyperlink</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="URL (https://...)"
              value={newLinkUrl}
              onChangeText={setNewLinkUrl}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Title (Optional)"
              value={newLinkTitle}
              onChangeText={setNewLinkTitle}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setIsLinkModalVisible(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={addHyperlink}
                style={[styles.modalButton, styles.saveButton]}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isTaskPickerVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link to Task</Text>
              <TouchableOpacity onPress={() => setIsTaskPickerVisible(false)}>
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {tasks.filter(t => !t.linkedNoteId).map((task) => (
                <TouchableOpacity 
                  key={task.id} 
                  style={styles.pickerItem}
                  onPress={() => handleLinkTask(task.id)}
                >
                  <ListTodo color="#666" size={18} />
                  <Text style={styles.pickerItemText}>{task.title}</Text>
                </TouchableOpacity>
              ))}
              {tasks.filter(t => !t.linkedNoteId).length === 0 && (
                <Text style={styles.emptyText}>No unlinked tasks available.</Text>
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
    padding: 15,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  contentInput: {
    fontSize: 16,
    minHeight: 150,
    marginBottom: 10,
  },
  contentView: {
    minHeight: 150,
    marginBottom: 10,
  },
  linkingSection: {
    marginTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  linkedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  linkedItemTitle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  linksSection: {
    marginTop: 20,
    paddingBottom: 40,
  },
  linksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addLinkText: {
    color: '#007AFF',
    marginLeft: 5,
    fontWeight: '600',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  linkRef: {
    backgroundColor: '#007AFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  linkRefText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkUrl: {
    fontSize: 12,
    color: '#666',
  },
  linkActionIcon: {
    marginLeft: 10,
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
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
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
