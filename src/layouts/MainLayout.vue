<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> Electron Quasar Demo </q-toolbar-title>

        <div>v{{ version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>Menu</q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="updateAvailable" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="system_update" color="primary" text-color="white" />
          <span class="q-ml-sm"
            >New update available (v{{ updateVersion }})</span
          >
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Later" color="primary" v-close-popup />
          <q-btn
            flat
            label="Install Now"
            color="primary"
            @click="installUpdate"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import { version } from '../../package.json'

const linksList = [
  {
    title: '首页',
    caption: 'Dashboard',
    icon: 'home',
    link: '/',
  },
  {
    title: '打印机',
    caption: 'Connect and print documents',
    icon: 'print',
    link: '/printer',
  },
  {
    title: '打印任务',
    caption: 'Print task management and history',
    icon: 'list',
    link: '/print-jobs',
  },
  {
    title: '数据库',
    caption: 'Manage local database',
    icon: 'storage',
    link: '/database',
  },
  {
    title: '接口测试',
    caption: 'Call remote APIs',
    icon: 'cloud',
    link: '/remote-api',
  },
  {
    title: '设置',
    caption: 'Application settings',
    icon: 'settings',
    link: '/settings',
  },
]

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink,
  },

  setup() {
    const leftDrawerOpen = ref(false)
    const updateAvailable = ref(false)
    const updateVersion = ref('')

    // In Electron environment, setup auto-updater listeners
    if (process.env.MODE === 'electron') {
      // Listen for update downloaded event
      window.electronAPI.onUpdateDownloaded(info => {
        updateVersion.value = info.version
        updateAvailable.value = true
      })

      // Listen for update error event
      window.electronAPI.onUpdateError(error => {
        console.error('Update error:', error)
      })
    }

    const installUpdate = () => {
      if (process.env.MODE === 'electron') {
        window.electronAPI.installUpdate()
      }
    }

    return {
      version,
      essentialLinks: linksList,
      leftDrawerOpen,
      updateAvailable,
      updateVersion,
      installUpdate,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
    }
  },
})
</script>
