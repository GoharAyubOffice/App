import { database } from '../index';
import { Profile } from '../model/profile';
import { Q } from '@nozbe/watermelondb';
import { OnboardingPreferences, OnboardingGoal } from '../../store/slices/onboardingSlice';
import { storageService, UploadProgress } from '../../services/storageService';

export interface UserProfileData {
  id?: string;
  email: string;
  fullName?: string;
  username?: string;
  avatarUrl?: string;
  onboardingCompleted?: boolean;
  goals?: string[];
  workStyle?: string;
  experienceLevel?: string;
  primaryUseCase?: string;
  notificationsEnabled?: boolean;
  reminderFrequency?: string;
  defaultTaskPriority?: string;
  theme?: string;
}

export class UserProfileActions {
  static async createProfile(userData: UserProfileData): Promise<Profile> {
    return await database.write(async () => {
      const profilesCollection = database.get<Profile>('profiles');
      
      return await profilesCollection.create((profile: any) => {
        profile.serverId = userData.id || '';
        profile.email = userData.email;
        profile.fullName = userData.fullName || '';
        profile.username = userData.username || '';
        profile.avatarUrl = userData.avatarUrl || '';
        profile.createdAt = Date.now();
        profile.updatedAt = Date.now();
        profile.isDirty = true;
      });
    });
  }

