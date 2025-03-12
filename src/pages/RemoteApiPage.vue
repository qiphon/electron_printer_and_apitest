<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="text-h4 q-mb-md">远程 API 调用</div>

      <div class="row q-col-gutter-md">
        <!-- API 请求表单 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6">发送 API 请求</div>
            </q-card-section>

            <q-card-section>
              <q-form @submit="fetchApiData" class="q-gutter-md">
                <q-select v-model="apiRequest.method" :options="['GET', 'POST', 'PUT', 'DELETE']" label="请求方法" />

                <q-input v-model="apiRequest.url" label="API 地址" :rules="[val => !!val || '请输入API地址']">
                  <template v-slot:prepend>
                    <q-icon name="link" />
                  </template>
                </q-input>

                <q-input v-if="apiRequest.method !== 'GET' && apiRequest.method !== 'DELETE'" v-model="apiRequest.data" type="textarea" label="请求数据 (JSON)" hint="输入有效的 JSON 格式数据" rows="4" />

                <q-toggle v-model="useCachedResponse" label="使用缓存响应 (如果可用)" />

                <div>
                  <q-btn type="submit" color="primary" label="发送请求" :loading="fetching" />

                  <q-btn type="button" flat color="secondary" label="清除响应" class="q-ml-sm" @click="clearResponse" />
                </div>
              </q-form>
            </q-card-section>
          </q-card>

          <q-card class="q-mt-md">
            <q-card-section>
              <div class="text-h6">快速 API 示例</div>
            </q-card-section>

            <q-separator />

            <q-list>
              <q-item v-for="(example, index) in apiExamples" :key="index" clickable @click="loadExample(example)">
                <q-item-section>
                  <q-item-label>{{ example.name }}</q-item-label>
                  <q-item-label caption>{{ example.url }}</q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-badge>{{ example.method }}</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>

        <!-- API 响应显示 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section class="row items-center">
              <div class="text-h6">API 响应</div>
              <q-space />
              <q-badge v-if="responseTime" color="grey">
                {{ responseStatus.fromCache ? '从缓存加载' : responseTime + 'ms' }}
              </q-badge>
            </q-card-section>

            <q-separator />

            <q-card-section v-if="responseStatus.loading" class="text-center">
              <q-spinner size="3em" color="primary" />
              <div class="q-mt-sm">加载中...</div>
            </q-card-section>

            <q-card-section v-else-if="responseStatus.error" class="text-center">
              <q-icon name="error" color="negative" size="3em" />
              <div class="text-negative q-mt-sm">
                {{ responseStatus.error }}
              </div>
            </q-card-section>

            <q-card-section v-else-if="!apiResponse">
              <div class="text-center text-grey">
                <q-icon name="info" size="2em" />
                <div class="q-mt-sm">发送请求以查看响应</div>
              </div>
            </q-card-section>

            <template v-else>
              <q-card-section>
                <q-tabs v-model="responseTab" class="text-primary" inline-label dense>
                  <q-tab name="json" icon="code" label="JSON" />
                  <q-tab name="raw" icon="description" label="原始数据" />
                </q-tabs>

                <q-separator />

                <q-tab-panels v-model="responseTab" animated>
                  <q-tab-panel name="json">
                    <pre class="response-json">{{ formattedResponse }}</pre>
                  </q-tab-panel>

                  <q-tab-panel name="raw">
                    <pre class="response-raw">{{ apiResponse }}</pre>
                  </q-tab-panel>
                </q-tab-panels>
              </q-card-section>
            </template>
          </q-card>

          <q-card v-if="apiCacheItems.length > 0" class="q-mt-md">
            <q-card-section>
              <div class="text-h6">API 缓存</div>
            </q-card-section>

            <q-separator />

            <q-list>
              <q-item v-for="(item, index) in apiCacheItems" :key="index">
                <q-item-section>
                  <q-item-label>{{ item.url }}</q-item-label>
                  <q-item-label caption>{{ new Date(item.timestamp).toLocaleString() }}</q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-btn flat round dense icon="delete" color="negative" @click="deleteCacheItem(item.id)" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import { dbInstance } from 'src/boot/db'

