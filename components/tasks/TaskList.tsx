import React from 'react';
import { FlatList, View, StyleSheet, RefreshControl, ListRenderItem } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { Task } from '../../db/model/task';
import { taskQueries } from '../../db/queries/taskQueries';
import { TaskListItem } from './TaskListItem';
import { EmptyState } from '../ui/EmptyState';
import { Spinner } from '../ui/Spinner';
import { useTheme } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';

interface TaskListProps {
  tasks: Task[];
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

const TaskListComponent: React.FC<TaskListProps> = ({
  tasks,
  onTaskPress,
  onTaskToggle,
  onCreateTask,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  showProject = false,
  emptyStateTitle = "No tasks yet",
  emptyStateDescription = "Create your first habit to get started on your productive journey.",
  emptyStateActionText = "Create your first habit",
}) => {
  const { isDarkMode } = useTheme();

  const renderTaskItem: ListRenderItem<Task> = ({ item, index }) => (
    <TaskListItem
      task={item}
      onPress={onTaskPress}
      onToggleComplete={onTaskToggle}
      showProject={showProject}
      style={index === 0 ? styles.firstItem : undefined}
    />
  );

  const renderSeparator = () => (
    <View style={[styles.separator, isDarkMode && styles.darkSeparator]} />
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Spinner size="large" centered />
        </View>
      );
    }

    return (
      <EmptyState
        title={emptyStateTitle}
        description={emptyStateDescription}
        actionText={emptyStateActionText}
        onActionPress={onCreateTask}
        icon={
          <Ionicons
            name="checkmark-circle-outline"
            size={64}
            color={isDarkMode ? '#666666' : '#CCCCCC'}
          />
        }
      />
    );
  };

  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <View style={[styles.skeletonCheckbox, isDarkMode && styles.darkSkeletonCheckbox]} />
          <View style={styles.skeletonContent}>
            <View style={[styles.skeletonTitle, isDarkMode && styles.darkSkeletonTitle]} />
            <View style={[styles.skeletonDescription, isDarkMode && styles.darkSkeletonDescription]} />
            <View style={[styles.skeletonDate, isDarkMode && styles.darkSkeletonDate]} />
          </View>
        </View>
      ))}
    </View>
  );

  if (isLoading && tasks.length === 0) {
    return renderSkeletonLoader();
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={isDarkMode ? '#FFFFFF' : '#000000'}
              colors={['#007AFF']}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          tasks.length === 0 && styles.emptyContentContainer,
        ]}
        testID="task-list"
      />
    </View>
  );
};

// Enhanced component with withObservables for real-time updates
const enhance = withObservables(['queryType'], ({ queryType = 'today' }) => {
  let query;
  
  switch (queryType) {
    case 'active':
      query = taskQueries.getActiveTasks();
      break;
    case 'completed':
      query = taskQueries.getCompletedTasks();
      break;
    case 'overdue':
      query = taskQueries.getOverdueTasks();
      break;
    case 'upcoming':
      query = taskQueries.getUpcomingTasks();
      break;
    case 'today':
    default:
      query = taskQueries.getTodaysTasks();
      break;
  }

  return {
    tasks: query,
  };
});

export const TaskList = enhance(TaskListComponent);

// Export the base component for cases where you want to pass tasks directly
export const TaskListBase = TaskListComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  darkContainer: {
    backgroundColor: '#1A1A1A',
  },
  contentContainer: {
    flexGrow: 1,
  },
  emptyContentContainer: {
    flex: 1,
  },
  firstItem: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 52,
  },
  darkSeparator: {
    backgroundColor: '#404040',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  skeletonContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  skeletonCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
    marginTop: 2,
  },
  darkSkeletonCheckbox: {
    backgroundColor: '#404040',
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 18,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  darkSkeletonTitle: {
    backgroundColor: '#404040',
  },
  skeletonDescription: {
    height: 14,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  darkSkeletonDescription: {
    backgroundColor: '#404040',
  },
  skeletonDate: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    width: '30%',
  },
  darkSkeletonDate: {
    backgroundColor: '#404040',
  },
});