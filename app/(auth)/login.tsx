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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
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
  };

  useEffect(() => {
    validateForm();
  }, [email, password, emailError, passwordError]);

  const validateForm = () => {
    const emailValid = authService.validateEmail(email).isValid;
    const passwordValid = password.length > 0;
    setIsFormValid(emailValid && passwordValid && !emailError && !passwordError);
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
    setPasswordError('');
  };

  const handleSignIn = async () => {
    if (!isFormValid || isLoading) return;

    // Final validation
    const emailValidation = authService.validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message || '');
      return;
    }

    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    const result = await authService.signIn({ email, password });
    
    if (result.success) {
      router.replace('/(main)');
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    if (isLoading) return;

    // OAuth doesn't work in Expo Go
    Alert.alert(
      'OAuth Not Available', 
      'Social sign-in requires a development build. Please use email/password or create a development build.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome Back
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to your account to continue
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
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
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
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.signInButton,
            {
              backgroundColor: isFormValid && !isLoading ? colors.primary : colors.textSecondary,
            },
          ]}
          onPress={handleSignIn}
          disabled={!isFormValid || isLoading}
          testID="sign-in-button"
        >
          {isLoading ? (
            <Spinner size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.forgotPasswordContainer}>
          <Link href="/(auth)/reset-password" style={styles.forgotPasswordLink}>
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
              Forgot your password?
            </Text>
          </Link>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
            Or continue with
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleSocialSignIn('google')}
            disabled={isLoading}
            testID="google-sign-in"
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleSocialSignIn('apple')}
            disabled={isLoading}
            testID="apple-sign-in"
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
          Don't have an account?{' '}
        </Text>
        <Link href="/(auth)/signup" style={styles.signUpLink}>
          <Text style={[styles.signUpLinkText, { color: colors.primary }]}>
            Sign Up
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
    marginTop: 40,
    marginBottom: 32,
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
    marginBottom: 20,
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
  signInButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 56,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordLink: {
    padding: 8,
  },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
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
  signUpLink: {
    padding: 4,
  },
  signUpLinkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});