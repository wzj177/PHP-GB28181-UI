<template>
  <div class="not-found-container">
    <div class="error-content">
      <h1>404</h1>
      <h2>页面不存在</h2>
      <p>抱歉，您访问的页面不存在。</p>
      <el-button
        type="primary"
        @click="goHome"
      >
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;

  .error-content {
    text-align: center;
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    h1 {
      font-size: 72px;
      color: #409eff;
      margin: 0 0 10px 0;
    }

    h2 {
      font-size: 24px;
      color: #303133;
      margin: 0 0 15px 0;
    }

    p {
      color: #909399;
      margin: 0 0 20px 0;
    }
  }
}
</style>