/* eslint-env node */
const { configure } = require('quasar/wrappers')

module.exports = configure(function (ctx) {
  return {
    supportTS: true,
    boot: ['axios', 'db'],
    css: ['app.scss'],
    extras: ['roboto-font', 'material-icons'],
    build: {
      vueRouterMode: 'hash',
      extendViteConf(viteConf) {},
      viteVuePluginOptions: {},
    },
    devServer: {
      port: 8080,
      open: false,
    },
    framework: {
      config: {},
      plugins: ['Notify', 'Dialog'],
    },
    animations: [],
    capacitor: {
      hideSplashscreen: true,
      appName: 'Electron Quasar Demo',
      appId: 'org.capacitor.electronquasardemo',
    },
    sourceFiles: {
      electronMain: './src-electron/electron-main.js',
      electronPreload: './src-electron/electron-preload.js',
    },
    electron: {
      bundler: 'builder',
      builder: {
        appId: 'org.electron.electronquasardemo',
        productName: 'Electron Quasar Demo',
        directories: {
          output: 'dist/electron',
        },
        artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
        publish: {
          provider: 'generic',
          url: 'http://your-update-server.com/updates/', // 这里要替换为实际的更新服务器地址
        },
        win: {
          target: ['nsis'],
          icon: 'public/icons/icon.ico',
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
        },
      },
      packager: {},
      nodeIntegration: true,
      inspectPort: 5858,
      extendElectronMainConf(esbuildConf) {
        // 主进程构建配置
        esbuildConf.define = {
          ...esbuildConf.define,
          'process.env.ELECTRON_DISABLE_SECURITY_WARNINGS': 'true',
        }
      },
      extendElectronPreloadConf(esbuildConf) {
        // 预加载脚本构建配置
        esbuildConf.define = {
          ...esbuildConf.define,
          'process.env.ELECTRON_DISABLE_SECURITY_WARNINGS': 'true',
        }
      },
    },
  }
})
