"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function QuickTestPage() {
  const [email, setEmail] = useState('lakshay@startupsquad.in');
  const [password, setPassword] = useState('Qwerty@123??');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setResult('Testing login...');

    try {
      console.log('Quick login test for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        setResult(`❌ Error: ${error.message}`);
        toast.error(`Login failed: ${error.message}`);
      } else if (data.user) {
        console.log('Login successful!', data.user);
        setResult(`✅ Success! User: ${data.user.email}`);
        toast.success('Login successful!');
        
        // Check if admin
        if (data.user.email === 'lakshay@startupsquad.in' || data.user.email === 'sanjay@startupsquad.in') {
          setResult(prev => prev + ' | Role: Admin');
          toast.success('Admin user detected!');
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        }
      } else {
        setResult('❌ No user data returned');
        toast.error('No user data returned');
      }
    } catch (error: any) {
      console.error('Exception:', error);
      setResult(`❌ Exception: ${error.message}`);
      toast.error(`Exception: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Quick Login Test</CardTitle>
          <CardDescription>
            Test Lakshay's login credentials directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button onClick={handleQuickLogin} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Login'
            )}
          </Button>

          {result && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Result:</p>
              <p className="text-sm">{result}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p><strong>Expected:</strong> ✅ Success! User: lakshay@startupsquad.in | Role: Admin</p>
            <p><strong>Then:</strong> Automatic redirect to /dashboard</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
