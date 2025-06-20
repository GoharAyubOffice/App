import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/hooks';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  style?: any;
  type?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  style,
  type = 'error',
  showIcon = true,
}) => {
  const { isDarkMode } = useTheme();

  const getColors = () => {
    switch (type) {
      case 'error':
        return {
          background: isDarkMode ? '#7F1D1D' : '#FEE2E2',
          border: isDarkMode ? '#DC2626' : '#F87171',
          text: isDarkMode ? '#FCA5A5' : '#B91C1C',
          icon: isDarkMode ? '#FCA5A5' : '#B91C1C',
        };
      case 'warning':
        return {
          background: isDarkMode ? '#78350F' : '#FEF3C7',
          border: isDarkMode ? '#D97706' : '#F59E0B',
          text: isDarkMode ? '#FCD34D' : '#92400E',
          icon: isDarkMode ? '#FCD34D' : '#92400E',
        };
      case 'info':
        return {
          background: isDarkMode ? '#1E3A8A' : '#DBEAFE',
          border: isDarkMode ? '#3B82F6' : '#60A5FA',
          text: isDarkMode ? '#93C5FD' : '#1D4ED8',
          icon: isDarkMode ? '#93C5FD' : '#1D4ED8',
        };
      default:
        return {
          background: isDarkMode ? '#7F1D1D' : '#FEE2E2',
          border: isDarkMode ? '#DC2626' : '#F87171',
          text: isDarkMode ? '#FCA5A5' : '#B91C1C',
          icon: isDarkMode ? '#FCA5A5' : '#B91C1C',
        };
    }
  };

  const colors = getColors();

  const getIconName = () => {
    switch (type) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'alert-circle';
    }
  };

  if (!message) return null;

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
        style,
      ]}
      testID="error-message"
    >
      <View style={styles.content}>
        {showIcon && (
          <Ionicons
            name={getIconName()}
            size={20}
            color={colors.icon}
            style={styles.icon}
          />
        )}
        <Text 
          style={[
            styles.message,
            { color: colors.text },
          ]}
          numberOfLines={3}
        >
          {message}
        </Text>
      </View>
      
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="dismiss-error"
        >
          <Ionicons
            name="close"
            size={18}
            color={colors.icon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 8,
    marginTop: 1,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  dismissButton: {
    marginLeft: 8,
    padding: 2,
  },
});