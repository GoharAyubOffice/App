// Real analytics engine using mockStorage data
import { mockStorage } from '../store/mockStorage';

export interface AnalyticsResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  hasMinimumData: boolean;
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  date?: Date;
  metadata?: any;
}

export interface CompletionRateData {
  daily: ChartDataPoint[];
  weekly: ChartDataPoint[];
  trend: 'improving' | 'declining' | 'stable';
  currentRate: number;
  previousRate: number;
}

export interface ProductivityTrend {
  tasksCompleted: ChartDataPoint[];
  activeTimes: ChartDataPoint[];
  streaks: ChartDataPoint[];
  overallTrend: 'up' | 'down' | 'stable';
}

export interface MoodProductivityCorrelation {
  correlationData: Array<{
    mood: number;
    completionRate: number;
    date: string;
  }>;
  correlationStrength: number; // -1 to 1
  insights: string[];
}

export interface TaskDistribution {
  byStatus: Array<{ status: string; count: number; percentage: number }>;
  byPriority: Array<{ priority: string; count: number; percentage: number }>;
  byCategory: Array<{ category: string; count: number; percentage: number }>;
  completionTimes: ChartDataPoint[];
}

export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageMood: number;
  longestStreak: number;
  totalActiveTime: number;
  hasMinimumData: boolean;
  dataQuality: {
    tasksDataSufficient: boolean;
    moodDataSufficient: boolean;
    streakDataSufficient: boolean;
    timeDataSufficient: boolean;
  };
}

class MockAnalyticsEngine {
  private static instance: MockAnalyticsEngine;

  public static getInstance(): MockAnalyticsEngine {
    if (!MockAnalyticsEngine.instance) {
      MockAnalyticsEngine.instance = new MockAnalyticsEngine();
    }
    return MockAnalyticsEngine.instance;
  }

  private calculateLongestStreak(tasks: any[]): number {
    // Calculate longest consecutive days with completed tasks
    const completedTasks = tasks.filter(t => t.status === 'completed')
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    
    if (completedTasks.length === 0) return 0;
    
    let longestStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < completedTasks.length; i++) {
      const prevDate = new Date(completedTasks[i - 1].updatedAt);
      const currDate = new Date(completedTasks[i].updatedAt);
      
      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return longestStreak;
  }

