const { exec } = require('child_process');
const os = require('os');

const PORT = process.argv[2] || 5002;

function killAllNodeProcesses() {
  const platform = os.platform();
  
  if (platform === 'win32') {
    // Windows - kill all node processes
    console.log('🔪 Killing all Node.js processes...');
    
    exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout) => {
      if (error) {
        console.log('No Node.js processes found');
        return;
      }
      
      const lines = stdout.split('\n');
      const pids = [];
      
      lines.forEach(line => {
        if (line.includes('node.exe')) {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const pid = parts[1].replace(/"/g, '').trim();
            if (pid && pid !== 'PID') {
              pids.push(pid);
            }
          }
        }
      });
      
      if (pids.length === 0) {
        console.log('No Node.js processes found');
        return;
      }
      
      console.log(`Found ${pids.length} Node.js processes:`, pids);
      
      pids.forEach(pid => {
        exec(`taskkill /PID ${pid} /F`, (killError) => {
          if (killError) {
            console.log(`Failed to kill process ${pid}: ${killError.message}`);
          } else {
            console.log(`✅ Killed Node.js process ${pid}`);
          }
        });
      });
    });
    
    // Also kill processes on specific port
    console.log(`🔪 Killing processes on port ${PORT}...`);
    exec(`netstat -ano | findstr :${PORT}`, (error, stdout) => {
      if (error) {
        console.log(`No processes found on port ${PORT}`);
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
        console.log(`No processes found on port ${PORT}`);
        return;
      }
      
      pids.forEach(pid => {
        exec(`taskkill /PID ${pid} /F`, (killError) => {
          if (killError) {
            console.log(`Failed to kill process ${pid}: ${killError.message}`);
          } else {
            console.log(`✅ Killed process ${pid} on port ${PORT}`);
          }
        });
      });
    });
    
  } else {
    // Unix/Linux/Mac
    console.log('🔪 Killing all Node.js processes...');
    exec('pkill -f node', (error) => {
      if (error) {
        console.log('No Node.js processes found or failed to kill');
      } else {
        console.log('✅ Killed all Node.js processes');
      }
    });
  }
}

console.log('🚨 KILLING ALL NODE.JS PROCESSES...');
killAllNodeProcesses();
