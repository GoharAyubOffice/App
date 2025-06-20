import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TaskList } from '../../components/tasks/TaskList';
import { Task } from '../../db/model/task';
import { useTheme, useCurrentUser, useAppState } from '../../store/hooks';
import { database } from '../../db';

export default function DashboardScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const { isLoading: appLoading } = useAppState();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTaskPress = useCallback((task: Task) => {
    router.push(`/tasks/${task.id}/edit`);
  }, [router]);

  const handleTaskToggle = useCallback(async (task: Task) => {
    try {
      await database.write(async () => {
        await task.update(record => {
          record.status = task.status === 'completed' ? 'todo' : 'completed';
          record.completedAt = task.status === 'completed' ? null : new Date();
          record.updatedAt = new Date();
        });
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  }, []);

  const handleCreateTask = useCallback(() => {
    router.push('/tasks/create');
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Add sync logic here if needed
      // await syncService.sync();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleSettingsPress = useCallback(() => {
    router.push('/settings/profile');
  }, [router]);

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const containerStyle = [
    styles.container,
    isDarkMode && styles.darkContainer,
  ];

  const headerStyle = [
    styles.header,
    isDarkMode && styles.darkHeader,
  ];

  const greetingStyle = [
    styles.greeting,
    isDarkMode && styles.darkGreeting,
  ];

  const dateStyle = [
    styles.date,
    isDarkMode && styles.darkDate,
  ];

  const sectionTitleStyle = [
    styles.sectionTitle,
    isDarkMode && styles.darkSectionTitle,
  ];

  return (
    <SafeAreaView 
      style={containerStyle}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={headerStyle}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={greetingStyle}>
              {getCurrentGreeting()}{currentUser?.name ? `, ${currentUser.name}` : ''}
            </Text>
            <Text style={dateStyle}>
              {getTodayDate()}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID="settings-button"
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={isDarkMode ? '#FFFFFF' : '#1A1A1A'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Section */}
      <View style={styles.taskSection}>
        <View style={styles.sectionHeader}>
          <Text style={sectionTitleStyle}>Today's Tasks</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateTask}
            testID="add-task-button"
          >
            <Ionicons
              name="add"
              size={24}
              color={isDarkMode ? '#FFFFFF' : '#1A1A1A'}
            />
          </TouchableOpacity>
        </View>

        <TaskList
          queryType="today"
          onTaskPress={handleTaskPress}
          onTaskToggle={handleTaskToggle}
          onCreateTask={handleCreateTask}
          isLoading={appLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          showProject={false}
          emptyStateTitle="No tasks for today"
          emptyStateDescription="Create your first habit to get started on your productive journey."
          emptyStateActionText="Create your first habit"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  darkContainer: {
    backgroundColor: '#1A1A1A',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  darkHeader: {
    backgroundColor: '#2A2A2A',
    borderBottomColor: '#404040',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  darkGreeting: {
    color: '#FFFFFF',
  },
  date: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  darkDate: {
    color: '#CCCCCC',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  taskSection: {
    flex: 1,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  darkSectionTitle: {
    color: '#FFFFFF',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
});