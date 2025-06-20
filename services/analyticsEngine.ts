import { Q } from '@nozbe/watermelondb';
import { database } from '../db/index';
import { Task } from '../db/model/task';
import { TaskCompletion } from '../db/model/taskCompletion';
import { DailyActivity } from '../db/model/dailyActivity';
import { UserStreak } from '../db/model/userStreak';
import { MoodEntry } from '../db/model/moodEntry';
import { TimeEntry } from '../db/model/timeEntry';
import { moodQueries } from '../db/queries/moodQueries';

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
  byPriority: Array<{ priority: string; count: number; percentage: number }>;
  byStatus: Array<{ status: string; count: number; percentage: number }>;
  completionByHour: ChartDataPoint[];
  averageTimeToComplete: number;
}

export interface StreakAnalytics {
  currentStreaks: Array<{ type: string; count: number; trend: string }>;
  longestStreaks: Array<{ type: string; count: number; achieved: string }>;
  protectionUsage: ChartDataPoint[];
  streakGrowth: ChartDataPoint[];
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

const MINIMUM_DATA_REQUIREMENTS = {
  TASKS: 5,
  MOOD_ENTRIES: 3,
  DAILY_ACTIVITIES: 3,
  TIME_ENTRIES: 3,
  DAYS_OF_DATA: 3,
};

export class AnalyticsEngine {
  private static instance: AnalyticsEngine;

