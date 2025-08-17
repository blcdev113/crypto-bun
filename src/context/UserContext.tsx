import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface UserContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOtp: (email: string) => Promise<void>;
  sendRegistrationOtp: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Store password temporarily for after OTP verification
      sessionStorage.setItem('pendingPassword', password);
      
      // Send OTP for email verification
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create user yet
        }
      });
      
      if (error) {
        sessionStorage.removeItem('pendingPassword');
        throw error;
      }
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const sendRegistrationOtp = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Store password temporarily for after OTP verification
      sessionStorage.setItem('pendingPassword', password);
      sessionStorage.setItem('pendingEmail', email);
      
      // Send OTP for email verification during registration
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });
      
      if (error) {
        sessionStorage.removeItem('pendingPassword');
        sessionStorage.removeItem('pendingEmail');
        throw error;
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const signInWithOtp = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
      
      if (error) throw error;
      
      // Check if this is a registration verification
      const pendingPassword = sessionStorage.getItem('pendingPassword');
      const pendingEmail = sessionStorage.getItem('pendingEmail');
      
      if (pendingPassword && pendingEmail && email === pendingEmail) {
        // Complete the registration by creating the user account
        sessionStorage.removeItem('pendingPassword');
        sessionStorage.removeItem('pendingEmail');
        
        // Sign out the temporary session
        await supabase.auth.signOut();
        
        // Now create the actual user account
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: pendingPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        if (signUpError) throw signUpError;
      }
    } catch (error: any) {
      throw new Error(error.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signUp, 
      signIn, 
      signInWithOtp, 
      sendRegistrationOtp,
      verifyOtp, 
      signOut 
    }}>
      {children}
    </UserContext.Provider>
  );
};