import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { MoodEntry, MoodLabel } from '../model/moodEntry';

export interface MoodQueryResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface MoodStatistics {
  averageMood: number;
  totalEntries: number;
  moodDistribution: Record<MoodLabel, number>;
  moodTrend: 'improving' | 'declining' | 'stable';
  bestDay?: { date: string; mood: number };
  worstDay?: { date: string; mood: number };
}

export interface CalendarMoodData {
  [date: string]: {
    mood: number;
    moodLabel: MoodLabel;
    color: string;
    emoji: string;
    notes?: string;
  };
}

export const moodQueries = {
  /**
   * Create a new mood entry
   */
  createMoodEntry: async (
    userId: string,
    moodScore: number,
    notes?: string,
    activityContext?: string,
    metadata?: any
  ): Promise<MoodQueryResult> => {
    try {
      const moodLabel = MoodEntry.getMoodLabelFromScore(moodScore);
      
      const moodEntry = await database.write(async () => {
        return await database.collections
          .get<MoodEntry>('mood_entries')
          .create(record => {
            record.userId = userId;
            record.moodScore = moodScore;
            record.moodLabel = moodLabel;
            record.notes = notes || '';
            record.loggedAt = new Date();
            record.activityContext = activityContext || '';
            record.metadata = metadata ? JSON.stringify(metadata) : '';
            record.createdAt = new Date();
            record.updatedAt = new Date();
            record.isDirty = true;
          });
      });

      return {
        success: true,
        data: moodEntry,
      };
    } catch (error) {
      console.error('Error creating mood entry:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create mood entry',
      };
    }
  },

  /**
   * Get mood entries for a specific user within a date range
   */
  getMoodEntriesInRange: async (
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MoodQueryResult> => {
    try {
      const entries = await database.collections
        .get<MoodEntry>('mood_entries')
        .query(
          Q.where('user_id', userId),
          Q.where('logged_at', Q.between(startDate.getTime(), endDate.getTime())),
          Q.sortBy('logged_at', Q.desc)
        )
        .fetch();

      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch mood entries',
      };
    }
  },

  /**
   * Get the most recent mood entry for a user
   */
  getLatestMoodEntry: async (userId: string): Promise<MoodQueryResult> => {
    try {
      const entries = await database.collections
        .get<MoodEntry>('mood_entries')
        .query(
          Q.where('user_id', userId),
          Q.sortBy('logged_at', Q.desc),
          Q.take(1)
        )
        .fetch();

      return {
        success: true,
        data: entries.length > 0 ? entries[0] : null,
      };
    } catch (error) {
      console.error('Error fetching latest mood entry:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch latest mood entry',
      };
    }
  },

  /**
   * Get mood entry for a specific date
   */
  getMoodEntryForDate: async (userId: string, date: Date): Promise<MoodQueryResult> => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const entries = await database.collections
        .get<MoodEntry>('mood_entries')
        .query(
          Q.where('user_id', userId),
          Q.where('logged_at', Q.between(startOfDay.getTime(), endOfDay.getTime())),
          Q.sortBy('logged_at', Q.desc),
          Q.take(1)
        )
        .fetch();

      return {
        success: true,
        data: entries.length > 0 ? entries[0] : null,
      };
    } catch (error) {
      console.error('Error fetching mood entry for date:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch mood entry for date',
      };
    }
  },

  /**
   * Get calendar mood data for a specific month
   */
  getCalendarMoodData: async (userId: string, year: number, month: number): Promise<MoodQueryResult> => {
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const entriesResult = await moodQueries.getMoodEntriesInRange(userId, startDate, endDate);
      
      if (!entriesResult.success) {
        return entriesResult;
      }

      const entries = entriesResult.data as MoodEntry[];
      const calendarData: CalendarMoodData = {};

      entries.forEach(entry => {
        const dateKey = entry.loggedAt.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // If multiple entries exist for the same day, keep the latest one
        if (!calendarData[dateKey] || entry.loggedAt > new Date(calendarData[dateKey].mood)) {
          calendarData[dateKey] = {
            mood: entry.moodScore,
            moodLabel: entry.moodLabel,
            color: entry.moodColor,
            emoji: entry.moodEmoji,
            notes: entry.notes,
          };
        }
      });

      return {
        success: true,
        data: calendarData,
      };
    } catch (error) {
      console.error('Error fetching calendar mood data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch calendar mood data',
      };
    }
  },

  /**
   * Get mood statistics for a user within a date range
   */
  getMoodStatistics: async (
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MoodQueryResult> => {
    try {
      const entriesResult = await moodQueries.getMoodEntriesInRange(userId, startDate, endDate);
      
      if (!entriesResult.success) {
        return entriesResult;
      }

      const entries = entriesResult.data as MoodEntry[];
      
      if (entries.length === 0) {
        return {
          success: true,
          data: {
            averageMood: 0,
            totalEntries: 0,
            moodDistribution: {},
            moodTrend: 'stable' as const,
          } as MoodStatistics,
        };
      }

      // Calculate statistics
      const totalMood = entries.reduce((sum, entry) => sum + entry.moodScore, 0);
      const averageMood = totalMood / entries.length;

      // Mood distribution
      const moodDistribution: Record<MoodLabel, number> = {
        very_sad: 0,
        sad: 0,
        neutral: 0,
        happy: 0,
        very_happy: 0,
      };

      entries.forEach(entry => {
        moodDistribution[entry.moodLabel]++;
      });

      // Calculate trend (compare first half vs second half)
      let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (entries.length >= 6) {
        const midPoint = Math.floor(entries.length / 2);
        const firstHalf = entries.slice(-midPoint); // Most recent entries first
        const secondHalf = entries.slice(0, entries.length - midPoint);
        
        const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.moodScore, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.moodScore, 0) / secondHalf.length;
        
        const difference = firstHalfAvg - secondHalfAvg;
        if (difference > 0.3) moodTrend = 'improving';
        else if (difference < -0.3) moodTrend = 'declining';
      }

      // Find best and worst days
      const sortedByMood = [...entries].sort((a, b) => b.moodScore - a.moodScore);
      const bestDay = sortedByMood[0] ? {
        date: sortedByMood[0].loggedAt.toISOString().split('T')[0],
        mood: sortedByMood[0].moodScore,
      } : undefined;
      
      const worstDay = sortedByMood[sortedByMood.length - 1] ? {
        date: sortedByMood[sortedByMood.length - 1].loggedAt.toISOString().split('T')[0],
        mood: sortedByMood[sortedByMood.length - 1].moodScore,
      } : undefined;

      const statistics: MoodStatistics = {
        averageMood,
        totalEntries: entries.length,
        moodDistribution,
        moodTrend,
        bestDay,
        worstDay,
      };

      return {
        success: true,
        data: statistics,
      };
    } catch (error) {
      console.error('Error calculating mood statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate mood statistics',
      };
    }
  },

  /**
   * Update an existing mood entry
   */
  updateMoodEntry: async (
    moodEntryId: string,
    updates: {
      moodScore?: number;
      notes?: string;
      activityContext?: string;
      metadata?: any;
    }
  ): Promise<MoodQueryResult> => {
    try {
      const moodEntry = await database.collections
        .get<MoodEntry>('mood_entries')
        .find(moodEntryId);

      const updatedEntry = await database.write(async () => {
        return await moodEntry.update(record => {
          if (updates.moodScore !== undefined) {
            record.moodScore = updates.moodScore;
            record.moodLabel = MoodEntry.getMoodLabelFromScore(updates.moodScore);
          }
          if (updates.notes !== undefined) {
            record.notes = updates.notes;
          }
          if (updates.activityContext !== undefined) {
            record.activityContext = updates.activityContext;
          }
          if (updates.metadata !== undefined) {
            record.metadata = JSON.stringify(updates.metadata);
          }
          record.updatedAt = new Date();
          record.isDirty = true;
        });
      });

      return {
        success: true,
        data: updatedEntry,
      };
    } catch (error) {
      console.error('Error updating mood entry:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update mood entry',
      };
    }
  },

  /**
   * Delete a mood entry
   */
  deleteMoodEntry: async (moodEntryId: string): Promise<MoodQueryResult> => {
    try {
      const moodEntry = await database.collections
        .get<MoodEntry>('mood_entries')
        .find(moodEntryId);

      await database.write(async () => {
        await moodEntry.markAsDeleted();
      });

      return {
        success: true,
        data: { deleted: true },
      };
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete mood entry',
      };
    }
  },

  /**
   * Check if user has logged mood today
   */
  hasMoodEntryToday: async (userId: string): Promise<MoodQueryResult> => {
    try {
      const today = new Date();
      const result = await moodQueries.getMoodEntryForDate(userId, today);
      
      return {
        success: true,
        data: { hasEntry: result.success && result.data !== null },
      };
    } catch (error) {
      console.error('Error checking today\'s mood entry:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check today\'s mood entry',
      };
    }
  },
};