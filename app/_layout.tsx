import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { store, persistor } from '@/store';
import { useTheme, useCurrentUser } from '@/store/hooks';
import { defineMidnightResetTask, registerMidnightResetTask, setUserIdForBackgroundTasks } from '@/tasks/midnightResetTask';
import { defineStreakMonitorTask, registerStreakMonitorTask, setUserIdForStreakMonitor } from '@/tasks/streakMonitorTask';
import { MidnightResetNotification } from '@/components/ui/MidnightResetNotification';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Loading component for PersistGate
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Initialize background tasks
  useEffect(() => {
    const initializeBackgroundTasks = async () => {
      try {
        console.log('Initializing background tasks...');
        
        // Define the background tasks
        defineMidnightResetTask();
        defineStreakMonitorTask();
        
        // Register the background tasks
        const midnightRegistered = await registerMidnightResetTask();
        const streakRegistered = await registerStreakMonitorTask();
        
        if (midnightRegistered && streakRegistered) {
          console.log('All background tasks initialized successfully');
        } else {
          console.warn('Some background tasks failed to register:', {
            midnight: midnightRegistered,
            streak: streakRegistered
          });
        }
      } catch (error) {
        console.error('Error initializing background tasks:', error);
      }
    };

    if (loaded) {
      initializeBackgroundTasks();
    }
  }, [loaded]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <RootLayoutNav />
      </PersistGate>
    </Provider>
  );
}

function RootLayoutNav() {
  const systemColorScheme = useColorScheme();
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  
  // Use Redux theme state, fallback to system preference
  const effectiveTheme = isDarkMode !== null ? isDarkMode : systemColorScheme === 'dark';

  // Set user ID for background tasks when user is available
  useEffect(() => {
    if (currentUser?.id) {
      setUserIdForBackgroundTasks(currentUser.id);
      setUserIdForStreakMonitor(currentUser.id);
    }
  }, [currentUser?.id]);

  return (
    <ThemeProvider value={effectiveTheme ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <MidnightResetNotification />
    </ThemeProvider>
  );
}
