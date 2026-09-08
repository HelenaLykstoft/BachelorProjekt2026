const fs = require('fs');
const path = require('path');

const PID_FILE = path.join(__dirname, '..', '.server.pid');

if (!fs.existsSync(PID_FILE)) {
  console.log('No running server found (.server.pid missing).');
  process.exit(0);
}

const pid = Number(fs.readFileSync(PID_FILE, 'utf-8').trim());

try {
  process.kill(pid);
  console.log(`Stopped server (pid ${pid}).`);
} catch (err) {
  if (err.code === 'ESRCH') {
    console.log('Server was not running.');
  } else {
    throw err;
  }
}

fs.unlinkSync(PID_FILE);
