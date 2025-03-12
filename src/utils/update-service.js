/**
 * Update Service
 * 
 * Utility for managing Electron auto-updates
 */

/**
 * 检查更新
 * @returns {Promise<Object>} - 更新检查结果
 */
export async function checkForUpdates() {
  // 仅在Electron模式下可用
  if (process.env.MODE !== 'electron') {
    return { available: false, message: '更新功能仅在桌面应用中可用' };
  }
  
  try {
    // 调用Electron的检查更新方法
    const result = await window.electronAPI.checkForUpdates();
    return result;
  } catch (error) {
    console.error('检查更新时出错:', error);
    return { available: false, error: error.message };
  }
}

/**
 * 安装可用的更新
 * @returns {Promise<Object>} - 安装结果
 */
export async function installUpdate() {
  // 仅在Electron模式下可用
  if (process.env.MODE !== 'electron') {
    return { success: false, message: '更新功能仅在桌面应用中可用' };
  }
  
  try {
    // 调用Electron的安装更新方法
    const result = await window.electronAPI.installUpdate();
    return result;
  } catch (error) {
    console.error('安装更新时出错:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 注册更新事件监听器
 * @param {Function} onUpdateAvailable - 更新可用时的回调
 * @param {Function} onUpdateDownloaded - 更新下载完成时的回调
 * @param {Function} onUpdateError - 更新错误时的回调
 * @returns {Object} - 注销函数
 */
export function registerUpdateListeners(onUpdateAvailable, onUpdateDownloaded, onUpdateError) {
  // 仅在Electron模式下可用
  if (process.env.MODE !== 'electron') {
    return { unregisterAll: () => {} };
  }
  
  const unregisterUpdateAvailable = onUpdateAvailable 
    ? window.electronAPI.onUpdateAvailable(onUpdateAvailable)
    : () => {};
    
  const unregisterUpdateDownloaded = onUpdateDownloaded
    ? window.electronAPI.onUpdateDownloaded(onUpdateDownloaded)
    : () => {};
    
  const unregisterUpdateError = onUpdateError
    ? window.electronAPI.onUpdateError(onUpdateError)
    : () => {};
  
  return {
    unregisterUpdateAvailable,
    unregisterUpdateDownloaded,
    unregisterUpdateError,
    unregisterAll: () => {
      unregisterUpdateAvailable();
      unregisterUpdateDownloaded();
      unregisterUpdateError();
    }
  };
}

export default {
  checkForUpdates,
  installUpdate,
  registerUpdateListeners
};
