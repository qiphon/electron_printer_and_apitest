<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="text-h4 q-mb-md">打印机管理</div>

      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">连接打印机</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="connectToPrinter" class="q-gutter-md">
            <q-input v-model="printerName" label="打印机名称" :rules="[val => !!val || '请输入打印机名称']" />

            <div class="row q-gutter-sm">
              <q-btn type="submit" color="primary" label="连接打印机" :loading="connectingPrinter" />
              <q-btn color="secondary" label="搜索打印机" :loading="searchingPrinters" @click="searchPrinters" />
            </div>

            <q-list v-if="availablePrinters.length > 0" bordered separator class="q-mt-md">
              <q-item v-for="printer in availablePrinters" :key="printer.name" clickable @click="selectPrinter(printer)">
                <q-item-section>
                  <q-item-label>{{ printer.name }}</q-item-label>
                  <q-item-label caption>{{ printer?.addresses || '无描述' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-form>
        </q-card-section>
      </q-card>

      <q-card v-if="printerConnected">
        <q-card-section>
          <div class="text-h6">打印文档</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="printDocument" class="q-gutter-md">
            <q-input v-model="documentContent" type="textarea" label="文档内容" :rules="[val => !!val || '请输入文档内容']" rows="4" />
            <q-file v-model="selectedFile" label="选择文件" @update:model-value="handleFileSelect" />
            <div class="row q-gutter-sm">
              <q-btn type="submit" color="primary" label="打印文档" :loading="printing" />
              <q-btn color="secondary" label="打印预览" @click="previewDocument" :disable="!documentContent" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <q-card v-if="printJobs.length > 0" class="q-mt-md">
        <q-card-section>
          <div class="text-h6">打印任务历史</div>
        </q-card-section>

        <q-separator />

        <q-list>
          <q-item v-for="(job, index) in printJobs" :key="index">
            <q-item-section>
              <q-item-label>{{ job.printerName }}</q-item-label>
              <q-item-label caption>{{ job.createdAt.toLocaleString() }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-badge :color="job.status === 'completed' ? 'positive' : 'warning'">
                {{ job.status }}
              </q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import { dbInstance } from 'src/boot/db'
import { Service } from 'bonjour-service'

export default defineComponent({
  name: 'PrinterPage',

  setup() {
    const $q = useQuasar()
    return { $q }
  },

  data() {
    return {
      printerName: '',
      documentContent: '',
      selectedFile: null,
      printerConnected: false,
      connectingPrinter: false,
      printing: false,
      printJobs: [],
      searchingPrinters: false,
      availablePrinters: [] as Service[],
    }
  },

  async mounted() {
    // Load print jobs from database
    if (dbInstance) {
      try {
        const jobs = await dbInstance.getAllFromIndex('printJobs', 'createdAt')
        this.printJobs = jobs.reverse()
      } catch (error) {
        console.error('Failed to load print jobs', error)
      }
    }
  },

  methods: {
    async connectToPrinter() {
      if (!this.printerName) return

      this.connectingPrinter = true

      try {
        if (process.env.MODE === 'electron') {
          const result = await window.electronAPI.connectPrinter({
            printerName: this.printerName,
          })

          if (result.success) {
            this.printerConnected = true
            this.$q.notify({
              color: 'positive',
              message: `成功连接到打印机: ${this.printerName}`,
              icon: 'check',
            })
          } else {
            throw new Error(result.error || '连接打印机失败')
          }
        } else {
          // For non-electron platforms, simulate printer connection
          await new Promise(resolve => setTimeout(resolve, 1000))
          this.printerConnected = true
          this.$q.notify({
            color: 'positive',
            message: `模拟连接到打印机: ${this.printerName}`,
            icon: 'check',
          })
        }
      } catch (error) {
        this.$q.notify({
          color: 'negative',
          message: `连接打印机失败: ${error.message}`,
          icon: 'error',
        })
      } finally {
        this.connectingPrinter = false
      }
    },

    async printDocument() {
      if (!this.documentContent) return

      this.printing = true

      try {
        // Create a new print job record
        const printJob = {
          printerName: this.printerName,
          content: this.documentContent,
          status: 'pending',
          createdAt: new Date(),
        }

        // Save to database first
        if (dbInstance) {
          await dbInstance.add('printJobs', printJob)
        }

        if (process.env.MODE === 'electron') {
          const result = await window.electronAPI.printDocument({
            printerName: this.printerName,
            documentContent: this.documentContent,
          })

          if (result.success) {
            // Update job status in database
            printJob.status = 'completed'
            if (dbInstance) {
              const key = await dbInstance.getKeyFromIndex('printJobs', 'createdAt', printJob.createdAt)
              if (key) {
                await dbInstance.put('printJobs', { ...printJob, id: key })
              }
            }

            this.$q.notify({
              color: 'positive',
              message: '文档已发送至打印机',
              icon: 'check',
            })
          } else {
            throw new Error(result.error || '打印失败')
          }
        } else {
          // For non-electron platforms, simulate printing
          await new Promise(resolve => setTimeout(resolve, 2000))

          // Update job status
          printJob.status = 'completed'
          if (dbInstance) {
            const key = await dbInstance.getKeyFromIndex('printJobs', 'createdAt', printJob.createdAt)
            if (key) {
              await dbInstance.put('printJobs', { ...printJob, id: key })
            }
          }

          this.$q.notify({
            color: 'positive',
            message: '模拟打印成功',
            icon: 'check',
          })
        }

        // Add to local list
        this.printJobs.unshift(printJob)
        this.documentContent = '' // Clear content after print
      } catch (error) {
        this.$q.notify({
          color: 'negative',
          message: `打印失败: ${error.message}`,
          icon: 'error',
        })
      } finally {
        this.printing = false
      }
    },
    async searchPrinters() {
      this.searchingPrinters = true
      try {
        if (process.env.MODE === 'electron') {
          const result = await window.electronAPI.searchPrinters()
          if (result.success) {
            this.availablePrinters = result.printers
            if (this.availablePrinters.length === 0) {
              this.$q.notify({
                color: 'warning',
                message: '未找到可用的打印机',
                icon: 'warning',
              })
            }
          } else {
            throw new Error(result.error || '搜索打印机失败')
          }
        } else {
          // 非electron环境模拟打印机搜索
          // await new Promise(resolve => setTimeout(resolve, 1000))
          // this.availablePrinters = [
          //   { name: '模拟打印机 1', description: '本地打印机' },
          //   { name: '模拟打印机 2', description: '网络打印机' },
          // ]
        }
      } catch (error) {
        this.$q.notify({
          color: 'negative',
          message: `搜索打印机失败: ${error.message}`,
          icon: 'error',
        })
      } finally {
        this.searchingPrinters = false
      }
    },

    selectPrinter(printer) {
      this.printerName = printer.name
      this.$q.notify({
        color: 'info',
        message: `已选择打印机: ${printer.name}`,
        icon: 'info',
      })
    },
  },
})
</script>
