const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class SimpleStore {
  constructor() {
    const userDataPath = app.getPath('userData');
    this.storePath = path.join(userDataPath, 'store.json');
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.storePath)) {
        const data = fs.readFileSync(this.storePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading store:', error);
    }
    return {};
  }

  save() {
    try {
      const userDataPath = app.getPath('userData');
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      fs.writeFileSync(this.storePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving store:', error);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  delete(key) {
    delete this.data[key];
    this.save();
  }

  clear() {
    this.data = {};
    this.save();
  }
}

module.exports = SimpleStore;

