import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryScatter, VictoryTooltip } from 'victory-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/hooks';
import { ProductivityTrend } from '../../services/analyticsEngine';

const { width } = Dimensions.get('window');
const chartWidth = width - 32;
const chartHeight = 200;

interface ProductivityTrendChartProps {
  data: ProductivityTrend;
  loading?: boolean;
}

export const ProductivityTrendChart: React.FC<ProductivityTrendChartProps> = ({
  data,
  loading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedMetric, setSelectedMetric] = useState<'tasks' | 'time' | 'streaks'>('tasks');
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

  const getChartData = () => {
    switch (selectedMetric) {
      case 'tasks':
        return data.tasksCompleted;
      case 'time':
        return data.activeTimes;
      case 'streaks':
        return data.streaks;
      default:
        return data.tasksCompleted;
    }
  };

  const getMetricColor = () => {
    switch (selectedMetric) {
      case 'tasks': return '#007AFF';
      case 'time': return '#FF9500';
      case 'streaks': return '#FF6B6B';
      default: return '#007AFF';
    }
  };

  const getTrendIcon = () => {
    switch (data.overallTrend) {
      case 'up':
        return <Ionicons name="trending-up" size={16} color="#4CAF50" />;
      case 'down':
        return <Ionicons name="trending-down" size={16} color="#FF6B6B" />;
      default:
        return <Ionicons name="remove" size={16} color="#9E9E9E" />;
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

  const titleStyle = [
    styles.title,
    isDarkMode && styles.darkTitle,
  ];

  const chartTheme = {
    axis: {
      style: {
        axis: { stroke: isDarkMode ? '#444444' : '#E9ECEF', strokeWidth: 1 },
        grid: { stroke: isDarkMode ? '#333333' : '#F5F5F5', strokeWidth: 0.5 },
        ticks: { stroke: isDarkMode ? '#666666' : '#CCCCCC', size: 4 },
        tickLabels: { 
          fontSize: 10, 
          padding: 8,
          fill: isDarkMode ? '#CCCCCC' : '#666666',
        },
      },
    },
  };

  if (loading) {
    return (
      <View style={containerStyle}>
        <View style={cardStyle}>
          <Text style={titleStyle}>Productivity Trend</Text>
          <View style={[styles.chartContainer, styles.loadingChart]}>
            <Ionicons 
              name="trending-up" 
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
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={titleStyle}>Productivity Trend</Text>
            <View style={styles.trendIndicator}>
              {getTrendIcon()}
              <Text style={[styles.trendText, { color: data.overallTrend === 'up' ? '#4CAF50' : data.overallTrend === 'down' ? '#FF6B6B' : '#9E9E9E' }]}>
                {data.overallTrend === 'up' ? 'Improving' : data.overallTrend === 'down' ? 'Declining' : 'Stable'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metricSelector}>
          <TouchableOpacity
            style={[
              styles.metricButton,
              selectedMetric === 'tasks' && { backgroundColor: '#007AFF' },
            ]}
            onPress={() => setSelectedMetric('tasks')}
          >
            <Text
              style={[
                styles.metricText,
                selectedMetric === 'tasks' && { color: '#FFFFFF' },
                isDarkMode && styles.darkMetricText,
              ]}
            >
              Tasks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.metricButton,
              selectedMetric === 'time' && { backgroundColor: '#FF9500' },
            ]}
            onPress={() => setSelectedMetric('time')}
          >
            <Text
              style={[
                styles.metricText,
                selectedMetric === 'time' && { color: '#FFFFFF' },
                isDarkMode && styles.darkMetricText,
              ]}
            >
              Time
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.metricButton,
              selectedMetric === 'streaks' && { backgroundColor: '#FF6B6B' },
            ]}
            onPress={() => setSelectedMetric('streaks')}
          >
            <Text
              style={[
                styles.metricText,
                selectedMetric === 'streaks' && { color: '#FFFFFF' },
                isDarkMode && styles.darkMetricText,
              ]}
            >
              Streaks
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          <VictoryChart
            theme={chartTheme}
            width={chartWidth}
            height={chartHeight}
            padding={{ left: 50, top: 20, right: 40, bottom: 50 }}
          >
            <VictoryAxis
              dependentAxis={false}
              tickFormat={(t, i) => {
                const date = new Date(t);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              style={chartTheme.axis.style}
            />
            <VictoryAxis
              dependentAxis
              style={chartTheme.axis.style}
            />
            <VictoryLine
              data={getChartData()}
              style={{
                data: { 
                  stroke: getMetricColor(), 
                  strokeWidth: 2,
                },
              }}
              animate={{
                duration: 1000,
                onLoad: { duration: 500 },
              }}
            />
            <VictoryScatter
              data={getChartData()}
              size={3}
              style={{
                data: { fill: getMetricColor() },
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
    marginBottom: 16,
  },
  titleSection: {
    alignItems: 'flex-start',
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
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricSelector: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  metricButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  metricText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  darkMetricText: {
    color: '#CCCCCC',
  },
  chartContainer: {
    alignItems: 'center',
  },
  loadingChart: {
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductivityTrendChart;