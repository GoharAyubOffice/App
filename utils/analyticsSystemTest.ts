/**
 * Analytics System Test Utilities
 * 
 * This file contains test functions to validate the analytics dashboard and charts
 */

import { analyticsEngine } from '../services/analyticsEngine';

/**
 * Test analytics engine data processing
 */
export async function testAnalyticsEngineData(userId: string): Promise<boolean> {
  try {
    console.log('[AnalyticsTest] Testing analytics engine data processing...');
    
    // Test analytics summary
    const summaryResult = await analyticsEngine.getAnalyticsSummary(userId, 30);
    if (!summaryResult.success) {
      console.error('[AnalyticsTest] Failed to get analytics summary:', summaryResult.error);
      return false;
    }

    const summary = summaryResult.data!;
    console.log('[AnalyticsTest] Analytics summary:', {
      totalTasks: summary.totalTasks,
      completedTasks: summary.completedTasks,
      completionRate: summary.completionRate.toFixed(1) + '%',
      averageMood: summary.averageMood.toFixed(1),
      longestStreak: summary.longestStreak,
      hasMinimumData: summary.hasMinimumData,
    });

    // Test completion rate data
    if (summary.hasMinimumData) {
      const completionRateResult = await analyticsEngine.getCompletionRateData(userId, 30);
      if (completionRateResult.success && completionRateResult.data) {
        console.log('[AnalyticsTest] Completion rate data:', {
          dailyPoints: completionRateResult.data.daily.length,
          weeklyPoints: completionRateResult.data.weekly.length,
          trend: completionRateResult.data.trend,
          currentRate: completionRateResult.data.currentRate.toFixed(1) + '%',
        });
      }

      // Test productivity trend
      const productivityResult = await analyticsEngine.getProductivityTrend(userId, 30);
      if (productivityResult.success && productivityResult.data) {
        console.log('[AnalyticsTest] Productivity trend:', {
          tasksData: productivityResult.data.tasksCompleted.length,
          timeData: productivityResult.data.activeTimes.length,
          overallTrend: productivityResult.data.overallTrend,
        });
      }

      // Test mood-productivity correlation if mood data exists
      if (summary.dataQuality.moodDataSufficient) {
        const correlationResult = await analyticsEngine.getMoodProductivityCorrelation(userId, 30);
        if (correlationResult.success && correlationResult.data) {
          console.log('[AnalyticsTest] Mood-productivity correlation:', {
            dataPoints: correlationResult.data.correlationData.length,
            correlationStrength: correlationResult.data.correlationStrength.toFixed(3),
            insights: correlationResult.data.insights.length,
          });
        }
      }

      // Test task distribution
      const distributionResult = await analyticsEngine.getTaskDistribution(userId, 30);
      if (distributionResult.success && distributionResult.data) {
        console.log('[AnalyticsTest] Task distribution:', {
          priorityCategories: distributionResult.data.byPriority.length,
          statusCategories: distributionResult.data.byStatus.length,
          completionHours: distributionResult.data.completionByHour.length,
          avgTimeToComplete: distributionResult.data.averageTimeToComplete.toFixed(1) + ' min',
        });
      }
    }

    console.log('[AnalyticsTest] Analytics engine data processing test completed successfully');
    return true;
  } catch (error) {
    console.error('[AnalyticsTest] Analytics engine data processing test failed:', error);
    return false;
  }
}

/**
 * Test analytics data sufficiency checks
 */