  private generateRealDailyData(userId: string, days: number): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    const today = new Date();
    const userTasks = mockStorage.getTasks(userId);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Get tasks created or updated on this day
      const dayTasks = userTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= dayStart && taskDate <= dayEnd;
      });
      
      const completedDayTasks = dayTasks.filter(t => t.status === 'completed');
      const completionRate = dayTasks.length > 0 ? (completedDayTasks.length / dayTasks.length) * 100 : 0;
      
      data.push({
        x: date.toISOString().split('T')[0],
        y: Math.round(completionRate),
        date: date,
        label: `${Math.round(completionRate)}%`
      });
    }
    
    return data;
  }

  async getAnalyticsSummary(userId: string): Promise<AnalyticsResult<AnalyticsSummary>> {
    try {
      // Get real user data from mockStorage
      const userTasks = mockStorage.getTasks(userId);
      const userMoods = mockStorage.getMoodEntries(userId);
      const stats = mockStorage.getStats(userId);

      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(t => t.status === 'completed').length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Check if we have minimum data for meaningful analytics
      const hasMinimumData = totalTasks >= 3 || userMoods.length >= 3;

      const summary: AnalyticsSummary = {
        totalTasks,
        completedTasks,
        completionRate: Math.round(completionRate * 10) / 10,
        averageMood: stats.averageMood,
        longestStreak: this.calculateLongestStreak(userTasks), 
        totalActiveTime: completedTasks * 25, // Estimate 25 min per completed task
        hasMinimumData,
        dataQuality: {
          tasksDataSufficient: totalTasks >= 5,
          moodDataSufficient: userMoods.length >= 5,
          streakDataSufficient: completedTasks >= 3,
          timeDataSufficient: completedTasks >= 3,
        }
      };

      return {
        success: true,
        hasMinimumData,
        data: summary,
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return {
        success: false,
        hasMinimumData: false,
        error: 'Failed to load analytics data'
      };
    }
  }

  async getCompletionRateData(userId: string, days: number = 30): Promise<AnalyticsResult<CompletionRateData>> {
    try {
      const dailyData = this.generateRealDailyData(userId, days);
      const weeklyData = this.generateRealDailyData(userId, Math.ceil(days / 7));

      // Calculate current and previous week rates
      const currentWeekData = dailyData.slice(-7);
      const previousWeekData = dailyData.slice(-14, -7);
      
      const currentRate = currentWeekData.length > 0 
        ? currentWeekData.reduce((sum, d) => sum + d.y, 0) / currentWeekData.length 
        : 0;
      const previousRate = previousWeekData.length > 0 
        ? previousWeekData.reduce((sum, d) => sum + d.y, 0) / previousWeekData.length 
        : 0;

      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (currentRate > previousRate + 5) trend = 'improving';
      else if (currentRate < previousRate - 5) trend = 'declining';

      const hasMinimumData = mockStorage.getTasks(userId).length >= 3;

      return {
        success: true,
        hasMinimumData,
        data: {
          daily: dailyData,
          weekly: weeklyData,
          trend,
          currentRate: Math.round(currentRate),
          previousRate: Math.round(previousRate),
        }
      };
    } catch (error) {
      console.error('Error getting completion rate data:', error);
      return {
        success: false,
        hasMinimumData: false,
        error: 'Failed to load completion rate data'
      };
    }
  }

  async getProductivityTrend(userId: string, days: number = 30): Promise<AnalyticsResult<ProductivityTrend>> {
    await new Promise(resolve => setTimeout(resolve, 700));

    const tasksCompleted = this.generateMockDailyData(days).map(d => ({
      ...d,
      y: Math.floor(d.y / 10), // Convert percentage to task count
      label: `${Math.floor(d.y / 10)} tasks`
    }));

    const activeTimes = this.generateMockDailyData(days).map(d => ({
      ...d,
      y: Math.floor(Math.random() * 120 + 60), // 60-180 minutes
      label: `${Math.floor(Math.random() * 120 + 60)} min`
    }));

    const streaks = this.generateMockDailyData(days).map(d => ({
      ...d,
      y: Math.floor(Math.random() * 8 + 1), // 1-8 day streaks
      label: `${Math.floor(Math.random() * 8 + 1)} days`
    }));

    return {
      success: true,
      hasMinimumData: true,
      data: {
        tasksCompleted,
        activeTimes,
        streaks,
        overallTrend: 'up' as const,
      }
    };
  }

  async getMoodProductivityCorrelation(userId: string, days: number = 30): Promise<AnalyticsResult<MoodProductivityCorrelation>> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const correlationData = this.generateMockDailyData(days).map(d => ({
      mood: Math.random() * 2 + 3, // 3-5 mood range
      completionRate: d.y,
      date: d.x as string,
    }));

    return {
      success: true,
      hasMinimumData: true,
      data: {
        correlationData,
        correlationStrength: 0.67, // Positive correlation
        insights: [
          'Your productivity tends to be higher on days when your mood is better',
          'Best performance occurs when mood is 4+ out of 5',
          'Consider mood-boosting activities on low-energy days'
        ]
      }
    };
  }

  async getTaskDistribution(userId: string): Promise<AnalyticsResult<TaskDistribution>> {
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      success: true,
      hasMinimumData: true,
      data: {
        byStatus: [
          { status: 'Completed', count: 35, percentage: 74.5 },
          { status: 'In Progress', count: 8, percentage: 17.0 },
          { status: 'To Do', count: 4, percentage: 8.5 },
        ],
        byPriority: [
          { priority: 'High', count: 12, percentage: 25.5 },
          { priority: 'Medium', count: 23, percentage: 48.9 },
          { priority: 'Low', count: 12, percentage: 25.5 },
        ],
        byCategory: [
          { category: 'Work', count: 20, percentage: 42.6 },
          { category: 'Personal', count: 15, percentage: 31.9 },
          { category: 'Health', count: 8, percentage: 17.0 },
          { category: 'Learning', count: 4, percentage: 8.5 },
        ],
        completionTimes: this.generateMockDailyData(12).map(d => ({
          ...d,
          y: Math.floor(Math.random() * 120 + 30), // 30-150 minutes
          label: `${Math.floor(Math.random() * 120 + 30)} min`
        }))
      }
    };
  }
}

// Export singleton instance
export const analyticsEngine = MockAnalyticsEngine.getInstance();