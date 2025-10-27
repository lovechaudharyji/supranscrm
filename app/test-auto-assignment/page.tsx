"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAutoAssignmentPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🚀 Starting auto-assignment diagnostic tests...');
      
      // Test 1: Supabase client
      addResult(`📡 Supabase URL: ${supabase.supabaseUrl}`);
      addResult(`🔑 Supabase Key: ${supabase.supabaseKey?.substring(0, 20)}...`);
      
      // Test 2: Basic connection
      addResult('🔍 Testing basic connection...');
      const { data: testData, error: testError } = await supabase
        .from('Leads')
        .select('count')
        .limit(1);
      
      if (testError) {
        addResult(`❌ Connection failed: ${testError.message}`);
        addResult(`❌ Error code: ${testError.code}`);
        addResult(`❌ Error hint: ${testError.hint}`);
        addResult(`❌ Error details: ${JSON.stringify(testError.details)}`);
      } else {
        addResult('✅ Basic connection successful');
      }
      
      // Test 3: Table structure
      addResult('🔍 Checking Leads table structure...');
      const { data: leadsData, error: leadsError } = await supabase
        .from('Leads')
        .select('whalesync_postgres_id, services, assigned_to')
        .limit(5);
      
      if (leadsError) {
        addResult(`❌ Leads query failed: ${leadsError.message}`);
        addResult(`❌ Leads error code: ${leadsError.code}`);
      } else {
        addResult(`✅ Leads query successful - found ${leadsData?.length || 0} records`);
        addResult(`📋 Sample data: ${JSON.stringify(leadsData?.slice(0, 2), null, 2)}`);
      }
      
      // Test 4: Employee Directory
      addResult('🔍 Checking Employee Directory...');
      const { data: empData, error: empError } = await supabase
        .from('Employee Directory')
        .select('whalesync_postgres_id, full_name, job_title, status')
        .limit(5);
      
      if (empError) {
        addResult(`❌ Employee query failed: ${empError.message}`);
        addResult(`❌ Employee error code: ${empError.code}`);
      } else {
        addResult(`✅ Employee query successful - found ${empData?.length || 0} records`);
        addResult(`📋 Sample employees: ${JSON.stringify(empData?.slice(0, 2), null, 2)}`);
      }
      
      // Test 5: Unassigned leads query
      addResult('🔍 Testing unassigned leads query...');
      const { data: unassignedData, error: unassignedError } = await supabase
        .from('Leads')
        .select('whalesync_postgres_id, services, assigned_to')
        .is('assigned_to', null);
      
      if (unassignedError) {
        addResult(`❌ Unassigned query failed: ${unassignedError.message}`);
      } else {
        addResult(`✅ Unassigned query successful - found ${unassignedData?.length || 0} unassigned leads`);
      }
      
      addResult('🎉 Diagnostic tests completed!');
      
    } catch (error: any) {
      addResult(`❌ Test failed with error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Auto-Assignment Diagnostic Tool</CardTitle>
          <p className="text-sm text-muted-foreground">
            This tool tests the database connection and queries used by the auto-assignment feature.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTests} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Running Tests...' : 'Run Diagnostic Tests'}
          </Button>
          
          {testResults.length > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
