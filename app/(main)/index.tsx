import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TaskList } from '../../components/tasks/TaskList';
import { Task } from '../../db/model/task';
import { useTheme, useCurrentUser, useAppState, useAppDispatch, useDailyStreak } from '../../store/hooks';
import { database } from '../../db';
import { checkIfMidnightResetNeeded, triggerMidnightResetManually } from '../../tasks/midnightResetTask';
import { updateDailyActivity, loadUserStreaks, performMidnightReset } from '../../store/slices/userActivitySlice';

export default function DashboardScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const { isLoading: appLoading } = useAppState();
  const dispatch = useAppDispatch();
  const dailyStreak = useDailyStreak();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check for midnight reset when component mounts
  useEffect(() => {
    const checkMidnightReset = async () => {
      if (!currentUser?.id) return;

      try {
        const needsReset = await checkIfMidnightResetNeeded(currentUser.id);
        if (needsReset) {
          console.log('Performing foreground midnight reset');
          dispatch(performMidnightReset(currentUser.id));
        }

        // Load user activity data
        dispatch(updateDailyActivity({ userId: currentUser.id }));
        dispatch(loadUserStreaks(currentUser.id));
      } catch (error) {
        console.error('Error checking midnight reset:', error);
      }
    };

    checkMidnightReset();
  }, [currentUser?.id, dispatch]);

  // Refresh tasks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setRefreshTrigger(prev => prev + 1);
    }, [])
  );

  const handleTaskPress = useCallback((task: Task) => {
    router.push(`/tasks/${task.id}/edit`);
  }, [router]);

  const handleTaskToggle = useCallback(async (task: Task) => {
    // Task completion is now handled optimistically in TaskListItem
    // This callback can be used for additional logic if needed
    console.log('Task toggled:', task.id, task.status);
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
      {/* Dashboard Title */}
      <View style={[styles.dashboardHeader, isDarkMode && styles.darkDashboardHeader]}>
        <Text style={[styles.dashboardTitle, isDarkMode && styles.darkDashboardTitle]}>
          Dashboard
        </Text>
      </View>

      {/* Streak Banner */}
      <View style={[styles.streakBanner, isDarkMode && styles.darkStreakBanner]}>
        <View style={styles.streakBannerContent}>
          <View style={styles.streakInfo}>
            <Ionicons name="flame" size={20} color="#FF6B35" />
            <Text style={[styles.streakBannerText, isDarkMode && styles.darkStreakBannerText]}>
              {dailyStreak > 0 ? `${dailyStreak} day streak!` : 'Start your streak today!'}
            </Text>
          </View>
          <Text style={[styles.streakSubtext, isDarkMode && styles.darkStreakSubtext]}>
            {dailyStreak > 0 ? 'Keep up the great work!' : 'Complete a task to start'}
          </Text>
        </View>
      </View>

      {/* Greeting Header */}
      <View style={headerStyle}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={greetingStyle}>
              {getCurrentGreeting()}{currentUser?.user_metadata?.full_name ? `, ${currentUser.user_metadata.full_name}` : ''}
            </Text>
            <Text style={dateStyle}>
              {getTodayDate()}
            </Text>
          </View>
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
          key={refreshTrigger} // Force re-render when refreshTrigger changes
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
  dashboardHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  darkDashboardHeader: {
    backgroundColor: '#2A2A2A',
    borderBottomColor: '#404040',
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  darkDashboardTitle: {
    color: '#FFFFFF',
  },
  streakBanner: {
    backgroundColor: '#FFF5F0',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  darkStreakBanner: {
    backgroundColor: '#2A2A2A',
  },
  streakBannerContent: {
    gap: 4,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  darkStreakBannerText: {
    color: '#FFFFFF',
  },
  streakSubtext: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 28,
  },
  darkStreakSubtext: {
    color: '#CCCCCC',
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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