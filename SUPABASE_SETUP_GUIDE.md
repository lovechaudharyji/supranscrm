# Supabase Setup Guide for Employee Directory & Departments

## Current Issue
The Employee Directory table query is failing with an empty error object `{}`. This typically indicates:
1. RLS (Row Level Security) policies blocking access
2. Missing table permissions
3. Incorrect table name or structure
4. Authentication issues

## Step-by-Step Fix

### 1. Check Table Existence
Go to your Supabase dashboard → Table Editor and verify these tables exist:
- `Employee Directory` (exact name with space)
- `Departments`

### 2. Check RLS Policies
Go to Supabase dashboard → Authentication → Policies:

**For Employee Directory table:**
```sql
-- Create a policy to allow all operations (for testing)
CREATE POLICY "Allow all operations on Employee Directory" 
ON "Employee Directory" 
FOR ALL 
USING (true) 
WITH CHECK (true);
```

**For Departments table:**
```sql
-- Create a policy to allow all operations (for testing)
CREATE POLICY "Allow all operations on Departments" 
ON "Departments" 
FOR ALL 
USING (true) 
WITH CHECK (true);
```

### 3. Check Table Permissions
Go to Supabase dashboard → Settings → API → Project Settings:
- Ensure "Enable RLS" is either disabled OR proper policies are set
- Check if your API key has the right permissions

### 4. Verify Table Structure

**Employee Directory table should have:**
- `whalesync_postgres_id` (UUID, Primary Key)
- `full_name` (Text)
- `official_email` (Text)
- `department` (UUID, Foreign Key to Departments)
- Other employee fields...

**Departments table should have:**
- `whalesync_postgres_id` (UUID, Primary Key)
- `department_name` (Text)
- `display_name` (Text)
- `headcount` (Integer)
- Other department fields...

### 5. Test with SQL Editor
Go to Supabase dashboard → SQL Editor and run:

```sql
-- Test basic query
SELECT * FROM "Employee Directory" LIMIT 5;

-- Test departments query
SELECT * FROM "Departments" LIMIT 5;

-- Test foreign key relationship
SELECT 
  e.whalesync_postgres_id,
  e.full_name,
  e.department,
  d.department_name,
  d.display_name
FROM "Employee Directory" e
LEFT JOIN "Departments" d ON e.department = d.whalesync_postgres_id
LIMIT 5;
```

### 6. Check Authentication
Ensure your Supabase client is properly configured with:
- Correct project URL
- Correct anon key
- Proper authentication (if required)

### 7. Alternative Table Names
If the exact table name doesn't work, try these variations:
- `employee_directory` (snake_case)
- `EmployeeDirectory` (camelCase)
- `employees` (simple name)

## Quick Fix Commands

### Disable RLS (Temporary)
```sql
ALTER TABLE "Employee Directory" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Departments" DISABLE ROW LEVEL SECURITY;
```

### Enable RLS with Open Policy
```sql
ALTER TABLE "Employee Directory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Departments" ENABLE ROW LEVEL SECURITY;

-- Create open policies
CREATE POLICY "Open access" ON "Employee Directory" FOR ALL USING (true);
CREATE POLICY "Open access" ON "Departments" FOR ALL USING (true);
```

## Debug Steps

1. **Check Console Logs**: Look for detailed error information
2. **Test Connection**: Use the test page at `/test-supabase-connection`
3. **Verify Data**: Ensure tables have data
4. **Check Permissions**: Verify API key permissions
5. **Test Queries**: Use SQL Editor to test queries directly

## Common Solutions

### If "relation does not exist" error:
- Check table name spelling
- Ensure tables are created
- Check if you're in the right schema

### If "permission denied" error:
- Check RLS policies
- Verify API key permissions
- Disable RLS temporarily

### If "invalid input syntax" error:
- Check data types
- Verify foreign key relationships
- Check for null values

## Next Steps

1. Run the SQL commands above
2. Test the connection using the test page
3. Check console logs for detailed error information
4. Update the application code based on the actual error details
