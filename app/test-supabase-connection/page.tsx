"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TestSupabaseConnection() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true);
        
        // Test 1: Basic connection with detailed error logging
        console.log('Testing basic Supabase connection...');
        const { data: testData, error: testError } = await supabase
          .from('Employee Directory')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.error('Connection test failed:', testError);
          console.error('Error details:', {
            message: testError.message,
            code: testError.code,
            hint: testError.hint,
            details: testError.details
          });
          setResults({ 
            error: 'Connection failed', 
            details: testError,
            errorInfo: {
              message: testError.message,
              code: testError.code,
              hint: testError.hint,
              details: testError.details
            }
          });
          return;
        }
        
        console.log('Connection test passed');
        
        // Test 2: Get table schemas
        console.log('Testing table schemas...');
        
        // Get a sample employee record
        const { data: employeeSample, error: empError } = await supabase
          .from('Employee Directory')
          .select('*')
          .limit(1);
        
        if (empError) {
          console.error('Employee sample error:', empError);
        }
        
        // Get a sample department record
        const { data: departmentSample, error: deptError } = await supabase
          .from('Departments')
          .select('*')
          .limit(1);
        
        if (deptError) {
          console.error('Department sample error:', deptError);
        }
        
        // Test 3: Try foreign key relationship
        console.log('Testing foreign key relationship...');
        const { data: employeeWithDept, error: relError } = await supabase
          .from('Employee Directory')
          .select(`
            whalesync_postgres_id,
            full_name,
            department,
            department:department(
              whalesync_postgres_id,
              department_name,
              display_name
            )
          `)
          .limit(1);
        
        if (relError) {
          console.error('Foreign key relationship error:', relError);
        }
        
        setResults({
          connectionTest: testData,
          employeeSample: employeeSample?.[0] || null,
          departmentSample: departmentSample?.[0] || null,
          employeeWithDept: employeeWithDept?.[0] || null,
          employeeFields: employeeSample?.[0] ? Object.keys(employeeSample[0]) : [],
          departmentFields: departmentSample?.[0] ? Object.keys(departmentSample[0]) : [],
          errors: {
            employee: empError,
            department: deptError,
            relationship: relError
          }
        });
        
      } catch (error) {
        console.error('Test error:', error);
        setResults({ error: 'Test failed', details: error });
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Testing Supabase Connection...</h1>
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test Results</h1>
      
      {results?.error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {results.error}
          <pre className="mt-2 text-sm">{JSON.stringify(results.details, null, 2)}</pre>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection Test */}
          <div className="bg-green-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">✅ Connection Test</h2>
            <pre className="text-sm">{JSON.stringify(results?.connectionTest, null, 2)}</pre>
          </div>

          {/* Employee Sample */}
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Employee Sample Data</h2>
            <pre className="text-sm overflow-auto max-h-96">{JSON.stringify(results?.employeeSample, null, 2)}</pre>
          </div>

          {/* Department Sample */}
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Department Sample Data</h2>
            <pre className="text-sm overflow-auto max-h-96">{JSON.stringify(results?.departmentSample, null, 2)}</pre>
          </div>

          {/* Foreign Key Test */}
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Foreign Key Relationship Test</h2>
            <pre className="text-sm overflow-auto max-h-96">{JSON.stringify(results?.employeeWithDept, null, 2)}</pre>
          </div>

          {/* Field Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-100 p-4 rounded">
              <h2 className="text-lg font-semibold mb-2">Employee Fields</h2>
              <ul className="text-sm space-y-1">
                {results?.employeeFields?.map((field: string, index: number) => (
                  <li key={index} className="font-mono">{field}</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-100 p-4 rounded">
              <h2 className="text-lg font-semibold mb-2">Department Fields</h2>
              <ul className="text-sm space-y-1">
                {results?.departmentFields?.map((field: string, index: number) => (
                  <li key={index} className="font-mono">{field}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Errors */}
          {(results?.errors?.employee || results?.errors?.department || results?.errors?.relationship) && (
            <div className="bg-yellow-100 p-4 rounded">
              <h2 className="text-lg font-semibold mb-2">⚠️ Errors</h2>
              <pre className="text-sm">{JSON.stringify(results?.errors, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
