import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../store/hooks';

export default function ProjectsLayout() {
  const { isDarkMode } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#1F2937',
      }}
    >
      <Stack.Screen
        name="create"
        options={{
          title: 'Create Project',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          title: 'Projects',
          headerShown: true,
        }}
      />
    </Stack>
  );
}