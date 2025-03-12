# Electron & Quasar 示例项目

## 项目介绍

这是一个基于Electron和Quasar框架的跨平台应用示例项目，支持Windows桌面平台和Android移动平台。该项目展示了多种常见功能的实现，包括打印机连接、远程API调用、前端数据库存储、应用热更新等。

## 主要实现功能

1. 用Quasar框架同时实现Windows和Android平台的运行；
   - 只测试了mac ✅
2. 通过框架实现驱动类型的打印机的连接及打印；
   - 打印机搜索经有时候找不到，还没找到问题 ❎
3. 用Electron主进程实现远程接口调用（接口使用JSONPlaceholder作为示例）； ✅
4. 通过Electron使用前端数据库(IndexedDB)，实现存储、查询、事务回滚等操作；
   - 实现了存储、查询 ✅ （设置页面、API请求页面）
   - 事务回滚还没实现 ❎
5. 通过Electron，实现热更新升级（实现客户端内容变化在线热更新升级，不需要全量安装软件包）。❎

## 技术栈

- **前端框架**: Vue 3 + Quasar 2
- **桌面应用**: Electron 27
- **移动应用**: Capacitor 5
- **HTTP请求**: Axios
- **自动更新**: electron-updater

## 开发环境配置

### 前提条件

- Node.js 18+ 和 npm 9+
- Android开发需要安装Android Studio和Android SDK

### 安装依赖

```bash
# 安装项目依赖
npm install

```

## 运行项目

```bash
# 以Electron模式运行（Windows开发）
npm run dev

# 以Capacitor模式运行Android应用
npm run dev:android
```

## 构建项目

```bash
# 构建Electron桌面应用
npm run build

# 构建Android应用
npm run build:android
```

## 项目结构

```
electron_quasar/
├── capacitor.config.json     # Capacitor配置文件
├── electron-builder.yml      # Electron构建配置
├── package.json              # 项目依赖与脚本
├── quasar.config.js          # Quasar配置文件
├── public/                   # 静态资源
├── src/                      # 源代码
│   ├── boot/                 # 启动配置
│   ├── components/           # Vue组件
│   ├── css/                  # 样式文件
│   ├── database/             # 数据库相关
│   ├── layouts/              # 布局组件
│   ├── pages/                # 页面组件
│   ├── router/               # 路由配置
│   └── utils/                # 工具函数
└── src-electron/             # Electron相关代码
    ├── electron-main.js      # Electron主进程
    └── electron-preload.js   # Electron预加载脚本
```

## 功能模块说明

### 打印机模块

通过`src/utils/printer-utils.js`实现打印机连接和打印功能。在Electron环境中通过主进程调用系统打印机，在移动端和Web环境中则使用模拟功能。

### 远程API调用

通过`src/utils/api-service.js`实现API请求，并支持缓存功能。在Electron环境中，API请求通过主进程进行，可以避免跨域问题。

### 前端数据库

使用IndexedDB作为前端数据库，通过`src/utils/db-manager.js`提供统一的数据库操作接口，支持事务和回滚功能。

### 热更新功能

通过`electron-updater`实现桌面应用的热更新功能，无需重新安装整个应用即可更新。更新配置在`electron-builder.yml`文件中设置。

## 注意事项

1. 更新服务器URL需要配置为实际的更新服务器地址。
2. Android平台打印功能为模拟实现，实际生产环境可能需要对接具体的打印设备SDK。
3. 在生产环境中，请确保API密钥和敏感信息不硬编码在代码中。

## 自定义配置

如需修改更多配置，请参考以下文件：

- Quasar配置: `quasar.config.js`
- Electron构建: `electron-builder.yml`
- Capacitor配置: `capacitor.config.json`

## 许可证

MIT
