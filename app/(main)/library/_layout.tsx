import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../store/hooks';

export default function LibraryLayout() {
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
        name="index"
        options={{
          title: 'Library',
          headerShown: true,
        }}
      />
    </Stack>
  );
}