# Server Restart Guide

## Problem
The backend server sometimes doesn't properly restart when changes are made, leading to "Port 5002 is already in use" errors.

## Solutions

### 1. Quick Fix - Use the restart script
```bash
npm run restart
```
This will kill any processes on port 5002 and start the server fresh.

### 2. Clean Start
```bash
npm run clean-start
```
Same as restart, but with a cleaner approach.

### 3. Manual Port Kill
If the above doesn't work:
```bash
# Kill port 5002 specifically
npm run kill-port

# Or kill all Node processes
npm run kill-all

# Then start the server
npm run dev
```

### 4. Windows Specific Commands
If you're on Windows and having issues:
```cmd
# Find process using port 5002
netstat -ano | findstr :5002

# Kill the process (replace <PID> with actual PID)
taskkill /PID <PID> /F
```

### 5. Development Mode Improvements
- The server now automatically kills existing processes before starting
- Nodemon has been configured with better restart handling
- Graceful shutdown is more aggressive in development mode

## What Was Fixed

1. **Automatic Port Cleanup**: The `dev` script now automatically kills existing processes before starting
2. **Better Nodemon Config**: Improved signal handling and timeout settings
3. **Enhanced Graceful Shutdown**: More aggressive shutdown in development mode
4. **Kill Scripts**: Improved port killing scripts with better error handling

## Usage

Just run:
```bash
npm run dev
```

The server will now automatically handle port conflicts and restart properly when you make changes to the code.
