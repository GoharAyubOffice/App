import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useIsAuthenticated } from '../../store/hooks';

export default function AuthLayout() {
  const { isDarkMode } = useTheme();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(main)');
    }
  }, [isAuthenticated, router]);

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
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen 
                  name="login" 
                  options={{
                    title: 'Sign In',
                  }}
                />
                <Stack.Screen 
                  name="signup" 
                  options={{
                    title: 'Sign Up',
                  }}
                />
                <Stack.Screen 
                  name="reset-password" 
                  options={{
                    title: 'Reset Password',
                  }}
                />
                <Stack.Screen 
                  name="update-password" 
                  options={{
                    title: 'Update Password',
                  }}
                />
              </Stack>
            </View>
          </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    minHeight: '100%',
  },
});