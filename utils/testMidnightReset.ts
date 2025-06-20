/**
 * Utility functions for testing midnight reset functionality
 * This file can be used for debugging and testing the midnight reset system
 */

import { streakActions } from '../db/actions/streakActions';
import { 
  triggerMidnightResetManually,
  getMidnightResetTaskStatus,
  checkIfMidnightResetNeeded,
} from '../tasks/midnightResetTask';

export const testMidnightResetSystem = {
  /**
   * Test basic streak actions
   */
  async testStreakActions(userId: string): Promise<void> {
    console.log('🧪 Testing streak actions...');
    
    try {
      // Test updating daily activity
      const activityResult = await streakActions.updateDailyActivity(userId);
      console.log('✅ Daily activity update:', activityResult.success);
      
      // Test getting user streaks
      const streaks = await streakActions.getUserStreaks(userId);
      console.log('✅ User streaks retrieved:', streaks.length);
      
      // Test getting streak stats
      const stats = await streakActions.getStreakStats(userId);
      console.log('✅ Streak stats:', stats);
      
    } catch (error) {
      console.error('❌ Streak actions test failed:', error);
    }
  },

  /**
   * Test midnight reset task
   */
  async testMidnightResetTask(userId: string): Promise<void> {
    console.log('🧪 Testing midnight reset task...');
    
    try {
      // Check current status
      const status = await getMidnightResetTaskStatus();
      console.log('✅ Task status:', status);
      
      // Check if reset is needed
      const needsReset = await checkIfMidnightResetNeeded(userId);
      console.log('✅ Needs reset:', needsReset);
      
      // Test manual trigger (be careful with this in production)
      if (needsReset) {
        console.log('🔄 Triggering manual reset...');
        const resetSuccess = await triggerMidnightResetManually(userId);
        console.log('✅ Manual reset result:', resetSuccess);
      }
      
    } catch (error) {
      console.error('❌ Midnight reset task test failed:', error);
    }
  },

  /**
   * Test complete system
   */
  async runCompleteTest(userId: string): Promise<void> {
    console.log('🚀 Starting complete midnight reset system test...');
    console.log('👤 User ID:', userId);
    
    await this.testStreakActions(userId);
    await this.testMidnightResetTask(userId);
    
    console.log('✨ Complete test finished!');
  },

  /**
   * Log current system state
   */
  async logSystemState(userId: string): Promise<void> {
    console.log('📊 Current Midnight Reset System State:');
    console.log('=====================================');
    
    try {
      // Task status
      const taskStatus = await getMidnightResetTaskStatus();
      console.log('Background Task Status:');
      console.log('- Registered:', taskStatus.isRegistered);
      console.log('- Background Fetch Status:', taskStatus.backgroundFetchStatus);
      console.log('- Last Reset:', taskStatus.lastResetDate?.toISOString() || 'Never');
      
      // Reset needed
      const needsReset = await checkIfMidnightResetNeeded(userId);
      console.log('- Needs Reset:', needsReset);
      
      // User stats
      const stats = await streakActions.getStreakStats(userId);
      console.log('User Stats:');
      console.log('- Daily Streak:', stats.dailyStreak);
      console.log('- Longest Streak:', stats.longestStreak);
      console.log('- Total Completions:', stats.totalCompletions);
      console.log('- Avg Completion Rate:', stats.averageCompletionRate.toFixed(1) + '%');
      
      // Recent activity
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const recentActivity = await streakActions.getDailyActivities(userId, startDate, endDate);
      console.log('Recent Activity (Last 7 days):');
      recentActivity.forEach(activity => {
        console.log(`- ${activity.activityDate.toDateString()}: ${activity.tasksCompleted} tasks completed`);
      });
      
    } catch (error) {
      console.error('❌ Error logging system state:', error);
    }
    
    console.log('=====================================');
  },
};

// Export for easy access in development
export default testMidnightResetSystem;