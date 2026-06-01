<template>
  <el-drawer
    :model-value="modelValue"
    :title="readonly ? '网关详情' : (gatewayId ? '编辑网关' : '新建网关')"
    size="780px"
    @close="handleClose"
    @open="onOpen"
  >
    <el-form ref="formRef" :model="form" :rules="readonly ? {} : rules" :disabled="readonly" label-width="120px">
      <el-tabs v-model="activeTab">
        <!-- Tab 1: 基础信息 -->
        <el-tab-pane label="基础信息" name="basic">
          <el-form-item label="网关标识" prop="gateway_id">
            <el-input v-model="form.gateway_id" placeholder="如 gw-bj-001" :disabled="!!gatewayId">
              <template #append>
                <el-button @click="generateGatewayId">随机生成</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="网关名称" prop="gateway_name">
            <el-input v-model="form.gateway_name" placeholder="如 北京网关-01">
              <template #append>
                <el-button @click="generateGatewayName">随机生成</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="国标编码" prop="server_id">
            <el-input v-model="form.server_id" placeholder="20位国标编码，自动生成" maxlength="20" @input="onServerIdInput">
              <template #append>
                <el-button @click="generateServerId">自动生成</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="SIP 域" prop="server_domain">
            <el-input v-model="form.server_domain" placeholder="自动取国标编码前10位" disabled />
            <div class="form-tip">自动取国标编码前10位</div>
          </el-form-item>

          <el-divider content-position="left">SIP 连接</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="监听地址" prop="sip_host">
                <el-input v-model="form.sip_host" placeholder="0.0.0.0" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="监听端口" prop="sip_port">
                <el-input-number v-model="form.sip_port" :min="1" :max="65535" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="传输协议" prop="transport">
                <el-select v-model="form.transport" style="width: 100%">
                  <el-option label="UDP" value="UDP" />
                  <el-option label="TCP" value="TCP" />
                  <el-option label="ALL (TCP & UDP)" value="ALL" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="公网 IP" prop="public_ip">
                <el-input v-model="form.public_ip" placeholder="用于 NAT 穿透" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 运行状态（仅详情模式显示） -->
          <template v-if="readonly">
            <el-divider content-position="left">TCP 进程状态</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="TCP 状态">
                  <el-tag v-if="detail.tcp_status" :type="detail.tcp_status === 'running' ? 'success' : 'danger'" size="small">
                    {{ detail.tcp_status === 'running' ? '运行中' : detail.tcp_status }}
                  </el-tag>
                  <span v-else>-</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="TCP PID">
                  {{ detail.tcp_pid ?? '-' }}
                </el-form-item>
              </el-col>
            </el-row>
          </template>
        </el-tab-pane>

        <!-- Tab 2: 设备认证 -->
        <el-tab-pane label="设备认证" name="auth">
          <el-form-item label="接入密码" prop="device_password">
            <el-input v-model="form.device_password" placeholder="设备统一接入密码" show-password>
              <template #append>
                <el-button @click="generatePassword">随机</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="启用认证" prop="authentication">
            <el-switch
              v-model="form.authentication" :active-value="1"
              :inactive-value="0"
            />
          </el-form-item>
          <el-form-item label="SIP 用户名" prop="sip_username">
            <el-input v-model="form.sip_username" />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="注册有效期(秒)" prop="register_expires">
                <el-input-number v-model="form.register_expires" :min="60" :step="60" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="心跳间隔(秒)" prop="keepalive_interval">
                <el-input-number v-model="form.keepalive_interval" :min="10" :step="10" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="心跳超时(秒)" prop="heartbeat_timeout">
                <el-input-number v-model="form.heartbeat_timeout" :min="30" :step="30" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="心跳丢失阈值" prop="keepalive_lost_number">
                <el-input-number v-model="form.keepalive_lost_number" :min="1" :max="10" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- Tab 3: 高级选项 -->
        <el-tab-pane label="高级选项" name="advanced">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="自动查询目录">
                <el-radio-group v-model="form.catalog_auto_query">
                  <el-radio :value="1">注册时自动查询</el-radio>
                  <el-radio :value="0">不自动查询</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="字符编码">
                <el-select v-model="form.encoding_type" style="width: 100%">
                  <el-option label="GB2312" value="GB2312" />
                  <el-option label="UTF-8" value="UTF-8" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Task 进程数">
                <el-input-number v-model="form.task_worker_num" :min="1" :max="32" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="定时器间隔">
                <el-input-number v-model="form.timer_interval" :min="10" :step="10" style="width: 100%" />
                <div class="form-tip">秒</div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="最大设备数">
                <el-input-number v-model="form.max_devices" :min="1" :step="1000" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="广播等ACK推流">
                <el-switch v-model="form.broadcast_push_after_ack" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- Tab 4: 消息队列 -->
        <el-tab-pane label="消息队列" name="mq">
          <el-form-item label="队列类型" prop="mq_type">
            <el-radio-group v-model="form.mq_type">
              <el-radio value="redis">Redis</el-radio>
              <el-radio value="rabbitmq">RabbitMQ</el-radio>
            </el-radio-group>
          </el-form-item>

          <template v-if="form.mq_type === 'redis'">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Redis 主机">
                  <el-input v-model="form.redis_config.host" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Redis 端口">
                  <el-input-number v-model="form.redis_config.port" :min="1" :max="65535" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Redis 密码">
                  <el-input v-model="form.redis_config.password" show-password />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Redis 数据库">
                  <el-input-number v-model="form.redis_config.database" :min="0" :max="15" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="Redis 前缀">
              <el-input v-model="form.redis_config.prefix" />
            </el-form-item>
          </template>

          <template v-if="form.mq_type === 'rabbitmq'">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="MQ 主机">
                  <el-input v-model="form.mq_config.host" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="MQ 端口">
                  <el-input-number v-model="form.mq_config.port" :min="1" :max="65535" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="MQ 用户名">
                  <el-input v-model="form.mq_config.user" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="MQ 密码">
                  <el-input v-model="form.mq_config.password" show-password />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="MQ VHost">
              <el-input v-model="form.mq_config.vhost" />
            </el-form-item>
          </template>
        </el-tab-pane>

        <!-- Tab 5: API 回调 -->
        <el-tab-pane label="API 回调" name="api">
          <el-form-item label="Hook URL">
            <el-input v-model="form.api_config.hock_url" placeholder="http://127.0.0.1:8886/api/v2/gb/server/hook" />
          </el-form-item>
          <el-form-item label="Pull URL">
            <el-input v-model="form.api_config.pull_url" placeholder="http://127.0.0.1:8886/api/v2/gb/devices/pull" />
          </el-form-item>
          <el-form-item label="API Token">
            <el-input v-model="form.api_config.token" show-password />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="日志级别">
                <el-select v-model="form.log_level" style="width: 100%">
                  <el-option label="DEBUG" value="DEBUG" />
                  <el-option label="INFO" value="INFO" />
                  <el-option label="WARNING" value="WARNING" />
                  <el-option label="ERROR" value="ERROR" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="调试模式">
                <el-switch v-model="form.debug" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <template #footer>
      <template v-if="readonly">
        <el-button @click="handleClose">关闭</el-button>
      </template>
      <template v-else>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { sipGatewayApi } from '@/api/sipGatewayApi'
