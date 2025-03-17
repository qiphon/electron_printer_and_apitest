<template>
  <q-page class="flex column q-pa-md">
    <div class="text-h4 q-mb-md">Electron & Quasar Demo</div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">系统功能</div>
      </q-card-section>

      <q-separator />

      <q-list>
        <q-item v-ripple>
          <q-item-section avatar>
            <q-icon color="primary" name="devices" />
          </q-item-section>
          <q-item-section>
            <q-item-label>跨平台支持</q-item-label>
            <q-item-label caption>Windows and Android 平台支持</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator spaced inset />

        <q-item v-ripple>
          <q-item-section avatar>
            <q-icon color="primary" name="print" />
          </q-item-section>
          <q-item-section>
            <q-item-label>打印机支持</q-item-label>
            <q-item-label caption>连接及打印功能</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator spaced inset />

        <q-item v-ripple>
          <q-item-section avatar>
            <q-icon color="primary" name="cloud" />
          </q-item-section>
          <q-item-section>
            <q-item-label>远程API调用</q-item-label>
            <q-item-label caption>使用Electron主进程</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator spaced inset />

        <q-item v-ripple>
          <q-item-section avatar>
            <q-icon color="primary" name="storage" />
          </q-item-section>
          <q-item-section>
            <q-item-label>前端数据库</q-item-label>
            <q-item-label caption>IndexedDB 存储、查询、事务回滚</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator spaced inset />

        <q-item v-ripple>
          <q-item-section avatar>
            <q-icon color="primary" name="system_update" />
          </q-item-section>
          <q-item-section>
            <q-item-label>热更新升级</q-item-label>
            <q-item-label caption>客户端在线热更新</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
    <q-card>
      <test-table />
    </q-card>
    <q-card>
      <q-card-section>
        <div class="text-h6">系统信息</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md">
          <q-item>
            <q-item-section>
              <q-item-label overline>当前平台</q-item-label>
              <q-item-label class="text-weight-bold">{{ platform }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label overline>应用版本</q-item-label>
              <q-item-label class="text-weight-bold">{{ version }}</q-item-label>
            </q-item-section>
          </q-item>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { version } from '../../package.json';
import TestTableVue from '../components/TestTable.vue';

export default defineComponent({
  name: 'IndexPage',
  components: {
    TestTable: TestTableVue
  },

  data() {
    return {
      version,
      platform: this.detectPlatform()
    };
  },

  methods: {
    detectPlatform() {
      if (process.env.MODE === 'electron') {
        return 'Electron (Desktop)';
      }
      else if (process.env.MODE === 'capacitor') {
        return 'Capacitor (Mobile)';
      }
      else {
        return 'Web Browser';
      }
    }
  }
});
</script>
