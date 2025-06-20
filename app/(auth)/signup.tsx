import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useAuthLoading, useAuthError } from '../../store/hooks';
import { authService } from '../../services/authService';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [fullNameError, setFullNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const { isDarkMode } = useTheme();
  const isLoading = useAuthLoading();
  const authError = useAuthError();
  const router = useRouter();

  const colors = {
    background: isDarkMode ? '#000000' : '#FFFFFF',
    surface: isDarkMode ? '#1F1F1F' : '#F8F9FA',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#A0A0A0' : '#666666',
    border: isDarkMode ? '#333333' : '#E1E5E9',
    borderFocus: isDarkMode ? '#3B82F6' : '#2563EB',
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    error: isDarkMode ? '#EF4444' : '#DC2626',
    success: isDarkMode ? '#10B981' : '#059669',
    warning: isDarkMode ? '#F59E0B' : '#D97706',
  };

  useEffect(() => {
    validateForm();
  }, [fullName, username, email, password, confirmPassword, fullNameError, usernameError, emailError, passwordError, confirmPasswordError]);

  const validateForm = () => {
    const allFieldsFilled = !!(fullName && username && email && password && confirmPassword);
    const noErrors = !fullNameError && !usernameError && !emailError && !passwordError && !confirmPasswordError;
    setIsFormValid(allFieldsFilled && noErrors);
  };

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (text.length > 0) {
      const validation = authService.validateFullName(text);
      setFullNameError(validation.isValid ? '' : validation.message || '');
    } else {
      setFullNameError('');
    }
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    if (text.length > 0) {
      const validation = authService.validateUsername(text);
      setUsernameError(validation.isValid ? '' : validation.message || '');
    } else {
      setUsernameError('');
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.length > 0) {
      const validation = authService.validateEmail(text);
      setEmailError(validation.isValid ? '' : validation.message || '');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text.length > 0) {
      const validation = authService.validatePassword(text);
      setPasswordError(validation.isValid ? '' : validation.message || '');
      setPasswordStrength(validation.strength || null);
    } else {
      setPasswordError('');
      setPasswordStrength(null);
    }
    
    // Revalidate confirm password
    if (confirmPassword && text !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else if (confirmPassword && text === confirmPassword) {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text.length > 0) {
      if (text !== password) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setConfirmPasswordError('');
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'strong':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'Weak password';
      case 'medium':
        return 'Medium strength';
      case 'strong':
        return 'Strong password';
      default:
        return '';
    }
  };

  const handleSignUp = async () => {
    if (!isFormValid || isLoading) return;

    // Final validation
    const fullNameValidation = authService.validateFullName(fullName);
    if (!fullNameValidation.isValid) {
      setFullNameError(fullNameValidation.message || '');
      return;
    }

    const usernameValidation = authService.validateUsername(username);
    if (!usernameValidation.isValid) {
      setUsernameError(usernameValidation.message || '');
      return;
    }

    const emailValidation = authService.validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message || '');
      return;
    }

    const passwordValidation = authService.validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message || '');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    const result = await authService.signUp({
      email,
      password,
      fullName,
      username,
    });

    if (result.success) {
      Alert.alert(
        'Account Created',
        'Please check your email for a verification link before signing in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    }
  };

  const handleSocialSignUp = async (provider: 'google' | 'apple') => {
    if (isLoading) return;

    try {
      const result = provider === 'google' 
        ? await authService.signInWithGoogle()
        : await authService.signInWithApple();
      
      if (result.success) {
        // OAuth redirect will handle navigation
      }
    } catch (error) {
      Alert.alert('Error', `Failed to sign up with ${provider}. Please try again.`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Create Account
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign up to get started with FlowState
        </Text>
      </View>

      <View style={styles.form}>
        {authError && (
          <ErrorMessage 
            message={authError} 
            onDismiss={() => {/* Clear error in Redux */}}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Full Name
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: fullNameError ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textSecondary}
              value={fullName}
              onChangeText={handleFullNameChange}
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="name"
              textContentType="name"
              editable={!isLoading}
              testID="fullname-input"
            />
          </View>
          {fullNameError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {fullNameError}
            </Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Username
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="at-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: usernameError ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Choose a username"
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              editable={!isLoading}
              testID="username-input"
            />
          </View>
          {usernameError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {usernameError}
            </Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Email Address
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: emailError ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!isLoading}
              testID="email-input"
            />
          </View>
          {emailError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {emailError}
            </Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Password
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: passwordError ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Create a password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password-new"
              textContentType="newPassword"
              editable={!isLoading}
              testID="password-input"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              testID="password-toggle"
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {passwordError}
            </Text>
          ) : passwordStrength ? (
            <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
              {getPasswordStrengthText()}
            </Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Confirm Password
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: confirmPasswordError ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Confirm your password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password-new"
              textContentType="newPassword"
              editable={!isLoading}
              testID="confirm-password-input"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              testID="confirm-password-toggle"
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {confirmPasswordError}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.signUpButton,
            {
              backgroundColor: isFormValid && !isLoading ? colors.primary : colors.textSecondary,
            },
          ]}
          onPress={handleSignUp}
          disabled={!isFormValid || isLoading}
          testID="sign-up-button"
        >
          {isLoading ? (
            <Spinner size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.signUpButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
            Or sign up with
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleSocialSignUp('google')}
            disabled={isLoading}
            testID="google-sign-up"
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleSocialSignUp('apple')}
            disabled={isLoading}
            testID="apple-sign-up"
          >
            <Ionicons name="logo-apple" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              Apple
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Already have an account?{' '}
        </Text>
        <Link href="/(auth)/login" style={styles.signInLink}>
          <Text style={[styles.signInLinkText, { color: colors.primary }]}>
            Sign In
          </Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 48,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 56,
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  strengthText: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  signUpButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 56,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 16,
  },
  signInLink: {
    padding: 4,
  },
  signInLinkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});