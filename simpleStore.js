// simpleStore.js - Simple key-value store for Electron
// Used to persist authentication tokens and user data

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class SimpleStore {
  constructor() {
    // Get the user data path from Electron
    const userDataPath = app.getPath('userData');
    this.filePath = path.join(userDataPath, 'community-curator-store.json');
    this.data = {};

    // Load existing data
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileData = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(fileData);
        console.log('Store loaded successfully');
      } else {
        console.log('No existing store found, starting fresh');
        this.data = {};
      }
    } catch (error) {
      console.error('Error loading store:', error);
      this.data = {};
    }
  }

  save() {
    try {
      const jsonData = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(this.filePath, jsonData, 'utf8');
      console.log('Store saved successfully');
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

  has(key) {
    return key in this.data;
  }

  getAll() {
    return { ...this.data };
  }
}

module.exports = SimpleStore;

