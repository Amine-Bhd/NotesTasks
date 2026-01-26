import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useStore } from '../store/useStore';
import { Plus, Moon, Sun } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import TaskItem from '../components/TaskItem';

export default function TasksScreen() {
  const { tasks, isDarkMode, toggleDarkMode } = useStore();
  const navigation = useNavigation<any>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={toggleDarkMode} 
          style={{ marginRight: 15 }}
        >
          {isDarkMode ? <Sun size={20} color="#FFCC00" /> : <Moon size={20} color="#666" />}
        </TouchableOpacity>
      ),
    });
  }, [navigation, isDarkMode]);

  const rootTasks = tasks.filter(t => !t.parentTaskId);

  return (
    <View style={[styles.container, isDarkMode ? styles.darkContainer : undefined]}>
      <FlatList
        data={rootTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskItem task={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={isDarkMode ? styles.darkText : undefined}>No tasks yet. Plan your day!</Text>
          </View>
        }
      />
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('EditTask')}
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
  listContent: {
    padding: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  darkText: {
    color: '#8E8E93',
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
  },
});
