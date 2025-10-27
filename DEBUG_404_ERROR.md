# Debug 404 Error - Step by Step Solution

## Current Issue
Getting 404 error when trying to access pages. This is likely due to:
1. Development server not running properly
2. Build cache issues
3. File permission problems
4. Next.js configuration issues

## Step-by-Step Fix

### 1. Stop All Running Processes
```bash
# Press Ctrl+C in any running terminal
# Or kill all Node processes
taskkill /f /im node.exe
```

### 2. Clear All Caches
```bash
# Delete build cache
rmdir /s /q .next

# Delete node_modules and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
```

### 3. Check File Permissions
- Right-click on the project folder
- Properties → Security → Advanced
- Ensure your user has "Full Control"
- Apply to all subfolders

### 4. Restart Development Server
```bash
npm run dev
```

### 5. Test Pages
Try accessing these URLs:
- `http://localhost:3000/simple-test` (should show "Simple Test Page")
- `http://localhost:3000/test-supabase-connection` (diagnostic page)
- `http://localhost:3000/dashboard/employees` (main employees page)

### 6. If Still Getting 404

#### Option A: Use Different Port
```bash
npm run dev -- --port 3001
```
Then try: `http://localhost:3001/dashboard/employees`

#### Option B: Check Next.js Configuration
Create/update `next.config.ts`:
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
}

export default nextConfig
```

#### Option C: Disable Turbopack
```bash
npm run dev -- --no-turbo
```

### 7. Alternative: Use Production Build
```bash
npm run build
npm start
```

## Quick Test Commands

### Test if server is running:
```bash
curl http://localhost:3000/simple-test
```

### Check if port is in use:
```bash
netstat -ano | findstr :3000
```

### Kill process on port 3000:
```bash
taskkill /PID <PID_NUMBER> /F
```

## Expected Results

After following these steps:
1. ✅ `http://localhost:3000/simple-test` should show "Simple Test Page"
2. ✅ `http://localhost:3000/test-supabase-connection` should show diagnostic interface
3. ✅ `http://localhost:3000/dashboard/employees` should show employees page (even if with errors)

## If All Else Fails

1. **Restart your computer** (clears all file locks)
2. **Run as Administrator** (fixes permission issues)
3. **Use a different port** (avoids port conflicts)
4. **Check antivirus software** (might be blocking file access)

## Next Steps

Once the 404 error is resolved:
1. Check the console logs for Supabase connection errors
2. Use the diagnostic page to identify database issues
3. Follow the Supabase setup guide to fix database problems