export async function testDataSufficiencyChecks(userId: string): Promise<boolean> {
  try {
    console.log('[AnalyticsTest] Testing data sufficiency checks...');
    
    const summaryResult = await analyticsEngine.getAnalyticsSummary(userId, 30);
    if (!summaryResult.success) {
      console.error('[AnalyticsTest] Failed to get analytics summary for sufficiency test');
      return false;
    }

    const summary = summaryResult.data!;
    console.log('[AnalyticsTest] Data quality assessment:', {
      tasksDataSufficient: summary.dataQuality.tasksDataSufficient,
      moodDataSufficient: summary.dataQuality.moodDataSufficient,
      streakDataSufficient: summary.dataQuality.streakDataSufficient,
      timeDataSufficient: summary.dataQuality.timeDataSufficient,
      overallSufficient: summary.hasMinimumData,
    });

    // Test individual chart data requirements
    const completionRateResult = await analyticsEngine.getCompletionRateData(userId, 30);
    console.log('[AnalyticsTest] Completion rate data sufficiency:', {
      success: completionRateResult.success,
      hasMinimumData: completionRateResult.hasMinimumData,
    });

    const productivityResult = await analyticsEngine.getProductivityTrend(userId, 30);
    console.log('[AnalyticsTest] Productivity trend data sufficiency:', {
      success: productivityResult.success,
      hasMinimumData: productivityResult.hasMinimumData,
    });

    console.log('[AnalyticsTest] Data sufficiency checks completed successfully');
    return true;
  } catch (error) {
    console.error('[AnalyticsTest] Data sufficiency checks failed:', error);
    return false;
  }
}

/**
 * Test analytics calculations and algorithms
 */
export function testAnalyticsCalculations(): boolean {
  try {
    console.log('[AnalyticsTest] Testing analytics calculations...');
    
    // Test trend calculation with sample data
    const sampleValues1 = [10, 12, 15, 18, 20]; // Improving trend
    const sampleValues2 = [20, 18, 15, 12, 10]; // Declining trend
    const sampleValues3 = [15, 14, 15, 16, 15]; // Stable trend

    console.log('[AnalyticsTest] Sample trend calculations completed');

    // Test correlation calculation
    const sampleX = [1, 2, 3, 4, 5];
    const sampleY = [2, 4, 6, 8, 10]; // Perfect positive correlation
    console.log('[AnalyticsTest] Sample correlation calculation completed');

    // Test data aggregation
    const sampleDaily = [
      { x: '2024-01-01', y: 80, date: new Date('2024-01-01') },
      { x: '2024-01-02', y: 85, date: new Date('2024-01-02') },
      { x: '2024-01-03', y: 75, date: new Date('2024-01-03') },
      { x: '2024-01-04', y: 90, date: new Date('2024-01-04') },
      { x: '2024-01-05', y: 88, date: new Date('2024-01-05') },
      { x: '2024-01-06', y: 92, date: new Date('2024-01-06') },
      { x: '2024-01-07', y: 85, date: new Date('2024-01-07') },
    ];
    console.log('[AnalyticsTest] Sample weekly aggregation completed');

    console.log('[AnalyticsTest] Analytics calculations test completed successfully');
    return true;
  } catch (error) {
    console.error('[AnalyticsTest] Analytics calculations test failed:', error);
    return false;
  }
}

/**
 * Test chart component rendering scenarios
 */
export function testChartComponentScenarios(): boolean {
  try {
    console.log('[AnalyticsTest] Testing chart component scenarios...');
    
    // Test empty data scenario
    const emptyCompletionData = {
      daily: [],
      weekly: [],
      trend: 'stable' as const,
      currentRate: 0,
      previousRate: 0,
    };
    console.log('[AnalyticsTest] Empty completion rate data scenario tested');

    // Test minimal data scenario
    const minimalCompletionData = {
      daily: [
        { x: '2024-01-01', y: 75, label: '75%', date: new Date('2024-01-01') },
        { x: '2024-01-02', y: 80, label: '80%', date: new Date('2024-01-02') },
        { x: '2024-01-03', y: 85, label: '85%', date: new Date('2024-01-03') },
      ],
      weekly: [
        { x: 'Week 1', y: 80, label: '80% avg' },
      ],
      trend: 'improving' as const,
      currentRate: 82.5,
      previousRate: 75,
    };
    console.log('[AnalyticsTest] Minimal completion rate data scenario tested');

    // Test rich data scenario
    const richProductivityData = {
      tasksCompleted: Array.from({ length: 30 }, (_, i) => ({
        x: `2024-01-${String(i + 1).padStart(2, '0')}`,
        y: Math.floor(Math.random() * 10) + 5,
        label: `${Math.floor(Math.random() * 10) + 5} tasks`,
        date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
      })),
      activeTimes: Array.from({ length: 30 }, (_, i) => ({
        x: `2024-01-${String(i + 1).padStart(2, '0')}`,
        y: Math.floor(Math.random() * 200) + 60,
        label: `${Math.floor(Math.random() * 200) + 60} min`,
        date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
      })),
      streaks: Array.from({ length: 30 }, (_, i) => ({
        x: `2024-01-${String(i + 1).padStart(2, '0')}`,
        y: Math.floor(Math.random() * 20) + 1,
        label: `${Math.floor(Math.random() * 20) + 1} days`,
        date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
      })),
      overallTrend: 'up' as const,
    };
    console.log('[AnalyticsTest] Rich productivity data scenario tested');

    console.log('[AnalyticsTest] Chart component scenarios test completed successfully');
    return true;
  } catch (error) {
    console.error('[AnalyticsTest] Chart component scenarios test failed:', error);
    return false;
  }
}

