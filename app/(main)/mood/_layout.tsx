import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../store/hooks';

export default function MoodLayout() {
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
        name="log"
        options={{
          title: 'Mood Log',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="calendar"
        options={{
          title: 'Mood Calendar',
          headerShown: true,
        }}
      />
    </Stack>
  );
}