/**
 * Printer Utilities
 * 
 * Helper functions for printer-related operations
 */

/**
 * 检测当前环境
 * @returns {string} - 环境类型 'electron', 'capacitor', 或 'web'
 */
function detectEnvironment() {
  if (process.env.MODE === 'electron') {
    return 'electron';
  } else if (process.env.MODE === 'capacitor') {
    return 'capacitor';
  } else {
    return 'web';
  }
}

/**
 * Connect to a printer
 * @param {string} printerName - Name of the printer to connect to
 * @returns {Promise<Object>} - Connection result
 */
export async function connectPrinter(printerName) {
  try {
    const env = detectEnvironment();
    
    if (env === 'electron') {
      // In Electron mode, use the main process
      return await window.electronAPI.connectPrinter({ printerName });
    } else if (env === 'capacitor') {
      // Simulate printer connection for Capacitor environment
      await new Promise(resolve => setTimeout(resolve, 800));
      return { 
        success: true, 
        message: `Simulated Android environment connection to printer: ${printerName}` 
      };
    } else {
      // Simulate printer connection for non-electron environments
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { 
        success: true, 
        message: `Simulated connection to printer: ${printerName}` 
      };
    }
  } catch (error) {
    console.error('Printer connection error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Print a document to a printer
 * @param {string} printerName - Name of the printer to use
 * @param {string|Object} content - Content to print
 * @param {Object} options - Printing options
 * @returns {Promise<Object>} - Print result
 */
export async function printDocument(printerName, content, options = {}) {
  try {
    // Format content for printing
    const documentContent = typeof content === 'object' 
      ? JSON.stringify(content) 
      : String(content);
    
    const env = detectEnvironment();
    
    if (env === 'electron') {
      // In Electron mode, use the main process
      return await window.electronAPI.printDocument({ 
        printerName, 
        documentContent,
        options
      });
    } else if (env === 'capacitor') {
      // Simulate printing for Capacitor environment
      // Consider using native printing plugin if available
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a print job record and save to database
      if (window.dbInstance) {
        try {
          await window.dbInstance.add('printJobs', {
            printerName,
            content: documentContent.substring(0, 100) + (documentContent.length > 100 ? '...' : ''),
            status: 'completed',
            createdAt: new Date()
          });
        } catch (e) {
          console.warn('Failed to save print record to database:', e);
        }
      }
      
      return { 
        success: true, 
        message: `Android environment simulated print successful: ${printerName}` 
      };
    } else {
      // Simulate printing for non-electron environments
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { 
        success: true, 
        message: `Simulated print successful: ${printerName}` 
      };
    }
  } catch (error) {
    console.error('Print document error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format content for printing
 * @param {Object} data - Data to format
 * @param {string} template - Template name to use
 * @returns {string} - Formatted content
 */
export function formatPrintContent(data, template = 'default') {
  try {
    switch (template) {
      case 'receipt':
        return formatReceiptTemplate(data);
      case 'report':
        return formatReportTemplate(data);
      case 'default':
      default:
        return formatDefaultTemplate(data);
    }
  } catch (error) {
    console.error('Error formatting print content:', error);
    return JSON.stringify(data, null, 2);
  }
}

/**
 * Format data using the default template
 * @param {Object} data - Data to format
 * @returns {string} - Formatted content
 */
function formatDefaultTemplate(data) {
  if (!data) return '';
  
  let output = '';
  
  // Add title if present
  if (data.title) {
    output += `${data.title}\n`;
    output += '='.repeat(data.title.length) + '\n\n';
  }
  
  // Add content
  if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'title') {
        output += `${key}: ${value}\n`;
      }
    }
  } else {
    output += data;
  }
  
  return output;
}

/**
 * Format data using the receipt template
 * @param {Object} data - Receipt data
 * @returns {string} - Formatted receipt
 */
function formatReceiptTemplate(data) {
  if (!data) return '';
  
  let output = '';
  
  // Header
  output += `${data.businessName || 'Business'}\n`;
  output += `${data.address || ''}\n`;
  output += `${data.phone || ''}\n`;
  output += `${data.date || new Date().toLocaleString()}\n`;
  output += '-'.repeat(32) + '\n\n';
  
  // Items
  if (data.items && Array.isArray(data.items)) {
    output += 'Item               Qty    Price\n';
    output += '-'.repeat(32) + '\n';
    
    for (const item of data.items) {
      const name = item.name.padEnd(18).substring(0, 18);
      const qty = String(item.quantity).padStart(3);
      const price = String(item.price.toFixed(2)).padStart(8);
      
      output += `${name} ${qty}  ${price}\n`;
    }
    
    output += '-'.repeat(32) + '\n';
  }
  
  // Summary
  if (data.subtotal) output += `Subtotal:         ${data.subtotal.toFixed(2)}\n`;
  if (data.tax) output += `Tax:              ${data.tax.toFixed(2)}\n`;
  if (data.total) output += `Total:            ${data.total.toFixed(2)}\n`;
  
  // Footer
  output += '\n';
  output += `${data.footerText || 'Thank you for your business!'}\n`;
  
  return output;
}

/**
 * Format data using the report template
 * @param {Object} data - Report data
 * @returns {string} - Formatted report
 */
function formatReportTemplate(data) {
  if (!data) return '';
  
  let output = '';
  
  // Header
  output += `${data.title || 'Report'}\n`;
  output += '='.repeat(32) + '\n';
  output += `Date: ${data.date || new Date().toLocaleDateString()}\n`;
  if (data.author) output += `Author: ${data.author}\n`;
  output += '\n';
  
  // Sections
  if (data.sections && Array.isArray(data.sections)) {
    for (const section of data.sections) {
      output += `${section.title}\n`;
      output += '-'.repeat(section.title.length) + '\n';
      output += `${section.content}\n\n`;
    }
  }
  
  // Summary
  if (data.summary) {
    output += 'Summary\n';
    output += '-------\n';
    output += data.summary + '\n';
  }
  
  return output;
}

export default {
  connectPrinter,
  printDocument,
  formatPrintContent
};