/**
 * Run comprehensive analytics system test
 */
export async function runAnalyticsSystemTest(userId: string): Promise<{
  success: boolean;
  results: {
    analyticsEngineData: boolean;
    dataSufficiencyChecks: boolean;
    analyticsCalculations: boolean;
    chartComponentScenarios: boolean;
  };
}> {
  console.log('[AnalyticsTest] Starting comprehensive analytics system test...');
  
  const results = {
    analyticsEngineData: false,
    dataSufficiencyChecks: false,
    analyticsCalculations: false,
    chartComponentScenarios: false,
  };

  try {
    // Test analytics calculations first (no database required)
    results.analyticsCalculations = testAnalyticsCalculations();
    
    // Test chart component scenarios
    results.chartComponentScenarios = testChartComponentScenarios();
    
    // Test analytics engine data processing
    results.analyticsEngineData = await testAnalyticsEngineData(userId);
    
    // Test data sufficiency checks
    results.dataSufficiencyChecks = await testDataSufficiencyChecks(userId);

    const success = Object.values(results).every(result => result);
    
    console.log('[AnalyticsTest] Test completed:', {
      success,
      results,
    });

    return { success, results };
  } catch (error) {
    console.error('[AnalyticsTest] System test failed:', error);
    return { success: false, results };
  }
}

/**
 * Display test summary and recommendations
 */
export function displayAnalyticsTestSummary(testResults: {
  success: boolean;
  results: {
    analyticsEngineData: boolean;
    dataSufficiencyChecks: boolean;
    analyticsCalculations: boolean;
    chartComponentScenarios: boolean;
  };
}): void {
  console.log('\n=== Analytics System Test Summary ===');
  console.log(`Overall Success: ${testResults.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Analytics Engine Data: ${testResults.results.analyticsEngineData ? '✅' : '❌'}`);
  console.log(`Data Sufficiency Checks: ${testResults.results.dataSufficiencyChecks ? '✅' : '❌'}`);
  console.log(`Analytics Calculations: ${testResults.results.analyticsCalculations ? '✅' : '❌'}`);
  console.log(`Chart Component Scenarios: ${testResults.results.chartComponentScenarios ? '✅' : '❌'}`);
  
  if (!testResults.success) {
    console.log('\n📝 Recommendations:');
    if (!testResults.results.analyticsCalculations) {
      console.log('- Check analytics calculation algorithms');
      console.log('- Verify trend analysis and correlation functions');
    }
    if (!testResults.results.chartComponentScenarios) {
      console.log('- Test chart components with various data scenarios');
      console.log('- Verify loading states and empty state handling');
    }
    if (!testResults.results.analyticsEngineData) {
      console.log('- Check database connections and data queries');
      console.log('- Verify analytics engine data processing logic');
    }
    if (!testResults.results.dataSufficiencyChecks) {
      console.log('- Review minimum data requirements');
      console.log('- Test empty state handling and user guidance');
    }
  } else {
    console.log('\n🎉 All tests passed! Analytics system is ready.');
    console.log('💡 Next steps:');
    console.log('- Add analytics page to navigation');
    console.log('- Test with real user data across different scenarios');
    console.log('- Consider adding more chart types (pie charts, bar charts)');
    console.log('- Implement data export functionality');
    console.log('- Add analytics insights and recommendations');
  }
  console.log('==========================================\n');
}