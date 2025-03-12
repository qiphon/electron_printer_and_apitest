import { boot } from 'quasar/wrappers'
import { openDB } from 'idb'

// Initialize IndexedDB database
const initDatabase = async () => {
  const db = await openDB('electronQuasarDB', 1, {
    upgrade(db) {
      // Create stores for our application
      if (!db.objectStoreNames.contains('settings')) {
        const settingsStore = db.createObjectStore('settings', { keyPath: 'id' })
        settingsStore.createIndex('name', 'name', { unique: true })
      }

      if (!db.objectStoreNames.contains('printJobs')) {
        const printJobsStore = db.createObjectStore('printJobs', {
          keyPath: 'id',
          autoIncrement: true,
        })
        printJobsStore.createIndex('status', 'status')
        printJobsStore.createIndex('createdAt', 'createdAt')
      }

      if (!db.objectStoreNames.contains('apiCache')) {
        const apiCacheStore = db.createObjectStore('apiCache', {
          keyPath: 'id',
        })
        apiCacheStore.createIndex('timestamp', 'timestamp')
      }
    },
  })

  return db
}

// Export database for use in the app
let dbInstance = null

export default boot(async ({ app }) => {
  // Initialize the database
  dbInstance = await initDatabase()

  // Make database available via injection
  app.config.globalProperties.$db = dbInstance
})

export { dbInstance }