export default defineComponent({
  name: 'RemoteApiPage',

  setup() {
    const $q = useQuasar()
    return { $q }
  },

  data() {
    return {
      apiRequest: {
        method: 'GET',
        url: '',
        data: '',
      },
      apiResponse: null,
      formattedResponse: '',
      responseTab: 'json',
      responseTime: null,
      responseStatus: {
        loading: false,
        error: null,
        fromCache: false,
      },
      fetching: false,
      useCachedResponse: true,
      apiCacheItems: [],
      apiExamples: [
        {
          name: '获取用户列表',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/users',
        },
        {
          name: '获取单个用户',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/users/1',
        },
        {
          name: '获取帖子列表',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/posts',
        },
        {
          name: '创建新帖子',
          method: 'POST',
          url: 'https://jsonplaceholder.typicode.com/posts',
          data: JSON.stringify(
            {
              title: '测试帖子',
              body: '这是一个测试帖子内容',
              userId: 1,
            },
            null,
            2,
          ),
        },
      ],
    }
  },

  async mounted() {
    await this.loadCacheItems()
  },

  methods: {
    async fetchApiData() {
      if (!this.apiRequest.url) return

      // Reset status
      this.responseStatus.loading = true
      this.responseStatus.error = null
      this.responseStatus.fromCache = false
      this.fetching = true
      this.apiResponse = null
      this.formattedResponse = ''
      this.responseTime = null

      try {
        const cacheKey = this.generateCacheKey(this.apiRequest)
        // Check cache if enabled
        if (this.useCachedResponse && dbInstance) {
          try {
            const cachedResponse = await dbInstance.get('apiCache', cacheKey)
            if (cachedResponse) {
              this.apiResponse = cachedResponse.data
              this.formatResponse()
              this.responseStatus.fromCache = true

              this.$q.notify({
                color: 'info',
                message: '从缓存加载响应',
                icon: 'cached',
              })

              this.fetching = false
              this.responseStatus.loading = false
              return
            }
          } catch (error) {
            console.warn('Failed to get from cache', error)
          }
        }

        // Format request body if provided
        let requestData = null
        if (this.apiRequest.data) {
          try {
            requestData = JSON.parse(this.apiRequest.data)
          } catch (error) {
            throw new Error('请求数据必须是有效的 JSON 格式')
          }
        }

        // Start timing
        const startTime = performance.now()

        // Make API request via Electron main process in electron mode
        // or directly via axios in other modes
        let result
        if (process.env.MODE === 'electron') {
          result = await window.electronAPI.fetchRemoteData({
            url: this.apiRequest.url,
            method: this.apiRequest.method,
            data: requestData,
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!result.success) {
            throw new Error(result.error)
          }

          this.apiResponse = result.data
        } else {
          // Direct axios call for non-electron environments
          const response = await this.$axios({
            url: this.apiRequest.url,
            method: this.apiRequest.method,
            data: requestData,
            headers: {
              'Content-Type': 'application/json',
            },
          })

          this.apiResponse = response.data
        }

        // Calculate response time
        this.responseTime = Math.round(performance.now() - startTime)

        // Format the response
        this.formatResponse()
        debugger
        // Store response in cache
        if (dbInstance) {
          // 序列化API响应数据以确保可以被正确克隆
          const serializedData = JSON.parse(JSON.stringify(this.apiResponse))

          try {
            await dbInstance.put('apiCache', {
              id: cacheKey,
              url: this.apiRequest.url,
              method: this.apiRequest.method,
              data: serializedData,
              timestamp: Date.now(),
            })
          } catch (error) {
            console.error('Failed to cache API response:', error)
            // 通知用户缓存失败，但不影响主流程
            this.$q.notify({
              color: 'warning',
              message: '响应数据已获取，但缓存失败',
              icon: 'warning',
            })
          }

          // Refresh cache items
          await this.loadCacheItems()
        }

        this.$q.notify({
          color: 'positive',
          message: '请求成功',
          icon: 'check',
        })
      } catch (error) {
        console.error('API request failed', error)
        this.responseStatus.error = error.message

        this.$q.notify({
          color: 'negative',
          message: `请求失败: ${error.message}`,
          icon: 'error',
        })
      } finally {
        this.fetching = false
        this.responseStatus.loading = false
      }
    },

    formatResponse() {
      try {
        if (typeof this.apiResponse === 'object') {
          this.formattedResponse = JSON.stringify(this.apiResponse, null, 2)
        } else {
          this.formattedResponse = this.apiResponse
        }
      } catch (error) {
        this.formattedResponse = String(this.apiResponse)
      }
    },

    clearResponse() {
      this.apiResponse = null
      this.formattedResponse = ''
      this.responseTime = null
      this.responseStatus.error = null
      this.responseStatus.fromCache = false
    },

    loadExample(example) {
      this.apiRequest.method = example.method
      this.apiRequest.url = example.url
      this.apiRequest.data = example.data || ''
    },

    generateCacheKey(request) {
      return `${request.method}-${request.url}-${request.data || ''}`
    },

    async loadCacheItems() {
      if (!dbInstance) return

      try {
        const items = await dbInstance.getAllFromIndex('apiCache', 'timestamp')
        this.apiCacheItems = items.reverse()
      } catch (error) {
        console.error('Failed to load cache items', error)
      }
    },

    async deleteCacheItem(id) {
      if (!dbInstance) return

      try {
        await dbInstance.delete('apiCache', id)
        await this.loadCacheItems()

        this.$q.notify({
          color: 'positive',
          message: '缓存项已删除',
          icon: 'check',
        })
      } catch (error) {
        console.error('Failed to delete cache item', error)

        this.$q.notify({
          color: 'negative',
          message: `删除失败: ${error.message}`,
          icon: 'error',
        })
      }
    },
  },
})
</script>

<style lang="scss" scoped>
.response-json,
.response-raw {
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 0.9em;
  padding: 0.5em;
  background-color: #f5f5f5;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}
</style>
