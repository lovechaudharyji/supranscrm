# Auto-Assignment Configuration

This page allows administrators to configure automatic lead assignment rules based on services. It uses Supabase instead of Airtable.

## Features

1. **Service Mapping**: Configure which employees should receive leads for each service
2. **Round-Robin Assignment**: Automatically distribute leads evenly among selected employees
3. **Daily Configuration**: Save and manage configurations on a daily basis
4. **Bulk Assignment**: Process all unassigned leads with one click

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the `crm8` directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://grjaqvdoxqendrzzgyjk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyamFxdmRveHFlbmRyenpneWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5Mzk3ODIsImV4cCI6MjA3MzUxNTc4Mn0.-pCRYyL6FCPZUEQEhf_0DQY5P3RsDOJAWuUCL_6okaA
```

### 2. Database Schema

The page expects the following Supabase tables and columns:

#### Leads Table
- `whalesync_postgres_id` (uuid) - Primary key
- `services` (text) - Service type for the lead
- `assigned_to` (uuid) - Foreign key to Employee Directory
- Other fields as per your schema

#### Employee Directory Table
- `whalesync_postgres_id` (uuid) - Primary key
- `full_name` (text) - Employee's full name
- `job_title` (text) - Employee's job title (must contain "Sales" to appear in auto-assignment)
- `status` (text) - Employee status (should be "Active" for available employees)
- Other fields as per your schema

### 3. Row Level Security (RLS)

Make sure your Supabase tables have appropriate RLS policies:

```sql
-- Allow reading leads
CREATE POLICY "Allow read leads" ON "Leads"
FOR SELECT USING (true);

-- Allow updating leads assignment
CREATE POLICY "Allow update leads assignment" ON "Leads"
FOR UPDATE USING (true);

-- Allow reading employees
CREATE POLICY "Allow read employees" ON "Employee Directory"
FOR SELECT USING (true);
```

## How to Use

### Step 1: Configure Service Assignments

1. Navigate to `/dashboard/admin/auto-assignment`
2. For each service, check the boxes next to employees who should handle leads for that service
3. You can select multiple employees per service (they'll receive leads in round-robin fashion)
4. Click "Save Today's Configuration" to save your settings

### Step 2: Run Auto-Assignment

1. After saving your configuration, click "Run Auto-Assignment"
2. The system will:
   - Find all leads without an assigned employee
   - Match them to services
   - Assign them to employees based on your configuration
   - Distribute leads evenly using round-robin

### Step 3: Monitor Results

- The page will show a success message with the number of leads assigned
- You can view assigned leads in the main Leads page

## How It Works

### Service Mapping

The configuration is stored in browser localStorage with the key format:
```
service_mapping_YYYY-MM-DD
```

This allows different configurations for different days.

### Round-Robin Algorithm

When you run auto-assignment:
1. System fetches all unassigned leads
2. For each lead, it identifies the service
3. It looks up which employees handle that service (from your config)
4. It assigns the lead to the next employee in rotation
5. Counter increments to ensure even distribution

### Example

If you have 10 leads for "Web Development" and assigned 3 employees (Alice, Bob, Carol):
- Lead 1 → Alice
- Lead 2 → Bob
- Lead 3 → Carol
- Lead 4 → Alice
- Lead 5 → Bob
- And so on...

## Differences from Airtable Version

| Feature | Airtable | Supabase |
|---------|----------|----------|
| API Calls | REST API with pagination | Supabase client with automatic pagination |
| Column Names | PascalCase (e.g., "Full Name") | snake_case (e.g., "full_name") |
| Record IDs | Airtable Record ID | whalesync_postgres_id (UUID) |
| Views | Uses "Sales Team" view | Filters by status = "Active" AND job_title contains "Sales" |
| Batch Updates | 10 records per request | Sequential updates (can be optimized) |
| Error Handling | HTTP status codes | Supabase error objects |

## Troubleshooting

### No Services Showing
- Check that your Leads table has records with non-null `services` field
- Verify table name is exactly "Leads" (case-sensitive)

### No Employees Showing
- Check that Employee Directory has records with `status` = "Active"
- Verify employees have `job_title` field containing "Sales" (e.g., "Sales Executive", "Sales Manager", "Sales Representative")
- Verify table name is exactly "Employee Directory" (case-sensitive)

### Assignment Not Working
- Ensure you've saved the configuration before running assignment
- Check that leads have null or empty `assigned_to` field
- Verify RLS policies allow updates

### Performance Issues
- If you have thousands of leads, consider adding pagination
- Batch update logic can be optimized with Supabase's bulk operations

## Future Enhancements

- Add assignment history tracking
- Support for multiple services per lead
- Email notifications when leads are assigned
- Analytics dashboard for assignment metrics
- Custom assignment rules (beyond round-robin)
- Ability to reassign leads

## Support

For issues or questions, contact your development team or refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

