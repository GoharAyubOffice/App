import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { VictoryChart, VictoryLine, VictoryArea, VictoryAxis, VictoryTooltip } from 'victory-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/hooks';
import { ChartDataPoint, CompletionRateData } from '../../services/analyticsEngine';

const { width } = Dimensions.get('window');
const chartWidth = width - 32;
const chartHeight = 220;

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

  const chartData = viewMode === 'daily' ? data.daily : data.weekly;
  
  const handleDataPointPress = (dataPoint: ChartDataPoint) => {
    setSelectedPoint(dataPoint);
    onDataPointPress?.(dataPoint);
  };

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'improving':
        return <Ionicons name="trending-up" size={16} color="#4CAF50" />;
      case 'declining':
        return <Ionicons name="trending-down" size={16} color="#FF6B6B" />;
      default:
        return <Ionicons name="remove" size={16} color="#9E9E9E" />;
    }
  };

  const getTrendColor = () => {
    switch (data.trend) {
      case 'improving': return '#4CAF50';
      case 'declining': return '#FF6B6B';
      default: return '#9E9E9E';
    }
  };

  const getTrendText = () => {
    const currentRate = data.currentRate.toFixed(1);
    const previousRate = data.previousRate.toFixed(1);
    const change = Math.abs(data.currentRate - data.previousRate).toFixed(1);
    
    switch (data.trend) {
      case 'improving':
        return `+${change}% from previous period`;
      case 'declining':
        return `-${change}% from previous period`;
      default:
        return 'No significant change';
    }
  };

  const containerStyle = [
    styles.container,
    isDarkMode && styles.darkContainer,
  ];

  const cardStyle = [
    styles.card,
    isDarkMode && styles.darkCard,
  ];

  const textStyle = [
    styles.text,
    isDarkMode && styles.darkText,
  ];

  const titleStyle = [
    styles.title,
    isDarkMode && styles.darkTitle,
  ];

  const subtitleStyle = [
    styles.subtitle,
    isDarkMode && styles.darkSubtitle,
  ];

  // Victory chart theme
  const chartTheme = {
    axis: {
      style: {
        axis: { stroke: isDarkMode ? '#444444' : '#E9ECEF', strokeWidth: 1 },
        grid: { stroke: isDarkMode ? '#333333' : '#F5F5F5', strokeWidth: 0.5 },
        ticks: { stroke: isDarkMode ? '#666666' : '#CCCCCC', size: 4 },
        tickLabels: { 
          fontSize: 11, 
          padding: 8,
          fill: isDarkMode ? '#CCCCCC' : '#666666',
          fontFamily: 'System',
        },
      },
    },
    line: {
      style: {
        data: { 
          stroke: '#007AFF', 
          strokeWidth: 3,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
      },
    },
    area: {
      style: {
        data: { 
          fill: 'url(#gradient)',
          fillOpacity: 0.3,
        },
      },
    },
  };

  if (loading) {
    return (
      <View style={containerStyle}>
        <View style={cardStyle}>
          <View style={styles.header}>
            <Text style={titleStyle}>Completion Rate</Text>
            <View style={styles.loadingIndicator}>
              <Text style={subtitleStyle}>Loading...</Text>
            </View>
          </View>
          <View style={[styles.chartContainer, styles.loadingChart]}>
            <Ionicons 
              name="analytics" 
              size={48} 
              color={isDarkMode ? '#666666' : '#CCCCCC'} 
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[containerStyle, { opacity: fadeAnim }]}>
      <View style={cardStyle}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={titleStyle}>Completion Rate</Text>
            <View style={styles.currentRate}>
              <Text style={[styles.rateValue, { color: getTrendColor() }]}>
                {data.currentRate.toFixed(1)}%
              </Text>
              <View style={styles.trendIndicator}>
                {getTrendIcon()}
                <Text style={[styles.trendText, { color: getTrendColor() }]}>
                  {getTrendText()}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'daily' && styles.activeToggle,
                viewMode === 'daily' && isDarkMode && styles.darkActiveToggle,
              ]}
              onPress={() => setViewMode('daily')}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'daily' && styles.activeToggleText,
                  isDarkMode && styles.darkToggleText,
                ]}
              >
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'weekly' && styles.activeToggle,
                viewMode === 'weekly' && isDarkMode && styles.darkActiveToggle,
              ]}
              onPress={() => setViewMode('weekly')}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'weekly' && styles.activeToggleText,
                  isDarkMode && styles.darkToggleText,
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <VictoryChart
            theme={chartTheme}
            width={chartWidth}
            height={chartHeight}
            padding={{ left: 50, top: 20, right: 40, bottom: 50 }}
            domainPadding={{ x: 20 }}
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#007AFF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#007AFF" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* X Axis */}
            <VictoryAxis
              dependentAxis={false}
              tickFormat={(t, i) => {
                if (viewMode === 'daily') {
                  const date = new Date(t);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                } else {
                  return `Week ${i + 1}`;
                }
              }}
              style={chartTheme.axis.style}
            />

            {/* Y Axis */}
            <VictoryAxis
              dependentAxis
              tickFormat={(t) => `${t}%`}
              style={chartTheme.axis.style}
            />

            {/* Area Chart */}
            <VictoryArea
              data={chartData}
              style={chartTheme.area.style}
              animate={{
                duration: 1000,
                onLoad: { duration: 500 },
              }}
            />

            {/* Line Chart */}
            <VictoryLine
              data={chartData}
              style={chartTheme.line.style}
              animate={{
                duration: 1000,
                onLoad: { duration: 500 },
              }}
              labelComponent={
                <VictoryTooltip
                  flyoutStyle={{
                    stroke: isDarkMode ? '#444444' : '#E9ECEF',
                    fill: isDarkMode ? '#2A2A2A' : '#FFFFFF',
                  }}
                  style={{
                    fill: isDarkMode ? '#FFFFFF' : '#1A1A1A',
                    fontSize: 12,
                  }}
                />
              }
            />
          </VictoryChart>
        </View>

        {/* Selected Point Details */}
        {selectedPoint && (
          <View style={[styles.selectedPointDetails, isDarkMode && styles.darkSelectedPointDetails]}>
            <Text style={[styles.selectedPointTitle, isDarkMode && styles.darkSelectedPointTitle]}>
              {viewMode === 'daily' ? 'Selected Day' : 'Selected Week'}
            </Text>
            <Text style={[styles.selectedPointValue, isDarkMode && styles.darkSelectedPointValue]}>
              {selectedPoint.label}
            </Text>
            {selectedPoint.metadata && (
              <Text style={[styles.selectedPointMetadata, isDarkMode && styles.darkSelectedPointMetadata]}>
                {selectedPoint.metadata.tasksCompleted} of {selectedPoint.metadata.totalTasks} tasks completed
              </Text>
            )}
          </View>
        )}

        {/* Summary Stats */}
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, isDarkMode && styles.darkStatLabel]}>
              Current Period
            </Text>
            <Text style={[styles.statValue, { color: getTrendColor() }]}>
              {data.currentRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, isDarkMode && styles.darkStatLabel]}>
              Previous Period
            </Text>
            <Text style={[styles.statValue, isDarkMode && styles.darkStatValue]}>
              {data.previousRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, isDarkMode && styles.darkStatLabel]}>
              Data Points
            </Text>
            <Text style={[styles.statValue, isDarkMode && styles.darkStatValue]}>
              {chartData.length}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkContainer: {
    // No additional styles needed
  },
  darkCard: {
    backgroundColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  darkSubtitle: {
    color: '#CCCCCC',
  },
  text: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  darkText: {
    color: '#FFFFFF',
  },
  currentRate: {
    alignItems: 'flex-start',
  },
  rateValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#007AFF',
  },
  darkActiveToggle: {
    backgroundColor: '#4A9EFF',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  darkToggleText: {
    color: '#CCCCCC',
  },
  activeToggleText: {
    color: '#FFFFFF',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  loadingChart: {
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedPointDetails: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  darkSelectedPointDetails: {
    backgroundColor: '#333333',
  },
  selectedPointTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
  },
  darkSelectedPointTitle: {
    color: '#CCCCCC',
  },
  selectedPointValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  darkSelectedPointValue: {
    color: '#FFFFFF',
  },
  selectedPointMetadata: {
    fontSize: 12,
    color: '#666666',
  },
  darkSelectedPointMetadata: {
    color: '#CCCCCC',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  darkStatLabel: {
    color: '#CCCCCC',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  darkStatValue: {
    color: '#FFFFFF',
  },
});

export default CompletionRateChart;