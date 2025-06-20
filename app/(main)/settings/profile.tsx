import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { 
  useTheme, 
  useCurrentUser, 
  useAppDispatch 
} from '../../../store/hooks';
import { setUser } from '../../../store/slices/authSlice';
import { UserProfileActions, UserProfileData } from '../../../db/actions/userProfileActions';
import { UploadProgress } from '../../../services/storageService';
import { Spinner } from '../../../components/ui/Spinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { Toast } from '../../../components/ui/Toast';

interface FormData {
  fullName: string;
  username: string;
  email: string;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
}

export default function ProfileScreen() {
  const { isDarkMode } = useTheme();
  const currentUser = useCurrentUser();
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Avatar state
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // Loading and UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const colors = {
    background: isDarkMode ? '#000000' : '#FFFFFF',
    surface: isDarkMode ? '#1F1F1F' : '#F8F9FA',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#A0A0A0' : '#666666',
    border: isDarkMode ? '#333333' : '#E1E5E9',
    borderFocus: isDarkMode ? '#3B82F6' : '#2563EB',
    primary: '#3B82F6',
    error: isDarkMode ? '#EF4444' : '#DC2626',
    success: isDarkMode ? '#10B981' : '#059669',
  };

  // Initialize form data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.user_metadata?.full_name || '',
        username: currentUser.user_metadata?.username || '',
        email: currentUser.email || '',
      });
      setAvatarUri(currentUser.user_metadata?.avatar_url || null);
    }
  }, [currentUser]);

  // Check for changes
  useEffect(() => {
    if (currentUser) {
      const hasFormChanges = 
        formData.fullName !== (currentUser.user_metadata?.full_name || '') ||
        formData.username !== (currentUser.user_metadata?.username || '') ||
        formData.email !== (currentUser.email || '');
      
      const hasAvatarChanges = avatarPreview !== null;
      
      setHasChanges(hasFormChanges || hasAvatarChanges);
    }
  }, [formData, avatarPreview, currentUser]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (generalError) {
      setGeneralError(null);
    }
  };

  const selectImageSource = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Remove Photo'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            openCamera();
          } else if (buttonIndex === 2) {
            openImageLibrary();
          } else if (buttonIndex === 3) {
            handleRemoveAvatar();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Avatar',
        'Choose how you want to set your avatar',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: openCamera },
          { text: 'Choose from Library', onPress: openImageLibrary },
          ...(avatarUri ? [{ text: 'Remove Photo', onPress: handleRemoveAvatar, style: 'destructive' as const }] : []),
        ]
      );
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarPreview(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showToast('Failed to open camera', 'error');
    }
  };

  const openImageLibrary = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required to select images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarPreview(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image library error:', error);
      showToast('Failed to open image library', 'error');
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove your avatar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setAvatarPreview(null);
            setAvatarUri(null);
          },
        },
      ]
    );
  };

  const validateForm = async (): Promise<boolean> => {
    const validation = await UserProfileActions.validateProfileData(formData);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return false;
    }

    // Check username availability if username changed
    if (formData.username !== (currentUser?.user_metadata?.username || '')) {
      const isAvailable = await UserProfileActions.checkUsernameAvailability(
        formData.username,
        currentUser?.id
      );
      
      if (!isAvailable) {
        setFormErrors({ username: 'Username is already taken' });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!currentUser || isSaving) return;

    setGeneralError(null);
    setIsSaving(true);

    try {
      // Validate form
      const isValid = await validateForm();
      if (!isValid) {
        setIsSaving(false);
        return;
      }

      let newAvatarUrl = avatarUri;

      // Upload new avatar if there's a preview
      if (avatarPreview) {
        setIsUploadingAvatar(true);
        
        const uploadResult = await UserProfileActions.updateAvatar(
          currentUser.id,
          avatarPreview,
          (progress) => setUploadProgress(progress)
        );

        setIsUploadingAvatar(false);
        setUploadProgress(null);

        if (!uploadResult.success) {
          setGeneralError(uploadResult.error || 'Failed to upload avatar');
          setIsSaving(false);
          return;
        }

        newAvatarUrl = uploadResult.avatarUrl || null;
        setAvatarUri(newAvatarUrl);
        setAvatarPreview(null);
      } else if (avatarUri === null && currentUser.user_metadata?.avatar_url) {
        // Remove avatar if it was removed
        const removeResult = await UserProfileActions.removeAvatar(currentUser.id);
        if (!removeResult.success) {
          console.warn('Failed to remove avatar:', removeResult.error);
        }
        newAvatarUrl = null;
      }

      // Update profile
      const profileData: Partial<UserProfileData> = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        avatarUrl: newAvatarUrl || undefined,
      };

      const updatedProfile = await UserProfileActions.updateProfile(
        currentUser.id,
        profileData
      );

      if (!updatedProfile) {
        setGeneralError('Failed to update profile. Please try again.');
        setIsSaving(false);
        return;
      }

      // Update Redux state with new user data
      const updatedUser = {
        ...currentUser,
        email: formData.email,
        user_metadata: {
          ...currentUser.user_metadata,
          full_name: formData.fullName,
          username: formData.username,
          avatar_url: newAvatarUrl,
        },
      };
      
      dispatch(setUser(updatedUser));

      showToast('Profile updated successfully!', 'success');
      setHasChanges(false);

    } catch (error) {
      console.error('Save profile error:', error);
      setGeneralError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before leaving?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: handleSave },
        ]
      );
    } else {
      router.back();
    }
  };

  const getDisplayAvatar = () => {
    return avatarPreview || avatarUri;
  };

  const renderAvatar = () => {
    const displayAvatar = getDisplayAvatar();
    
    return (
      <View style={styles.avatarContainer}>
        <TouchableOpacity
          style={[styles.avatarButton, { borderColor: colors.border }]}
          onPress={selectImageSource}
          disabled={isSaving}
        >
          {displayAvatar ? (
            <Image 
              source={{ uri: displayAvatar }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons 
                name="person" 
                size={40} 
                color={colors.textSecondary} 
              />
            </View>
          )}
          
          {/* Upload progress overlay */}
          {isUploadingAvatar && uploadProgress && (
            <View style={styles.uploadOverlay}>
              <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.progressText, { color: colors.text }]}>
                  {Math.round(uploadProgress.percentage)}%
                </Text>
                <Spinner size="small" color={colors.primary} />
              </View>
            </View>
          )}

          {/* Camera icon overlay */}
          <View style={[styles.avatarOverlay, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        
        <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
          Tap to change avatar
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          testID="back-button"
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Profile
        </Text>
        
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: hasChanges && !isSaving ? colors.primary : colors.border,
              opacity: hasChanges && !isSaving ? 1 : 0.6,
            }
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          testID="save-button"
        >
          {isSaving ? (
            <Spinner size="small" color="#FFFFFF" />
          ) : (
            <Text style={[
              styles.saveButtonText,
              { color: hasChanges ? '#FFFFFF' : colors.textSecondary }
            ]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        {renderAvatar()}

        {/* Form Section */}
        <View style={styles.formSection}>
          {generalError && (
            <ErrorMessage 
              message={generalError} 
              onDismiss={() => setGeneralError(null)}
            />
          )}

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Full Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: formErrors.fullName ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textSecondary}
              value={formData.fullName}
              onChangeText={(text) => handleInputChange('fullName', text)}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isSaving}
              testID="fullname-input"
            />
            {formErrors.fullName && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {formErrors.fullName}
              </Text>
            )}
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Username
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: formErrors.username ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Choose a username"
              placeholderTextColor={colors.textSecondary}
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
              testID="username-input"
            />
            {formErrors.username && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {formErrors.username}
              </Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Email Address
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: formErrors.email ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
              testID="email-input"
            />
            {formErrors.email && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {formErrors.email}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarButton: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  avatarHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 4,
  },
});