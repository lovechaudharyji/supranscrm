"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestEmployeeDBPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEmployeeDirectory = async () => {
    setLoading(true);
    try {
      console.log('Testing Employee Directory table...');
      
      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from('Employee Directory')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Connection test failed:', testError);
        setResult({ error: testError.message, success: false });
        return;
      }
      
      console.log('Connection test successful, fetching data...');
      
      // Fetch actual data
      const { data: employeesData, error: employeesError } = await supabase
        .from('Employee Directory')
        .select('*')
        .limit(10);
      
      if (employeesError) {
        console.error('Data fetch failed:', employeesError);
        setResult({ error: employeesError.message, success: false });
        return;
      }
      
      console.log('Data fetch successful:', employeesData);
      setResult({ 
        success: true, 
        count: employeesData?.length || 0,
        data: employeesData,
        sample: employeesData?.[0]
      });
      
    } catch (err) {
      console.error('Exception:', err);
      setResult({ 
        error: err instanceof Error ? err.message : 'Unknown error', 
        success: false 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Employee Directory Database Test</CardTitle>
            <CardDescription>
              Test connection to Employee Directory table
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testEmployeeDirectory} disabled={loading}>
              {loading ? 'Testing...' : 'Test Employee Directory'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
                {result.success ? '✅ Success!' : '❌ Error'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-4">
                  <p className="text-green-600 font-semibold">
                    Found {result.count} employee records
                  </p>
                  {result.sample && (
                    <div>
                      <p className="font-semibold mb-2">Sample Employee Data:</p>
                      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                        {JSON.stringify(result.sample, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-600">
                  <p className="font-semibold">Error:</p>
                  <p className="text-sm">{result.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
