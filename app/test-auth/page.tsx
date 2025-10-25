"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function TestAuthPage() {
  const [email, setEmail] = useState('lakshay@startupsquad.in');
  const [password, setPassword] = useState('Qwerty@123??');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogs([]);
    setIsLoading(true);
    addLog(`Testing login for: ${email}`);

    try {
      addLog('Testing Supabase connection...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        addLog(`Supabase connection error: ${sessionError.message}`);
        toast.error(`Connection error: ${sessionError.message}`);
        setIsLoading(false);
        return;
      }
      addLog('Supabase connection successful!');

      addLog('Testing authentication...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addLog(`Authentication error: ${error.message}`);
        toast.error(`Auth error: ${error.message}`);
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        addLog('Authentication failed: No user data returned');
        toast.error('Auth failed: No user data.');
        setIsLoading(false);
        return;
      }

      addLog(`Authentication successful!`);
      addLog(`User ID: ${data.user.id}`);
      addLog(`User Email: ${data.user.email}`);

      // Check if this is Lakshay or Sanjay
      if (data.user.email === 'lakshay@startupsquad.in' || data.user.email === 'sanjay@startupsquad.in') {
        addLog(`Admin user detected: ${data.user.email}`);
        toast.success(`Admin login successful for ${data.user.email}!`);
        
        addLog('Redirecting to admin dashboard...');
        window.location.href = '/dashboard';
      } else {
        addLog('Regular user - checking Employee Directory...');
        const { data: employeeData, error: employeeError } = await supabase
          .from('Employee Directory')
          .select('full_name, job_title, department')
          .eq('official_email', data.user.email)
          .single();

        if (employeeError || !employeeData) {
          addLog(`Employee Directory error: ${employeeError?.message || 'No employee data'}`);
          toast.error('Employee error: Could not find employee record.');
          setIsLoading(false);
          return;
        }

        addLog(`Employee found: ${employeeData.full_name}`);
        toast.success(`Login successful for ${employeeData.full_name}!`);
      }

    } catch (error: any) {
      addLog(`Login exception: ${error.message || 'Unknown error'}`);
      toast.error(error.message || 'An unexpected error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-gradient-to-br from-background to-muted p-4 gap-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Test Authentication</CardTitle>
          <CardDescription>
            Test login with Lakshay's credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTestLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lakshay@startupsquad.in"
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
                placeholder="Qwerty@123??"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Login'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="w-full max-w-md lg:max-w-lg h-[400px] overflow-y-auto">
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
          <CardDescription>Real-time output of the authentication process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono bg-gray-800 text-gray-200 p-3 rounded-md">
            {logs.length === 0 ? (
              <p className="text-gray-500">Click "Test Login" to start debugging...</p>
            ) : (
              logs.map((log, index) => (
                <p key={index} className="break-words">{log}</p>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
