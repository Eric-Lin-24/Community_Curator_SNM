// Simple test to check if electron loads
console.log('Loading electron...');
const electron = require('electron');
console.log('Electron loaded:', typeof electron);
console.log('Electron.app:', typeof electron.app);

const { app } = electron;
console.log('App destructured:', typeof app);

if (app) {
  console.log('App is available!');
  app.disableHardwareAcceleration();
  console.log('Called disableHardwareAcceleration successfully');
} else {
  console.log('ERROR: App is undefined!');
}
