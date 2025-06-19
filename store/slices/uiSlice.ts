import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  // Navigation state
  activeTab: string;
  lastActiveWorkspace: string | null;
  lastActiveProject: string | null;
  
  // Theme and preferences
  isDarkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  
  // App state
  isOffline: boolean;
  hasNetworkConnection: boolean;
  
  // Onboarding and tutorials
  hasCompletedOnboarding: boolean;
  hasSeenTutorial: Record<string, boolean>;
  
  // UI interactions
  selectedTasks: string[];
  isMultiSelectMode: boolean;
  
  // Filters and sorting
  taskFilters: {
    status: string[];
    priority: string[];
    assignee: string[];
    tags: string[];
  };
  taskSortBy: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'title';
  taskSortOrder: 'asc' | 'desc';
  
  // Modal and overlay states
  activeModal: string | null;
  sidebarOpen: boolean;
  
  // Performance and sync
  lastSyncTime: number | null;
  pendingSyncCount: number;
}

const initialState: UIState = {
  // Navigation
  activeTab: 'tasks',
  lastActiveWorkspace: null,
  lastActiveProject: null,
  
  // Theme
  isDarkMode: false,
  fontSize: 'medium',
  
  // App state
  isOffline: false,
  hasNetworkConnection: true,
  
  // Onboarding
  hasCompletedOnboarding: false,
  hasSeenTutorial: {},
  
  // UI interactions
  selectedTasks: [],
  isMultiSelectMode: false,
  
  // Filters
  taskFilters: {
    status: [],
    priority: [],
    assignee: [],
    tags: [],
  },
  taskSortBy: 'updated_at',
  taskSortOrder: 'desc',
  
  // Modals
  activeModal: null,
  sidebarOpen: false,
  
  // Sync
  lastSyncTime: null,
  pendingSyncCount: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Navigation actions
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setLastActiveWorkspace: (state, action: PayloadAction<string | null>) => {
      state.lastActiveWorkspace = action.payload;
    },
    setLastActiveProject: (state, action: PayloadAction<string | null>) => {
      state.lastActiveProject = action.payload;
    },
    
    // Theme actions
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload;
    },
    
    // Network state
    setOfflineState: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
      state.hasNetworkConnection = !action.payload;
    },
    setNetworkConnection: (state, action: PayloadAction<boolean>) => {
      state.hasNetworkConnection = action.payload;
      if (action.payload) {
        state.isOffline = false;
      }
    },
    
    // Onboarding actions
    setOnboardingComplete: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedOnboarding = action.payload;
    },
    markTutorialSeen: (state, action: PayloadAction<string>) => {
      state.hasSeenTutorial[action.payload] = true;
    },
    
    // Task selection
    selectTask: (state, action: PayloadAction<string>) => {
      if (!state.selectedTasks.includes(action.payload)) {
        state.selectedTasks.push(action.payload);
      }
    },
    deselectTask: (state, action: PayloadAction<string>) => {
      state.selectedTasks = state.selectedTasks.filter(id => id !== action.payload);
    },
    toggleTaskSelection: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      if (state.selectedTasks.includes(taskId)) {
        state.selectedTasks = state.selectedTasks.filter(id => id !== taskId);
      } else {
        state.selectedTasks.push(taskId);
      }
    },
    clearTaskSelection: (state) => {
      state.selectedTasks = [];
    },
    setMultiSelectMode: (state, action: PayloadAction<boolean>) => {
      state.isMultiSelectMode = action.payload;
      if (!action.payload) {
        state.selectedTasks = [];
      }
    },
    
    // Filter actions
    setTaskFilter: (state, action: PayloadAction<{ 
      filterType: keyof UIState['taskFilters']; 
      values: string[] 
    }>) => {
      const { filterType, values } = action.payload;
      state.taskFilters[filterType] = values;
    },
    addTaskFilter: (state, action: PayloadAction<{ 
      filterType: keyof UIState['taskFilters']; 
      value: string 
    }>) => {
      const { filterType, value } = action.payload;
      if (!state.taskFilters[filterType].includes(value)) {
        state.taskFilters[filterType].push(value);
      }
    },
    removeTaskFilter: (state, action: PayloadAction<{ 
      filterType: keyof UIState['taskFilters']; 
      value: string 
    }>) => {
      const { filterType, value } = action.payload;
      state.taskFilters[filterType] = state.taskFilters[filterType].filter(v => v !== value);
    },
    clearAllFilters: (state) => {
      state.taskFilters = {
        status: [],
        priority: [],
        assignee: [],
        tags: [],
      };
    },
    
    // Sorting actions
    setTaskSort: (state, action: PayloadAction<{
      sortBy: UIState['taskSortBy'];
      sortOrder: UIState['taskSortOrder'];
    }>) => {
      const { sortBy, sortOrder } = action.payload;
      state.taskSortBy = sortBy;
      state.taskSortOrder = sortOrder;
    },
    toggleSortOrder: (state) => {
      state.taskSortOrder = state.taskSortOrder === 'asc' ? 'desc' : 'asc';
    },
    
    // Modal actions
    setActiveModal: (state, action: PayloadAction<string | null>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    
    // Sidebar actions
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    // Sync actions
    updateLastSyncTime: (state) => {
      state.lastSyncTime = Date.now();
    },
    setPendingSyncCount: (state, action: PayloadAction<number>) => {
      state.pendingSyncCount = action.payload;
    },
    incrementPendingSync: (state) => {
      state.pendingSyncCount += 1;
    },
    decrementPendingSync: (state) => {
      state.pendingSyncCount = Math.max(0, state.pendingSyncCount - 1);
    },
    
    // Reset actions
    resetUIState: (state) => {
      // Reset to initial state but keep user preferences
      const preferencesToKeep = {
        isDarkMode: state.isDarkMode,
        fontSize: state.fontSize,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasSeenTutorial: state.hasSeenTutorial,
      };
      
      Object.assign(state, initialState, preferencesToKeep);
    },
  },
});

export const {
  // Navigation
  setActiveTab,
  setLastActiveWorkspace,
  setLastActiveProject,
  
  // Theme
  toggleDarkMode,
  setDarkMode,
  setFontSize,
  
  // Network
  setOfflineState,
  setNetworkConnection,
  
  // Onboarding
  setOnboardingComplete,
  markTutorialSeen,
  
  // Task selection
  selectTask,
  deselectTask,
  toggleTaskSelection,
  clearTaskSelection,
  setMultiSelectMode,
  
  // Filters
  setTaskFilter,
  addTaskFilter,
  removeTaskFilter,
  clearAllFilters,
  
  // Sorting
  setTaskSort,
  toggleSortOrder,
  
  // Modals
  setActiveModal,
  closeModal,
  
  // Sidebar
  setSidebarOpen,
  toggleSidebar,
  
  // Sync
  updateLastSyncTime,
  setPendingSyncCount,
  incrementPendingSync,
  decrementPendingSync,
  
  // Reset
  resetUIState,
} = uiSlice.actions;

export default uiSlice.reducer;