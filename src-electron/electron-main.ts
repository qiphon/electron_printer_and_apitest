import { app, BrowserWindow, ipcMain, webContents } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import axios from 'axios'
import { Bonjour, Browser } from 'bonjour-service'
import { checkAsarUpdate } from './utils/checkAsarUpdate'
const Logger = require('./logger')

// Needed for autoUpdater
if (process.env.PROD) {
  global.__statics = path.join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

// Keep a global reference of the window object to avoid garbage collection
let mainWindow: BrowserWindow | null

// Define constants for application
const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../public')

function createWindow() {
  app
    .getGPUInfo('complete')
    .then(info => {
      Logger.info('gpuInfo')
      Logger.info(info?.gpuDevice)
      // if (info?.gpuDevice?.length === 1 && info.gpuDevice[0].active === false) {
      //   Logger.info('gpu is unusable')
        app.commandLine.appendSwitch('no-sandbox')
        app.commandLine.appendSwitch('disable-gpu')
        app.commandLine.appendSwitch('disable-software-rasterizer')
        app.commandLine.appendSwitch('disable-gpu-compositing')
        app.commandLine.appendSwitch('disable-gpu-rasterization')
        app.commandLine.appendSwitch('disable-gpu-sandbox')
        app.commandLine.appendSwitch('--no-sandbox')
        app.disableHardwareAcceleration()
      // }
      mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        minWidth: 800,
        minHeight: 600,
        useContentSize: true,
        webPreferences: {
          contextIsolation: true,
          preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
        },
      })

      mainWindow.loadURL(process.env.APP_URL)

      mainWindow.on('closed', () => {
        mainWindow = null
      })
    })
    .catch(err => {
      Logger.error('getGPUInfo error')
      Logger.error(err)
    })

  // Setup auto updater events
}

ipcMain.handle('check-hot-update', (ev, param) => {
  return checkAsarUpdate(mainWindow, mainWindow, param)
})

ipcMain.handle('open-dev-tools', (ev, param) => {
  Logger.info('open dev tool handle')
  Logger.info(mainWindow)
  Logger.info('webContents' in mainWindow)
  Logger.info('openDevTools' in mainWindow?.webContents)
  mainWindow?.webContents.openDevTools()

  // mainWindow?.webContents.openDevTools()
})
// IPC handlers for remote API calls
ipcMain.handle('fetch-remote-data', async (event, { url, method, data, headers }) => {
  try {
    const response = await axios({
      url,
      method: method || 'GET',
      data,
      headers,
    })
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 连接打印机
ipcMain.handle('connect-printer', async (event, { printerName }) => {
  try {
    const printers = await mainWindow?.webContents.getPrinters()
    const printer = printers?.find(p => p.name === printerName)

    if (!printer) {
      throw new Error('找不到指定的打印机')
    }

    return { success: true, printer }
  } catch (error) {
    console.error('连接打印机失败:', error)
    return { success: false, error: error.message }
  }
})

// 打印文档
ipcMain.handle('print-document', async (event, { printerName, documentContent }) => {
  try {
    if (!mainWindow) {
      throw new Error('主窗口未初始化')
    }

    // 创建隐藏的打印窗口
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
      },
    })

    // 加载打印内容
    await printWindow.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(`
      <html>
        <body>
          <div style="white-space: pre-wrap;">${documentContent}</div>
        </body>
      </html>
    `),
    )

    // 打印设置
    const printOptions = {
      silent: false,
      printBackground: true,
      deviceName: printerName,
    }

    try {
      // 打印预览
      const data = await printWindow.webContents.print(printOptions, (success, failureReason) => {
        if (!success) {
          console.error('打印失败:', failureReason)
        }
      })

      return { success: true, data }
    } finally {
      // 清理打印窗口
      printWindow.close()
    }
  } catch (error) {
    console.error('打印文档失败:', error)
    return { success: false, error: error.message }
  }
})

// IPC handlers for update operations
ipcMain.handle('check-for-updates', async () => {
  if (process.env.DEV) {
    return { available: false, message: 'Updates disabled in development mode' }
  }

  try {
    const result = await autoUpdater.checkForUpdates()
    if (result && result.updateInfo) {
      return {
        available: true,
        version: result.updateInfo.version,
        releaseDate: result.updateInfo.releaseDate,
        message: `有新版本可用: ${result.updateInfo.version}`,
      }
    }
    return { available: false, message: '当前已是最新版本' }
  } catch (error) {
    console.error('Error checking for updates:', error)
    return { available: false, error: error.message }
  }
})

ipcMain.handle('install-update', async () => {
  if (process.env.DEV) {
    return { success: false, message: 'Updates disabled in development mode' }
  }

  try {
    // 退出并安装更新
    autoUpdater.quitAndInstall(false, true)
    return { success: true }
  } catch (error) {
    console.error('Error installing update:', error)
    return { success: false, error: error.message }
  }
})

// 搜索打印机
ipcMain.handle('search-printers', async () => {
  try {
    // let printers = await mainWindow?.webContents.getPrintersAsync()

    const bonjour = new Bonjour()

    let printers = await new Promise((resolve, reject) => {
      let server: Browser | null
      const close = () => {
        bonjour.destroy()
        server?.stop()
      }

      server = bonjour.find({ type: 'http' }, service => {
        // console.log('Bonjour打印机搜索结果:', service)
        close()
        resolve([service])
      })
      server.on('error', err => {
        console.error('Bonjour打印机搜索错误:', err)
        close()
        reject(err)
      })
      // 超时退出
      setTimeout(() => {
        close()
        reject(new Error('Bonjour打印机搜索超时'))
      }, 18000)
    })

    return { success: true, printers }
  } catch (error) {
    console.error('搜索打印机失败:', error)
    return { success: false, error: error.message }
  }
})

// Electron app lifecycle events
app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
