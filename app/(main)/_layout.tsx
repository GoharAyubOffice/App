import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../store/hooks';

export default function MainLayout() {
  const { isDarkMode } = useTheme();

  const colors = {
    background: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    tabBarBackground: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    tabBarActiveTint: '#3B82F6',
    tabBarInactiveTint: isDarkMode ? '#9CA3AF' : '#6B7280',
    headerBackground: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    headerTint: isDarkMode ? '#FFFFFF' : '#1F2937',
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarActiveTint,
        tabBarInactiveTintColor: colors.tabBarInactiveTint,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: colors.headerBackground,
        },
        headerTintColor: colors.headerTint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Mood',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="happy-outline" size={size} color={color} />
          ),
          href: '/mood/log',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
          href: '/library',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          href: null, // Hide from tab bar - projects removed
        }}
      />
    </Tabs>
  );
}