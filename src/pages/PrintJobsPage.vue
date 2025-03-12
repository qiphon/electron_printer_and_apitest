<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row q-mb-md items-center">
        <div class="text-h5 q-mr-md">打印任务管理</div>
        <q-btn
          color="primary"
          icon="refresh"
          flat
          round
          :loading="loading"
          @click="loadPrintJobs"
        />
      </div>

      <q-card class="print-test-card q-mb-md">
        <q-card-section>
          <div class="text-h6">打印测试</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="testContent"
            outlined
            type="textarea"
            label="输入测试打印内容"
            rows="3"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            label="打印测试内容"
            color="primary"
            :loading="printing"
            @click="printTestContent"
          />
        </q-card-actions>
      </q-card>

      <q-table
        title="打印任务历史"
        :rows="printJobs"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="getStatusColor(props.row.status)"
              text-color="white"
              :label="getStatusText(props.row.status)"
            />
          </q-td>
        </template>
        
        <template v-slot:body-cell-createdAt="props">
          <q-td :props="props">
            {{ formatDate(props.row.createdAt) }}
          </q-td>
        </template>
        
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-sm">
            <q-btn
              flat
              round
              color="primary"
              icon="print"
              @click="reprintJob(props.row)"
              :disable="printing"
            >
              <q-tooltip>重新打印</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              color="negative"
              icon="delete"
              @click="deleteJob(props.row.id)"
            >
              <q-tooltip>删除记录</q-tooltip>
            </q-btn>
          </q-td>
        </template>
        
        <template v-slot:no-data>
          <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
            <q-icon name="print_disabled" size="2em" />
            <span>暂无打印任务记录</span>
          </div>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue';
import { date } from 'quasar';
import { dbInstance } from 'src/boot/db';
import { printDocument } from 'src/utils/printer-utils';

export default defineComponent({
  name: 'PrintJobsPage',
  
  setup() {
    const loading = ref(false);
    const printing = ref(false);
    const printJobs = ref([]);
    const testContent = ref('测试打印内容\n打印时间：' + new Date().toLocaleString());
    
    const columns = [
      {
        name: 'id',
        required: true,
        label: 'ID',
        align: 'left',
        field: 'id',
        sortable: true
      },
      { 
        name: 'printerName', 
        align: 'left', 
        label: '打印机', 
        field: 'printerName',
        sortable: true
      },
      { 
        name: 'content', 
        align: 'left', 
        label: '内容', 
        field: 'content' 
      },
      { 
        name: 'status', 
        align: 'center', 
        label: '状态', 
        field: 'status',
        sortable: true
      },
      { 
        name: 'createdAt', 
        align: 'center', 
        label: '创建时间', 
        field: 'createdAt',
        sortable: true
      },
      { 
        name: 'actions', 
        align: 'center', 
        label: '操作', 
        field: 'actions' 
      }
    ];
    
    const loadPrintJobs = async () => {
      loading.value = true;
      try {
        const jobs = await dbInstance.getAll('printJobs');
        printJobs.value = jobs.sort((a, b) => {
          // 按创建时间降序排列
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      } catch (error) {
        console.error('加载打印任务失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const printTestContent = async () => {
      if (!testContent.value.trim()) return;
      
      printing.value = true;
      try {
        const result = await printDocument('Default Printer', testContent.value);
        
        if (result.success) {
          // 创建一个新打印任务记录
          await dbInstance.add('printJobs', {
            printerName: 'Default Printer',
            content: testContent.value.substring(0, 100) + (testContent.value.length > 100 ? '...' : ''),
            status: 'completed',
            createdAt: new Date()
          });
          
          // 重新加载打印任务
          await loadPrintJobs();
        }
      } catch (error) {
        console.error('打印测试内容失败:', error);
      } finally {
        printing.value = false;
      }
    };
    
    const reprintJob = async (job) => {
      printing.value = true;
      try {
        await printDocument(job.printerName, job.content);
      } catch (error) {
        console.error('重新打印失败:', error);
      } finally {
        printing.value = false;
      }
    };
    
    const deleteJob = async (id) => {
      try {
        await dbInstance.delete('printJobs', id);
        await loadPrintJobs();
      } catch (error) {
        console.error('删除打印任务失败:', error);
      }
    };
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'completed':
          return 'positive';
        case 'failed':
          return 'negative';
        case 'pending':
          return 'warning';
        default:
          return 'grey';
      }
    };
    
    const getStatusText = (status) => {
      switch (status) {
        case 'completed':
          return '已完成';
        case 'failed':
          return '失败';
        case 'pending':
          return '等待中';
        default:
          return '未知';
      }
    };
    
    const formatDate = (dateStr) => {
      const dateObj = new Date(dateStr);
      return date.formatDate(dateObj, 'YYYY-MM-DD HH:mm:ss');
    };
    
    onMounted(() => {
      loadPrintJobs();
    });
    
    return {
      loading,
      printing,
      printJobs,
      testContent,
      columns,
      loadPrintJobs,
      printTestContent,
      reprintJob,
      deleteJob,
      getStatusColor,
      getStatusText,
      formatDate
    };
  }
});
</script>

<style lang="scss" scoped>
.print-test-card {
  max-width: 800px;
}
</style>