import type { SipGatewayFormData, RedisConfig, MqConfig, ApiConfig } from '@/types/sipGateway'

const props = defineProps<{
  modelValue: boolean
  gatewayId?: number | null
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const activeTab = ref('basic')

interface FormState extends SipGatewayFormData {
  redis_config: RedisConfig
  mq_config: MqConfig
  api_config: ApiConfig
}

const defaultForm = (): FormState => ({
  gateway_id: '',
  gateway_name: '',
  server_id: '',
  server_domain: '',
  sip_host: '0.0.0.0',
  sip_port: 5060,
  transport: 'UDP',
  public_ip: '',
  device_password: '12345678',
  authentication: 1,
  sip_username: 'admin',
  register_expires: 3600,
  keepalive_interval: 60,
  heartbeat_timeout: 180,
  keepalive_lost_number: 3,
  catalog_auto_query: 1,
  encoding_type: 'GB2312',
  task_worker_num: 4,
  timer_interval: 60,
  max_devices: 10000,
  broadcast_push_after_ack: true,
  mq_type: 'redis',
  redis_config: { host: '127.0.0.1', password: '', port: 6379, database: 11, prefix: 'gbvr_iot_gb_gateway_' },
  mq_config: { host: '127.0.0.1', port: 5672, user: 'guest', password: 'guest', vhost: '/' },
  api_config: { hock_url: '', pull_url: '', token: '' },
  log_level: 'INFO',
  debug: false
})

const form = ref<FormState>(defaultForm())
const detail = ref<Record<string, any>>({})

const rules: FormRules = {
  gateway_id: [{ required: true, message: '请输入网关标识', trigger: 'blur' }],
  gateway_name: [{ required: true, message: '请输入网关名称', trigger: 'blur' }],
  server_id: [{ required: true, message: '请输入国标编码', trigger: 'blur' }],
  server_domain: [{ required: true, message: '请输入 SIP 域', trigger: 'blur' }]
}

// ====== 随机生成工具 ======

const randomStr = (len: number, chars = 'abcdefghijklmnopqrstuvwxyz0123456789') => {
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

const generateGatewayId = () => {
  form.value.gateway_id = `gw-${randomStr(3, 'abcdefghijklmnopqrstuvwxyz')}-${randomStr(3, '0123456789')}`
}

const generateGatewayName = () => {
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆']
  const city = cities[Math.floor(Math.random() * cities.length)]
  form.value.gateway_name = `${city}网关-${randomStr(2, '0123456789')}`
}

/** 国标编码规则：前10位为 SIP 域（区域编码），后10位为序号 */
const generateServerId = () => {
  // 区域编码 10 位 (如 3402000000)
  const area = '3402000000'
  // 序号 10 位随机
  const seq = randomStr(10, '0123456789')
  form.value.server_id = area + seq
  form.value.server_domain = area
}

const onServerIdInput = (val: string) => {
  form.value.server_domain = val.slice(0, 10)
}

const generatePassword = () => {
  form.value.device_password = randomStr(8, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
}

// ====== 生命周期 ======

const onOpen = async () => {
  form.value = defaultForm()
  activeTab.value = 'basic'
  if (props.gatewayId) {
    try {
      const detailData = await sipGatewayApi.getGatewayDetail(props.gatewayId)
      detail.value = detailData
      form.value = {
        ...form.value,
        ...detailData,
        authentication: detailData.authentication ? 1 : 0,
        redis_config: detailData.redis_config || form.value.redis_config,
        mq_config: detailData.mq_config as any || form.value.mq_config,
        api_config: detailData.api_config || form.value.api_config
      }
    } catch (e: any) {
      ElMessage.error(e.message || '获取网关详情失败')
    }
  }
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (props.gatewayId) {
      await sipGatewayApi.updateGateway(props.gatewayId, form.value)
    } else {
      await sipGatewayApi.createGateway(form.value)
    }
    ElMessage.success(props.gatewayId ? '更新成功' : '创建成功')
    emit('update:modelValue', false)
    emit('success')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.form-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  line-height: 1;
}

:deep(.el-tabs__content) {
  padding: 0 0 16px;
}

:deep(.el-divider) {
  margin: 24px 0 16px;
}
</style>
