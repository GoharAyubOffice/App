import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/hooks';

interface StreakProtectionBadgeProps {
  isProtected: boolean;
  availableProtections: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export const StreakProtectionBadge: React.FC<StreakProtectionBadgeProps> = ({
  isProtected,
  availableProtections,
  size = 'medium',
  showCount = false,
}) => {
  const { isDarkMode } = useTheme();

  if (!isProtected && availableProtections === 0) {
    return null;
  }

  const sizeConfig = {
    small: { iconSize: 12, fontSize: 10, padding: 4 },
    medium: { iconSize: 16, fontSize: 12, padding: 6 },
    large: { iconSize: 20, fontSize: 14, padding: 8 },
  };

  const config = sizeConfig[size];

  const containerStyle = [
    styles.container,
    styles[`${size}Container`],
    isDarkMode && styles.darkContainer,
    isProtected && styles.protectedContainer,
    isProtected && isDarkMode && styles.darkProtectedContainer,
  ];

  const textStyle = [
    styles.text,
    { fontSize: config.fontSize },
    isDarkMode && styles.darkText,
    isProtected && styles.protectedText,
  ];

  const iconColor = isProtected 
    ? '#4CAF50' 
    : isDarkMode 
      ? '#CCCCCC' 
      : '#666666';

  return (
    <View style={containerStyle}>
      <Ionicons
        name={isProtected ? 'shield-checkmark' : 'shield-outline'}
        size={config.iconSize}
        color={iconColor}
      />
      {showCount && (
        <Text style={textStyle}>
          {isProtected ? 'Protected' : availableProtections}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    gap: 4,
  },
  darkContainer: {
    backgroundColor: '#2A2A2A',
  },
  protectedContainer: {
    backgroundColor: '#E8F5E8',
  },
  darkProtectedContainer: {
    backgroundColor: '#1B3B1B',
  },
  smallContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  mediumContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  largeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
    color: '#666666',
  },
  darkText: {
    color: '#CCCCCC',
  },
  protectedText: {
    color: '#4CAF50',
  },
});

export default StreakProtectionBadge;