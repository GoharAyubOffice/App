import React, { useState, useEffect } from 'react';
import { FlatList, View, StyleSheet, RefreshControl, ListRenderItem } from 'react-native';
import { Task } from '../../db/model/task';
import { TaskActions } from '../../db/actions/taskActions';
import { TaskListItem } from './TaskListItem';
import { EmptyState } from '../ui/EmptyState';
import { Spinner } from '../ui/Spinner';
import { useTheme, useCurrentUser } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';

interface TaskListProps {
  queryType?: 'today' | 'all' | 'completed' | 'pending';
  onTaskPress?: (task: Task) => void;
  onTaskToggle?: (task: Task) => void;
  onCreateTask?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  showProject?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateActionText?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  queryType = 'today',
  onTaskPress,
  onTaskToggle,
  onCreateTask,
  isLoading: externalLoading = false,
  isRefreshing = false,
  onRefresh,
  showProject = false,
  emptyStateTitle = "No tasks yet",
  emptyStateDescription = "Create your first task to get started on your productive journey.",
  emptyStateActionText = "Create your first task",
}) => {
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const colors = {
    background: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
  };

  const loadTasks = async () => {
    if (!currentUser?.id) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      let fetchedTasks: Task[] = [];

      switch (queryType) {
        case 'today':
          fetchedTasks = await TaskActions.getTodayTasks(currentUser.id);
          break;
        case 'all':
          fetchedTasks = await TaskActions.getTasksByAssignee(currentUser.id);
          break;
        case 'completed':
          const allTasks = await TaskActions.getTasksByAssignee(currentUser.id);
          fetchedTasks = allTasks.filter(t => t.status === 'completed');
          break;
        case 'pending':
          const allPendingTasks = await TaskActions.getTasksByAssignee(currentUser.id);
          fetchedTasks = allPendingTasks.filter(t => t.status !== 'completed');
          break;
        default:
          fetchedTasks = await TaskActions.getTodayTasks(currentUser.id);
      }

      console.log('Loaded tasks:', fetchedTasks.length, 'for query:', queryType);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [currentUser?.id, queryType]);

  const handleRefresh = async () => {
    await loadTasks();
    onRefresh?.();
  };

  const handleTaskToggle = async (task: Task) => {
    try {
      const updatedTask = await TaskActions.toggleTaskStatus(task.id);
      if (updatedTask) {
        // Reload tasks to reflect changes
        await loadTasks();
        onTaskToggle?.(updatedTask);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const renderTaskItem: ListRenderItem<Task> = ({ item, index }) => (
    <TaskListItem
      task={item}
      onPress={onTaskPress}
      onToggleComplete={handleTaskToggle}
      showProject={showProject}
      style={index === 0 ? styles.firstItem : undefined}
    />
  );

  if (isLoading || externalLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Spinner size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      renderItem={renderTaskItem}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#3B82F6"
        />
      }
      contentContainerStyle={[
        styles.container,
        tasks.length === 0 && styles.emptyContainer,
      ]}
      ListEmptyComponent={
        <EmptyState
          icon={<Ionicons name="checkmark-circle-outline" size={64} color="#9CA3AF" />}
          title={emptyStateTitle}
          description={emptyStateDescription}
          actionText={emptyStateActionText}
          onAction={onCreateTask}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  firstItem: {
    marginTop: 0,
  },
});