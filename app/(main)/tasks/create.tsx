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
import { PredefinedTasks } from '../../../components/tasks/PredefinedTasks';
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
  const [activeTab, setActiveTab] = useState<'custom' | 'templates'>('templates');
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

  // No need to load projects anymore
  useEffect(() => {
    setIsLoadingProjects(false);
  }, []);

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
        projectId: 'default', // Use default project since we're not using projects
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

  const handlePredefinedTaskSelect = () => {
    // Navigate back after selecting a predefined task
    setTimeout(() => {
      router.back();
    }, 1000);
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

  // Remove project requirement - tasks can be created without projects

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
          {activeTab === 'custom' ? 'New Task' : 'Task Templates'}
        </Text>
        
        {/* Placeholder for symmetry */}
        <View style={styles.headerButton} />
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'templates' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setActiveTab('templates')}
        >
          <Ionicons 
            name="library-outline" 
            size={20} 
            color={activeTab === 'templates' ? '#FFFFFF' : colors.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'templates' ? '#FFFFFF' : colors.textSecondary }
          ]}>
            Templates
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'custom' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setActiveTab('custom')}
        >
          <Ionicons 
            name="create-outline" 
            size={20} 
            color={activeTab === 'custom' ? '#FFFFFF' : colors.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'custom' ? '#FFFFFF' : colors.textSecondary }
          ]}>
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'templates' ? (
        <PredefinedTasks
          onTaskSelect={handlePredefinedTaskSelect}
        />
      ) : (
        <TaskForm
          projects={[]} // Empty projects array since we're not using projects
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          submitButtonText="Create Task"
        />
      )}

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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
});