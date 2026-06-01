<template>
  <div class="setting-container">
    <el-tabs v-model="activeName" @tab-click="handleTabClick">
      <el-tab-pane label="基础配置" name="basic">
        <BasicTab ref="basicTabRef" />
      </el-tab-pane>
      <el-tab-pane label="附件配置" name="attachment">
        <AttachmentTab ref="attachmentTabRef" />
      </el-tab-pane>
      <el-tab-pane label="安全配置" name="auth">
        <AuthTab ref="authTabRef" />
      </el-tab-pane>
      <el-tab-pane label="存储配置" name="storage">
        <StorageTab ref="storageTabRef" />
      </el-tab-pane>
      <el-tab-pane label="CDN配置" name="cdn">
        <CDNTab ref="cdnTabRef" />
      </el-tab-pane>
      <el-tab-pane label="邮件配置" name="mail">
        <MailTab ref="mailTabRef" />
      </el-tab-pane>
      <el-tab-pane label="会员端配置" name="vip">
        <VIPTab ref="vipTabRef" />
      </el-tab-pane>
      <el-tab-pane label="IP名单" name="ip">
        <IPCheckTab ref="ipTabRef" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { TabsPaneContext } from 'element-plus'
import BasicTab from './tabs/BasicTab.vue'
import AttachmentTab from './tabs/AttachmentTab.vue'
import AuthTab from './tabs/AuthTab.vue'
import StorageTab from './tabs/StorageTab.vue'
import CDNTab from './tabs/CDNTab.vue'
import MailTab from './tabs/MailTab.vue'
import VIPTab from './tabs/VIPTab.vue'
import IPCheckTab from './tabs/IPCheckTab.vue'

const activeName = ref('basic')

const basicTabRef = ref()
const attachmentTabRef = ref()
const authTabRef = ref()
const storageTabRef = ref()
const cdnTabRef = ref()
const mailTabRef = ref()
const vipTabRef = ref()
const ipTabRef = ref()

const tabRefsMap: Record<string, typeof basicTabRef> = {
  basic: basicTabRef,
  attachment: attachmentTabRef,
  auth: authTabRef,
  storage: storageTabRef,
  cdn: cdnTabRef,
  mail: mailTabRef,
  vip: vipTabRef,
  ip: ipTabRef
}

const handleTabClick = (tab: TabsPaneContext) => {
  const tabName = String(tab.paneName)
  const tabRef = tabRefsMap[tabName]
  tabRef.value?.initDataSource()
}

// 初始加载 basic 数据
onMounted(() => {
  basicTabRef.value?.initDataSource()
})
</script>

<style lang="scss" scoped>
.setting-container {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;

  :deep(.el-tabs__content) {
    background: var(--bg-panel);
    border-radius: 4px;
    padding: 20px;
  }
}
</style>
