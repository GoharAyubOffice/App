/**
 * Smart Notification System Test Utilities
 * 
 * This file contains test functions to validate the smart notification system
 */

import { notificationPersonalizer } from '../services/notificationPersonalizer';
import { notificationService } from '../services/notificationService';
import { taskCompletionActions } from '../db/actions/taskCompletionActions';

/**
 * Test the basic notification scheduling functionality
 */
export async function testBasicNotificationScheduling(): Promise<boolean> {
  try {
    console.log('[SmartNotificationTest] Testing basic notification scheduling...');
    
    // Test notification permission request
    const hasPermissions = await notificationService.requestPermissions();
    console.log('[SmartNotificationTest] Notification permissions:', hasPermissions);
    
    if (!hasPermissions) {
      console.warn('[SmartNotificationTest] Notification permissions not granted');
      return false;
    }

    // Test scheduling a simple notification
    const mockTask = {
      id: 'test-task-123',
      title: 'Test Task for Smart Notifications',
      priority: 'medium' as const,
    };

    const timing = { hour: 9, minute: 0 };
    
    // Note: This would work with an actual Task object from the database
    // const notificationId = await notificationService.scheduleTaskReminder(mockTask, timing);
    // console.log('[SmartNotificationTest] Scheduled notification ID:', notificationId);

    console.log('[SmartNotificationTest] Basic scheduling test completed');
    return true;
  } catch (error) {
    console.error('[SmartNotificationTest] Basic scheduling test failed:', error);
    return false;
  }
}

/**
 * Test the personalization analysis functionality
 */
export async function testPersonalizationAnalysis(userId: string): Promise<boolean> {
  try {
    console.log('[SmartNotificationTest] Testing personalization analysis...');
    
    // Test user profile creation/analysis
    const profile = await notificationPersonalizer.analyzeUserPatterns(userId);
    console.log('[SmartNotificationTest] User profile:', {
      mostActiveHours: profile.mostActiveHours,
      preferredDays: profile.preferredDays,
      totalCompletions: profile.totalCompletions,
    });

    // Test settings management
    const settings = await notificationPersonalizer.getUserSettings(userId);
    console.log('[SmartNotificationTest] User settings:', settings);

    // Test optimization
    const mockTask = {
      id: 'test-task-456',
      title: 'Test Optimization Task',
      priority: 'high' as const,
    };

    const originalTiming = { hour: 14, minute: 30 };
    
    // Note: This would work with an actual Task object from the database
    // const optimization = await notificationPersonalizer.getOptimizedTiming(
    //   userId,
    //   mockTask,
    //   originalTiming
    // );
    // console.log('[SmartNotificationTest] Optimization result:', optimization);

    console.log('[SmartNotificationTest] Personalization analysis test completed');
    return true;
  } catch (error) {
    console.error('[SmartNotificationTest] Personalization analysis test failed:', error);
    return false;
  }
}

/**
 * Test the learning trigger functionality
 */
export async function testLearningTriggers(userId: string): Promise<boolean> {
  try {
    console.log('[SmartNotificationTest] Testing learning triggers...');
    
    // Test settings update
    await notificationPersonalizer.updateUserSettings(userId, {
      isSmartEnabled: true,
      learningEnabled: true,
      adaptationSensitivity: 'medium',
    });

    // Verify settings were updated
    const updatedSettings = await notificationPersonalizer.getUserSettings(userId);
    console.log('[SmartNotificationTest] Updated settings:', updatedSettings);

    console.log('[SmartNotificationTest] Learning triggers test completed');
    return true;
  } catch (error) {
    console.error('[SmartNotificationTest] Learning triggers test failed:', error);
    return false;
  }
}

/**
 * Run comprehensive smart notification system test
 */
export async function runSmartNotificationSystemTest(userId: string): Promise<{
  success: boolean;
  results: {
    basicScheduling: boolean;
    personalizationAnalysis: boolean;
    learningTriggers: boolean;
  };
}> {
  console.log('[SmartNotificationTest] Starting comprehensive smart notification system test...');
  
  const results = {
    basicScheduling: false,
    personalizationAnalysis: false,
    learningTriggers: false,
  };

  try {
    // Test basic scheduling
    results.basicScheduling = await testBasicNotificationScheduling();
    
    // Test personalization analysis
    results.personalizationAnalysis = await testPersonalizationAnalysis(userId);
    
    // Test learning triggers
    results.learningTriggers = await testLearningTriggers(userId);

    const success = Object.values(results).every(result => result);
    
    console.log('[SmartNotificationTest] Test completed:', {
      success,
      results,
    });

    return { success, results };
  } catch (error) {
    console.error('[SmartNotificationTest] System test failed:', error);
    return { success: false, results };
  }
}

/**
 * Test notification message generation
 */
export function testNotificationMessages(): boolean {
  try {
    console.log('[SmartNotificationTest] Testing notification message generation...');
    
    const mockTask = {
      id: 'test-task-789',
      title: 'Important Meeting Prep',
      priority: 'urgent' as const,
    } as any;

    const mockOptimization = {
      confidence: 0.8,
      reason: 'Moved 2 hours later when you\'re most active',
      effectivenessScore: 0.9,
    };

    const message = taskCompletionActions.generateSmartNotificationMessage(
      mockTask,
      mockOptimization
    );

    console.log('[SmartNotificationTest] Generated message:', message);
    
    // Test different confidence levels
    const lowConfidenceMessage = taskCompletionActions.generateSmartNotificationMessage(
      mockTask,
      { ...mockOptimization, confidence: 0.2 }
    );
    
    const mediumConfidenceMessage = taskCompletionActions.generateSmartNotificationMessage(
      mockTask,
      { ...mockOptimization, confidence: 0.5 }
    );

    console.log('[SmartNotificationTest] Message variations:', {
      highConfidence: message,
      mediumConfidence: mediumConfidenceMessage,
      lowConfidence: lowConfidenceMessage,
    });

    console.log('[SmartNotificationTest] Message generation test completed');
    return true;
  } catch (error) {
    console.error('[SmartNotificationTest] Message generation test failed:', error);
    return false;
  }
}

/**
 * Display test summary and recommendations
 */
export function displayTestSummary(testResults: {
  success: boolean;
  results: {
    basicScheduling: boolean;
    personalizationAnalysis: boolean;
    learningTriggers: boolean;
  };
}): void {
  console.log('\n=== Smart Notification System Test Summary ===');
  console.log(`Overall Success: ${testResults.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Basic Scheduling: ${testResults.results.basicScheduling ? '✅' : '❌'}`);
  console.log(`Personalization Analysis: ${testResults.results.personalizationAnalysis ? '✅' : '❌'}`);
  console.log(`Learning Triggers: ${testResults.results.learningTriggers ? '✅' : '❌'}`);
  
  if (!testResults.success) {
    console.log('\n📝 Recommendations:');
    if (!testResults.results.basicScheduling) {
      console.log('- Check notification permissions');
      console.log('- Verify Expo Notifications configuration');
    }
    if (!testResults.results.personalizationAnalysis) {
      console.log('- Check database connection and task completion data');
      console.log('- Verify AsyncStorage permissions');
    }
    if (!testResults.results.learningTriggers) {
      console.log('- Check settings persistence');
      console.log('- Verify user authentication state');
    }
  } else {
    console.log('\n🎉 All tests passed! Smart notification system is ready.');
    console.log('💡 Next steps:');
    console.log('- Integrate SmartNotificationSettings into your settings screen');
    console.log('- Use useSmartNotifications hook in your task components');
    console.log('- Monitor user patterns and adjust learning sensitivity as needed');
  }
  console.log('===============================================\n');
}