import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useCurrentUser } from '../../store/hooks';
import { analyticsEngine, AnalyticsSummary, CompletionRateData, ProductivityTrend, MoodProductivityCorrelation, TaskDistribution } from '../../services/analyticsEngine';
import { CompletionRateChart } from '../../components/analytics/CompletionRateChart';
import { EmptyAnalyticsState } from '../../components/analytics/EmptyAnalyticsState';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  summary: AnalyticsSummary | null;
  completionRate: CompletionRateData | null;
  productivityTrend: ProductivityTrend | null;
  moodCorrelation: MoodProductivityCorrelation | null;
  taskDistribution: TaskDistribution | null;
}

interface LoadingState {
  summary: boolean;
  completionRate: boolean;
  productivityTrend: boolean;
  moodCorrelation: boolean;
  taskDistribution: boolean;
}

export default function AnalyticsScreen() {
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const [data, setData] = useState<AnalyticsData>({
    summary: null,
    completionRate: null,
    productivityTrend: null,
    moodCorrelation: null,
    taskDistribution: null,
  });
  const [loading, setLoading] = useState<LoadingState>({
    summary: true,
    completionRate: false,
    productivityTrend: false,
    moodCorrelation: false,
    taskDistribution: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<30 | 90>(30);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Load analytics data
  const loadAnalyticsData = useCallback(async (showRefreshing = false) => {
    if (!currentUser?.id) return;

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(prev => ({ ...prev, summary: true }));
      }
      setError(null);

      // First, get the summary to determine if we have enough data
      const summaryResult = await analyticsEngine.getAnalyticsSummary(currentUser.id, selectedTimeRange);
      
      if (!summaryResult.success) {
        throw new Error(summaryResult.error || 'Failed to load analytics summary');
      }

      const summary = summaryResult.data!;
      setData(prev => ({ ...prev, summary }));

      // If we don't have minimum data, stop here
      if (!summary.hasMinimumData) {
        setLoading({
          summary: false,
          completionRate: false,
          productivityTrend: false,
          moodCorrelation: false,
          taskDistribution: false,
        });
        setRefreshing(false);
        return;
      }

      // Load detailed analytics in parallel
      setLoading(prev => ({
        ...prev,
        summary: false,
        completionRate: true,
        productivityTrend: true,
        moodCorrelation: summary.dataQuality.moodDataSufficient,
        taskDistribution: true,
      }));

      const [
        completionRateResult,
        productivityTrendResult,
        moodCorrelationResult,
        taskDistributionResult,
      ] = await Promise.allSettled([
        analyticsEngine.getCompletionRateData(currentUser.id, selectedTimeRange),
        analyticsEngine.getProductivityTrend(currentUser.id, selectedTimeRange),
        summary.dataQuality.moodDataSufficient 
          ? analyticsEngine.getMoodProductivityCorrelation(currentUser.id, selectedTimeRange)
          : Promise.resolve({ success: false, hasMinimumData: false }),
        analyticsEngine.getTaskDistribution(currentUser.id, selectedTimeRange),
      ]);

      // Process results
      const newData: Partial<AnalyticsData> = { summary };

      if (completionRateResult.status === 'fulfilled' && completionRateResult.value.success) {
        newData.completionRate = completionRateResult.value.data!;
      }

      if (productivityTrendResult.status === 'fulfilled' && productivityTrendResult.value.success) {
        newData.productivityTrend = productivityTrendResult.value.data!;
      }

      if (moodCorrelationResult.status === 'fulfilled' && moodCorrelationResult.value.success) {
        newData.moodCorrelation = moodCorrelationResult.value.data!;
      }

      if (taskDistributionResult.status === 'fulfilled' && taskDistributionResult.value.success) {
        newData.taskDistribution = taskDistributionResult.value.data!;
      }

      setData(prev => ({ ...prev, ...newData }));

      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading({
        summary: false,
        completionRate: false,
        productivityTrend: false,
        moodCorrelation: false,
        taskDistribution: false,
      });
      setRefreshing(false);
    }
  }, [currentUser?.id, selectedTimeRange, fadeAnim]);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadAnalyticsData();
    }, [loadAnalyticsData])
  );

  // Reload when time range changes
  useEffect(() => {
    if (currentUser?.id) {
      loadAnalyticsData();
    }
  }, [selectedTimeRange]);

  const handleRefresh = () => {
    loadAnalyticsData(true);
  };

  const handleTimeRangeChange = (range: 30 | 90) => {
    setSelectedTimeRange(range);
  };

  const handleDataPointPress = (dataPoint: any) => {
    Alert.alert(
      'Data Point Details',
      `Value: ${dataPoint.label}\nDate: ${dataPoint.x}`,
      [{ text: 'OK' }]
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, isDarkMode && styles.darkHeader]}>
      <Text style={[styles.title, isDarkMode && styles.darkTitle]}>
        Analytics Dashboard
      </Text>
      <Text style={[styles.subtitle, isDarkMode && styles.darkSubtitle]}>
        Insights into your productivity and habits
      </Text>
      
      <View style={styles.timeRangeSelector}>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            selectedTimeRange === 30 && styles.activeTimeRange,
            selectedTimeRange === 30 && isDarkMode && styles.darkActiveTimeRange,
          ]}
          onPress={() => handleTimeRangeChange(30)}
        >
          <Text
            style={[
              styles.timeRangeText,
              selectedTimeRange === 30 && styles.activeTimeRangeText,
              isDarkMode && styles.darkTimeRangeText,
            ]}
          >
            30 Days
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            selectedTimeRange === 90 && styles.activeTimeRange,
            selectedTimeRange === 90 && isDarkMode && styles.darkActiveTimeRange,
          ]}
          onPress={() => handleTimeRangeChange(90)}
        >
          <Text
            style={[
              styles.timeRangeText,
              selectedTimeRange === 90 && styles.activeTimeRangeText,
              isDarkMode && styles.darkTimeRangeText,
            ]}
          >
            90 Days
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSummaryCards = () => {
    if (!data.summary) return null;

    const { summary } = data;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, isDarkMode && styles.darkSummaryCard]}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={[styles.summaryValue, isDarkMode && styles.darkSummaryValue]}>
              {summary.completionRate.toFixed(1)}%
            </Text>
            <Text style={[styles.summaryLabel, isDarkMode && styles.darkSummaryLabel]}>
              Completion Rate
            </Text>
          </View>
          <View style={[styles.summaryCard, isDarkMode && styles.darkSummaryCard]}>
            <Ionicons name="happy" size={24} color="#FF9500" />
            <Text style={[styles.summaryValue, isDarkMode && styles.darkSummaryValue]}>
              {summary.averageMood.toFixed(1)}
            </Text>
            <Text style={[styles.summaryLabel, isDarkMode && styles.darkSummaryLabel]}>
              Average Mood
            </Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, isDarkMode && styles.darkSummaryCard]}>
            <Ionicons name="flame" size={24} color="#FF6B6B" />
            <Text style={[styles.summaryValue, isDarkMode && styles.darkSummaryValue]}>
              {summary.longestStreak}
            </Text>
            <Text style={[styles.summaryLabel, isDarkMode && styles.darkSummaryLabel]}>
              Longest Streak
            </Text>
          </View>
          <View style={[styles.summaryCard, isDarkMode && styles.darkSummaryCard]}>
            <Ionicons name="time" size={24} color="#007AFF" />
            <Text style={[styles.summaryValue, isDarkMode && styles.darkSummaryValue]}>
              {Math.round(summary.totalActiveTime / 60)}h
            </Text>
            <Text style={[styles.summaryLabel, isDarkMode && styles.darkSummaryLabel]}>
              Active Time
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={[styles.errorContainer, isDarkMode && styles.darkErrorContainer]}>
      <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
      <Text style={[styles.errorTitle, isDarkMode && styles.darkErrorTitle]}>
        Failed to Load Analytics
      </Text>
      <Text style={[styles.errorText, isDarkMode && styles.darkErrorText]}>
        {error}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => loadAnalyticsData()}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Show error state
  if (error && !data.summary) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        {renderErrorState()}
      </View>
    );
  }

  // Show empty state if insufficient data
  if (!loading.summary && (!data.summary || !data.summary.hasMinimumData)) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDarkMode ? '#FFFFFF' : '#000000'}
            />
          }
        >
          {renderHeader()}
          <EmptyAnalyticsState
            summary={data.summary || undefined}
            onRetry={() => loadAnalyticsData(true)}
          />
        </ScrollView>
      </View>
    );
  }

  // Show main analytics dashboard
  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        }
      >
        {renderHeader()}
        
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderSummaryCards()}
          
          {/* Completion Rate Chart */}
          {data.completionRate && (
            <CompletionRateChart
              data={data.completionRate}
              loading={loading.completionRate}
              onDataPointPress={handleDataPointPress}
            />
          )}

          {/* Additional charts would go here */}
          {/* TODO: Add ProductivityTrendChart, MoodCorrelationChart, TaskDistributionChart */}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  darkContainer: {
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  darkHeader: {
    backgroundColor: '#2A2A2A',
    borderBottomColor: '#444444',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  darkSubtitle: {
    color: '#CCCCCC',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTimeRange: {
    backgroundColor: '#007AFF',
  },
  darkActiveTimeRange: {
    backgroundColor: '#4A9EFF',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  darkTimeRangeText: {
    color: '#CCCCCC',
  },
  activeTimeRangeText: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkSummaryCard: {
    backgroundColor: '#2A2A2A',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  darkSummaryValue: {
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  darkSummaryLabel: {
    color: '#CCCCCC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  darkErrorContainer: {
    // No additional styles needed
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  darkErrorTitle: {
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  darkErrorText: {
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
});