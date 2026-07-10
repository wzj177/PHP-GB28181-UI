<template>
  <div class="stream-proxy-container">
    <!-- 统计摘要 -->
    <div class="summary-section">
      <div class="summary-card total">
        <div class="summary-icon"><el-icon><Connection /></el-icon></div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.total || 0 }}</div>
          <div class="summary-label">总数</div>
        </div>
      </div>
      <div class="summary-card online">
        <div class="summary-icon"><el-icon><SuccessFilled /></el-icon></div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.by_status?.online || 0 }}</div>
          <div class="summary-label">在线</div>
        </div>
      </div>
      <div class="summary-card offline">
        <div class="summary-icon"><el-icon><WarningFilled /></el-icon></div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.by_status?.offline || 0 }}</div>
          <div class="summary-label">离线</div>
        </div>
      </div>
      <div class="summary-card stopped">
        <div class="summary-icon"><el-icon><CircleCloseFilled /></el-icon></div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.by_status?.stopped || 0 }}</div>
          <div class="summary-label">已停止</div>
        </div>
      </div>
      <div class="summary-card error">
        <div class="summary-icon"><el-icon><CircleCloseFilled /></el-icon></div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.by_status?.error || 0 }}</div>
          <div class="summary-label">异常</div>
        </div>
      </div>
    </div>

    <!-- 搜索过滤 -->
    <div class="search-filters">
      <ElSelect v-model="filters.type" placeholder="类型" clearable style="width: 120px; margin-right: 10px;">
        <ElOption label="拉流" value="pull" />
        <ElOption label="推流" value="push" />
      </ElSelect>
      <ElSelect v-model="filters.protocol" placeholder="协议" clearable style="width: 130px; margin-right: 10px;">
        <ElOption label="RTSP" value="rtsp" />
        <ElOption label="RTMP" value="rtmp" />
        <ElOption label="HTTP-FLV" value="http-flv" />
      </ElSelect>
      <ElSelect v-model="filters.status" placeholder="状态" clearable style="width: 120px; margin-right: 10px;">
        <ElOption label="在线" value="online" />
        <ElOption label="离线" value="offline" />
        <ElOption label="已停止" value="stopped" />
        <ElOption label="异常" value="error" />
      </ElSelect>
      <ElInput
        v-model="filters.keyword"
        placeholder="搜索名称/地址"
        style="width: 220px; margin-right: 10px;"
        clearable
        @keyup.enter="search"
      />
      <ElButton type="primary" @click="search">搜索</ElButton>
      <ElButton @click="resetFilters">重置</ElButton>
      <ElButton @click="fetchList">刷新</ElButton>
      <ElButton type="success" @click="openCreateDialog">新增</ElButton>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <ElTable v-loading="loading" :data="list" style="width: 100%">
        <ElTableColumn prop="name" label="名称" min-width="150" show-overflow-tooltip />
        <ElTableColumn label="类型" width="80">
          <template #default="{ row }">
            <ElTag :type="row.type === 'pull' ? 'primary' : 'warning'" size="small">
              {{ row.type === 'pull' ? '拉流' : '推流' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="protocol" label="协议" width="90">
          <template #default="{ row }">
            <ElTag type="info" size="small">{{ row.protocol?.toUpperCase() }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="source_url" label="源地址" min-width="200" show-overflow-tooltip />
        <ElTableColumn label="在线人数" width="90">
          <template #default="{ row }">{{ row.viewer_count || 0 }}</template>
        </ElTableColumn>
        <ElTableColumn label="录像" width="80">
          <template #default="{ row }">
            <ElTag v-if="row.record_status === 1" type="danger" size="small">录像中</ElTag>
            <span v-else class="text-muted">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="last_heartbeat_at" label="最后心跳" width="175" show-overflow-tooltip />
        <ElTableColumn prop="description" label="描述" min-width="120" show-overflow-tooltip />
        <ElTableColumn label="操作" min-width="390" fixed="right">
          <template #default="{ row }">
            <ElButton v-if="row.type === 'pull'" size="small" type="success" :disabled="row.status === 'online'" @click="handleStart(row)">启动</ElButton>
            <ElButton v-if="row.type === 'pull'" size="small" type="warning" :disabled="row.status === 'stopped'" @click="handleStop(row)">停止</ElButton>
            <ElButton v-if="row.type === 'pull'" size="small" type="info" @click="handleRestart(row)">重启</ElButton>
            <ElButton size="small" type="primary" @click="handlePlay(row)">播放</ElButton>
            <ElButton v-if="row.type === 'push'" size="small" @click="showPushUrl(row)">推流地址</ElButton>
            <ElButton size="small" type="primary" @click="openEditDialog(row)">编辑</ElButton>
            <ElButton size="small" type="danger" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <ElPagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <ElDialog
      v-model="formDialog.visible"
      :title="formDialog.isEdit ? '编辑流代理' : '新增流代理'"
      width="620px"
      @close="resetFormDialog"
    >
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="formData.name" placeholder="请输入名称" />
        </ElFormItem>
        <ElFormItem label="类型" prop="type">
          <ElSelect v-model="formData.type" placeholder="请选择类型" style="width: 100%;" @change="onTypeChange">
            <ElOption label="拉流 (Pull)" value="pull" />
            <ElOption label="推流 (Push)" value="push" />
          </ElSelect>
          <div v-if="formData.type === 'push'" class="form-tip-push">
            推流由 OBS / FFmpeg 等客户端主动接入，创建后可在操作列查看推流地址
          </div>
        </ElFormItem>
        <ElFormItem label="协议" prop="protocol">
          <ElSelect v-model="formData.protocol" placeholder="请选择协议" style="width: 100%;">
            <ElOption label="RTSP" value="rtsp" />
            <ElOption label="RTMP" value="rtmp" />
            <ElOption label="HTTP-FLV" value="http-flv" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="formData.type === 'push'" prop="stream">
          <template #label>
            <span>推流ID</span>
            <ElTooltip placement="top">
              <template #content>
                <div>自定义推流ID，方便在 OBS 中配置（如 obs_live_01）</div>
                <div>留空则系统自动生成 UUID</div>
                <div>仅支持字母、数字、下划线、横线</div>
              </template>
              <el-icon class="tip-icon"><QuestionFilled /></el-icon>
            </ElTooltip>
          </template>
          <ElInput
            v-model="formData.stream"
            :disabled="formDialog.isEdit"
            placeholder="留空自动生成，如 obs_live_01"
            clearable
          />
        </ElFormItem>
        <ElFormItem v-if="formData.type === 'pull'" prop="source_url">
          <template #label>
            <span>源地址</span>
            <ElTooltip placement="top" :width="340">
              <template #content>
                <div class="rtsp-tip">
                  <div class="rtsp-tip-title">常见设备 RTSP 地址格式</div>
                  <div class="rtsp-tip-item">
                    <span class="brand">海康威视</span>
                    <div class="addr">主码流：rtsp://用户名:密码@IP:554/Streaming/Channels/101</div>
                    <div class="addr">子码流：rtsp://用户名:密码@IP:554/Streaming/Channels/102</div>
                  </div>
                  <div class="rtsp-tip-item">
                    <span class="brand">大华</span>
                    <div class="addr">主码流：rtsp://用户名:密码@IP:554/cam/realmonitor?channel=1&amp;subtype=0</div>
                    <div class="addr">子码流：rtsp://用户名:密码@IP:554/cam/realmonitor?channel=1&amp;subtype=1</div>
                  </div>
                  <div class="rtsp-tip-item">
                    <span class="brand">宇视</span>
                    <div class="addr">rtsp://用户名:密码@IP:554/video1</div>
                  </div>
                  <div class="rtsp-tip-item">
                    <span class="brand">华为</span>
                    <div class="addr">rtsp://用户名:密码@IP:554/LiveMedia/ch1/Media1</div>
                  </div>
                  <div class="rtsp-tip-item">
                    <span class="brand">天地伟业</span>
                    <div class="addr">rtsp://用户名:密码@IP:554/mpeg4/1/media.amp</div>
                  </div>
                  <div class="rtsp-tip-note">默认端口 554 可省略；用户名/密码含特殊字符需 URL 编码</div>
                </div>
              </template>
              <el-icon class="tip-icon"><QuestionFilled /></el-icon>
            </ElTooltip>
          </template>
          <ElInput v-model="formData.source_url" placeholder="rtsp://用户名:密码@IP:554/stream路径" clearable />
        </ElFormItem>
        <ElFormItem label="流媒体服务器" prop="media_server_id">
          <ElSelect v-model="formData.media_server_id" placeholder="请选择流媒体服务器" style="width: 100%;">
            <ElOption
              v-for="s in mediaServerOptions"
              :key="s.id"
              :label="s.name || s.id"
              :value="String(s.id)"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="formData.type === 'pull'" label="RTP传输方式" prop="rtp_type">
          <ElSelect v-model="formData.rtp_type" style="width: 100%;">
            <ElOption label="TCP" :value="0" />
            <ElOption label="UDP" :value="1" />
          </ElSelect>
        </ElFormItem>
        <ElRow :gutter="20">
          <ElCol :span="8">
            <ElFormItem label="启用HLS">
              <ElSwitch v-model="formData.enable_hls" :active-value="1" :inactive-value="0" />
            </ElFormItem>
          </ElCol>
          <ElCol v-if="formData.type === 'pull'" :span="8">
            <ElFormItem label="启用MP4">
              <ElSwitch v-model="formData.enable_mp4" :active-value="1" :inactive-value="0" />
            </ElFormItem>
          </ElCol>
          <ElCol v-if="formData.type === 'pull'" :span="8">
            <ElFormItem label="自动重连">
              <ElSwitch v-model="formData.enable_auto_reconnect" :active-value="1" :inactive-value="0" />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow v-if="formData.type === 'pull'" :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="最大重试次数">
              <ElInputNumber v-model="formData.max_retry_count" :min="0" :max="100" style="width: 100%;" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="超时时间(秒)">
              <ElInputNumber v-model="formData.timeout_sec" :min="1" :max="60" style="width: 100%;" />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem label="描述">
          <ElInput v-model="formData.description" type="textarea" :rows="2" placeholder="可选" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="formDialog.visible = false">取消</ElButton>
        <ElButton type="primary" :loading="formDialog.loading" @click="handleSubmit">保存</ElButton>
      </template>
    </ElDialog>

    <!-- 播放器（复用通道列表同款 AggregatedPlayer，左侧播放器 + 右侧播放地址列表） -->
    <AggregatedPlayer
      v-model="playDialog.visible"
      :stream-info="playDialog.streamInfo"
      is-live
      show-play-url-list
    />

    <!-- 推流地址弹窗 -->
    <ElDialog v-model="pushUrlDialog.visible" title="推流地址" width="600px">
      <div v-if="pushUrlDialog.data" class="push-url-box">
        <div class="push-obs">
          <div class="push-obs-title">📺 OBS 推流配置</div>
          <div class="push-obs-row">
            <span class="push-obs-label">服务器</span>
            <code>{{ pushServer }}</code>
            <ElButton text @click="copyUrl(pushServer)">复制</ElButton>
          </div>
          <div class="push-obs-row">
            <span class="push-obs-label">串流密钥</span>
            <code>{{ pushUrlDialog.data.stream_id }}</code>
            <ElButton text @click="copyUrl(pushUrlDialog.data.stream_id)">复制</ElButton>
          </div>
        </div>
        <div class="push-url-item">
          <span class="url-key">RTMP</span>
          <ElInput :model-value="pushUrlDialog.data.rtmp" readonly style="flex: 1;">
            <template #append><ElButton @click="copyUrl(pushUrlDialog.data.rtmp)">复制</ElButton></template>
          </ElInput>
        </div>
        <div v-if="pushUrlDialog.data.rtsp" class="push-url-item">
          <span class="url-key">RTSP</span>
          <ElInput :model-value="pushUrlDialog.data.rtsp" readonly style="flex: 1;">
            <template #append><ElButton @click="copyUrl(pushUrlDialog.data.rtsp)">复制</ElButton></template>
          </ElInput>
        </div>
        <div v-if="pushUrlDialog.data.tips" class="push-help">
          <p v-if="pushUrlDialog.data.tips.obs_rtmp">{{ pushUrlDialog.data.tips.obs_rtmp }}</p>
          <p v-if="pushUrlDialog.data.tips.ffmpeg">{{ pushUrlDialog.data.tips.ffmpeg }}</p>
        </div>
      </div>
      <div v-else class="empty-urls">暂无推流地址</div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
// @ts-ignore
import { Connection, SuccessFilled, WarningFilled, CircleCloseFilled, QuestionFilled } from '@element-plus/icons-vue'
import { streamProxyApi } from '@/api/streamProxyApi'
import { mediaServerApi } from '@/api/mediaServerApi'
import { AggregatedPlayer } from '@/components/player'

interface StreamProxy {
  id: number
  proxy_id: string
  name: string
  type: 'pull' | 'push'
  protocol: string
  source_url?: string
  app?: string
  stream?: string
  media_server_id?: string
  status: 'online' | 'offline' | 'stopped' | 'error'
  last_heartbeat_at?: string
  error_message?: string
  record_plan_id?: number
  record_status?: number
  enable_auto_reconnect?: number
  max_retry_count?: number
  current_retry_count?: number
  timeout_sec?: number
  rtp_type?: number
  enable_hls?: number
  enable_mp4?: number
  viewer_count?: number
  description?: string
  tags?: string[]
}

interface Summary {
  total: number
  by_status: { online: number; offline: number; stopped: number; error: number }
  by_type: { pull: number; push: number }
}

// 列表数据
const list = ref<StreamProxy[]>([])
const loading = ref(false)
const summary = ref<Partial<Summary>>({})
const pagination = ref({ currentPage: 1, pageSize: 20, total: 0 })
const filters = ref({ type: '', protocol: '', status: '', keyword: '' })

// 流媒体服务器选项
const mediaServerOptions = ref<Array<{ id: string | number; name?: string }>>([])

const fetchMediaServers = async () => {
  try {
    const res: any = await mediaServerApi.getList()
    mediaServerOptions.value = res?.list || res || []
  } catch {
    // ignore
  }
}

const fetchSummary = async () => {
  try {
    const data: any = await streamProxyApi.getSummary()
    summary.value = data || {}
  } catch {
    // ignore
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      type: filters.value.type || undefined,
      protocol: filters.value.protocol || undefined,
      status: filters.value.status || undefined,
      keyword: filters.value.keyword || undefined,
      start: (pagination.value.currentPage - 1) * pagination.value.pageSize,
      limit: pagination.value.pageSize
    }
    const data: any = await streamProxyApi.getList(params)
    list.value = data?.list || []
    pagination.value.total = data?.paginator?.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取列表失败')
  } finally {
    loading.value = false
  }
}

const search = () => {
  pagination.value.currentPage = 1
  fetchList()
}

const resetFilters = () => {
  filters.value = { type: '', protocol: '', status: '', keyword: '' }
  pagination.value.currentPage = 1
  fetchList()
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  fetchList()
}

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page
  fetchList()
}

// 状态辅助
type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const getStatusType = (status: string): TagType => {
  const map: Record<string, TagType> = { online: 'success', offline: 'warning', stopped: 'info', error: 'danger' }
  return map[status] || 'info'
}
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = { online: '在线', offline: '离线', stopped: '已停止', error: '异常' }
  return map[status] || status
}

