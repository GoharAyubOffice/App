import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme, useCurrentUser } from '../../../store/hooks';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  rightComponent?: 'arrow' | 'switch';
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const currentUser = useCurrentUser();

  const colors = {
    background: isDarkMode ? '#1A1A1A' : '#F8F9FA',
    cardBackground: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDarkMode ? '#CCCCCC' : '#666666',
    border: isDarkMode ? '#404040' : '#E5E7EB',
    danger: '#FF6B6B',
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // Handle sign out logic
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion logic
            Alert.alert('Account Deleted', 'Your account has been deleted.');
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const profileSection: SettingItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Edit your profile information',
      icon: 'person-outline',
      onPress: () => router.push('/settings/profile'),
      rightComponent: 'arrow',
    },
  ];

  const preferencesSection: SettingItem[] = [
    {
      id: 'dark-mode',
      title: 'Dark Mode',
      subtitle: 'Switch between light and dark themes',
      icon: 'moon-outline',
      rightComponent: 'switch',
      switchValue: isDarkMode,
      onSwitchChange: toggleTheme,
    },
  ];

  const securitySection: SettingItem[] = [
    {
      id: 'change-password',
      title: 'Change Password',
      subtitle: 'Update your account password',
      icon: 'lock-closed-outline',
      onPress: () => router.push('/(auth)/update-password'),
      rightComponent: 'arrow',
    },
  ];

  const dangerSection: SettingItem[] = [
    {
      id: 'sign-out',
      title: 'Sign Out',
      icon: 'log-out-outline',
      onPress: handleSignOut,
    },
    {
      id: 'delete-account',
      title: 'Delete Account',
      subtitle: 'Permanently delete your account and all data',
      icon: 'trash-outline',
      onPress: handleDeleteAccount,
    },
  ];

  const renderSection = (title: string, items: SettingItem[], isDanger = false) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.settingItem,
              index < items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
            ]}
            onPress={item.onPress}
            disabled={!item.onPress && !item.onSwitchChange}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name={item.icon}
                size={24}
                color={isDanger ? colors.danger : colors.text}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[
                  styles.settingTitle,
                  { color: isDanger ? colors.danger : colors.text }
                ]}>
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.settingRight}>
              {item.rightComponent === 'arrow' && (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              )}
              {item.rightComponent === 'switch' && (
                <Switch
                  value={item.switchValue}
                  onValueChange={item.onSwitchChange}
                  trackColor={{ false: colors.border, true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* User Header */}
      <View style={[styles.userHeader, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.border }]}>
            <Ionicons name="person" size={32} color={colors.textSecondary} />
          </View>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {currentUser?.fullName || 'User Name'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {currentUser?.email || 'user@example.com'}
          </Text>
        </View>
      </View>

      {/* Settings Sections */}
      {renderSection('Profile', profileSection)}
      {renderSection('Preferences', preferencesSection)}
      {renderSection('Security', securitySection)}
      {renderSection('Account', dangerSection, true)}

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 12,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 32,
  },
  versionText: {
    fontSize: 12,
  },
});