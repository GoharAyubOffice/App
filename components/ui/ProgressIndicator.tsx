import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../store/hooks';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  showText?: boolean;
  showPercentage?: boolean;
  style?: any;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  current,
  total,
  showText = true,
  showPercentage = false,
  style,
}) => {
  const { isDarkMode } = useTheme();
  
  const colors = {
    background: isDarkMode ? '#333333' : '#E5E7EB',
    progress: '#3B82F6',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#A0A0A0' : '#666666',
  };

  const percentage = Math.round((current / total) * 100);
  const progressWidth = `${percentage}%`;

  return (
    <View style={[styles.container, style]}>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.stepText, { color: colors.text }]}>
            Step {current} of {total}
          </Text>
          {showPercentage && (
            <Text style={[styles.percentageText, { color: colors.textSecondary }]}>
              {percentage}%
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBackground,
            { backgroundColor: colors.background }
          ]}
        >
          <View 
            style={[
              styles.progressBar,
              { 
                backgroundColor: colors.progress,
                width: progressWidth,
              }
            ]}
          />
        </View>
        
        <View style={styles.dotsContainer}>
          {Array.from({ length: total }, (_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index < current 
                    ? colors.progress 
                    : colors.background,
                }
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    position: 'relative',
  },
  progressBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});