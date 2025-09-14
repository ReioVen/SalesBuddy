#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

console.log('🌱 Starting translation seeder...');

// Run the seeder script
const seederProcess = spawn('node', [path.join(__dirname, 'seedTranslations.js')], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

seederProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Translation seeder completed successfully!');
  } else {
    console.error('❌ Translation seeder failed with code:', code);
  }
});

seederProcess.on('error', (error) => {
  console.error('❌ Error running translation seeder:', error);
});
