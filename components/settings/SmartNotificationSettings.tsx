import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useCurrentUser } from '../../store/hooks';
import { notificationPersonalizer, PersonalizationSettings } from '../../services/notificationPersonalizer';
import { notificationService } from '../../services/notificationService';

interface SmartNotificationSettingsProps {
  onSettingsChange?: (settings: PersonalizationSettings) => void;
}

export const SmartNotificationSettings: React.FC<SmartNotificationSettingsProps> = ({
  onSettingsChange,
}) => {
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const [settings, setSettings] = useState<PersonalizationSettings>({
    isSmartEnabled: true,
    minHour: 8,
    maxHour: 22,
    excludedDays: [],
    adaptationSensitivity: 'medium',
    learningEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [hasPermissions, setHasPermissions] = useState(false);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sensitivityOptions: Array<{ value: PersonalizationSettings['adaptationSensitivity']; label: string; description: string }> = [
    { value: 'low', label: 'Conservative', description: 'Small adjustments, stays close to your original times' },
    { value: 'medium', label: 'Balanced', description: 'Moderate optimization based on your patterns' },
    { value: 'high', label: 'Adaptive', description: 'Maximum optimization, follows your peak productivity times' },
  ];

  useEffect(() => {
    loadSettings();
    checkNotificationPermissions();
  }, [currentUser?.id]);

  const loadSettings = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const userSettings = await notificationPersonalizer.getUserSettings(currentUser.id);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationPermissions = async () => {
    try {
      const hasPerms = await notificationService.requestPermissions();
      setHasPermissions(hasPerms);
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setHasPermissions(false);
    }
  };

  const updateSettings = async (newSettings: Partial<PersonalizationSettings>) => {
    if (!currentUser?.id) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      await notificationPersonalizer.updateUserSettings(currentUser.id, updatedSettings);
      setSettings(updatedSettings);
      onSettingsChange?.(updatedSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    }
  };

  const toggleDay = (dayIndex: number) => {
    const excludedDays = [...settings.excludedDays];
    const index = excludedDays.indexOf(dayIndex);
    
    if (index > -1) {
      excludedDays.splice(index, 1);
    } else {
      excludedDays.push(dayIndex);
    }
    
    updateSettings({ excludedDays });
  };

  const updateTimeRange = (type: 'min' | 'max', hour: number) => {
    if (type === 'min' && hour >= settings.maxHour) {
      Alert.alert('Invalid Time', 'Start time must be before end time.');
      return;
    }
    if (type === 'max' && hour <= settings.minHour) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }

    updateSettings({ [type === 'min' ? 'minHour' : 'maxHour']: hour });
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all smart notification settings to defaults. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: PersonalizationSettings = {
              isSmartEnabled: true,
              minHour: 8,
              maxHour: 22,
              excludedDays: [],
              adaptationSensitivity: 'medium',
              learningEnabled: true,
            };
            updateSettings(defaultSettings);
          },
        },
      ]
    );
  };

  const containerStyle = [
    styles.container,
    isDarkMode && styles.darkContainer,
  ];

  const sectionStyle = [
    styles.section,
    isDarkMode && styles.darkSection,
  ];

  const textStyle = [
    styles.text,
    isDarkMode && styles.darkText,
  ];

  const labelStyle = [
    styles.label,
    isDarkMode && styles.darkLabel,
  ];

  const descriptionStyle = [
    styles.description,
    isDarkMode && styles.darkDescription,
  ];

  if (loading) {
    return (
      <View style={containerStyle}>
        <Text style={textStyle}>Loading settings...</Text>
      </View>
    );
  }

  if (!hasPermissions) {
    return (
      <View style={containerStyle}>
        <View style={sectionStyle}>
          <Ionicons 
            name="notifications-off" 
            size={48} 
            color={isDarkMode ? '#CCCCCC' : '#666666'} 
            style={styles.permissionIcon}
          />
          <Text style={[labelStyle, styles.permissionTitle]}>Notification Permissions Required</Text>
          <Text style={descriptionStyle}>
            To use smart notifications, please enable notification permissions in your device settings.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={checkNotificationPermissions}
          >
            <Text style={styles.buttonText}>Check Permissions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={containerStyle} showsVerticalScrollIndicator={false}>
      {/* Smart Notifications Toggle */}
      <View style={sectionStyle}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={labelStyle}>Smart Notifications</Text>
            <Text style={descriptionStyle}>
              Let the app learn your patterns and optimize notification timing
            </Text>
          </View>
          <Switch
            value={settings.isSmartEnabled}
            onValueChange={(value) => updateSettings({ isSmartEnabled: value })}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            thumbColor={settings.isSmartEnabled ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {settings.isSmartEnabled && (
        <>
          {/* Learning Toggle */}
          <View style={sectionStyle}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={labelStyle}>Learning Enabled</Text>
                <Text style={descriptionStyle}>
                  Allow the app to analyze your completion patterns and adapt over time
                </Text>
              </View>
              <Switch
                value={settings.learningEnabled}
                onValueChange={(value) => updateSettings({ learningEnabled: value })}
                trackColor={{ false: '#767577', true: '#007AFF' }}
                thumbColor={settings.learningEnabled ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Adaptation Sensitivity */}
          <View style={sectionStyle}>
            <Text style={labelStyle}>Adaptation Level</Text>
            <Text style={[descriptionStyle, styles.sectionDescription]}>
              How aggressively should the app optimize your notification times?
            </Text>
            
            {sensitivityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionRow,
                  settings.adaptationSensitivity === option.value && styles.selectedOption,
                  settings.adaptationSensitivity === option.value && isDarkMode && styles.darkSelectedOption,
                ]}
                onPress={() => updateSettings({ adaptationSensitivity: option.value })}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    labelStyle,
                    settings.adaptationSensitivity === option.value && styles.selectedText,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    descriptionStyle,
                    settings.adaptationSensitivity === option.value && styles.selectedDescription,
                  ]}>
                    {option.description}
                  </Text>
                </View>
                {settings.adaptationSensitivity === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Time Range */}
          <View style={sectionStyle}>
            <Text style={labelStyle}>Notification Time Range</Text>
            <Text style={[descriptionStyle, styles.sectionDescription]}>
              Smart notifications will only be scheduled within this time range
            </Text>
            
            <View style={styles.timeRangeContainer}>
              <View style={styles.timePickerSection}>
                <Text style={descriptionStyle}>From</Text>
                <View style={styles.timeDisplay}>
                  <Text style={textStyle}>{settings.minHour}:00</Text>
                </View>
                <View style={styles.timeButtons}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => updateTimeRange('min', Math.max(0, settings.minHour - 1))}
                  >
                    <Ionicons name="remove" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => updateTimeRange('min', Math.min(23, settings.minHour + 1))}
                  >
                    <Ionicons name="add" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.timePickerSection}>
                <Text style={descriptionStyle}>To</Text>
                <View style={styles.timeDisplay}>
                  <Text style={textStyle}>{settings.maxHour}:00</Text>
                </View>
                <View style={styles.timeButtons}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => updateTimeRange('max', Math.max(0, settings.maxHour - 1))}
                  >
                    <Ionicons name="remove" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => updateTimeRange('max', Math.min(23, settings.maxHour + 1))}
                  >
                    <Ionicons name="add" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Excluded Days */}
          <View style={sectionStyle}>
            <Text style={labelStyle}>Quiet Days</Text>
            <Text style={[descriptionStyle, styles.sectionDescription]}>
              Select days when you don't want to receive smart notifications
            </Text>
            
            <View style={styles.daysContainer}>
              {dayNames.map((day, index) => {
                const isExcluded = settings.excludedDays.includes(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      isExcluded && styles.excludedDay,
                      isExcluded && isDarkMode && styles.darkExcludedDay,
                    ]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text style={[
                      styles.dayText,
                      isDarkMode && styles.darkDayText,
                      isExcluded && styles.excludedDayText,
                    ]}>
                      {day.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </>
      )}

      {/* Reset Button */}
      <View style={sectionStyle}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={resetToDefaults}
        >
          <Ionicons name="refresh" size={20} color="#666666" />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Reset to Defaults
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  darkSection: {
    backgroundColor: '#2A2A2A',
  },
  text: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  darkText: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  darkLabel: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  darkDescription: {
    color: '#CCCCCC',
  },
  sectionDescription: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#F8F9FA',
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  darkSelectedOption: {
    backgroundColor: '#1E3A5F',
  },
  optionContent: {
    flex: 1,
  },
  selectedText: {
    color: '#007AFF',
  },
  selectedDescription: {
    color: '#0066CC',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  timePickerSection: {
    alignItems: 'center',
  },
  timeDisplay: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    backgroundColor: '#E9ECEF',
    padding: 8,
    borderRadius: 6,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    minWidth: 45,
    alignItems: 'center',
  },
  excludedDay: {
    backgroundColor: '#FFE6E6',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  darkExcludedDay: {
    backgroundColor: '#4A1E1E',
    borderColor: '#FF6B6B',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  darkDayText: {
    color: '#FFFFFF',
  },
  excludedDayText: {
    color: '#FF6B6B',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#666666',
  },
  permissionIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  permissionTitle: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 8,
  },
});

export default SmartNotificationSettings;