import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

// Import reducers
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

// Configure persistence
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  // Only persist UI state and some auth state
  whitelist: ['ui'],
};

// Auth persist config - only persist onboarding state, not sensitive auth data
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['isOnboarded'], // Only persist onboarding status
};

// UI persist config - persist most UI state for better UX
const uiPersistConfig = {
  key: 'ui',
  storage: AsyncStorage,
  whitelist: [
    'activeTab',
    'lastActiveWorkspace', 
    'lastActiveProject',
    'isDarkMode',
    'fontSize',
    'hasCompletedOnboarding',
    'hasSeenTutorial',
    'taskFilters',
    'taskSortBy',
    'taskSortOrder',
  ],
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedUIReducer = persistReducer(uiPersistConfig, uiReducer);

// Root reducer
const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  ui: persistedUIReducer,
});

// Persist the root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      // Enable additional middleware for development
      immutableCheck: {
        warnAfter: 128,
      },
      serializableCheck: {
        warnAfter: 128,
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['auth.user', 'auth.session'],
      },
    }),
  devTools: __DEV__,
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type-safe selector hook
export const selectAuth = (state: RootState) => state.auth;
export const selectUI = (state: RootState) => state.ui;

// Utility functions for common selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;

export const selectActiveTab = (state: RootState) => state.ui.activeTab;
export const selectIsDarkMode = (state: RootState) => state.ui.isDarkMode;
export const selectTaskFilters = (state: RootState) => state.ui.taskFilters;
export const selectSelectedTasks = (state: RootState) => state.ui.selectedTasks;
export const selectIsOffline = (state: RootState) => state.ui.isOffline;

// Action to reset entire store (useful for logout)
export const resetStore = () => ({
  type: 'RESET_STORE',
});

// Enhanced root reducer with reset capability
const enhancedReducer = (state: any, action: any) => {
  if (action.type === 'RESET_STORE') {
    // Clear persisted state
    AsyncStorage.multiRemove(['persist:root', 'persist:auth', 'persist:ui']);
    return rootReducer(undefined, action);
  }
  return persistedReducer(state, action);
};

// Update store configuration to use enhanced reducer
export const storeWithReset = configureStore({
  reducer: enhancedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['auth.user', 'auth.session'],
      },
      immutableCheck: {
        warnAfter: 128,
      },
    }),
  devTools: __DEV__,
});

export default store;