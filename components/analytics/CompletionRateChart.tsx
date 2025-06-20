import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/hooks';
import { ChartDataPoint, CompletionRateData } from '../../services/analyticsEngine';

const { width } = Dimensions.get('window');
const chartWidth = width - 32;
const chartHeight = 180;

interface CompletionRateChartProps {
  data: CompletionRateData;
  loading?: boolean;
  onDataPointPress?: (dataPoint: ChartDataPoint) => void;
}

export const CompletionRateChart: React.FC<CompletionRateChartProps> = ({
  data,
  loading = false,
  onDataPointPress,
}) => {
  const { isDarkMode } = useTheme();
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  const colors = {
    background: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDarkMode ? '#CCCCCC' : '#666666',
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    surface: isDarkMode ? '#1F1F1F' : '#F8F9FA',
    border: isDarkMode ? '#404040' : '#E5E7EB',
  };

  const chartData = viewMode === 'daily' ? data.daily : data.weekly;
  const maxValue = Math.max(...chartData.map(d => d.y), 100);
  
  const handleDataPointPress = (dataPoint: ChartDataPoint) => {
    setSelectedPoint(dataPoint);
    onDataPointPress?.(dataPoint);
  };

  const getTrendColor = () => {
    switch (data.trend) {
      case 'improving': return colors.success;
      case 'declining': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'improving': return 'trending-up';
      case 'declining': return 'trending-down';
      default: return 'remove';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading chart...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor: colors.background, opacity: fadeAnim }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Completion Rate
          </Text>
          <View style={styles.trendContainer}>
            <Ionicons 
              name={getTrendIcon()} 
              size={16} 
              color={getTrendColor()} 
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {data.currentRate}% vs {data.previousRate}% last week
            </Text>
          </View>
        </View>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'daily' && { backgroundColor: colors.primary },
              { borderColor: colors.border }
            ]}
            onPress={() => setViewMode('daily')}
          >
            <Text style={[
              styles.toggleText,
              { color: viewMode === 'daily' ? '#FFFFFF' : colors.textSecondary }
            ]}>
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'weekly' && { backgroundColor: colors.primary },
              { borderColor: colors.border }
            ]}
            onPress={() => setViewMode('weekly')}
          >
            <Text style={[
              styles.toggleText,
              { color: viewMode === 'weekly' ? '#FFFFFF' : colors.textSecondary }
            ]}>
              Weekly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Simple Bar Chart */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.chartContainer}
      >
        <View style={styles.chart}>
          {chartData.slice(-14).map((dataPoint, index) => {
            const barHeight = (dataPoint.y / maxValue) * (chartHeight - 40);
            const isSelected = selectedPoint?.x === dataPoint.x;
            
            return (
              <TouchableOpacity
                key={`${dataPoint.x}-${index}`}
                style={styles.barContainer}
                onPress={() => handleDataPointPress(dataPoint)}
              >
                <View style={styles.barWrapper}>
                  {/* Value label */}
                  <Text style={[styles.valueLabel, { color: colors.text }]}>
                    {dataPoint.y}%
                  </Text>
                  
                  {/* Bar */}
                  <View 
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 4),
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      }
                    ]}
                  />
                  
                  {/* Date label */}
                  <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                    {formatDate(dataPoint.x as string)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {data.currentRate}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Current
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {data.previousRate}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Previous
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getTrendColor() }]}>
            {data.trend}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Trend
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainer: {
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    marginHorizontal: -4,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: chartHeight,
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  barContainer: {
    marginHorizontal: 2,
  },
  barWrapper: {
    alignItems: 'center',
    minWidth: 32,
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 9,
    transform: [{ rotate: '-45deg' }],
    width: 40,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
});