import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useCurrentUser } from '../../../store/hooks';
import { TaskForm } from '../../../components/tasks/TaskForm';
import { TaskActions, TaskData } from '../../../db/actions/taskActions';
import { Project } from '../../../db/model/project';
import { Spinner } from '../../../components/ui/Spinner';
import { Toast } from '../../../components/ui/Toast';

export default function CreateTaskScreen() {
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
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

  // Load available projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const availableProjects = await TaskActions.getAvailableProjects();
      setProjects(availableProjects);
      
      if (availableProjects.length === 0) {
        Alert.alert(
          'No Projects Available',
          'You need to create a project before you can create tasks. Would you like to create a project now?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
            { text: 'Create Project', onPress: () => router.push('/(main)/projects/create') },
          ]
        );
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      showToast('Failed to load projects', 'error');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const handleSubmit = async (taskData: TaskData) => {
    if (!currentUser) {
      showToast('You must be logged in to create tasks', 'error');
      return;
    }

    try {
      setIsLoading(true);

      // Add user info to task data
      const completeTaskData: TaskData = {
        ...taskData,
        createdBy: currentUser.id,
        assigneeId: taskData.assigneeId || currentUser.id, // Default to current user
      };

      // Create the task
      const newTask = await TaskActions.createTask(completeTaskData);

      if (newTask) {
        showToast('Task created successfully!', 'success');
        
        // Navigate back after a short delay to show the success message
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        throw new Error('Failed to create task');
      }

    } catch (error) {
      console.error('Error creating task:', error);
      showToast('Failed to create task. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Task',
      'Are you sure you want to discard this task?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  if (isLoadingProjects) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Spinner size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading projects...
        </Text>
      </View>
    );
  }

  if (projects.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="folder-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Projects Available
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Create a project first to organize your tasks
        </Text>
        <TouchableOpacity
          style={[styles.createProjectButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(main)/projects/create')}
        >
          <Text style={styles.createProjectButtonText}>
            Create Project
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
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          New Task
        </Text>
        
        {/* Placeholder for symmetry */}
        <View style={styles.headerButton} />
      </View>

      {/* Task Form */}
      <TaskForm
        projects={projects}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        submitButtonText="Create Task"
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  createProjectButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  createProjectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});