const { spawn } = require('child_process');
const os = require('os');

// Find active IPv4 address that is not internal and not virtual
function getLocalWifiIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    // Prioritize Wi-Fi or Wireless
    if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless')) {
      for (const net of interfaces[name]) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
          return net.address;
        }
      }
    }
  }

  // Fallback to any non-virtual IPv4
  for (const name of Object.keys(interfaces)) {
    if (!name.toLowerCase().includes('virtual') && !name.toLowerCase().includes('vethernet')) {
      for (const net of interfaces[name]) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
          return net.address;
        }
      }
    }
  }

  return '10.80.241.173'; // Default discovered Wi-Fi IP
}

const wifiIp = getLocalWifiIp();
console.log(`[MiniLedger] Setting Metro Packager IP to: ${wifiIp}`);

// Set environment variable for Expo packager
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = wifiIp;

// Spawn expo start --lan
const child = spawn('npx', ['expo', 'start', '--lan'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
