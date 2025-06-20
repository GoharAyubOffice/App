import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useCurrentUser } from '../../store/hooks';
import { TaskActions } from '../../db/actions/taskActions';
import { TaskPriority, TaskStatus } from '../../db/model/task';

interface PredefinedTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PREDEFINED_TASKS: PredefinedTask[] = [
  // Health & Fitness
  { id: '1', title: 'Drink 8 glasses of water', description: 'Stay hydrated throughout the day', priority: 'medium', category: 'Health', icon: 'water-outline' },
  { id: '2', title: 'Exercise for 30 minutes', description: 'Any physical activity counts', priority: 'high', category: 'Health', icon: 'fitness-outline' },
  { id: '3', title: 'Take a 10-minute walk', description: 'Fresh air and light exercise', priority: 'low', category: 'Health', icon: 'walk-outline' },
  { id: '4', title: 'Eat a healthy breakfast', description: 'Start your day with nutritious food', priority: 'medium', category: 'Health', icon: 'restaurant-outline' },
  { id: '5', title: 'Get 8 hours of sleep', description: 'Prioritize your rest and recovery', priority: 'high', category: 'Health', icon: 'bed-outline' },
  
  // Productivity
  { id: '6', title: 'Review daily goals', description: 'Check your progress and priorities', priority: 'high', category: 'Productivity', icon: 'list-outline' },
  { id: '7', title: 'Clear email inbox', description: 'Organize and respond to emails', priority: 'medium', category: 'Productivity', icon: 'mail-outline' },
  { id: '8', title: 'Plan tomorrow\'s schedule', description: 'Prepare for the next day', priority: 'medium', category: 'Productivity', icon: 'calendar-outline' },
  { id: '9', title: 'Take a break every hour', description: 'Rest your eyes and stretch', priority: 'low', category: 'Productivity', icon: 'time-outline' },
  { id: '10', title: 'Complete one important task', description: 'Focus on your top priority', priority: 'high', category: 'Productivity', icon: 'checkmark-circle-outline' },
  
  // Personal Development
  { id: '11', title: 'Read for 20 minutes', description: 'Expand your knowledge', priority: 'medium', category: 'Learning', icon: 'book-outline' },
  { id: '12', title: 'Practice meditation', description: 'Mindfulness and stress relief', priority: 'medium', category: 'Mindfulness', icon: 'leaf-outline' },
  { id: '13', title: 'Learn something new', description: 'Watch a tutorial or take a course', priority: 'low', category: 'Learning', icon: 'school-outline' },
  { id: '14', title: 'Journal your thoughts', description: 'Reflect on your day', priority: 'low', category: 'Mindfulness', icon: 'journal-outline' },
  { id: '15', title: 'Practice gratitude', description: 'Write down 3 things you\'re grateful for', priority: 'low', category: 'Mindfulness', icon: 'heart-outline' },
  
  // Social & Relationships
  { id: '16', title: 'Call a friend or family', description: 'Stay connected with loved ones', priority: 'medium', category: 'Social', icon: 'call-outline' },
  { id: '17', title: 'Send a thoughtful message', description: 'Brighten someone\'s day', priority: 'low', category: 'Social', icon: 'chatbubble-outline' },
  { id: '18', title: 'Plan quality time with family', description: 'Strengthen relationships', priority: 'medium', category: 'Social', icon: 'people-outline' },
  
  // Life Management
  { id: '19', title: 'Tidy up workspace', description: 'Organize your environment', priority: 'low', category: 'Organization', icon: 'cube-outline' },
  { id: '20', title: 'Review finances', description: 'Check budget and expenses', priority: 'medium', category: 'Finance', icon: 'card-outline' },
  { id: '21', title: 'Back up important files', description: 'Protect your digital data', priority: 'low', category: 'Tech', icon: 'cloud-upload-outline' },
  { id: '22', title: 'Take vitamins/supplements', description: 'Support your health routine', priority: 'low', category: 'Health', icon: 'medical-outline' },
  { id: '23', title: 'Practice deep breathing', description: '5 minutes of focused breathing', priority: 'low', category: 'Mindfulness', icon: 'ellipse-outline' },
  { id: '24', title: 'Stretch for 10 minutes', description: 'Improve flexibility and posture', priority: 'low', category: 'Health', icon: 'body-outline' },
];

interface PredefinedTasksProps {
  onTaskSelect?: (task: PredefinedTask) => void;
  onClose?: () => void;
}

export const PredefinedTasks: React.FC<PredefinedTasksProps> = ({
  onTaskSelect,
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const colors = {
    background: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    surface: isDarkMode ? '#2A2A2A' : '#F8F9FA',
    text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDarkMode ? '#CCCCCC' : '#666666',
    border: isDarkMode ? '#404040' : '#E5E7EB',
    primary: '#3B82F6',
    success: '#10B981',
  };

  const categories = ['All', ...Array.from(new Set(PREDEFINED_TASKS.map(task => task.category)))];

  const filteredTasks = selectedCategory === 'All' 
    ? PREDEFINED_TASKS 
    : PREDEFINED_TASKS.filter(task => task.category === selectedCategory);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return colors.textSecondary;
    }
  };

  const handleAddTask = async (predefinedTask: PredefinedTask) => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to add tasks');
      return;
    }

    try {
      setIsAdding(predefinedTask.id);

      const taskData = {
        title: predefinedTask.title,
        description: predefinedTask.description,
        status: 'todo' as TaskStatus,
        priority: predefinedTask.priority,
        projectId: 'default',
        createdBy: currentUser.id,
        assigneeId: currentUser.id,
      };

      const newTask = await TaskActions.createTask(taskData);

      if (newTask) {
        Alert.alert(
          'Success',
          `"${predefinedTask.title}" has been added to your tasks!`,
          [{ text: 'OK' }]
        );
        onTaskSelect?.(predefinedTask);
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error adding predefined task:', error);
      Alert.alert('Error', 'Failed to add task. Please try again.');
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Choose from Templates
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              {
                backgroundColor: selectedCategory === category ? colors.primary : colors.surface,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              { 
                color: selectedCategory === category ? '#FFFFFF' : colors.text 
              }
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tasks List */}
      <ScrollView 
        style={styles.tasksList}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.map((task) => (
          <View 
            key={task.id}
            style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.taskHeader}>
              <View style={styles.taskIcon}>
                <Ionicons 
                  name={task.icon} 
                  size={24} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, { color: colors.text }]}>
                  {task.title}
                </Text>
                <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>
                  {task.description}
                </Text>
              </View>
              <View style={styles.taskMeta}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                  <Text style={styles.priorityText}>
                    {task.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.addButton,
                { 
                  backgroundColor: colors.primary,
                  opacity: isAdding === task.id ? 0.5 : 1,
                }
              ]}
              onPress={() => handleAddTask(task)}
              disabled={isAdding === task.id}
            >
              <Ionicons 
                name={isAdding === task.id ? "hourglass-outline" : "add"} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.addButtonText}>
                {isAdding === task.id ? 'Adding...' : 'Add Task'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  categoryContainer: {
    paddingVertical: 16,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  taskMeta: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});