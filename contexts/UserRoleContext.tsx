"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type UserRole = 'admin' | 'employee' | 'hr';

interface UserRoleContextType {
  userRole: UserRole | null;
  setUserRole: (role: UserRole | null) => void;
  isLoading: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = () => {
      try {
        // Only check for demo mode - no real authentication
        const demoRole = document.cookie
          .split('; ')
          .find(row => row.startsWith('demo_user_role='))
          ?.split('=')[1];
        
        if (demoRole) {
          setUserRole(demoRole as UserRole);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, []);

  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole, isLoading }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}
