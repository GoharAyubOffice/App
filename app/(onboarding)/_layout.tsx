import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useIsAuthenticated, useIsOnboardingCompleted } from '../../store/hooks';

export default function OnboardingLayout() {
  const { isDarkMode } = useTheme();
  const isAuthenticated = useIsAuthenticated();
  const isOnboardingCompleted = useIsOnboardingCompleted();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    if (isOnboardingCompleted) {
      router.replace('/(tabs)');
      return;
    }
  }, [isAuthenticated, isOnboardingCompleted, router]);

  useEffect(() => {
    // Prevent back button on Android during onboarding
    const backAction = () => {
      // Allow going back within onboarding but prevent leaving onboarding
      return false; // Let the default behavior handle back navigation within onboarding
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const backgroundColor = isDarkMode ? '#000000' : '#FFFFFF';
  const statusBarStyle = isDarkMode ? 'light' : 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar style={statusBarStyle} backgroundColor={backgroundColor} />
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.content}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            >
              <Stack.Screen 
                name="index" 
                options={{
                  title: 'Welcome',
                  gestureEnabled: false, // Don't allow swiping away from welcome
                }}
              />
              <Stack.Screen 
                name="step-goals" 
                options={{
                  title: 'Goals',
                }}
              />
              <Stack.Screen 
                name="step-preferences" 
                options={{
                  title: 'Preferences',
                }}
              />
              <Stack.Screen 
                name="step-completion" 
                options={{
                  title: 'Complete',
                  gestureEnabled: false, // Don't allow swiping away from completion
                }}
              />
            </Stack>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});