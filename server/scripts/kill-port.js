const { exec } = require('child_process');
const os = require('os');

const PORT = process.argv[2] || 5002;

function killPort(port) {
  const platform = os.platform();
  
  if (platform === 'win32') {
    // Windows command
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error) {
        console.log(`No process found on port ${port}`);
        return;
      }
      
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          pids.add(parts[4]);
        }
      });
      
      if (pids.size === 0) {
        console.log(`No process found on port ${port}`);
        return;
      }
      
      pids.forEach(pid => {
        exec(`taskkill /PID ${pid} /F`, (killError) => {
          if (killError) {
            console.log(`Failed to kill process ${pid}: ${killError.message}`);
          } else {
            console.log(`Killed process ${pid} on port ${port}`);
          }
        });
      });
    });
  } else {
    // Unix/Linux/Mac command
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (error) {
        console.log(`No process found on port ${port}`);
        return;
      }
      
      const pids = stdout.trim().split('\n').filter(pid => pid);
      
      if (pids.length === 0) {
        console.log(`No process found on port ${port}`);
        return;
      }
      
      pids.forEach(pid => {
        exec(`kill -9 ${pid}`, (killError) => {
          if (killError) {
            console.log(`Failed to kill process ${pid}: ${killError.message}`);
          } else {
            console.log(`Killed process ${pid} on port ${port}`);
          }
        });
      });
    });
  }
}

console.log(`Killing processes on port ${PORT}...`);
killPort(PORT);

// Exit after a short delay to allow processes to be killed
setTimeout(() => {
  console.log(`Port ${PORT} cleanup completed`);
  process.exit(0);
}, 2000);