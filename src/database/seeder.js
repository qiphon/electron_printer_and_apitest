/**
 * Database Seeder Script
 * 
 * This script populates the IndexedDB database with initial data
 * Run with: npm run db:seed
 */

import { openDB } from 'idb';

// Initial data to populate the database
const seedData = {
  settings: [
    {
      id: 'app-settings',
      name: 'Application Settings',
      value: {
        theme: 'auto',
        density: 'comfortable',
        defaultPrinter: 'Default Printer',
        paperSize: 'A4',
        duplex: false,
        apiEndpoint: 'https://jsonplaceholder.typicode.com',
        cacheDuration: 60,
        useCache: true
      }
    },
    {
      id: 'printer-settings',
      name: 'Printer Settings',
      value: {
        defaultMargins: { top: 10, right: 10, bottom: 10, left: 10 },
        defaultOrientation: 'portrait',
        defaultQuality: 'normal'
      }
    }
  ],
  apiCache: [
    {
      id: 'GET-https://jsonplaceholder.typicode.com/users-',
      url: 'https://jsonplaceholder.typicode.com/users',
      method: 'GET',
      data: [
        {
          id: 1,
          name: 'Leanne Graham',
          username: 'Bret',
          email: 'Sincere@april.biz'
        },
        {
          id: 2,
          name: 'Ervin Howell',
          username: 'Antonette',
          email: 'Shanna@melissa.tv'
        }
      ],
      timestamp: Date.now()
    }
  ],
  printJobs: [
    {
      id: 1,
      printerName: 'Default Printer',
      content: '测试打印内容 1',
      status: 'completed',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      id: 2,
      printerName: 'PDF Printer',
      content: '测试打印内容 2',
      status: 'completed',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
    },
    {
      id: 3,
      printerName: 'Default Printer',
      content: '测试打印内容 3',
      status: 'failed',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    }
  ]
};

async function seedDatabase() {
  console.log('Seeding database...');
  
  try {
    // Open database
    const db = await openDB('electronQuasarDB', 1, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
          settingsStore.createIndex('name', 'name', { unique: true });
        }
        
        if (!db.objectStoreNames.contains('printJobs')) {
          const printJobsStore = db.createObjectStore('printJobs', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          printJobsStore.createIndex('status', 'status');
          printJobsStore.createIndex('createdAt', 'createdAt');
        }
        
        if (!db.objectStoreNames.contains('apiCache')) {
          const apiCacheStore = db.createObjectStore('apiCache', { 
            keyPath: 'id'
          });
          apiCacheStore.createIndex('timestamp', 'timestamp');
        }
      }
    });
    
    // Clear existing data (optional)
    const clearExisting = true;
    if (clearExisting) {
      console.log('Clearing existing data...');
      const tx = db.transaction(['settings', 'apiCache', 'printJobs'], 'readwrite');
      await Promise.all([
        tx.objectStore('settings').clear(),
        tx.objectStore('apiCache').clear(),
        tx.objectStore('printJobs').clear()
      ]);
      await tx.done;
    }
    
    // Add settings data
    console.log('Adding settings data...');
    const settingsTx = db.transaction('settings', 'readwrite');
    await Promise.all(
      seedData.settings.map(setting => settingsTx.store.add(setting))
    );
    await settingsTx.done;
    
    // Add API cache data
    console.log('Adding API cache data...');
    const apiCacheTx = db.transaction('apiCache', 'readwrite');
    await Promise.all(
      seedData.apiCache.map(cache => apiCacheTx.store.add(cache))
    );
    await apiCacheTx.done;
    
    // Add print jobs data
    console.log('Adding print jobs data...');
    const printJobsTx = db.transaction('printJobs', 'readwrite');
    await Promise.all(
      seedData.printJobs.map(job => printJobsTx.store.add(job))
    );
    await printJobsTx.done;
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seeder
seedDatabase();
