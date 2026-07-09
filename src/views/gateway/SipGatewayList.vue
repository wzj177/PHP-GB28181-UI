<template>
  <div class="sip-gateway-page">
    <div class="page-header">
      <h2>SIP 网关管理</h2>
      <p class="page-description">管理 SIP 网关集群实例，监控网关状态和设备绑定</p>
    </div>

    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="网关名称">
          <el-input
            v-model="filters.gateway_name"
            placeholder="搜索网关名称"
            clearable
            style="width: 200px"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="在线" value="active" />
            <el-option label="离线" value="inactive" />
            <el-option label="已禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="消息队列">
          <el-select v-model="filters.mq_type" placeholder="全部" clearable style="width: 130px">
            <el-option label="Redis" value="redis" />
            <el-option label="RabbitMQ" value="rabbitmq" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="gateways" style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="gateway_id" label="网关标识" min-width="130" show-overflow-tooltip />
        <el-table-column prop="gateway_name" label="网关名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="server_id" label="国标编码" min-width="160" show-overflow-tooltip />
        <el-table-column label="SIP 地址" min-width="140">
          <template #default="{ row }">{{ row.sip_host }}:{{ row.sip_port }}</template>
        </el-table-column>
        <el-table-column prop="transport" label="传输协议" width="90" align="center" />
        <el-table-column label="TCP状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.tcp_status" :type="tcpStatusTagType(row.tcp_status)" size="small">
              {{ tcpStatusLabel(row.tcp_status) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="tcp_pid" label="TCP PID" width="90" align="center" />
        <el-table-column prop="public_ip" label="公网IP" min-width="130" show-overflow-tooltip />
        <el-table-column label="消息队列" width="100" align="center">
          <template #default="{ row }">{{ row.mq_type === 'redis' ? 'Redis' : 'RabbitMQ' }}</template>
        </el-table-column>
        <el-table-column label="自动查询" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.catalog_auto_query === 1 ? 'success' : 'info'" size="small">
              {{ row.catalog_auto_query === 1 ? '注册时查询' : '不自动查询' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="UDP状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="UDP PID" width="90" align="center">
          <template #default="{ row }">{{ row.pid ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="设备数" width="80" align="center">
          <template #default="{ row }">{{ row.device_count }}</template>
        </el-table-column>
        <el-table-column label="最后心跳" width="175">
          <template #default="{ row }">{{ row.last_seen_at ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
            <el-button type="danger" link :icon="Delete" @click="deleteGateway(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadGateways"
          @current-change="loadGateways"
        />
      </div>
    </el-card>

    <!-- 表单抽屉 -->
    <SipGatewayFormDialog
      v-model="dialog.visible"
      :gateway-id="dialog.gatewayId"
      :readonly="dialog.readonly"
      @success="onSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete } from '@element-plus/icons-vue'
import { sipGatewayApi } from '@/api/sipGatewayApi'
import type { SipGateway, SipGatewayStatus } from '@/types/sipGateway'
import SipGatewayFormDialog from './SipGatewayFormDialog.vue'

const loading = ref(false)
const gateways = ref<SipGateway[]>([])
const filters = ref({
  gateway_name: '',
  status: undefined as SipGatewayStatus | undefined,
  mq_type: undefined as string | undefined
})
const pagination = ref({ page: 1, limit: 20, total: 0 })
const dialog = ref({ visible: false, gatewayId: null as number | null, readonly: false })

const statusTagType = (status: SipGatewayStatus) => {
  const map: Record<SipGatewayStatus, '' | 'success' | 'info' | 'danger'> = {
    active: 'success',
    inactive: 'info',
    disabled: 'danger'
  }
  return map[status] || 'info'
}

const statusLabel = (status: SipGatewayStatus) => {
  const map: Record<SipGatewayStatus, string> = {
    active: '在线',
    inactive: '离线',
    disabled: '已禁用'
  }
  return map[status] || status
}

const tcpStatusLabel = (s?: string) => {
  const map: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    stop: '已停止',
    error: '异常',
    starting: '启动中',
    exited: '已退出',
    crashed: '崩溃'
  }
  return (s && map[s]) || s || '-'
}

const tcpStatusTagType = (s?: string): 'success' | 'info' | 'warning' | 'danger' => {
  const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    running: 'success',
    stopped: 'info',
    stop: 'info',
    error: 'danger',
    starting: 'warning',
    exited: 'info',
    crashed: 'danger'
  }
  return (s && map[s]) || 'warning'
}

const loadGateways = async () => {
  loading.value = true
  try {
    const offset = (pagination.value.page - 1) * pagination.value.limit
    const data = await sipGatewayApi.getGatewayList({
      gateway_name: filters.value.gateway_name || undefined,
      status: filters.value.status,
      mq_type: filters.value.mq_type as any,
      start: offset,
      limit: pagination.value.limit
    })
    gateways.value = data.list
    pagination.value.total = data.paginator.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取网关列表失败')
  } finally {
    loading.value = false
  }
}

const search = () => {
  pagination.value.page = 1
  loadGateways()
}

const resetFilters = () => {
  filters.value = { gateway_name: '', status: undefined, mq_type: undefined }
  search()
}

const openDetail = (gateway: SipGateway) => {
  dialog.value = { visible: true, gatewayId: gateway.id, readonly: true }
}

const onSuccess = () => loadGateways()

const deleteGateway = async (gateway: SipGateway) => {
  await ElMessageBox.confirm(`确定要删除网关 "${gateway.gateway_name}" 吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确定删除',
    confirmButtonClass: 'el-button--danger'
  })
  try {
    await sipGatewayApi.deleteGateway(gateway.id)
    ElMessage.success('删除成功')
    loadGateways()
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  }
}

onMounted(() => loadGateways())
</script>

<style scoped lang="scss">
.sip-gateway-page {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;
}

.page-header {
  margin-bottom: 16px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 500;
    color: var(--text-main);
  }

  .page-description {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
  }
}

.filter-card {
  margin-bottom: 16px;

  .filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin: 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
}

.table-card {
  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
