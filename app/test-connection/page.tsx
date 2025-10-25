"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function TestConnectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Not tested');

  const testConnection = async () => {
    setIsLoading(true);
    setConnectionStatus('Testing...');

    try {
      console.log('Testing Supabase connection...');
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      // Test basic connection
      const { data, error } = await supabase.from('Employee Directory').select('count').limit(1);
      
      if (error) {
        console.error('Connection error:', error);
        setConnectionStatus(`Error: ${error.message}`);
        toast.error(`Connection failed: ${error.message}`);
      } else {
        console.log('Connection successful!');
        setConnectionStatus('✅ Connection successful!');
        toast.success('Supabase connection working!');
      }

      // Test auth connection
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('Auth connection error:', authError);
        setConnectionStatus(prev => prev + ` | Auth Error: ${authError.message}`);
      } else {
        console.log('Auth connection successful!');
        setConnectionStatus(prev => prev + ' | Auth: ✅');
      }

    } catch (error: any) {
      console.error('Test exception:', error);
      setConnectionStatus(`Exception: ${error.message}`);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Supabase Connection Test</CardTitle>
          <CardDescription>
            Test if Supabase is properly connected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to test the Supabase connection
            </p>
            <Button onClick={testConnection} disabled={isLoading} className="w-full">
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
          
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-semibold mb-1">Status:</p>
            <p className="text-sm">{connectionStatus}</p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Environment Variables:</strong></p>
            <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
