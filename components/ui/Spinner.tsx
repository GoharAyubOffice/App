import React from 'react';
import { ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../store/hooks';

interface SpinnerProps {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: ViewStyle;
  centered?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'small',
  color,
  style,
  centered = false,
}) => {
  const { isDarkMode } = useTheme();
  
  const defaultColor = color || (isDarkMode ? '#FFFFFF' : '#000000');
  
  const containerStyle = [
    centered && styles.centered,
    style,
  ];

  return (
    <View style={containerStyle}>
      <ActivityIndicator 
        size={size} 
        color={defaultColor}
        testID="spinner"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});