<template>
  <div class="fullscreen bg-blue-grey-1 text-grey-9 flex flex-center">
    <div class="column items-center">
      <div class="text-h1">404</div>
      <div class="text-h4 q-mb-md">页面不存在</div>
      <q-btn
        color="primary"
        icon="home"
        label="返回首页"
        to="/"
        no-caps
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ErrorNotFound'
});
</script>
