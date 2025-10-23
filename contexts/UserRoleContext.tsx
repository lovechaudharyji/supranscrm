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
    const checkUserRole = async () => {
      try {
        // Check for demo mode first
        const demoRole = document.cookie
          .split('; ')
          .find(row => row.startsWith('demo_user_role='))
          ?.split('=')[1];
        
        if (demoRole) {
          setUserRole(demoRole as UserRole);
          setIsLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if user is HR (has specific HR email or role)
          const { data: hrData } = await supabase
            .from("Employee Directory")
            .select("job_title, department")
            .eq("official_email", user.email)
            .single();

          if (hrData && (hrData.job_title?.toLowerCase().includes('hr') || 
                        hrData.department?.toLowerCase().includes('hr'))) {
            setUserRole('hr');
          } else if (hrData) {
            setUserRole('employee');
          } else {
            setUserRole('admin');
          }
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserRole(null);
      } else if (session?.user) {
        checkUserRole();
      }
    });

    return () => subscription.unsubscribe();
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
