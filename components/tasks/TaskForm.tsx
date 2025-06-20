import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../store/hooks';
import { TaskData } from '../../db/actions/taskActions';
import { TaskStatus, TaskPriority } from '../../db/model/task';
import { Project } from '../../db/model/project';
import { Spinner } from '../ui/Spinner';
import { ErrorMessage } from '../ui/ErrorMessage';

interface TaskFormProps {
  initialData?: Partial<TaskData>;
  projects: Project[];
  onSubmit: (data: TaskData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
}

interface FormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  dueDate: Date | null;
}

interface FormErrors {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  projectId?: string;
  dueDate?: string;
}

const TASK_STATUSES: { value: TaskStatus; label: string; icon: string }[] = [
  { value: 'todo', label: 'To Do', icon: 'radio-button-off' },
  { value: 'in_progress', label: 'In Progress', icon: 'play-circle' },
  { value: 'completed', label: 'Completed', icon: 'checkmark-circle' },
  { value: 'cancelled', label: 'Cancelled', icon: 'close-circle' },
];

const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#10B981' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#EF4444' },
  { value: 'urgent', label: 'Urgent', color: '#DC2626' },
];

const DESCRIPTION_MAX_LENGTH = 2000;

export const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  projects,
  onSubmit,
  onCancel,
  isLoading = false,
  submitButtonText = 'Create Task',
}) => {
  const { isDarkMode } = useTheme();
  const titleInputRef = useRef<TextInput>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'todo',
    priority: initialData?.priority || 'medium',
    projectId: 'default', // Always use default since we don't use projects
    dueDate: initialData?.dueDate || null,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

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

  // Auto-focus title input on mobile
  useEffect(() => {
    if (Platform.OS !== 'web' && titleInputRef.current) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Remove project dependency - no smart defaults needed

  const handleInputChange = (field: keyof FormData, value: any) => {
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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validate title
    if (!formData.title.trim()) {
      errors.title = 'Task title is required';
    } else if (formData.title.trim().length > 200) {
      errors.title = 'Task title must be less than 200 characters';
    }

    // Validate description
    if (formData.description.length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description must be less than ${DESCRIPTION_MAX_LENGTH} characters`;
    }

    // No project validation needed anymore

    // Validate due date
    if (formData.dueDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (formData.dueDate < now) {
        errors.dueDate = 'Due date cannot be in the past';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || isLoading) return;

    try {
      setGeneralError(null);
      
      const taskData: TaskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        projectId: formData.projectId,
        dueDate: formData.dueDate ?? undefined,
        createdBy: '', // This should be set by the calling component
      };

      await onSubmit(taskData);
    } catch (error) {
      console.error('Form submission error:', error);
      setGeneralError('Failed to save task. Please try again.');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('dueDate', selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDescriptionCharacterCount = () => {
    const remaining = DESCRIPTION_MAX_LENGTH - formData.description.length;
    const isNearLimit = remaining < 100;
    return {
      text: `${formData.description.length}/${DESCRIPTION_MAX_LENGTH}`,
      color: isNearLimit ? colors.error : colors.textSecondary,
    };
  };

  const getSelectedProject = () => {
    return projects.find(p => p.id === formData.projectId);
  };

  const getPriorityColor = (priority: TaskPriority) => {
    return TASK_PRIORITIES.find(p => p.value === priority)?.color || colors.textSecondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* General Error */}
        {generalError && (
          <ErrorMessage 
            message={generalError} 
            onDismiss={() => setGeneralError(null)}
          />
        )}

        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Task Title *
          </Text>
          <TextInput
            ref={titleInputRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: formErrors.title ? colors.error : colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Enter task title"
            placeholderTextColor={colors.textSecondary}
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            autoCapitalize="sentences"
            autoCorrect={false}
            editable={!isLoading}
            maxLength={200}
            testID="task-title-input"
          />
          {formErrors.title && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {formErrors.title}
            </Text>
          )}
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>
              Description
            </Text>
            <Text style={[styles.characterCount, { color: getDescriptionCharacterCount().color }]}>
              {getDescriptionCharacterCount().text}
            </Text>
          </View>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: formErrors.description ? colors.error : colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Add a description for your task..."
            placeholderTextColor={colors.textSecondary}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoCapitalize="sentences"
            editable={!isLoading}
            maxLength={DESCRIPTION_MAX_LENGTH}
            testID="task-description-input"
          />
          {formErrors.description && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {formErrors.description}
            </Text>
          )}
        </View>

        {/* Removed Project Selection - tasks are standalone now */}

        {/* Status Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Status
          </Text>
          <View style={styles.optionsGrid}>
            {TASK_STATUSES.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.optionItem,
                  {
                    backgroundColor: formData.status === status.value 
                      ? colors.primary 
                      : colors.surface,
                    borderColor: formData.status === status.value 
                      ? colors.primary 
                      : colors.border,
                  },
                ]}
                onPress={() => handleInputChange('status', status.value)}
                disabled={isLoading}
              >
                <Ionicons
                  name={status.icon as any}
                  size={20}
                  color={formData.status === status.value ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: formData.status === status.value 
                        ? '#FFFFFF' 
                        : colors.text,
                    },
                  ]}
                >
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Priority
          </Text>
          <View style={styles.optionsGrid}>
            {TASK_PRIORITIES.map((priority) => (
              <TouchableOpacity
                key={priority.value}
                style={[
                  styles.optionItem,
                  {
                    backgroundColor: formData.priority === priority.value 
                      ? priority.color 
                      : colors.surface,
                    borderColor: formData.priority === priority.value 
                      ? priority.color 
                      : colors.border,
                  },
                ]}
                onPress={() => handleInputChange('priority', priority.value)}
                disabled={isLoading}
              >
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: formData.priority === priority.value ? '#FFFFFF' : priority.color },
                  ]}
                />
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: formData.priority === priority.value 
                        ? '#FFFFFF' 
                        : colors.text,
                    },
                  ]}
                >
                  {priority.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Due Date
          </Text>
          <TouchableOpacity
            style={[
              styles.dateButton,
              {
                backgroundColor: colors.surface,
                borderColor: formErrors.dueDate ? colors.error : colors.border,
              },
            ]}
            onPress={() => setShowDatePicker(true)}
            disabled={isLoading}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text
              style={[
                styles.dateText,
                {
                  color: formData.dueDate ? colors.text : colors.textSecondary,
                },
              ]}
            >
              {formData.dueDate ? formatDate(formData.dueDate) : 'Select due date'}
            </Text>
            {formData.dueDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => handleInputChange('dueDate', null)}
                disabled={isLoading}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {formErrors.dueDate && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {formErrors.dueDate}
            </Text>
          )}
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.dueDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.primary,
              opacity: isLoading ? 0.6 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
          testID="submit-task-button"
        >
          {isLoading ? (
            <Spinner size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {submitButtonText}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 100,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  projectsList: {
    flexDirection: 'row',
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 120,
  },
  projectColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  clearDateButton: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});