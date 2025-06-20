import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/hooks';
import { Task, TaskPriority, TaskStatus } from '../../db/model/task';

interface TaskListItemProps {
  task: Task;
  onPress?: (task: Task) => void;
  onToggleComplete?: (task: Task) => void;
  style?: ViewStyle;
  showProject?: boolean;
}

const priorityColors = {
  low: '#28A745',
  medium: '#FFC107',
  high: '#FF6B35',
  urgent: '#DC3545',
};

const priorityIcons: Record<TaskPriority, string> = {
  low: 'chevron-down',
  medium: 'chevron-forward',
  high: 'chevron-up',
  urgent: 'warning',
};

export const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  onPress,
  onToggleComplete,
  style,
  showProject = false,
}) => {
  const { isDarkMode } = useTheme();

  const isCompleted = task.status === 'completed';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

  const containerStyle = [
    styles.container,
    isDarkMode && styles.darkContainer,
    isCompleted && styles.completedContainer,
    isCompleted && isDarkMode && styles.darkCompletedContainer,
    style,
  ];

  const titleStyle = [
    styles.title,
    isDarkMode && styles.darkTitle,
    isCompleted && styles.completedTitle,
  ];

  const descriptionStyle = [
    styles.description,
    isDarkMode && styles.darkDescription,
    isCompleted && styles.completedDescription,
  ];

  const dueDateStyle = [
    styles.dueDate,
    isDarkMode && styles.darkDueDate,
    isOverdue && styles.overdueDueDate,
    isCompleted && styles.completedDueDate,
  ];

  const formatDueDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueDate = new Date(date);
    
    if (dueDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return dueDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleToggleComplete = () => {
    if (onToggleComplete) {
      onToggleComplete(task);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(task);
    }
  };

  return (
    <TouchableOpacity 
      style={containerStyle}
      onPress={handlePress}
      activeOpacity={0.7}
      testID="task-list-item"
    >
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={handleToggleComplete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID="task-checkbox"
      >
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isCompleted ? '#28A745' : (isDarkMode ? '#CCCCCC' : '#666666')}
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={titleStyle} numberOfLines={2}>
            {task.title}
          </Text>
          
          <View style={styles.priorityContainer}>
            <Ionicons
              name={priorityIcons[task.priority] as any}
              size={16}
              color={priorityColors[task.priority]}
            />
          </View>
        </View>

        {task.description && (
          <Text style={descriptionStyle} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        <View style={styles.footer}>
          {task.dueDate && (
            <Text style={dueDateStyle}>
              {formatDueDate(task.dueDate)}
            </Text>
          )}
          
          {showProject && task.project && (
            <Text style={[styles.projectText, isDarkMode && styles.darkProjectText]}>
              {task.project.name}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  darkContainer: {
    backgroundColor: '#2A2A2A',
    borderBottomColor: '#404040',
  },
  completedContainer: {
    opacity: 0.6,
  },
  darkCompletedContainer: {
    opacity: 0.5,
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    lineHeight: 22,
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  priorityContainer: {
    marginLeft: 8,
    paddingTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  darkDescription: {
    color: '#CCCCCC',
  },
  completedDescription: {
    textDecorationLine: 'line-through',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dueDate: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  darkDueDate: {
    color: '#CCCCCC',
  },
  overdueDueDate: {
    color: '#DC3545',
  },
  completedDueDate: {
    textDecorationLine: 'line-through',
  },
  projectText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  darkProjectText: {
    color: '#0A84FF',
  },
});