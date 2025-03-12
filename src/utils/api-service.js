import { api } from 'src/boot/axios';
import { dbInstance } from 'src/boot/db';

/**
 * API Service
 * 
 * Utility for making API requests with caching capability
 */
class ApiService {
  /**
   * Make an API request
   * @param {Object} config - Request config
   * @param {string} config.url - Request URL
   * @param {string} config.method - HTTP method (GET, POST, etc.)
   * @param {Object} config.data - Request data
   * @param {Object} config.headers - Request headers
   * @param {boolean} config.useCache - Whether to use cache
   * @param {number} config.cacheDuration - Cache duration in minutes
   * @returns {Promise<Object>} - Response data
   */
  static async request(config) {
    const {
      url,
      method = 'GET',
      data = null,
      headers = {},
      useCache = true,
      cacheDuration = 60
    } = config;
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(method, url, data);
    
    // Try to get from cache if using GET and cache is enabled
    if (method === 'GET' && useCache && dbInstance) {
      try {
        const cachedResponse = await dbInstance.get('apiCache', cacheKey);
        
        if (cachedResponse) {
          const now = Date.now();
          const maxAge = cacheDuration * 60 * 1000; // Convert minutes to milliseconds
          
          // Check if cache is still valid
          if (now - cachedResponse.timestamp < maxAge) {
            console.log('Using cached response for:', url);
            return { 
              data: cachedResponse.data,
              fromCache: true,
              timestamp: cachedResponse.timestamp
            };
          }
        }
      } catch (error) {
        console.warn('Failed to get from cache:', error);
      }
    }
    
    // Make request via Electron main process or directly with axios
    try {
      let response;
      
      if (process.env.MODE === 'electron') {
        // Make request via Electron IPC
        response = await window.electronAPI.fetchRemoteData({
          url,
          method,
          data,
          headers
        });
        
        if (!response.success) {
          throw new Error(response.error);
        }
        
        response = response.data;
      } else {
        // Make request directly with axios
        const axiosResponse = await api.request({
          url,
          method,
          data,
          headers
        });
        
        response = axiosResponse.data;
      }
      
      // Cache the response for GET requests
      if (method === 'GET' && useCache && dbInstance) {
        try {
          const timestamp = Date.now();
          
          await dbInstance.put('apiCache', {
            id: cacheKey,
            url,
            method,
            data: response,
            timestamp
          });
        } catch (error) {
          console.warn('Failed to cache response:', error);
        }
      }
      
      return { 
        data: response,
        fromCache: false,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  /**
   * GET request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  static async get(url, options = {}) {
    return this.request({
      url,
      method: 'GET',
      ...options
    });
  }
  
  /**
   * POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  static async post(url, data, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    });
  }
  
  /**
   * PUT request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  static async put(url, data, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    });
  }
  
  /**
   * DELETE request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  static async delete(url, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      ...options
    });
  }
  
  /**
   * Clear API cache
   * @param {string} url - Optional URL to clear specific cache
   * @returns {Promise<void>}
   */
  static async clearCache(url = null) {
    if (!dbInstance) return;
    
    try {
      if (url) {
        // Delete specific cache entries for this URL
        const allCache = await dbInstance.getAllFromIndex('apiCache', 'timestamp');
        const keysToDelete = allCache
          .filter(cache => cache.url === url)
          .map(cache => cache.id);
        
        const tx = dbInstance.transaction('apiCache', 'readwrite');
        await Promise.all(keysToDelete.map(key => tx.store.delete(key)));
        await tx.done;
      } else {
        // Clear entire cache
        await dbInstance.clear('apiCache');
      }
    } catch (error) {
      console.error('Failed to clear API cache:', error);
      throw error;
    }
  }
  
  /**
   * Generate a cache key for a request
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @returns {string} - Cache key
   */
  static generateCacheKey(method, url, data) {
    // Convert data to string, handling circular references
    let dataStr = '';
    if (data) {
      try {
        dataStr = JSON.stringify(data);
      } catch (error) {
        console.warn('Failed to stringify data for cache key:', error);
        dataStr = String(Date.now()); // Fallback to timestamp
      }
    }
    
    return `${method}-${url}-${dataStr}`;
  }
}

export default ApiService;
