import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useTheme } from '../../store/hooks';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onActionPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onActionPress,
  icon,
  style,
}) => {
  const { isDarkMode } = useTheme();

  const containerStyle = [
    styles.container,
    isDarkMode && styles.darkContainer,
    style,
  ];

  const titleStyle = [
    styles.title,
    isDarkMode && styles.darkTitle,
  ];

  const descriptionStyle = [
    styles.description,
    isDarkMode && styles.darkDescription,
  ];

  const buttonStyle = [
    styles.button,
    isDarkMode && styles.darkButton,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    isDarkMode && styles.darkButtonText,
  ];

  return (
    <View style={containerStyle}>
      {icon && (
        <View style={styles.iconContainer}>
          {icon}
        </View>
      )}
      
      <Text style={titleStyle}>{title}</Text>
      <Text style={descriptionStyle}>{description}</Text>
      
      {actionText && onActionPress && (
        <TouchableOpacity 
          style={buttonStyle}
          onPress={onActionPress}
          activeOpacity={0.7}
          testID="empty-state-action"
        >
          <Text style={buttonTextStyle}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  darkContainer: {
    backgroundColor: '#1A1A1A',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  darkDescription: {
    color: '#CCCCCC',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  darkButton: {
    backgroundColor: '#0A84FF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.05,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  darkButtonText: {
    color: '#FFFFFF',
  },
});