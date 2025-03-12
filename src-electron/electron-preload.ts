import { contextBridge, ipcRenderer } from 'electron';

// 确保在预加载脚本完成初始化之前不会暴露任何API
process.once('loaded', () => {
  // 暴露受保护的方法，允许渲染进程使用ipcRenderer而不暴露整个对象
  contextBridge.exposeInMainWorld('electronAPI', {
    // API调用函数
    fetchRemoteData: async (params) => {
      try {
        return await ipcRenderer.invoke('fetch-remote-data', params);
      } catch (error) {
        console.error('API调用错误:', error);
        throw error;
      }
    },
    
    // 打印机功能
    connectPrinter: async (params) => {
      try {
        return await ipcRenderer.invoke('connect-printer', params);
      } catch (error) {
        console.error('连接打印机错误:', error);
        throw error;
      }
    },
    printDocument: async (params) => {
      try {
        return await ipcRenderer.invoke('print-document', params);
      } catch (error) {
        console.error('打印文档错误:', error);
        throw error;
      }
    },
    searchPrinters: async () => {
      try {
        return await ipcRenderer.invoke('search-printers');
      } catch (error) {
        console.error('搜索打印机错误:', error);
        throw error;
      }
    },
    
    // 自动更新功能
    checkForUpdates: async () => {
      try {
        return await ipcRenderer.invoke('check-for-updates');
      } catch (error) {
        console.error('检查更新错误:', error);
        throw error;
      }
    },
    installUpdate: async () => {
      try {
        return await ipcRenderer.invoke('install-update');
      } catch (error) {
        console.error('安装更新错误:', error);
        throw error;
      }
    },
    
    // 自动更新事件监听器
    onUpdateAvailable: (callback) => {
      const handler = (event, ...args) => callback(...args);
      ipcRenderer.on('update-available', handler);
      return () => ipcRenderer.removeListener('update-available', handler);
    },
    onUpdateDownloaded: (callback) => {
      const handler = (event, ...args) => callback(...args);
      ipcRenderer.on('update-downloaded', handler);
      return () => ipcRenderer.removeListener('update-downloaded', handler);
    },
    onUpdateError: (callback) => {
      const handler = (event, ...args) => callback(...args);
      ipcRenderer.on('update-error', handler);
      return () => ipcRenderer.removeListener('update-error', handler);
    }
  });
});
