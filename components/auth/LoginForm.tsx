"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    
    try {
      console.log('Starting login process for:', data.email);
      const { user, error } = await signIn(data.email, data.password);
      
      console.log('SignIn response:', { user, error });
      
      if (error) {
        console.error('Login error:', error);
        // Handle specific error cases
        if (error.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (error.includes('Email not confirmed')) {
          toast.error('Please check your email and confirm your account before signing in.');
        } else if (error.includes('Too many requests')) {
          toast.error('Too many login attempts. Please try again later.');
        } else {
          toast.error(error);
        }
        setIsLoading(false);
        return;
      }

      if (user) {
        console.log('Login successful! User:', user);
        toast.success(`Welcome back, ${user.full_name}!`);
        
        // Immediate redirect based on user role
        let redirectUrl = '';
        if (user.role === 'admin') {
          redirectUrl = '/dashboard';
          console.log('Admin user - redirecting to dashboard');
        } else if (user.role === 'hr') {
          redirectUrl = '/dashboard/attendance/hr';
          console.log('HR user - redirecting to HR dashboard');
        } else {
          redirectUrl = '/employee';
          console.log('Employee user - redirecting to employee portal');
        }
        
        console.log('Redirecting to:', redirectUrl);
        
        // Small delay to ensure auth state is properly set
        setTimeout(() => {
          router.push(redirectUrl);
        }, 100);
        
      } else {
        console.log('No user object received from signIn');
        toast.error('Login failed - no user data received');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Login exception:', error);
      toast.error(error.message || 'An error occurred during login');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <Building2 className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Company CRM</CardTitle>
        <CardDescription>
          Sign in to access your company dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Company Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="your.email@company.com"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In to Company CRM'
            )}
          </Button>

          {/* Admin Users Info */}
          <div className="text-center text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-md">
            <p className="font-semibold mb-1">Admin Access</p>
            <p className="text-xs">Lakshay Takkar: lakshay@startupsquad.in</p>
            <p className="text-xs">Sanjay Kumar Sharma: sanjay@startupsquad.in</p>
            <p className="text-xs mt-1">Password: admin123456</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
