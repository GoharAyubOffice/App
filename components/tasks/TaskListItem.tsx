import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useCurrentUser } from '../../store/hooks';
import { useSelector } from 'react-redux';
import { selectStreaks } from '../../store/slices/userActivitySlice';
import { Task, TaskPriority, TaskStatus } from '../../db/model/task';
import { taskCompletionActions } from '../../db/actions/taskCompletionActions';
import { useAnimatedCompletion } from '../../hooks/useAnimatedCompletion';
import { StreakProtectionBadge } from '../ui/StreakProtectionBadge';

interface TaskListItemProps {
  task: Task;
  onPress?: (task: Task) => void;
  onToggleComplete?: (task: Task) => void;
  style?: ViewStyle;
  showProject?: boolean;
  optimisticUpdate?: boolean;
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
  optimisticUpdate = true,
}) => {
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const streaks = useSelector(selectStreaks);
  const [isProcessing, setIsProcessing] = useState(false);

  const isCompleted = task.status === 'completed';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

  // Get daily completion streak for protection status
  const dailyStreak = streaks.find(s => s.streakType === 'daily_completion');
  const showProtectionBadge = dailyStreak && (dailyStreak.isProtectedToday || dailyStreak.availableProtections > 0);

  // Initialize animated completion hook
  const {
    containerAnimatedStyle,
    checkboxAnimatedStyle,
    textAnimatedStyle,
    strikethroughAnimatedStyle,
    triggerCompletionAnimation,
    triggerSuccessAnimation,
    triggerErrorAnimation,
  } = useAnimatedCompletion({
    isCompleted,
    onAnimationComplete: () => {
      setIsProcessing(false);
    },
    animationDuration: 300,
  });

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

  const handleToggleComplete = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    triggerCompletionAnimation();
    
    try {
      if (optimisticUpdate && currentUser?.id) {
        // Use the task completion actions for optimistic updates
        const result = await taskCompletionActions.toggleTaskCompletion(
          task,
          currentUser.id,
          'manual'
        );
        
        if (result.success) {
          triggerSuccessAnimation();
        } else {
          triggerErrorAnimation();
          console.error('Task completion failed:', result.error);
        }
      }
      
      // Call the parent's toggle handler if provided
      if (onToggleComplete) {
        onToggleComplete(task);
      }
    } catch (error) {
      triggerErrorAnimation();
      console.error('Error toggling task completion:', error);
    }
  }, [task, currentUser, isProcessing, optimisticUpdate, onToggleComplete, triggerCompletionAnimation, triggerSuccessAnimation, triggerErrorAnimation]);

  const handlePress = () => {
    if (onPress) {
      onPress(task);
    }
  };

  return (
    <Animated.View style={[containerAnimatedStyle, style]}>
      <TouchableOpacity 
        style={containerStyle}
        onPress={handlePress}
        activeOpacity={0.7}
        testID="task-list-item"
        disabled={isProcessing}
      >
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={handleToggleComplete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="task-checkbox"
          disabled={isProcessing}
        >
          <Animated.View style={checkboxAnimatedStyle}>
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isCompleted ? '#28A745' : (isDarkMode ? '#CCCCCC' : '#666666')}
            />
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Animated.Text style={[titleStyle, textAnimatedStyle]} numberOfLines={2}>
                {task.title}
              </Animated.Text>
              {isCompleted && (
                <Animated.View style={[styles.strikethrough, strikethroughAnimatedStyle]} />
              )}
            </View>
          
            <View style={styles.priorityContainer}>
              <Ionicons
                name={priorityIcons[task.priority] as any}
                size={16}
                color={priorityColors[task.priority]}
              />
            </View>
          </View>

          {task.description && (
            <View style={styles.descriptionContainer}>
              <Animated.Text style={[descriptionStyle, textAnimatedStyle]} numberOfLines={2}>
                {task.description}
              </Animated.Text>
              {isCompleted && (
                <Animated.View style={[styles.strikethrough, strikethroughAnimatedStyle]} />
              )}
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              {task.dueDate && (
                <Animated.Text style={[dueDateStyle, textAnimatedStyle]}>
                  {formatDueDate(task.dueDate)}
                </Animated.Text>
              )}
            
              {showProject && task.project && (
                <Animated.Text style={[styles.projectText, isDarkMode && styles.darkProjectText, textAnimatedStyle]}>
                  {task.project.name}
                </Animated.Text>
              )}
            </View>

            {showProtectionBadge && dailyStreak && (
              <StreakProtectionBadge
                isProtected={dailyStreak.isProtectedToday}
                availableProtections={dailyStreak.availableProtections}
                size="small"
                showCount={!dailyStreak.isProtectedToday}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
    // Opacity is now handled by animations
  },
  darkCompletedContainer: {
    // Opacity is now handled by animations
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
  titleContainer: {
    flex: 1,
    position: 'relative',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    lineHeight: 22,
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  completedTitle: {
    // Strikethrough is now handled by animated overlay
  },
  priorityContainer: {
    marginLeft: 8,
    paddingTop: 2,
  },
  descriptionContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  darkDescription: {
    color: '#CCCCCC',
  },
  completedDescription: {
    // Strikethrough is now handled by animated overlay
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
    // Strikethrough is now handled by animated overlay
  },
  projectText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  darkProjectText: {
    color: '#0A84FF',
  },
  strikethrough: {
    position: 'absolute',
    top: '50%',
    left: 0,
    height: 1,
    backgroundColor: '#666666',
    zIndex: 1,
  },
});