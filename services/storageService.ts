import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  bucket?: string;
  upsert?: boolean;
}

export interface UploadResult {
  success: boolean;
  data?: {
    path: string;
    fullPath: string;
    publicUrl: string;
  };
  error?: string;
}

export class StorageService {
  private static instance: StorageService;
  private readonly AVATARS_BUCKET = 'avatars';
  private readonly ATTACHMENTS_BUCKET = 'attachments';

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async uploadAvatar(
    userId: string,
    imageUri: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const { onProgress } = options;
      
      // Generate unique filename
      const fileExt = this.getFileExtension(imageUri) || 'jpg';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Convert image URI to blob/file
      const file = await this.uriToFile(imageUri, fileName);
      
      if (!file) {
        return {
          success: false,
          error: 'Failed to process image file',
        };
      }

      // Simulate progress for user feedback
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size, percentage: 0 });
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.AVATARS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: this.getReadableError(error.message),
        };
      }

      // Simulate progress completion
      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.AVATARS_BUCKET)
        .getPublicUrl(data.path);

      return {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl: urlData.publicUrl,
        },
      };

    } catch (error) {
      console.error('Storage service error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  }

  async uploadAttachment(
    taskId: string,
    fileUri: string,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const { onProgress } = options;
      
      // Generate unique filename
      const fileExt = this.getFileExtension(fileName);
      const uniqueFileName = `${taskId}_${Date.now()}_${fileName}`;
      const filePath = `tasks/${taskId}/${uniqueFileName}`;

      // Convert file URI to blob/file
      const file = await this.uriToFile(fileUri, uniqueFileName);
      
      if (!file) {
        return {
          success: false,
          error: 'Failed to process file',
        };
      }

      // Progress tracking
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size, percentage: 0 });
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.ATTACHMENTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: this.getReadableError(error.message),
        };
      }

      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.ATTACHMENTS_BUCKET)
        .getPublicUrl(data.path);

      return {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl: urlData.publicUrl,
        },
      };

    } catch (error) {
      console.error('Storage service error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  }

  async deleteFile(
    bucket: string,
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return {
          success: false,
          error: this.getReadableError(error.message),
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Storage service error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  }

  async deleteAvatar(userId: string, avatarPath: string): Promise<{ success: boolean; error?: string }> {
    return this.deleteFile(this.AVATARS_BUCKET, avatarPath);
  }

  async deleteAttachment(attachmentPath: string): Promise<{ success: boolean; error?: string }> {
    return this.deleteFile(this.ATTACHMENTS_BUCKET, attachmentPath);
  }

  async getSignedUrl(
    bucket: string,
    filePath: string,
    expiresIn: number = 3600
  ): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Signed URL error:', error);
        return {
          success: false,
          error: this.getReadableError(error.message),
        };
      }

      return {
        success: true,
        signedUrl: data.signedUrl,
      };

    } catch (error) {
      console.error('Storage service error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  }

  async listFiles(
    bucket: string,
    path?: string
  ): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path);

      if (error) {
        console.error('List files error:', error);
        return {
          success: false,
          error: this.getReadableError(error.message),
        };
      }

      return {
        success: true,
        files: data,
      };

    } catch (error) {
      console.error('Storage service error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  }

  private async uriToFile(uri: string, fileName: string): Promise<File | null> {
    try {
      // For React Native, we need to handle the file differently
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a File object from the blob
      const file = new File([blob], fileName, {
        type: blob.type || 'image/jpeg',
      });

      return file;
    } catch (error) {
      console.error('Error converting URI to file:', error);
      return null;
    }
  }

  private getFileExtension(uri: string): string | null {
    const match = uri.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : null;
  }

  private getReadableError(error: string): string {
    // Map Supabase storage errors to user-friendly messages
    if (error.includes('Duplicate')) {
      return 'A file with this name already exists.';
    }
    
    if (error.includes('Too large')) {
      return 'File size is too large. Please choose a smaller file.';
    }
    
    if (error.includes('Invalid file type')) {
      return 'File type is not supported.';
    }
    
    if (error.includes('Unauthorized')) {
      return 'You do not have permission to upload files.';
    }
    
    if (error.includes('Quota exceeded')) {
      return 'Storage quota exceeded. Please contact support.';
    }
    
    if (error.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Default message for unknown errors
    return 'Upload failed. Please try again.';
  }

  // Utility methods
  getAvatarUrl(userId: string, avatarPath?: string): string | null {
    if (!avatarPath) return null;
    
    const { data } = supabase.storage
      .from(this.AVATARS_BUCKET)
      .getPublicUrl(avatarPath);
    
    return data.publicUrl;
  }

  getAttachmentUrl(attachmentPath: string): string | null {
    if (!attachmentPath) return null;
    
    const { data } = supabase.storage
      .from(this.ATTACHMENTS_BUCKET)
      .getPublicUrl(attachmentPath);
    
    return data.publicUrl;
  }

  // Validation methods
  validateImageFile(uri: string, maxSizeBytes: number = 5 * 1024 * 1024): { isValid: boolean; error?: string } {
    const ext = this.getFileExtension(uri);
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!ext || !allowedExtensions.includes(ext)) {
      return {
        isValid: false,
        error: 'Please select a valid image file (JPG, PNG, GIF, or WebP).',
      };
    }

    // Note: File size validation would need to be done after fetching the file
    // This is a basic validation for file type only
    return { isValid: true };
  }

  validateAttachmentFile(fileName: string, maxSizeBytes: number = 10 * 1024 * 1024): { isValid: boolean; error?: string } {
    const ext = this.getFileExtension(fileName);
    const allowedExtensions = [
      'pdf', 'doc', 'docx', 'txt', 'rtf',
      'jpg', 'jpeg', 'png', 'gif', 'webp',
      'mp4', 'mov', 'avi',
      'zip', 'rar', '7z',
      'xls', 'xlsx', 'csv',
      'ppt', 'pptx',
    ];
    
    if (!ext || !allowedExtensions.includes(ext)) {
      return {
        isValid: false,
        error: 'File type not supported.',
      };
    }

    return { isValid: true };
  }
}

export const storageService = StorageService.getInstance();