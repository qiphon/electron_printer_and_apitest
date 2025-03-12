<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="text-h4 q-mb-md">系统设置</div>

      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">应用信息</div>
        </q-card-section>

        <q-separator />

        <q-list>
          <q-item>
            <q-item-section>
              <q-item-label>版本</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label>{{ version }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>平台</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label>{{ platform }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="process.env.MODE === 'electron'">
            <q-item-section>
              <q-item-label>检查更新</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn color="primary" label="检查更新" @click="checkForUpdates" :loading="checkingUpdates" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">主题设置</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-select v-model="settings.theme" :options="themeOptions" label="主题" @update:model-value="saveSettings" />
            </div>

            <div class="col-12 col-md-6">
              <q-select v-model="settings.density" :options="densityOptions" label="界面密度" @update:model-value="saveSettings" />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">打印机设置</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="settings.defaultPrinter" label="默认打印机" @update:model-value="saveSettings" />
            </div>

            <div class="col-12 col-md-6">
              <q-select v-model="settings.paperSize" :options="paperSizeOptions" label="纸张大小" @update:model-value="saveSettings" />
            </div>

            <div class="col-12">
              <q-toggle v-model="settings.duplex" label="双面打印" @update:model-value="saveSettings" />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <div class="text-h6">数据设置</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="settings.apiEndpoint" label="API 地址" @update:model-value="saveSettings" />
            </div>

            <div class="col-12 col-md-6">
              <q-input type="number" v-model.number="settings.cacheDuration" label="缓存有效期 (分钟)" @update:model-value="saveSettings" />
            </div>

            <div class="col-12">
              <q-toggle v-model="settings.useCache" label="启用 API 缓存" @update:model-value="saveSettings" />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn color="negative" label="清除所有数据" @click="confirmClearData" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import { dbInstance } from 'src/boot/db'
import { version } from '../../package.json'
import { checkForUpdates } from 'src/utils/update-service'

export default defineComponent({
  name: 'SettingsPage',

  setup() {
    const $q = useQuasar()
    return { $q }
  },

  data() {
    return {
      version,
      process,
      platform: this.detectPlatform(),
      checkingUpdates: false,
      settings: {
        theme: 'auto',
        density: 'comfortable',
        defaultPrinter: '',
        paperSize: 'A4',
        duplex: false,
        apiEndpoint: 'https://api.example.com',
        cacheDuration: 60,
        useCache: true,
      },
      themeOptions: [
        { label: '跟随系统', value: 'auto' },
        { label: '浅色', value: 'light' },
        { label: '深色', value: 'dark' },
      ],
      densityOptions: [
        { label: '紧凑', value: 'compact' },
        { label: '舒适', value: 'comfortable' },
        { label: '宽松', value: 'loose' },
      ],
      paperSizeOptions: ['A4', 'A5', 'Letter', 'Legal'],
    }
  },

  async mounted() {
    await this.loadSettings()
    this.applySettings()
  },

  methods: {
    detectPlatform() {
      if (process.env.MODE === 'electron') {
        return 'Electron (Desktop)'
      } else if (process.env.MODE === 'capacitor') {
        return 'Capacitor (Mobile)'
      } else {
        return 'Web Browser'
      }
    },

    async loadSettings() {
      if (!dbInstance) return

      try {
        // Get default settings from database or use defaults
        const settingsFromDb = await dbInstance.get('settings', 'app-settings')
        if (settingsFromDb) {
          this.settings = { ...this.settings, ...JSON.parse(settingsFromDb.value) }
        } else {
          // Save default settings to DB if not exists
          await this.saveSettings()
        }
      } catch (error) {
        console.error('Failed to load settings', error)

        this.$q.notify({
          color: 'negative',
          message: `加载设置失败: ${error.message}`,
          icon: 'error',
        })
      }
    },

    async saveSettings() {
      if (!dbInstance) return

      try {
        await dbInstance
          .put('settings', {
            id: 'app-settings',
            name: 'Application Settings',
            value: JSON.stringify(this.settings),
          })
          .catch(error => {
            this.$q.notify({
              color: 'negative',
              message: `保存设置失败: ${error.message}`,
              icon: 'error',
            })
          })

        this.applySettings()

        this.$q.notify({
          color: 'positive',
          message: '设置已保存',
          icon: 'check',
        })
      } catch (error) {
        console.error('Failed to save settings', error)

        this.$q.notify({
          color: 'negative',
          message: `保存设置失败: ${error.message}`,
          icon: 'error',
        })
      }
    },

    applySettings() {
      // Apply theme
      if (this.settings.theme === 'dark') {
        this.$q.dark.set(true)
      } else if (this.settings.theme === 'light') {
        this.$q.dark.set(false)
      } else {
        this.$q.dark.set('auto')
      }

      // Apply density (this would usually be done at app startup)
      if (this.$q.screen) {
        this.$q.screen.setSizes({ lg: 1024, md: 768, sm: 480, xs: 0 })
      }
    },

    async checkForUpdates() {
      this.checkingUpdates = true

      try {
        if (process.env.MODE === 'electron') {
          const result = await checkForUpdates()

          if (result.available) {
            this.$q.notify({
              color: 'positive',
              message: result.message || `发现新版本 ${result.version}`,
              icon: 'system_update',
              timeout: 5000,
              actions: [{ label: '立即安装', color: 'white', handler: () => this.installUpdate() }],
            })
          } else {
            this.$q.notify({
              color: 'info',
              message: result.message || '当前已是最新版本',
              icon: 'check',
            })
          }
        } else {
          this.$q.notify({
            color: 'warning',
            message: '自动更新功能仅在桌面版可用',
            icon: 'info',
          })
        }
      } catch (error) {
        this.$q.notify({
          color: 'negative',
          message: `检查更新失败: ${error.message}`,
          icon: 'error',
        })
      } finally {
        this.checkingUpdates = false
      }
    },

    async installUpdate() {
      this.$q
        .dialog({
          title: '安装更新',
          message: '应用将重启以完成更新安装。确定继续吗？',
          cancel: true,
          persistent: true,
        })
        .onOk(async () => {
          try {
            await window.electronAPI.installUpdate()
          } catch (error) {
            this.$q.notify({
              color: 'negative',
              message: `安装更新失败: ${error.message}`,
              icon: 'error',
            })
          }
        })
    },

    confirmClearData() {
      this.$q
        .dialog({
          title: '确认清除数据',
          message: '此操作将清除所有本地存储的数据，包括设置、缓存和打印记录。此操作无法撤销。',
          cancel: true,
          persistent: true,
        })
        .onOk(async () => {
          if (!dbInstance) return

          try {
            // Clear all data in IndexedDB
            const tx = dbInstance.transaction(['settings', 'printJobs', 'apiCache'], 'readwrite')
            await Promise.all([tx.objectStore('settings').clear(), tx.objectStore('printJobs').clear(), tx.objectStore('apiCache').clear()])
            await tx.done

            // Reset settings to defaults
            this.settings = {
              theme: 'auto',
              density: 'comfortable',
              defaultPrinter: '',
              paperSize: 'A4',
              duplex: false,
              apiEndpoint: 'https://api.example.com',
              cacheDuration: 60,
              useCache: true,
            }

            // Save default settings
            await this.saveSettings()

            this.$q.notify({
              color: 'positive',
              message: '所有数据已清除',
              icon: 'check',
            })
          } catch (error) {
            console.error('Failed to clear data', error)

            this.$q.notify({
              color: 'negative',
              message: `清除数据失败: ${error.message}`,
              icon: 'error',
            })
          }
        })
    },
  },
})
</script>
