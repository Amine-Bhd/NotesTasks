import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Task } from '../types';
import { useStore } from '../store/useStore';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Plus, Info } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Removed setLayoutAnimationEnabledExperimental as it warns in New Architecture
// if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

interface TaskItemProps {
  task: Task;
  level?: number;
}

export default function TaskItem({ task, level = 0 }: TaskItemProps) {
  const { tasks, updateTask, addTask, isDarkMode } = useStore();
  const navigation = useNavigation<any>();
  const [isExpanded, setIsExpanded] = useState(true);

  const subtasks = tasks.filter(t => t.parentTaskId === task.id);
  const hasSubtasks = subtasks.length > 0;

  const toggleComplete = () => {
    // Logic will be handled in store, just passing the new state
    updateTask(task.id, { completed: !task.completed });
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleAddSubtask = () => {
    navigation.navigate('EditTask', { parentTaskId: task.id });
  };

  return (
    <View style={[styles.container, { marginLeft: level * 20 }]}>
      <View style={[styles.mainRow, isDarkMode ? styles.darkMainRow : undefined]}>
        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
          {hasSubtasks ? (
            isExpanded ? 
              <ChevronDown size={20} color={isDarkMode ? "#AAA" : "#666"} /> : 
              <ChevronRight size={20} color={isDarkMode ? "#AAA" : "#666"} />
          ) : (
            <View style={{ width: 20 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleComplete} style={styles.checkButton}>
          {task.completed ? (
            <CheckCircle2 color="#4CD964" size={24} />
          ) : (
            <Circle color={isDarkMode ? "#666" : "#C7C7CC"} size={24} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.content}
          onPress={() => navigation.navigate('EditTask', { taskId: task.id })}
        >
          <Text style={[
            styles.title, 
            isDarkMode ? styles.darkTitle : undefined,
            task.completed ? styles.completedText : undefined
          ]}>
            {task.title}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleAddSubtask} style={styles.actionButton}>
          <Plus size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {isExpanded && hasSubtasks && (
        <View style={[styles.subtasksContainer, isDarkMode ? styles.darkSubtasksContainer : undefined]}>
          {subtasks.map(sub => (
            <TaskItem key={sub.id} task={sub} level={1} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  darkMainRow: {
    backgroundColor: '#1C1C1E',
  },
  expandButton: {
    marginRight: 5,
  },
  checkButton: {
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: '#333',
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  subtasksContainer: {
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5EA',
    marginLeft: 22,
  },
  darkSubtasksContainer: {
    borderLeftColor: '#38383A',
  },
});
