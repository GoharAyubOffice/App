import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useCurrentUser } from '../../../../store/hooks';
import { TaskForm } from '../../../../components/tasks/TaskForm';
import { TaskActions, TaskData } from '../../../../db/actions/taskActions';
import { Task } from '../../../../db/model/task';
import { Project } from '../../../../db/model/project';
import { Spinner } from '../../../../components/ui/Spinner';
import { Toast } from '../../../../components/ui/Toast';

export default function EditTaskScreen() {
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [task, setTask] = useState<Task | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const colors = {
    background: isDarkMode ? '#000000' : '#FFFFFF',
    surface: isDarkMode ? '#1F1F1F' : '#F8F9FA',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#A0A0A0' : '#666666',
    border: isDarkMode ? '#333333' : '#E1E5E9',
    primary: '#3B82F6',
    error: isDarkMode ? '#EF4444' : '#DC2626',
  };

  // Load task data and projects
  useEffect(() => {
    if (id) {
      loadTaskData();
    }
  }, [id]);

  const loadTaskData = async () => {
    try {
      setIsLoadingData(true);
      
      // Load task and projects in parallel
      const [taskData, availableProjects] = await Promise.all([
        TaskActions.getTaskById(id!),
        TaskActions.getAvailableProjects(),
      ]);

      if (!taskData) {
        Alert.alert(
          'Task Not Found',
          'The task you are trying to edit could not be found.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      setTask(taskData);
      setProjects(availableProjects);

    } catch (error) {
      console.error('Error loading task data:', error);
      showToast('Failed to load task data', 'error');
      setTimeout(() => router.back(), 2000);
    } finally {
      setIsLoadingData(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const getInitialFormData = (): Partial<TaskData> | undefined => {
    if (!task) return undefined;

    const taskData = task as any;
    return {
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status,
      priority: taskData.priority,
      projectId: taskData.projectId,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      assigneeId: taskData.assigneeId,
    };
  };

  const handleSubmit = async (taskData: TaskData) => {
    if (!currentUser || !task) {
      showToast('Unable to update task', 'error');
      return;
    }

    try {
      setIsLoading(true);

      // Update the task
      const updatedTask = await TaskActions.updateTask(task.id, taskData);

      if (updatedTask) {
        showToast('Task updated successfully!', 'success');
        setHasChanges(false);
        
        // Navigate back after a short delay to show the success message
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        throw new Error('Failed to update task');
      }

    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before leaving?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: () => {
            // Handle save logic here if needed
            // For now, just go back
            router.back();
          }},
        ]
      );
    } else {
      router.back();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const success = await TaskActions.deleteTask(task!.id);
              
              if (success) {
                showToast('Task deleted successfully', 'success');
                setTimeout(() => {
                  router.back();
                }, 1000);
              } else {
                throw new Error('Failed to delete task');
              }
            } catch (error) {
              console.error('Error deleting task:', error);
              showToast('Failed to delete task. Please try again.', 'error');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoadingData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Spinner size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading task...
        </Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Task Not Found
        </Text>
        <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
          The task you are looking for could not be found.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCancel}
          testID="cancel-button"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Task
        </Text>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleDelete}
          testID="delete-button"
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Task Form */}
      <TaskForm
        initialData={getInitialFormData()}
        projects={projects}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        submitButtonText="Update Task"
      />

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});