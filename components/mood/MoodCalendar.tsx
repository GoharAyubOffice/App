import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useCurrentUser } from '../../store/hooks';
import { moodQueries, CalendarMoodData } from '../../db/queries/moodQueries';
import { MoodEntry } from '../../db/model/moodEntry';

const { width } = Dimensions.get('window');

interface MoodCalendarProps {
  onDateSelect?: (date: string, moodData?: any) => void;
  showStats?: boolean;
}

interface MoodStats {
  averageMood: number;
  totalEntries: number;
  bestMoodCount: number;
  improvementTrend: 'up' | 'down' | 'stable';
}

export const MoodCalendar: React.FC<MoodCalendarProps> = ({
  onDateSelect,
  showStats = true,
}) => {
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarMoodData>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthStats, setMonthStats] = useState<MoodStats | null>(null);

  useEffect(() => {
    loadMoodDataForMonth(currentMonth);
  }, [currentMonth, currentUser?.id]);

  const loadMoodDataForMonth = async (month: Date) => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError(null);

      const year = month.getFullYear();
      const monthIndex = month.getMonth();

      const result = await moodQueries.getCalendarMoodData(currentUser.id, year, monthIndex);

      if (result.success) {
        setCalendarData(result.data);
        await calculateMonthStats(result.data);
      } else {
        setError(result.error || 'Failed to load mood data');
      }
    } catch (err) {
      console.error('Error loading mood data:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthStats = async (data: CalendarMoodData) => {
    const entries = Object.values(data);
    if (entries.length === 0) {
      setMonthStats(null);
      return;
    }

    const totalMood = entries.reduce((sum, entry) => sum + entry.mood, 0);
    const averageMood = totalMood / entries.length;
    const bestMoodCount = entries.filter(entry => entry.mood >= 4).length;

    // Simple trend calculation based on first vs second half of entries
    let improvementTrend: 'up' | 'down' | 'stable' = 'stable';
    if (entries.length >= 4) {
      const sortedEntries = Object.entries(data).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
      const midPoint = Math.floor(sortedEntries.length / 2);
      const firstHalf = sortedEntries.slice(0, midPoint);
      const secondHalf = sortedEntries.slice(midPoint);
      
      const firstHalfAvg = firstHalf.reduce((sum, [, entry]) => sum + entry.mood, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, [, entry]) => sum + entry.mood, 0) / secondHalf.length;
      
      if (secondHalfAvg > firstHalfAvg + 0.3) improvementTrend = 'up';
      else if (secondHalfAvg < firstHalfAvg - 0.3) improvementTrend = 'down';
    }

    setMonthStats({
      averageMood,
      totalEntries: entries.length,
      bestMoodCount,
      improvementTrend,
    });
  };

  const handleDatePress = (day: DateData) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);
    
    const moodData = calendarData[dateString];
    onDateSelect?.(dateString, moodData);

    if (moodData) {
      Alert.alert(
        `${moodData.emoji} ${moodData.moodLabel}`,
        moodData.notes || 'No notes for this day',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMonthChange = (month: DateData) => {
    const newMonth = new Date(month.year, month.month - 1);
    setCurrentMonth(newMonth);
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, isDarkMode && styles.darkEmptyContainer]}>
      <Ionicons 
        name="calendar-outline" 
        size={64} 
        color={isDarkMode ? '#666666' : '#CCCCCC'} 
      />
      <Text style={[styles.emptyTitle, isDarkMode && styles.darkEmptyTitle]}>
        No mood data yet
      </Text>
      <Text style={[styles.emptySubtitle, isDarkMode && styles.darkEmptySubtitle]}>
        Log your mood to see your journey
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={[styles.errorContainer, isDarkMode && styles.darkErrorContainer]}>
      <Ionicons 
        name="alert-circle-outline" 
        size={48} 
        color="#FF6B6B" 
      />
      <Text style={[styles.errorTitle, isDarkMode && styles.darkErrorTitle]}>
        Error loading mood data
      </Text>
      <Text style={[styles.errorSubtitle, isDarkMode && styles.darkErrorSubtitle]}>
        {error}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => loadMoodDataForMonth(currentMonth)}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={[styles.loadingContainer, isDarkMode && styles.darkLoadingContainer]}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={[styles.loadingText, isDarkMode && styles.darkLoadingText]}>
        Loading mood data...
      </Text>
    </View>
  );

  const renderStatsCard = () => {
    if (!showStats || !monthStats) return null;

    return (
      <View style={[styles.statsCard, isDarkMode && styles.darkStatsCard]}>
        <Text style={[styles.statsTitle, isDarkMode && styles.darkStatsTitle]}>
          This Month
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isDarkMode && styles.darkStatValue]}>
              {monthStats.averageMood.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.darkStatLabel]}>
              Average Mood
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isDarkMode && styles.darkStatValue]}>
              {monthStats.totalEntries}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.darkStatLabel]}>
              Days Logged
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isDarkMode && styles.darkStatValue]}>
              {monthStats.bestMoodCount}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.darkStatLabel]}>
              Great Days
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons
              name={
                monthStats.improvementTrend === 'up'
                  ? 'trending-up'
                  : monthStats.improvementTrend === 'down'
                  ? 'trending-down'
                  : 'remove'
              }
              size={24}
              color={
                monthStats.improvementTrend === 'up'
                  ? '#4CAF50'
                  : monthStats.improvementTrend === 'down'
                  ? '#FF6B6B'
                  : '#9E9E9E'
              }
            />
            <Text style={[styles.statLabel, isDarkMode && styles.darkStatLabel]}>
              Trend
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Prepare marked dates for the calendar
  const markedDates = Object.entries(calendarData).reduce((acc, [date, moodData]) => {
    acc[date] = {
      customStyles: {
        container: {
          backgroundColor: moodData.color,
          borderRadius: 6,
        },
        text: {
          color: '#FFFFFF',
          fontWeight: 'bold',
        },
      },
      selected: date === selectedDate,
      selectedColor: moodData.color,
    };
    return acc;
  }, {} as any);

  if (selectedDate && !calendarData[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: '#007AFF',
    };
  }

  const calendarTheme = {
    backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    calendarBackground: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    textSectionTitleColor: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    selectedDayBackgroundColor: '#007AFF',
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: '#007AFF',
    dayTextColor: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    textDisabledColor: isDarkMode ? '#666666' : '#CCCCCC',
    dotColor: '#007AFF',
    selectedDotColor: '#FFFFFF',
    arrowColor: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    disabledArrowColor: isDarkMode ? '#666666' : '#CCCCCC',
    monthTextColor: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    indicatorColor: '#007AFF',
    textDayFontFamily: 'System',
    textMonthFontFamily: 'System',
    textDayHeaderFontFamily: 'System',
    textDayFontWeight: "300",
    textMonthFontWeight: "600",
    textDayHeaderFontWeight: "600",
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 13,
  };

  if (loading) {
    return renderLoadingState();
  }

  if (error) {
    return renderErrorState();
  }

  const hasNoData = Object.keys(calendarData).length === 0;

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      {renderStatsCard()}
      
      <View style={[styles.calendarContainer, isDarkMode && styles.darkCalendarContainer]}>
        <Calendar
          current={currentMonth.toISOString().split('T')[0]}
          onDayPress={handleDatePress}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
          markingType="custom"
          theme={{
            ...calendarTheme,
            textDayFontWeight: 300 as const,
            textMonthFontWeight: 600 as const,
            textDayHeaderFontWeight: 600 as const,
          }}
          style={styles.calendar}
          hideExtraDays={true}
          firstDay={1} // Monday
          enableSwipeMonths={true}
        />
        
        {/* Legend */}
        <View style={styles.legend}>
          <Text style={[styles.legendTitle, isDarkMode && styles.darkLegendTitle]}>
            Mood Scale
          </Text>
          <View style={styles.legendRow}>
            {MoodEntry.getMoodOptions().map((mood) => (
              <View key={mood.score} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: mood.color },
                  ]}
                />
                <Text style={[styles.legendText, isDarkMode && styles.darkLegendText]}>
                  {mood.emoji}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {hasNoData && renderEmptyState()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  darkContainer: {
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  darkLoadingContainer: {
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  darkLoadingText: {
    color: '#CCCCCC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8F9FA',
  },
  darkErrorContainer: {
    backgroundColor: '#1A1A1A',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  darkErrorTitle: {
    color: '#FFFFFF',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  darkErrorSubtitle: {
    color: '#CCCCCC',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -50 }],
  },
  darkEmptyContainer: {
    // No additional styles needed
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  darkEmptyTitle: {
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  darkEmptySubtitle: {
    color: '#CCCCCC',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkStatsCard: {
    backgroundColor: '#2A2A2A',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  darkStatsTitle: {
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  darkStatValue: {
    color: '#4A9EFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  darkStatLabel: {
    color: '#CCCCCC',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkCalendarContainer: {
    backgroundColor: '#2A2A2A',
  },
  calendar: {
    paddingTop: 16,
  },
  legend: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  darkLegendTitle: {
    color: '#FFFFFF',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 18,
  },
  darkLegendText: {
    // Emojis don't need dark mode styling
  },
});

export default MoodCalendar;