// 启动/停止/重启
const handleStart = async (row: StreamProxy) => {
  try {
    await streamProxyApi.start(row.id)
    ElMessage.success('启动成功')
    fetchList()
    fetchSummary()
  } catch (e: any) {
    ElMessage.error(e.message || '启动失败')
  }
}

const handleStop = async (row: StreamProxy) => {
  try {
    await ElMessageBox.confirm(`确定停止「${row.name}」？`, '提示', { type: 'warning' })
    await streamProxyApi.stop(row.id)
    ElMessage.success('已停止')
    fetchList()
    fetchSummary()
  } catch {
    // cancel
  }
}

const handleRestart = async (row: StreamProxy) => {
  try {
    await streamProxyApi.restart(row.id)
    ElMessage.success('重启成功')
    fetchList()
  } catch (e: any) {
    ElMessage.error(e.message || '重启失败')
  }
}

const handleDelete = async (row: StreamProxy) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」？此操作不可恢复。`, '警告', { type: 'warning' })
    await streamProxyApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchList()
    fetchSummary()
  } catch {
    // cancel
  }
}

// 播放：拉取 play-urls 后交给 AggregatedPlayer 播放（与通道列表播放器一致）
const playDialog = ref({ visible: false, streamInfo: null as any })
const handlePlay = async (row: StreamProxy) => {
  try {
    const data: any = await streamProxyApi.getPlayUrls(row.id)
    if (!data) {
      ElMessage.warning('暂无播放地址（流代理未启动）')
      return
    }
    playDialog.value = { visible: true, streamInfo: data }
  } catch (e: any) {
    ElMessage.error(e.message || '获取播放地址失败')
  }
}
const copyUrl = (url: string) => {
  navigator.clipboard.writeText(url).then(() => ElMessage.success('已复制'))
}

// 推流地址
const pushUrlDialog = ref({ visible: false, data: null as any })
// OBS 服务器地址 = RTMP 推流地址去掉最后的串流密钥段
const pushServer = computed(() => {
  const rtmp: string = pushUrlDialog.value.data?.rtmp || ''
  return rtmp.replace(/\/[^/]+$/, '')
})
const showPushUrl = async (row: StreamProxy) => {
  try {
    const data: any = await streamProxyApi.getPushUrl(row.id)
    pushUrlDialog.value = { visible: true, data: data || null }
  } catch (e: any) {
    ElMessage.error(e.message || '获取推流地址失败')
  }
}

// 表单
const formRef = ref<FormInstance>()
const formDialog = ref({ visible: false, isEdit: false, loading: false })
const defaultForm = () => ({
  id: 0,
  name: '',
  type: 'pull' as 'pull' | 'push',
  protocol: 'rtsp',
  source_url: '',
  stream: '',
  media_server_id: '',
  rtp_type: 0,
  enable_hls: 1,
  enable_mp4: 0,
  enable_auto_reconnect: 1,
  max_retry_count: 10,
  timeout_sec: 10,
  description: ''
})
const formData = ref(defaultForm())

const formRules = computed<FormRules>(() => ({
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  protocol: [{ required: true, message: '请选择协议', trigger: 'change' }],
  source_url: formData.value.type === 'pull'
    ? [{ required: true, message: '请输入源地址', trigger: 'blur' }]
    : [],
  stream: [{ pattern: /^[A-Za-z0-9_-]*$/, message: '仅支持字母、数字、下划线、横线', trigger: 'blur' }],
  media_server_id: [{ required: true, message: '请选择流媒体服务器', trigger: 'change' }]
}))

const onTypeChange = () => {
  formData.value.source_url = ''
}

const openCreateDialog = () => {
  formData.value = defaultForm()
  formDialog.value = { visible: true, isEdit: false, loading: false }
}

const openEditDialog = (row: StreamProxy) => {
  formData.value = {
    id: row.id,
    name: row.name,
    type: row.type,
    protocol: row.protocol,
    source_url: row.source_url || '',
    stream: row.stream || '',
    media_server_id: row.media_server_id || '',
    rtp_type: row.rtp_type ?? 0,
    enable_hls: row.enable_hls ?? 1,
    enable_mp4: row.enable_mp4 ?? 0,
    enable_auto_reconnect: row.enable_auto_reconnect ?? 1,
    max_retry_count: row.max_retry_count ?? 10,
    timeout_sec: row.timeout_sec ?? 10,
    description: row.description || ''
  }
  formDialog.value = { visible: true, isEdit: true, loading: false }
}

const resetFormDialog = () => {
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    formDialog.value.loading = true
    try {
      if (formDialog.value.isEdit) {
        // 标识字段不可改：type/protocol/stream/media_server_id，其余（含 source_url）均可更新
        const { id, type, protocol, stream, media_server_id, ...updatePayload } = formData.value
        await streamProxyApi.update(id, updatePayload)
        ElMessage.success('更新成功')
      } else {
        const { id, ...createPayload } = formData.value
        await streamProxyApi.create(createPayload as any)
        ElMessage.success('创建成功')
      }
      formDialog.value.visible = false
      fetchList()
      fetchSummary()
    } catch (e: any) {
      ElMessage.error(e.message || '操作失败')
    } finally {
      formDialog.value.loading = false
    }
  })
}

onMounted(async () => {
  await Promise.all([fetchSummary(), fetchList(), fetchMediaServers()])
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.stream-proxy-container {
  padding: 16px;
}

.summary-section {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  min-width: 130px;
  flex: 1;

  .summary-icon {
    font-size: 28px;
  }
  .summary-value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
  }
  .summary-label {
    font-size: 12px;
    color: #909399;
  }

  &.online .summary-icon { color: #67c23a; }
  &.offline .summary-icon { color: #e6a23c; }
  &.stopped .summary-icon { color: #909399; }
  &.error .summary-icon { color: #f56c6c; }
  &.total .summary-icon { color: #409eff; }
}

.search-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  margin-bottom: 16px;
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}

.empty-urls {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.push-url-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.push-obs {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 16px;

  .push-obs-title {
    font-weight: 600;
    margin-bottom: 8px;
    color: #303133;
  }

  .push-obs-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    margin-top: 6px;

    .push-obs-label {
      width: 64px;
      color: #909399;
      flex-shrink: 0;
    }

    code {
      flex: 1;
      background: #fff;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      padding: 4px 8px;
      word-break: break-all;
      color: #303133;
    }
  }
}

.push-url-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .url-key {
    width: 60px;
    font-size: 12px;
    font-weight: 600;
    color: #606266;
    flex-shrink: 0;
  }
}

.push-help {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
  background: #fafafa;
  border-radius: 6px;
  padding: 8px 12px;

  p {
    margin: 0;
    word-break: break-all;
  }
}

.text-muted {
  color: #c0c4cc;
}

.tip-icon {
  margin-left: 4px;
  color: #909399;
  cursor: pointer;
  font-size: 14px;
  vertical-align: middle;
  &:hover { color: #409eff; }
}

.form-tip-push {
  margin-top: 6px;
  font-size: 12px;
  color: #e6a23c;
  line-height: 1.5;
}
</style>

<style lang="scss">
.rtsp-tip {
  font-size: 12px;
  line-height: 1.6;
  max-width: 340px;

  .rtsp-tip-title {
    font-weight: 700;
    font-size: 13px;
    margin-bottom: 8px;
    color: #fff;
  }

  .rtsp-tip-item {
    margin-bottom: 8px;

    .brand {
      display: inline-block;
      background: rgba(255,255,255,0.15);
      border-radius: 3px;
      padding: 0 5px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .addr {
      color: #b3d8ff;
      word-break: break-all;
      padding-left: 4px;
    }
  }

  .rtsp-tip-note {
    margin-top: 6px;
    color: #e6a23c;
    border-top: 1px solid rgba(255,255,255,0.15);
    padding-top: 6px;
  }
}
</style>
