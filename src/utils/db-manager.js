import { dbInstance } from 'src/boot/db';

/**
 * Database Manager
 * 
 * A utility class to handle common database operations
 */
class DbManager {
  /**
   * Get all records from a store
   * @param {string} storeName - IndexedDB store name
   * @returns {Promise<Array>} - Array of records
   */
  static async getAll(storeName) {
    if (!dbInstance) throw new Error('Database not initialized');
    
    try {
      return await dbInstance.getAll(storeName);
    } catch (error) {
      console.error(`Error getting all records from ${storeName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get records by index
   * @param {string} storeName - IndexedDB store name
   * @param {string} indexName - Index name
   * @param {any} indexValue - Index value to query
   * @returns {Promise<Array>} - Array of matching records
   */
  static async getByIndex(storeName, indexName, indexValue) {
    if (!dbInstance) throw new Error('Database not initialized');
    
    try {
      return await dbInstance.getAllFromIndex(storeName, indexName, indexValue);
    } catch (error) {
      console.error(`Error getting records by index from ${storeName}:`, error);
      throw error;
    }
  }
  
  /**
   * Add a record to a store
   * @param {string} storeName - IndexedDB store name
   * @param {Object} record - Record to add
   * @returns {Promise<number|string>} - Key of the added record
   */
  static async add(storeName, record) {
    if (!dbInstance) throw new Error('Database not initialized');
    
    try {
      return await dbInstance.add(storeName, record);
    } catch (error) {
      console.error(`Error adding record to ${storeName}:`, error);
      throw error;
    }
  }
  
  /**
   * Update a record in a store
   * @param {string} storeName - IndexedDB store name
   * @param {Object} record - Record to update (must include key)
   * @returns {Promise<number|string>} - Key of the updated record
   */
  static async update(storeName, record) {
    if (!dbInstance) throw new Error('Database not initialized');
    
    try {
      return await dbInstance.put(storeName, record);
    } catch (error) {
      console.error(`Error updating record in ${storeName}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a record from a store
   * @param {string} storeName - IndexedDB store name
   * @param {number|string} key - Key of the record to delete
   * @returns {Promise<void>}
   */
  static async delete(storeName, key) {
    if (!dbInstance) throw new Error('Database not initialized');
    
    try {
      await dbInstance.delete(storeName, key);
    } catch (error) {
      console.error(`Error deleting record from ${storeName}:`, error);
      throw error;
    }
  }
  
  /**
   * Clear all records from a store
   * @param {string} storeName - IndexedDB store name
   * @returns {Promise<void>}
   */
  static async clear(storeName) {
    if (!dbInstance) throw new Error('Database not initialized');
    
    try {
      await dbInstance.clear(storeName);
    } catch (error) {
      console.error(`Error clearing store ${storeName}:`, error);
      throw error;
    }
  }
  
  /**
   * Perform a transaction with multiple operations
   * @param {string|string[]} storeNames - Store name(s) to include in transaction
   * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
   * @param {Function} callback - Function to execute within transaction
   * @returns {Promise<any>} - Result of the transaction
   */
  static async transaction(storeNames, mode, callback) {
    if (!dbInstance) throw new Error('Database not initialized');
    
    try {
      const tx = dbInstance.transaction(storeNames, mode);
      const result = await callback(tx);
      await tx.done;
      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }
  
  /**
   * Export all database data as JSON
   * @returns {Promise<Object>} - Database export object
   */
  static async exportDatabase() {
    if (!dbInstance) throw new Error('Database not initialized');
    
    try {
      const storeNames = Array.from(dbInstance.objectStoreNames);
      const exportData = {};
      
      for (const storeName of storeNames) {
        exportData[storeName] = await dbInstance.getAll(storeName);
      }
      
      return exportData;
    } catch (error) {
      console.error('Error exporting database:', error);
      throw error;
    }
  }
  
  /**
   * Import data into database
   * @param {Object} importData - Data to import
   * @returns {Promise<void>}
   */
  static async importDatabase(importData) {
    if (!dbInstance) throw new Error('Database not initialized');
    
    try {
      const storeNames = Object.keys(importData);
      
      // Use transaction for atomicity
      const tx = dbInstance.transaction(storeNames, 'readwrite');
      
      for (const storeName of storeNames) {
        // Clear store first
        await tx.objectStore(storeName).clear();
        
        // Add all records
        for (const record of importData[storeName]) {
          await tx.objectStore(storeName).add(record);
        }
      }
      
      await tx.done;
    } catch (error) {
      console.error('Error importing database:', error);
      throw error;
    }
  }
}

export default DbManager;
