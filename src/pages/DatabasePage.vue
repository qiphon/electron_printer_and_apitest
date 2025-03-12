<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="text-h4 q-mb-md">数据库管理</div>
      
      <div class="row q-col-gutter-md">
        <!-- 添加数据区域 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6">添加新记录</div>
            </q-card-section>
            
            <q-card-section>
              <q-form @submit="addRecord" class="q-gutter-md">
                <q-input 
                  v-model="newRecord.name" 
                  label="名称" 
                  :rules="[val => !!val || '请输入名称']"
                />
                
                <q-input 
                  v-model="newRecord.value" 
                  label="值" 
                  :rules="[val => !!val || '请输入值']"
                />
                
                <div>
                  <q-btn 
                    type="submit" 
                    color="primary" 
                    label="保存" 
                    :loading="saving"
                  />
                  
                  <q-btn 
                    v-if="transactionMode"
                    @click="commitTransaction" 
                    color="positive" 
                    label="提交事务" 
                    class="q-ml-sm"
                    :loading="committing"
                  />
                  
                  <q-btn 
                    v-if="transactionMode"
                    @click="rollbackTransaction" 
                    color="negative" 
                    label="回滚事务" 
                    class="q-ml-sm"
                    :loading="rolling"
                  />
                  
                  <q-toggle
                    v-model="transactionMode"
                    label="事务模式"
                    class="q-mt-md"
                    :disable="saving || committing || rolling"
                  />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </div>
        
        <!-- 数据显示区域 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6">数据记录</div>
            </q-card-section>
            
            <q-separator />
            
            <q-card-section>
              <q-input 
                v-model="searchText" 
                label="搜索记录" 
                clearable
                debounce="300"
                @update:model-value="searchRecords"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </q-card-section>
            
            <q-list separator>
              <q-item v-for="record in filteredRecords" :key="record.id">
                <q-item-section>
                  <q-item-label>{{ record.name }}</q-item-label>
                  <q-item-label caption>{{ record.value }}</q-item-label>
                </q-item-section>
                
                <q-item-section side>
                  <q-btn 
                    flat 
                    round 
                    dense 
                    icon="delete" 
                    color="negative"
                    @click="deleteRecord(record.id)"
                  />
                </q-item-section>
              </q-item>
              
              <q-item v-if="filteredRecords.length === 0">
                <q-item-section>
                  <q-item-label class="text-center text-grey">没有记录</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
      </div>
      
      <!-- 数据库日志 -->
      <q-card class="q-mt-md">
        <q-card-section>
          <div class="text-h6">数据库日志</div>
        </q-card-section>
        
        <q-separator />
        
        <q-list dense>
          <q-item v-for="(log, index) in dbLogs" :key="index">
            <q-item-section>
              <q-item-label>{{ log.message }}</q-item-label>
              <q-item-label caption>{{ log.timestamp.toLocaleString() }}</q-item-label>
            </q-item-section>
            
            <q-item-section side>
              <q-badge :color="logColor(log.type)">
                {{ log.type }}
              </q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue';
import { useQuasar } from 'quasar';
import { dbInstance } from 'src/boot/db';

