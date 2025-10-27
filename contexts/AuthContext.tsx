"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  full_name: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGettingUser, setIsGettingUser] = useState(false);

  // Get current user and role
  const getCurrentUser = async () => {
    if (isGettingUser) {
      console.log('Already getting user, skipping...');
      return;
    }
    
    try {
      setIsGettingUser(true);
      console.log('Getting current user...');
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        setUser(null);
        setLoading(false);
        return;
      }
      
      if (!authUser) {
        console.log('No authenticated user found');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('Authenticated user found:', authUser.email);

      // Check if this is Lakshay or Sanjay (admin users)
      if (authUser.email === 'lakshay@startupsquad.in' || authUser.email === 'sanjay@startupsquad.in') {
        console.log('Admin user detected:', authUser.email);
        
        const userData: User = {
          id: authUser.id,
          email: authUser.email!,
          role: 'admin',
          full_name: authUser.email === 'lakshay@startupsquad.in' ? 'Lakshay Takkar' : 'Sanjay Kumar Sharma',
          created_at: authUser.created_at
        };

        console.log('Setting admin user data:', userData);
        setUser(userData);
        setLoading(false);
        return;
      }

      // For other users, check Employee Directory
      console.log('Checking Employee Directory for user:', authUser.email);
      const { data: employeeData, error: employeeError } = await supabase
        .from('Employee Directory')
        .select('full_name, job_title, department')
        .eq('official_email', authUser.email)
        .single();

      if (employeeError) {
        console.error('Employee Directory error:', employeeError);
        setUser(null);
        setLoading(false);
        return;
      }

      if (!employeeData) {
        console.error('No employee record found');
        setUser(null);
        setLoading(false);
        return;
      }

      // Determine role based on job title or department
      let role: 'admin' | 'hr' | 'employee' = 'employee';
      
      if (employeeData.job_title?.toLowerCase().includes('hr') || 
          employeeData.department?.toLowerCase().includes('hr')) {
        role = 'hr';
      } else if (employeeData.job_title?.toLowerCase().includes('admin') || 
                 employeeData.job_title?.toLowerCase().includes('ceo') ||
                 employeeData.job_title?.toLowerCase().includes('manager')) {
        role = 'admin';
      }

      console.log('User role determined:', role);

      const userData: User = {
        id: authUser.id,
        email: authUser.email!,
        role: role,
        full_name: employeeData.full_name || authUser.email!,
        created_at: authUser.created_at
      };

      console.log('Setting user data:', userData);
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error getting current user:', error);
      setUser(null);
      setLoading(false);
    } finally {
      setIsGettingUser(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
    try {
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { user: null, error: error.message };
      }

      if (!data.user) {
        console.error('No user data returned');
        return { user: null, error: 'No user data returned' };
      }

      console.log('Sign in successful, getting user profile...');
      
      // Check if this is Lakshay or Sanjay (admin users)
      if (data.user.email === 'lakshay@startupsquad.in' || data.user.email === 'sanjay@startupsquad.in') {
        console.log('Admin user detected:', data.user.email);
        
        const userData: User = {
          id: data.user.id,
          email: data.user.email!,
          role: 'admin',
          full_name: data.user.email === 'lakshay@startupsquad.in' ? 'Lakshay Takkar' : 'Sanjay Kumar Sharma',
          created_at: data.user.created_at
        };

        console.log('User profile loaded:', userData);
        
        // Update the state
        setUser(userData);
        setLoading(false);
        
        return { user: userData, error: null };
      }

      // For other users, check Employee Directory
      console.log('Checking Employee Directory for user:', data.user.email);
      const { data: employeeData, error: employeeError } = await supabase
        .from('Employee Directory')
        .select('full_name, job_title, department')
        .eq('official_email', data.user.email)
        .single();

      if (employeeError) {
        console.error('Employee Directory error:', employeeError);
        return { user: null, error: 'Failed to get employee profile' };
      }

      if (!employeeData) {
        console.error('No employee record found');
        return { user: null, error: 'No employee record found' };
      }

      // Determine role based on job title or department
      let role: 'admin' | 'hr' | 'employee' = 'employee';
      
      if (employeeData.job_title?.toLowerCase().includes('hr') || 
          employeeData.department?.toLowerCase().includes('hr')) {
        role = 'hr';
      } else if (employeeData.job_title?.toLowerCase().includes('admin') || 
                 employeeData.job_title?.toLowerCase().includes('ceo') ||
                 employeeData.job_title?.toLowerCase().includes('manager')) {
        role = 'admin';
      }

      console.log('User role determined:', role);

      const userData: User = {
        id: data.user.id,
        email: data.user.email!,
        role: role,
        full_name: employeeData.full_name || data.user.email!,
        created_at: data.user.created_at
      };

      console.log('User profile loaded:', userData);
      
      // Update the state
      setUser(userData);
      setLoading(false);
      
      return { user: userData, error: null };
    } catch (error: any) {
      console.error('Sign in exception:', error);
      return { user: null, error: error.message || 'An error occurred during sign in' };
    }
  };

  // Clear attendance and user data from local storage
  const clearUserData = () => {
    try {
      // Clear specific attendance and user data
      localStorage.removeItem('offline-attendance');
      localStorage.removeItem('attendance-data');
      localStorage.removeItem('user-data');
      localStorage.removeItem('employee-data');
      localStorage.removeItem('demo-mode');
      
      // Clear any other app-specific data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('attendance') || key.includes('employee') || key.includes('user'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('User and attendance data cleared from local storage');
    } catch (error) {
      console.error('Error clearing local storage:', error);
      // Fallback to clear all
      localStorage.clear();
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      
      // Clear user and attendance data from local storage
      clearUserData();
      
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // HR permissions
    if (user.role === 'hr') {
      return ['view_employees', 'manage_attendance', 'view_reports'].includes(permission);
    }
    
    // Employee permissions
    if (user.role === 'employee') {
      return ['view_profile', 'manage_tasks', 'view_leads'].includes(permission);
    }
    
    return false;
  };

  // Listen for auth state changes
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (isMounted) {
        console.log('Initializing auth...');
        await getCurrentUser();
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setLoading(false);
        }
        // Removed SIGNED_IN handler to prevent loops - signIn function handles this
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