  static async updateProfile(profileId: string, updates: Partial<UserProfileData>): Promise<Profile | null> {
    try {
      const profilesCollection = database.get<Profile>('profiles');
      const profile = await profilesCollection.find(profileId);
      
      return await database.write(async () => {
        return await profile.update((record: any) => {
          if (updates.email !== undefined) record.email = updates.email;
          if (updates.fullName !== undefined) record.fullName = updates.fullName;
          if (updates.username !== undefined) record.username = updates.username;
          if (updates.avatarUrl !== undefined) record.avatarUrl = updates.avatarUrl;
          record.updatedAt = Date.now();
          record.isDirty = true;
        });
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  static async getProfileByEmail(email: string): Promise<Profile | null> {
    try {
      const profilesCollection = database.get<Profile>('profiles');
      const profiles = await profilesCollection
        .query(Q.where('email', email))
        .fetch();
      
      return profiles.length > 0 ? profiles[0] : null;
    } catch (error) {
      console.error('Error fetching profile by email:', error);
      return null;
    }
  }

  static async getProfileById(id: string): Promise<Profile | null> {
    try {
      const profilesCollection = database.get<Profile>('profiles');
      return await profilesCollection.find(id);
    } catch (error) {
      console.error('Error fetching profile by ID:', error);
      return null;
    }
  }

  static async updateOnboardingData(
    profileId: string,
    preferences: OnboardingPreferences,
    selectedGoals: OnboardingGoal[]
  ): Promise<Profile | null> {
    try {
      const profilesCollection = database.get<Profile>('profiles');
      const profile = await profilesCollection.find(profileId);
      
      // Prepare the data to store
      const goalIds = selectedGoals.map(goal => goal.id);
      const onboardingData = {
        goals: goalIds,
        workStyle: preferences.workStyle,
        experienceLevel: preferences.experienceLevel,
        primaryUseCase: preferences.primaryUseCase,
        notificationsEnabled: preferences.notificationsEnabled,
        reminderFrequency: preferences.reminderFrequency,
        defaultTaskPriority: preferences.defaultTaskPriority,
        theme: preferences.theme,
        onboardingCompleted: true,
        onboardingCompletedAt: Date.now(),
      };

      return await database.write(async () => {
        return await profile.update((record: any) => {
          // Store as JSON string since WatermelonDB doesn't have native JSON support
          record.onboardingData = JSON.stringify(onboardingData);
          record.updatedAt = Date.now();
          record.isDirty = true;
        });
      });
    } catch (error) {
      console.error('Error updating onboarding data:', error);
      return null;
    }
  }

  static async getOnboardingData(profileId: string): Promise<any | null> {
    try {
      const profile = await this.getProfileById(profileId);
      if (!profile) return null;

      const onboardingDataString = (profile as any).onboardingData;
      if (!onboardingDataString) return null;

      return JSON.parse(onboardingDataString);
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      return null;
    }
  }

  static async isOnboardingCompleted(profileId: string): Promise<boolean> {
    try {
      const onboardingData = await this.getOnboardingData(profileId);
      return onboardingData?.onboardingCompleted || false;
    } catch (error) {
      console.error('Error checking onboarding completion:', error);
      return false;
    }
  }

  static async updateUserPreferences(
    profileId: string,
    preferences: Partial<OnboardingPreferences>
  ): Promise<Profile | null> {
    try {
      const currentData = await this.getOnboardingData(profileId) || {};
      const updatedData = { ...currentData, ...preferences };

      const profilesCollection = database.get<Profile>('profiles');
      const profile = await profilesCollection.find(profileId);

      return await database.write(async () => {
        return await profile.update((record: any) => {
          record.onboardingData = JSON.stringify(updatedData);
          record.updatedAt = Date.now();
          record.isDirty = true;
        });
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return null;
    }
  }

  static async deleteProfile(profileId: string): Promise<boolean> {
    try {
      const profilesCollection = database.get<Profile>('profiles');
      const profile = await profilesCollection.find(profileId);
      
      await database.write(async () => {
        await profile.markAsDeleted();
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  }

  static async getAllProfiles(): Promise<Profile[]> {
    try {
      const profilesCollection = database.get<Profile>('profiles');
      return await profilesCollection.query().fetch();
    } catch (error) {
      console.error('Error fetching all profiles:', error);
      return [];
    }
  }

  static async searchProfiles(query: string): Promise<Profile[]> {
    try {
      const profilesCollection = database.get<Profile>('profiles');
      return await profilesCollection
        .query(
          Q.or(
            Q.where('full_name', Q.like(`%${Q.sanitizeLikeString(query)}%`)),
            Q.where('username', Q.like(`%${Q.sanitizeLikeString(query)}%`)),
            Q.where('email', Q.like(`%${Q.sanitizeLikeString(query)}%`))
          )
        )
        .fetch();
    } catch (error) {
      console.error('Error searching profiles:', error);
      return [];
    }
  }

  static async createDefaultWorkspace(userId: string, userName: string): Promise<void> {
    try {
      await database.write(async () => {
        const workspacesCollection = database.get('workspaces');
        
        const workspace = await workspacesCollection.create((workspace: any) => {
          workspace.name = `${userName}'s Workspace`;
          workspace.description = 'Your personal workspace';
          workspace.ownerId = userId;
          workspace.createdAt = Date.now();
          workspace.updatedAt = Date.now();
          workspace.isDirty = true;
        });

        // Add user as workspace member
        const workspaceMembersCollection = database.get('workspace_members');
        await workspaceMembersCollection.create((member: any) => {
          member.workspaceId = workspace.id;
          member.userId = userId;
          member.role = 'owner';
          member.joinedAt = Date.now();
          member.isDirty = true;
        });

        // Create a default project
        const projectsCollection = database.get('projects');
        await projectsCollection.create((project: any) => {
          project.name = 'Getting Started';
          project.description = 'Your first project to get started with FlowState';
          project.workspaceId = workspace.id;
          project.color = '#3B82F6';
          project.isArchived = false;
          project.createdAt = Date.now();
          project.updatedAt = Date.now();
          project.isDirty = true;
        });
      });
    } catch (error) {
      console.error('Error creating default workspace:', error);
    }
  }

  static async syncProfileToServer(profileId: string): Promise<boolean> {
    try {
      // This would integrate with your sync service
      // For now, just mark as synced
      const profilesCollection = database.get<Profile>('profiles');
      const profile = await profilesCollection.find(profileId);
      
      await database.write(async () => {
        await profile.update((record: any) => {
          record.isDirty = false;
          record.syncedAt = Date.now();
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error syncing profile to server:', error);
      return false;
    }
  }

  static async updateAvatar(
    profileId: string, 
    imageUri: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
    try {
      // Validate image file
      const validation = storageService.validateImageFile(imageUri);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Get current profile to check for existing avatar
      const profile = await this.getProfileById(profileId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
        };
      }

      // Upload new avatar
      const uploadResult = await storageService.uploadAvatar(
        profileId,
        imageUri,
        { onProgress }
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error,
        };
      }

      // Update profile with new avatar URL
      const updatedProfile = await this.updateProfile(profileId, {
        avatarUrl: uploadResult.data!.publicUrl,
      });

      if (!updatedProfile) {
        return {
          success: false,
          error: 'Failed to update profile',
        };
      }

      // Delete old avatar if it exists
      const currentAvatarUrl = (profile as any).avatarUrl;
      if (currentAvatarUrl && currentAvatarUrl !== uploadResult.data!.publicUrl) {
        try {
          // Extract path from URL and delete old avatar
          const pathMatch = currentAvatarUrl.match(/avatars\/(.+)$/);
          if (pathMatch) {
            await storageService.deleteAvatar(profileId, pathMatch[1]);
          }
        } catch (error) {
          // Log error but don't fail the operation
          console.warn('Failed to delete old avatar:', error);
        }
      }

      return {
        success: true,
        avatarUrl: uploadResult.data!.publicUrl,
      };

    } catch (error) {
      console.error('Error updating avatar:', error);
      return {
        success: false,
        error: 'Failed to update avatar. Please try again.',
      };
    }
  }

  static async removeAvatar(profileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const profile = await this.getProfileById(profileId);
      if (!profile) {
        return {
          success: false,
          error: 'Profile not found',
        };
      }

      const currentAvatarUrl = (profile as any).avatarUrl;
      
      // Update profile to remove avatar URL
      const updatedProfile = await this.updateProfile(profileId, {
        avatarUrl: '',
      });

      if (!updatedProfile) {
        return {
          success: false,
          error: 'Failed to update profile',
        };
      }

      // Delete avatar file from storage
      if (currentAvatarUrl) {
        try {
          const pathMatch = currentAvatarUrl.match(/avatars\/(.+)$/);
          if (pathMatch) {
            await storageService.deleteAvatar(profileId, pathMatch[1]);
          }
        } catch (error) {
          // Log error but don't fail the operation
          console.warn('Failed to delete avatar file:', error);
        }
      }

      return { success: true };

    } catch (error) {
      console.error('Error removing avatar:', error);
      return {
        success: false,
        error: 'Failed to remove avatar. Please try again.',
      };
    }
  }

  static async validateProfileData(data: Partial<UserProfileData>): Promise<{ 
    isValid: boolean; 
    errors: { [key: string]: string } 
  }> {
    const errors: { [key: string]: string } = {};

    // Validate email
    if (data.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.email.trim()) {
        errors.email = 'Email is required';
      } else if (!emailRegex.test(data.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Validate full name
    if (data.fullName !== undefined) {
      if (!data.fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (data.fullName.trim().length < 2) {
        errors.fullName = 'Full name must be at least 2 characters long';
      } else if (data.fullName.trim().length > 100) {
        errors.fullName = 'Full name must be less than 100 characters long';
      }
    }

    // Validate username
    if (data.username !== undefined) {
      if (!data.username.trim()) {
        errors.username = 'Username is required';
      } else if (data.username.length < 3) {
        errors.username = 'Username must be at least 3 characters long';
      } else if (data.username.length > 30) {
        errors.username = 'Username must be less than 30 characters long';
      } else {
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(data.username)) {
          errors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static async checkUsernameAvailability(username: string, excludeProfileId?: string): Promise<boolean> {
    try {
      const profilesCollection = database.get<Profile>('profiles');
      let query = profilesCollection.query(Q.where('username', username));
      
      if (excludeProfileId) {
        query = profilesCollection.query(
          Q.and(
            Q.where('username', username),
            Q.where('id', Q.notEq(excludeProfileId))
          )
        );
      }
      
      const existingProfiles = await query.fetch();
      return existingProfiles.length === 0;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  static async getProfileStats(profileId: string): Promise<{
    tasksCompleted: number;
    tasksTotal: number;
    projectsCount: number;
    workspacesCount: number;
  } | null> {
    try {
      // This would query the actual task and project collections
      // For now, return mock data
      return {
        tasksCompleted: 0,
        tasksTotal: 0,
        projectsCount: 0,
        workspacesCount: 0,
      };
    } catch (error) {
      console.error('Error getting profile stats:', error);
      return null;
    }
  }
}

export default UserProfileActions;