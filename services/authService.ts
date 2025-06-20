import { supabase } from '../lib/supabase';
import { store } from '../store';
import { setAuth, setLoading, setError, signOut } from '../store/slices/authSlice';
import { AuthError, Session, User } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  username?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
  accessToken: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: User;
  session?: Session;
}

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.setupAuthListener();
  }

  private setupAuthListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      const dispatch = store.dispatch;
      
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            dispatch(setAuth({ user: session.user, session }));
            await this.updateUserProfile(session.user);
          }
          break;
        case 'SIGNED_OUT':
          dispatch(signOut());
          break;
        case 'TOKEN_REFRESHED':
          if (session) {
            dispatch(setAuth({ user: session.user, session }));
          }
          break;
        case 'USER_UPDATED':
          if (session?.user) {
            dispatch(setAuth({ user: session.user, session }));
            await this.updateUserProfile(session.user);
          }
          break;
      }
      dispatch(setLoading(false));
    });
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      store.dispatch(setLoading(true));
      store.dispatch(setError(''));

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            username: data.username,
          },
        },
      });

      if (error) {
        const errorMessage = this.getReadableErrorMessage(error);
        store.dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      }

      if (authData.user) {
        return {
          success: true,
          user: authData.user,
          session: authData.session ?? undefined,
        };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      store.dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      store.dispatch(setLoading(true));
      store.dispatch(setError(''));

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        const errorMessage = this.getReadableErrorMessage(error);
        store.dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      }

      if (authData.user && authData.session) {
        return {
          success: true,
          user: authData.user,
          session: authData.session,
        };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      store.dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  async signOut(): Promise<AuthResponse> {
    try {
      store.dispatch(setLoading(true));
      store.dispatch(setError(''));

      const { error } = await supabase.auth.signOut();

      if (error) {
        const errorMessage = this.getReadableErrorMessage(error);
        store.dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      }

      store.dispatch(signOut());
      return { success: true };
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      store.dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
    try {
      store.dispatch(setLoading(true));
      store.dispatch(setError(''));

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: 'flowstate://reset-password',
      });

      if (error) {
        const errorMessage = this.getReadableErrorMessage(error);
        store.dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      store.dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  async updatePassword(data: UpdatePasswordData): Promise<AuthResponse> {
    try {
      store.dispatch(setLoading(true));
      store.dispatch(setError(''));

      const { data: userData, error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        const errorMessage = this.getReadableErrorMessage(error);
        store.dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      }

      if (userData.user) {
        return {
          success: true,
          user: userData.user,
        };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      store.dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      store.dispatch(setLoading(true));
      store.dispatch(setError(''));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'flowstate://auth/callback',
        },
      });

      if (error) {
        const errorMessage = this.getReadableErrorMessage(error);
        store.dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      store.dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  async signInWithApple(): Promise<AuthResponse> {
    try {
      store.dispatch(setLoading(true));
      store.dispatch(setError(''));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'flowstate://auth/callback',
        },
      });

      if (error) {
        const errorMessage = this.getReadableErrorMessage(error);
        store.dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      store.dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  private async updateUserProfile(user: User) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        store.dispatch(setAuth({ user, session: null }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  private getReadableErrorMessage(error: AuthError): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link before signing in.';
      case 'User already registered':
        return 'An account with this email already exists. Please sign in instead.';
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.';
      case 'Unable to validate email address: invalid format':
        return 'Please enter a valid email address.';
      case 'Signup is disabled':
        return 'Account registration is currently disabled. Please contact support.';
      case 'Email rate limit exceeded':
        return 'Too many emails sent. Please wait a few minutes before trying again.';
      case 'Too many requests':
        return 'Too many login attempts. Please wait a few minutes before trying again.';
      default:
        if (error.message.includes('Network error')) {
          return 'Network connection error. Please check your internet connection.';
        }
        if (error.message.includes('timeout')) {
          return 'Request timed out. Please try again.';
        }
        if (error.message.includes('rate limit')) {
          return 'Too many attempts. Please wait a few minutes before trying again.';
        }
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  validateEmail(email: string): { isValid: boolean; message?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      return { isValid: false, message: 'Email is required' };
    }
    
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
  }

  validatePassword(password: string): { isValid: boolean; message?: string; strength?: 'weak' | 'medium' | 'strong' } {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }
    
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long', strength: 'weak' };
    }
    
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strengthScore = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strengthScore < 2) {
      return { isValid: true, message: 'Consider using a stronger password', strength: 'weak' };
    } else if (strengthScore < 3) {
      return { isValid: true, strength: 'medium' };
    } else {
      return { isValid: true, strength: 'strong' };
    }
  }

  validateFullName(fullName: string): { isValid: boolean; message?: string } {
    if (!fullName.trim()) {
      return { isValid: false, message: 'Full name is required' };
    }
    
    if (fullName.trim().length < 2) {
      return { isValid: false, message: 'Full name must be at least 2 characters long' };
    }
    
    return { isValid: true };
  }

  validateUsername(username: string): { isValid: boolean; message?: string } {
    if (!username.trim()) {
      return { isValid: false, message: 'Username is required' };
    }
    
    if (username.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters long' };
    }
    
    if (username.length > 20) {
      return { isValid: false, message: 'Username must be less than 20 characters long' };
    }
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return { isValid: false, message: 'Username can only contain letters, numbers, hyphens, and underscores' };
    }
    
    return { isValid: true };
  }
}

export const authService = AuthService.getInstance();