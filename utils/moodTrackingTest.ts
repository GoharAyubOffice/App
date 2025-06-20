/**
 * Mood Tracking System Test Utilities
 * 
 * This file contains test functions to validate the mood tracking system
 */

import { moodQueries } from '../db/queries/moodQueries';
import { MoodEntry } from '../db/model/moodEntry';

/**
 * Test creating mood entries
 */
export async function testMoodEntryCreation(userId: string): Promise<boolean> {
  try {
    console.log('[MoodTest] Testing mood entry creation...');
    
    // Test creating different mood entries
    const testMoods = [
      { score: 1, notes: 'Feeling very sad today', context: 'morning_check' },
      { score: 3, notes: 'Neutral day at work', context: 'work_break' },
      { score: 5, notes: 'Amazing day with friends!', context: 'evening_reflection' },
    ];

    for (const mood of testMoods) {
      const result = await moodQueries.createMoodEntry(
        userId,
        mood.score,
        mood.notes,
        mood.context
      );

      if (!result.success) {
        console.error(`[MoodTest] Failed to create mood entry:`, result.error);
        return false;
      }

      console.log(`[MoodTest] Created mood entry: ${mood.score}/5 - ${mood.notes}`);
    }

    console.log('[MoodTest] Mood entry creation test completed successfully');
    return true;
  } catch (error) {
    console.error('[MoodTest] Mood entry creation test failed:', error);
    return false;
  }
}

/**
 * Test mood entry retrieval
 */
export async function testMoodEntryRetrieval(userId: string): Promise<boolean> {
  try {
    console.log('[MoodTest] Testing mood entry retrieval...');
    
    // Test getting latest mood entry
    const latestResult = await moodQueries.getLatestMoodEntry(userId);
    if (!latestResult.success) {
      console.error(`[MoodTest] Failed to get latest mood entry:`, latestResult.error);
      return false;
    }

    console.log('[MoodTest] Latest mood entry:', latestResult.data?.moodScore || 'None');

    // Test getting mood entries for date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const rangeResult = await moodQueries.getMoodEntriesInRange(userId, startDate, endDate);
    if (!rangeResult.success) {
      console.error(`[MoodTest] Failed to get mood entries in range:`, rangeResult.error);
      return false;
    }

    console.log(`[MoodTest] Found ${rangeResult.data?.length || 0} mood entries in last 30 days`);

    console.log('[MoodTest] Mood entry retrieval test completed successfully');
    return true;
  } catch (error) {
    console.error('[MoodTest] Mood entry retrieval test failed:', error);
    return false;
  }
}

/**
 * Test calendar mood data
 */
export async function testCalendarMoodData(userId: string): Promise<boolean> {
  try {
    console.log('[MoodTest] Testing calendar mood data...');
    
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const calendarResult = await moodQueries.getCalendarMoodData(userId, year, month);
    if (!calendarResult.success) {
      console.error(`[MoodTest] Failed to get calendar mood data:`, calendarResult.error);
      return false;
    }

    const calendarData = calendarResult.data;
    const entryCount = Object.keys(calendarData).length;
    
    console.log(`[MoodTest] Calendar data contains ${entryCount} days with mood entries`);
    
    // Log sample of calendar data
    if (entryCount > 0) {
      const sampleDate = Object.keys(calendarData)[0];
      const sampleEntry = calendarData[sampleDate];
      console.log(`[MoodTest] Sample entry for ${sampleDate}:`, {
        mood: sampleEntry.mood,
        emoji: sampleEntry.emoji,
        color: sampleEntry.color,
      });
    }

    console.log('[MoodTest] Calendar mood data test completed successfully');
    return true;
  } catch (error) {
    console.error('[MoodTest] Calendar mood data test failed:', error);
    return false;
  }
}

/**
 * Test mood statistics calculation
 */
export async function testMoodStatistics(userId: string): Promise<boolean> {
  try {
    console.log('[MoodTest] Testing mood statistics...');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const statsResult = await moodQueries.getMoodStatistics(userId, startDate, endDate);
    if (!statsResult.success) {
      console.error(`[MoodTest] Failed to get mood statistics:`, statsResult.error);
      return false;
    }

    const stats = statsResult.data;
    console.log('[MoodTest] Mood statistics:', {
      averageMood: stats.averageMood.toFixed(1),
      totalEntries: stats.totalEntries,
      moodTrend: stats.moodTrend,
      bestDay: stats.bestDay,
      worstDay: stats.worstDay,
    });

    console.log('[MoodTest] Mood statistics test completed successfully');
    return true;
  } catch (error) {
    console.error('[MoodTest] Mood statistics test failed:', error);
    return false;
  }
}