  static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine();
    }
    return AnalyticsEngine.instance;
  }

  /**
   * Get overall analytics summary
   */
  async getAnalyticsSummary(userId: string, days: number = 30): Promise<AnalyticsResult<AnalyticsSummary>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch all required data in parallel
      const [
        tasksData,
        completionsData,
        dailyActivitiesData,
        moodData,
        streakData,
        timeData
      ] = await Promise.all([
        this.getTasksInRange(userId, startDate, endDate),
        this.getCompletionsInRange(userId, startDate, endDate),
        this.getDailyActivitiesInRange(userId, startDate, endDate),
        moodQueries.getMoodEntriesInRange(userId, startDate, endDate),
        this.getStreaksForUser(userId),
        this.getTimeEntriesInRange(userId, startDate, endDate),
      ]);

      const tasks: any[] = tasksData && tasksData.success && tasksData.data ? tasksData.data : [];
      const completions: any[] = completionsData && completionsData.success && completionsData.data ? completionsData.data : [];
      const dailyActivities: any[] = dailyActivitiesData && dailyActivitiesData.success && dailyActivitiesData.data ? dailyActivitiesData.data : [];
      const moodEntries: Array<{ moodScore: number }> = moodData && moodData.success && moodData.data ? moodData.data : [];
      const streaks: Array<{ longestCount: number }> = streakData && streakData.success && streakData.data ? streakData.data : [];
      const timeEntries: Array<{ duration?: number }> = timeData && timeData.success && timeData.data ? timeData.data : [];

      // Calculate summary metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const averageMood = moodEntries.length > 0
        ? moodEntries.reduce((sum: number, entry: { moodScore: number }) => sum + entry.moodScore, 0) / moodEntries.length
        : 0;

      const longestStreak = streaks && streaks.length > 0
        ? Math.max(...streaks.map((streak: { longestCount: number }) => streak.longestCount))
        : 0;

      const totalActiveTime = timeEntries && timeEntries.length > 0
        ? timeEntries.reduce((sum: number, entry: { duration?: number }) => sum + (entry.duration || 0), 0)
        : 0;

      // Check data sufficiency
      const dataQuality = {
        tasksDataSufficient: tasks.length >= MINIMUM_DATA_REQUIREMENTS.TASKS,
        moodDataSufficient: moodEntries.length >= MINIMUM_DATA_REQUIREMENTS.MOOD_ENTRIES,
        streakDataSufficient: streaks && streaks.length > 0,
        timeDataSufficient: timeEntries && timeEntries.length >= MINIMUM_DATA_REQUIREMENTS.TIME_ENTRIES,
      };

      const hasMinimumData = dataQuality.tasksDataSufficient &&
        dailyActivities && dailyActivities.length >= MINIMUM_DATA_REQUIREMENTS.DAILY_ACTIVITIES;

      return {
        success: true,
        hasMinimumData,
        data: {
          totalTasks,
          completedTasks,
          completionRate,
          averageMood,
          longestStreak,
          totalActiveTime,
          hasMinimumData,
          dataQuality,
        },
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return {
        success: false,
        hasMinimumData: false,
        error: error instanceof Error ? error.message : 'Failed to get analytics summary',
      };
    }
  }

  /**
   * Get completion rate data for charts
   */
  async getCompletionRateData(userId: string, days: number = 30): Promise<AnalyticsResult<CompletionRateData>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dailyActivitiesResult = await this.getDailyActivitiesInRange(userId, startDate, endDate);
      
      if (!dailyActivitiesResult.success || !dailyActivitiesResult.data) {
        return {
          success: false,
          hasMinimumData: false,
          error: 'Failed to fetch daily activities',
        };
      }

      const dailyActivities = dailyActivitiesResult.data;
      const hasMinimumData = dailyActivities.length >= MINIMUM_DATA_REQUIREMENTS.DAILY_ACTIVITIES;

      // Generate daily completion rate data
      const daily: ChartDataPoint[] = dailyActivities.map(activity => ({
        x: activity.activityDate.toISOString().split('T')[0],
        y: Math.round(activity.completionRate * 100) / 100,
        label: `${(activity.completionRate * 100).toFixed(1)}%`,
        date: activity.activityDate,
        metadata: {
          tasksCompleted: activity.tasksCompleted,
          totalTasks: activity.totalTasks,
        },
      }));

      // Generate weekly aggregated data
      const weekly = this.aggregateDataByWeek(daily);

      // Calculate trend
      const trend = this.calculateTrend(daily.map(d => d.y));

      // Current vs previous period comparison
      const midPoint = Math.floor(daily.length / 2);
      const currentPeriod = daily.slice(midPoint);
      const previousPeriod = daily.slice(0, midPoint);

      const currentRate = currentPeriod.length > 0 
        ? currentPeriod.reduce((sum, d) => sum + d.y, 0) / currentPeriod.length
        : 0;
      
      const previousRate = previousPeriod.length > 0 
        ? previousPeriod.reduce((sum, d) => sum + d.y, 0) / previousPeriod.length
        : 0;

      return {
        success: true,
        hasMinimumData,
        data: {
          daily,
          weekly,
          trend,
          currentRate,
          previousRate,
        },
      };
    } catch (error) {
      console.error('Error getting completion rate data:', error);
      return {
        success: false,
        hasMinimumData: false,
        error: error instanceof Error ? error.message : 'Failed to get completion rate data',
      };
    }
  }

  /**
   * Get productivity trend data
   */
  async getProductivityTrend(userId: string, days: number = 30): Promise<AnalyticsResult<ProductivityTrend>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [dailyActivitiesResult, streaksResult] = await Promise.all([
        this.getDailyActivitiesInRange(userId, startDate, endDate),
        this.getStreaksForUser(userId),
      ]);

      if (!dailyActivitiesResult.success) {
        return {
          success: false,
          hasMinimumData: false,
          error: 'Failed to fetch productivity data',
        };
      }

      const dailyActivities = dailyActivitiesResult.data || [];
      const streaks = streaksResult.success ? streaksResult.data || [] : [];
      const hasMinimumData = dailyActivities.length >= MINIMUM_DATA_REQUIREMENTS.DAILY_ACTIVITIES;

      // Tasks completed trend
      const tasksCompleted: ChartDataPoint[] = dailyActivities.map(activity => ({
        x: activity.activityDate.toISOString().split('T')[0],
        y: activity.tasksCompleted,
        label: `${activity.tasksCompleted} tasks`,
        date: activity.activityDate,
      }));

      // Active time trend
      const activeTimes: ChartDataPoint[] = dailyActivities.map(activity => ({
        x: activity.activityDate.toISOString().split('T')[0],
        y: activity.activeTimeMinutes,
        label: `${activity.activeTimeMinutes} min`,
        date: activity.activityDate,
      }));

      // Streak trend (simplified - using daily completion streak if available)
      const streakData: ChartDataPoint[] = dailyActivities.map((activity, index) => ({
        x: activity.activityDate.toISOString().split('T')[0],
        y: activity.streakDays,
        label: `${activity.streakDays} days`,
        date: activity.activityDate,
      }));

      // Calculate overall trend
      const completionTrend = this.calculateTrend(tasksCompleted.map(d => d.y));
      const timeTrend = this.calculateTrend(activeTimes.map(d => d.y));
      const streakTrend = this.calculateTrend(streakData.map(d => d.y));

      let overallTrend: 'up' | 'down' | 'stable' = 'stable';
      const trends = [completionTrend, timeTrend, streakTrend];
      const upCount = trends.filter(t => t === 'improving').length;
      const downCount = trends.filter(t => t === 'declining').length;

      if (upCount > downCount) overallTrend = 'up';
      else if (downCount > upCount) overallTrend = 'down';

      return {
        success: true,
        hasMinimumData,
        data: {
          tasksCompleted,
          activeTimes,
          streaks: streakData,
          overallTrend,
        },
      };
    } catch (error) {
      console.error('Error getting productivity trend:', error);
      return {
        success: false,
        hasMinimumData: false,
        error: error instanceof Error ? error.message : 'Failed to get productivity trend',
      };
    }
  }

  /**
   * Get mood-productivity correlation
   */
  async getMoodProductivityCorrelation(userId: string, days: number = 30): Promise<AnalyticsResult<MoodProductivityCorrelation>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [moodResult, dailyActivitiesResult] = await Promise.all([
        moodQueries.getMoodEntriesInRange(userId, startDate, endDate),
        this.getDailyActivitiesInRange(userId, startDate, endDate),
      ]);

      if (!moodResult.success || !dailyActivitiesResult.success) {
        return {
          success: false,
          hasMinimumData: false,
          error: 'Failed to fetch mood or productivity data',
        };
      }

      const moodEntries = moodResult.data || [];
      const dailyActivities = dailyActivitiesResult.data || [];
      const hasMinimumData = moodEntries.length >= MINIMUM_DATA_REQUIREMENTS.MOOD_ENTRIES &&
                            dailyActivities.length >= MINIMUM_DATA_REQUIREMENTS.DAILY_ACTIVITIES;

      // Create correlation data by matching dates
      const correlationData: Array<{
        mood: number;
        completionRate: number;
        date: string;
      }> = [];

      moodEntries.forEach((moodEntry: any) => {
        const moodDate = moodEntry.loggedAt.toISOString().split('T')[0];
        const matchingActivity = dailyActivities.find(activity => 
          activity.activityDate.toISOString().split('T')[0] === moodDate
        );

        if (matchingActivity) {
          correlationData.push({
            mood: moodEntry.moodScore,
            completionRate: matchingActivity.completionRate * 100,
            date: moodDate,
          });
        }
      });

      // Calculate correlation strength (Pearson correlation)
      const correlationStrength = this.calculateCorrelation(
        correlationData.map(d => d.mood),
        correlationData.map(d => d.completionRate)
      );

      // Generate insights
      const insights = this.generateMoodProductivityInsights(correlationData, correlationStrength);

      return {
        success: true,
        hasMinimumData,
        data: {
          correlationData,
          correlationStrength,
          insights,
        },
      };
    } catch (error) {
      console.error('Error getting mood-productivity correlation:', error);
      return {
        success: false,
        hasMinimumData: false,
        error: error instanceof Error ? error.message : 'Failed to get mood-productivity correlation',
      };
    }
  }

  /**
   * Get task distribution analytics
   */
  async getTaskDistribution(userId: string, days: number = 30): Promise<AnalyticsResult<TaskDistribution>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [tasksResult, completionsResult, timeEntriesResult] = await Promise.all([
        this.getTasksInRange(userId, startDate, endDate),
        this.getCompletionsInRange(userId, startDate, endDate),
        this.getTimeEntriesInRange(userId, startDate, endDate),
      ]);

      if (!tasksResult.success) {
        return {
          success: false,
          hasMinimumData: false,
          error: 'Failed to fetch task data',
        };
      }

      const tasks = tasksResult.data || [];
      const completions = completionsResult.success ? completionsResult.data || [] : [];
      const timeEntries = timeEntriesResult.success ? timeEntriesResult.data || [] : [];
      const hasMinimumData = tasks.length >= MINIMUM_DATA_REQUIREMENTS.TASKS;

      // Priority distribution
      const priorityCounts = tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byPriority = Object.entries(priorityCounts).map(([priority, count]) => ({
        priority,
        count,
        percentage: Math.round((count / tasks.length) * 100),
      }));

      // Status distribution
      const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / tasks.length) * 100),
      }));

      // Completion by hour of day
      const completionByHour = this.getCompletionsByHour(completions);

      // Average time to complete
      const averageTimeToComplete = this.calculateAverageTimeToComplete(tasks, timeEntries);

      return {
        success: true,
        hasMinimumData,
        data: {
          byPriority,
          byStatus,
          completionByHour,
          averageTimeToComplete,
        },
      };
    } catch (error) {
      console.error('Error getting task distribution:', error);
      return {
        success: false,
        hasMinimumData: false,
        error: error instanceof Error ? error.message : 'Failed to get task distribution',
      };
    }
  }

  // Helper methods

  private async getTasksInRange(userId: string, startDate: Date, endDate: Date): Promise<AnalyticsResult<Task[]>> {
    try {
      const tasks = await database.collections
        .get<Task>('tasks')
        .query(
          Q.where('created_by', userId),
          Q.where('created_at', Q.between(startDate.getTime(), endDate.getTime()))
        )
        .fetch();

      return { success: true, data: tasks, hasMinimumData: tasks.length >= MINIMUM_DATA_REQUIREMENTS.TASKS };
    } catch (error) {
      return { success: false, hasMinimumData: false, error: 'Failed to fetch tasks' };
    }
  }

  private async getCompletionsInRange(userId: string, startDate: Date, endDate: Date): Promise<AnalyticsResult<TaskCompletion[]>> {
    try {
      const completions = await database.collections
        .get<TaskCompletion>('task_completions')
        .query(
          Q.where('completed_by', userId),
          Q.where('completed_at', Q.between(startDate.getTime(), endDate.getTime()))
        )
        .fetch();

      return { success: true, data: completions, hasMinimumData: true };
    } catch (error) {
      return { success: false, hasMinimumData: false, error: 'Failed to fetch completions' };
    }
  }

  private async getDailyActivitiesInRange(userId: string, startDate: Date, endDate: Date): Promise<AnalyticsResult<DailyActivity[]>> {
    try {
      const activities = await database.collections
        .get<DailyActivity>('daily_activities')
        .query(
          Q.where('user_id', userId),
          Q.where('activity_date', Q.between(startDate.getTime(), endDate.getTime())),
          Q.sortBy('activity_date', Q.asc)
        )
        .fetch();

      return { success: true, data: activities, hasMinimumData: activities.length >= MINIMUM_DATA_REQUIREMENTS.DAILY_ACTIVITIES };
    } catch (error) {
      return { success: false, hasMinimumData: false, error: 'Failed to fetch daily activities' };
    }
  }

  private async getStreaksForUser(userId: string): Promise<AnalyticsResult<UserStreak[]>> {
    try {
      const streaks = await database.collections
        .get<UserStreak>('user_streaks')
        .query(Q.where('user_id', userId))
        .fetch();

      return { success: true, data: streaks, hasMinimumData: streaks.length > 0 };
    } catch (error) {
      return { success: false, hasMinimumData: false, error: 'Failed to fetch streaks' };
    }
  }

  private async getTimeEntriesInRange(userId: string, startDate: Date, endDate: Date): Promise<AnalyticsResult<TimeEntry[]>> {
    try {
      const timeEntries = await database.collections
        .get<TimeEntry>('time_entries')
        .query(
          Q.where('user_id', userId),
          Q.where('created_at', Q.between(startDate.getTime(), endDate.getTime()))
        )
        .fetch();

      return { success: true, data: timeEntries, hasMinimumData: timeEntries.length >= MINIMUM_DATA_REQUIREMENTS.TIME_ENTRIES };
    } catch (error) {
      return { success: false, hasMinimumData: false, error: 'Failed to fetch time entries' };
    }
  }

  private aggregateDataByWeek(dailyData: ChartDataPoint[]): ChartDataPoint[] {
    const weeklyData: { [key: string]: { sum: number; count: number; dates: Date[] } } = {};

    dailyData.forEach(point => {
      if (point.date) {
        const weekKey = this.getWeekKey(point.date);
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { sum: 0, count: 0, dates: [] };
        }
        weeklyData[weekKey].sum += point.y;
        weeklyData[weekKey].count += 1;
        weeklyData[weekKey].dates.push(point.date);
      }
    });

    return Object.entries(weeklyData).map(([weekKey, data]) => ({
      x: weekKey,
      y: Math.round((data.sum / data.count) * 100) / 100,
      label: `${(data.sum / data.count).toFixed(1)}% avg`,
      metadata: { count: data.count, dates: data.dates },
    }));
  }

  private getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toISOString().split('T')[0];
  }

  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    if (Math.abs(difference) < 0.1) return 'stable';
    return difference > 0 ? 'improving' : 'declining';
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private generateMoodProductivityInsights(data: Array<{ mood: number; completionRate: number; date: string }>, correlation: number): string[] {
    const insights: string[] = [];

    if (Math.abs(correlation) < 0.1) {
      insights.push("Your mood and productivity appear to be independent of each other.");
    } else if (correlation > 0.3) {
      insights.push("There's a positive correlation between your mood and productivity.");
      insights.push("Consider mood-boosting activities to enhance your task completion rate.");
    } else if (correlation < -0.3) {
      insights.push("Interestingly, your productivity seems higher when your mood is lower.");
      insights.push("You might be someone who works well under pressure or finds focus in challenging times.");
    }

    const avgMood = data.reduce((sum, d) => sum + d.mood, 0) / data.length;
    const avgProductivity = data.reduce((sum, d) => sum + d.completionRate, 0) / data.length;

    if (avgMood >= 4 && avgProductivity >= 70) {
      insights.push("You're maintaining both high mood and high productivity - great balance!");
    } else if (avgMood < 3 && avgProductivity >= 70) {
      insights.push("You're highly productive even during tough times - consider self-care to improve mood.");
    }

    return insights;
  }

  private getCompletionsByHour(completions: TaskCompletion[]): ChartDataPoint[] {
    const hourCounts = new Array(24).fill(0);
    
    completions.forEach(completion => {
      const hour = completion.completedAt.getHours();
      hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({
      x: hour,
      y: count,
      label: `${count} completions`,
    }));
  }

  private calculateAverageTimeToComplete(tasks: Task[], timeEntries: TimeEntry[]): number {
    const taskTimes = new Map<string, number>();
    
    timeEntries.forEach(entry => {
      const existing = taskTimes.get(entry.taskId) || 0;
      taskTimes.set(entry.taskId, existing + entry.duration);
    });

    const completedTasks = tasks.filter(task => task.status === 'completed');
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      return sum + (taskTimes.get(task.id) || 0);
    }, 0);

    return totalTime / completedTasks.length;
  }
}

// Export singleton instance
export const analyticsEngine = AnalyticsEngine.getInstance();