export default defineComponent({
  name: 'DatabasePage',
  
  setup() {
    const $q = useQuasar();
    return { $q };
  },
  
  data() {
    return {
      newRecord: {
        name: '',
        value: ''
      },
      records: [],
      filteredRecords: [],
      searchText: '',
      saving: false,
      committing: false,
      rolling: false,
      transactionMode: false,
      transaction: null,
      transactionStore: null,
      transactionChanges: [],
      dbLogs: []
    };
  },
  
  async mounted() {
    await this.loadRecords();
  },
  
  methods: {
    async loadRecords() {
      if (!dbInstance) return;
      
      try {
        const settings = await dbInstance.getAll('settings');
        this.records = settings;
        this.filteredRecords = [...settings];
        this.addLog('info', '加载数据记录');
      } catch (error) {
        console.error('Failed to load records', error);
        this.addLog('error', `加载数据失败: ${error.message}`);
      }
    },
    
    searchRecords() {
      if (!this.searchText) {
        this.filteredRecords = [...this.records];
        return;
      }
      
      const searchLower = this.searchText.toLowerCase();
      this.filteredRecords = this.records.filter(
        record => record.name.toLowerCase().includes(searchLower) || 
                record.value.toLowerCase().includes(searchLower)
      );
    },
    
    async addRecord() {
      if (!this.newRecord.name || !this.newRecord.value) return;
      
      this.saving = true;
      
      try {
        // Create record object
        const record = {
          id: Date.now().toString(),
          name: this.newRecord.name,
          value: this.newRecord.value
        };
        
        if (this.transactionMode) {
          // In transaction mode
          if (!this.transaction) {
            // Start a new transaction
            this.transaction = dbInstance.transaction('settings', 'readwrite');
            this.transactionStore = this.transaction.objectStore('settings');
            this.addLog('info', '开始新事务');
          }
          
          // Add record to transaction
          await this.transactionStore.add(record);
          this.transactionChanges.push({ type: 'add', record });
          this.addLog('transaction', `事务中添加记录: ${record.name}`);
          
          // Update local records for display
          this.records.push(record);
          this.searchRecords();
          
          this.$q.notify({
            color: 'info',
            message: '记录已添加到事务中（尚未提交）',
            icon: 'info'
          });
        } else {
          // Direct add without transaction
          await dbInstance.add('settings', record);
          this.addLog('success', `添加记录: ${record.name}`);
          
          // Update local records
          this.records.push(record);
          this.searchRecords();
          
          this.$q.notify({
            color: 'positive',
            message: '记录已保存',
            icon: 'check'
          });
        }
        
        // Clear form
        this.newRecord.name = '';
        this.newRecord.value = '';
        
      } catch (error) {
        console.error('Failed to add record', error);
        this.addLog('error', `添加记录失败: ${error.message}`);
        
        this.$q.notify({
          color: 'negative',
          message: `保存失败: ${error.message}`,
          icon: 'error'
        });
      } finally {
        this.saving = false;
      }
    },
    
    async deleteRecord(id) {
      try {
        if (this.transactionMode) {
          if (!this.transaction) {
            // Start a new transaction
            this.transaction = dbInstance.transaction('settings', 'readwrite');
            this.transactionStore = this.transaction.objectStore('settings');
            this.addLog('info', '开始新事务');
          }
          
          // Find record to be deleted
          const recordToDelete = this.records.find(rec => rec.id === id);
          
          // Delete from transaction
          await this.transactionStore.delete(id);
          this.transactionChanges.push({ type: 'delete', id, record: recordToDelete });
          this.addLog('transaction', `事务中删除记录: ID=${id}`);
          
          // Update local records for display
          this.records = this.records.filter(rec => rec.id !== id);
          this.searchRecords();
          
          this.$q.notify({
            color: 'info',
            message: '记录已从事务中删除（尚未提交）',
            icon: 'info'
          });
        } else {
          // Direct delete without transaction
          await dbInstance.delete('settings', id);
          this.addLog('success', `删除记录: ID=${id}`);
          
          // Update local records
          this.records = this.records.filter(rec => rec.id !== id);
          this.searchRecords();
          
          this.$q.notify({
            color: 'positive',
            message: '记录已删除',
            icon: 'check'
          });
        }
      } catch (error) {
        console.error('Failed to delete record', error);
        this.addLog('error', `删除记录失败: ${error.message}`);
        
        this.$q.notify({
          color: 'negative',
          message: `删除失败: ${error.message}`,
          icon: 'error'
        });
      }
    },
    
    async commitTransaction() {
      if (!this.transaction) return;
      
      this.committing = true;
      
      try {
        // Commit the transaction
        await this.transaction.done;
        this.addLog('success', '事务已提交');
        
        this.$q.notify({
          color: 'positive',
          message: '事务已成功提交',
          icon: 'check'
        });
      } catch (error) {
        console.error('Transaction commit failed', error);
        this.addLog('error', `事务提交失败: ${error.message}`);
        
        this.$q.notify({
          color: 'negative',
          message: `事务提交失败: ${error.message}`,
          icon: 'error'
        });
        
        // Reload records to sync with database
        await this.loadRecords();
      } finally {
        this.transaction = null;
        this.transactionStore = null;
        this.transactionChanges = [];
        this.committing = false;
      }
    },
    
    async rollbackTransaction() {
      if (!this.transaction) return;
      
      this.rolling = true;
      
      try {
        // Abort the transaction
        this.transaction.abort();
        this.addLog('warning', '事务已回滚');
        
        // Revert local changes
        for (const change of this.transactionChanges.reverse()) {
          if (change.type === 'add') {
            // Remove added records
            this.records = this.records.filter(rec => rec.id !== change.record.id);
          } else if (change.type === 'delete' && change.record) {
            // Restore deleted records
            this.records.push(change.record);
          }
        }
        
        // Update filtered records
        this.searchRecords();
        
        this.$q.notify({
          color: 'warning',
          message: '事务已回滚，变更已撤销',
          icon: 'replay'
        });
      } catch (error) {
        console.error('Transaction rollback failed', error);
        this.addLog('error', `事务回滚失败: ${error.message}`);
        
        this.$q.notify({
          color: 'negative',
          message: `事务回滚失败: ${error.message}`,
          icon: 'error'
        });
        
        // Reload records to sync with database
        await this.loadRecords();
      } finally {
        this.transaction = null;
        this.transactionStore = null;
        this.transactionChanges = [];
        this.rolling = false;
      }
    },
    
    addLog(type, message) {
      const log = {
        type,
        message,
        timestamp: new Date()
      };
      
      this.dbLogs.unshift(log);
      
      // Keep logs limited to prevent memory issues
      if (this.dbLogs.length > 50) {
        this.dbLogs.pop();
      }
    },
    
    logColor(type) {
      switch (type) {
        case 'error':
          return 'negative';
        case 'success':
          return 'positive';
        case 'warning':
          return 'warning';
        case 'transaction':
          return 'purple';
        default:
          return 'info';
      }
    }
  }
});
</script>