/**
 * Test MoodEntry model helper methods
 */
export function testMoodEntryHelpers(): boolean {
  try {
    console.log('[MoodTest] Testing MoodEntry helper methods...');
    
    // Test mood options
    const moodOptions = MoodEntry.getMoodOptions();
    console.log(`[MoodTest] Available mood options: ${moodOptions.length}`);
    
    moodOptions.forEach(option => {
      console.log(`[MoodTest] ${option.score}: ${option.emoji} ${option.displayName} (${option.color})`);
    });

    // Test mood label from score
    const testScores = [1, 2, 3, 4, 5];
    testScores.forEach(score => {
      const label = MoodEntry.getMoodLabelFromScore(score);
      console.log(`[MoodTest] Score ${score} -> Label: ${label}`);
    });

    console.log('[MoodTest] MoodEntry helper methods test completed successfully');
    return true;
  } catch (error) {
    console.error('[MoodTest] MoodEntry helper methods test failed:', error);
    return false;
  }
}

/**
 * Run comprehensive mood tracking system test
 */
export async function runMoodTrackingSystemTest(userId: string): Promise<{
  success: boolean;
  results: {
    moodEntryCreation: boolean;
    moodEntryRetrieval: boolean;
    calendarMoodData: boolean;
    moodStatistics: boolean;
    helperMethods: boolean;
  };
}> {
  console.log('[MoodTest] Starting comprehensive mood tracking system test...');
  
  const results = {
    moodEntryCreation: false,
    moodEntryRetrieval: false,
    calendarMoodData: false,
    moodStatistics: false,
    helperMethods: false,
  };

  try {
    // Test helper methods first (no database required)
    results.helperMethods = testMoodEntryHelpers();
    
    // Test mood entry creation
    results.moodEntryCreation = await testMoodEntryCreation(userId);
    
    // Test mood entry retrieval
    results.moodEntryRetrieval = await testMoodEntryRetrieval(userId);
    
    // Test calendar mood data
    results.calendarMoodData = await testCalendarMoodData(userId);
    
    // Test mood statistics
    results.moodStatistics = await testMoodStatistics(userId);

    const success = Object.values(results).every(result => result);
    
    console.log('[MoodTest] Test completed:', {
      success,
      results,
    });

    return { success, results };
  } catch (error) {
    console.error('[MoodTest] System test failed:', error);
    return { success: false, results };
  }
}

/**
 * Display test summary and recommendations
 */
export function displayMoodTestSummary(testResults: {
  success: boolean;
  results: {
    moodEntryCreation: boolean;
    moodEntryRetrieval: boolean;
    calendarMoodData: boolean;
    moodStatistics: boolean;
    helperMethods: boolean;
  };
}): void {
  console.log('\n=== Mood Tracking System Test Summary ===');
  console.log(`Overall Success: ${testResults.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Mood Entry Creation: ${testResults.results.moodEntryCreation ? '✅' : '❌'}`);
  console.log(`Mood Entry Retrieval: ${testResults.results.moodEntryRetrieval ? '✅' : '❌'}`);
  console.log(`Calendar Mood Data: ${testResults.results.calendarMoodData ? '✅' : '❌'}`);
  console.log(`Mood Statistics: ${testResults.results.moodStatistics ? '✅' : '❌'}`);
  console.log(`Helper Methods: ${testResults.results.helperMethods ? '✅' : '❌'}`);
  
  if (!testResults.success) {
    console.log('\n📝 Recommendations:');
    if (!testResults.results.helperMethods) {
      console.log('- Check MoodEntry model implementation');
      console.log('- Verify mood options and helper methods');
    }
    if (!testResults.results.moodEntryCreation) {
      console.log('- Check database connection and mood_entries table');
      console.log('- Verify user authentication and permissions');
    }
    if (!testResults.results.moodEntryRetrieval) {
      console.log('- Check query implementation in moodQueries');
      console.log('- Verify database indexes and performance');
    }
    if (!testResults.results.calendarMoodData) {
      console.log('- Check calendar data formatting and date handling');
      console.log('- Verify timezone and date range calculations');
    }
    if (!testResults.results.moodStatistics) {
      console.log('- Check statistics calculation algorithms');
      console.log('- Verify trend analysis and aggregation logic');
    }
  } else {
    console.log('\n🎉 All tests passed! Mood tracking system is ready.');
    console.log('💡 Next steps:');
    console.log('- Add mood tracking pages to navigation');
    console.log('- Test UI components with real data');
    console.log('- Consider adding mood insights and recommendations');
    console.log('- Implement mood-based notifications or reminders');
  }
  console.log('===============================================\n');
}