<template>
  <div class="page">
    <div class="grid">
      <!-- 主控制 -->
      <div class="panel">
        <h3>方向控制</h3>
        <div class="ptz-main">
          <div class="pad">
            <div
              class="dir up"
              @mousedown="startPtzCommand('up')"
              @mouseup="stopPtzCommand()"
              @mouseleave="stopPtzCommand()"
            >
              ▲
            </div>
            <div
              class="dir down"
              @mousedown="startPtzCommand('down')"
              @mouseup="stopPtzCommand()"
              @mouseleave="stopPtzCommand()"
            >
              ▼
            </div>
            <div
              class="dir left"
              @mousedown="startPtzCommand('left')"
              @mouseup="stopPtzCommand()"
              @mouseleave="stopPtzCommand()"
            >
              ◀
            </div>
            <div
              class="dir right"
              @mousedown="startPtzCommand('right')"
              @mouseup="stopPtzCommand()"
              @mouseleave="stopPtzCommand()"
            >
              ▶
            </div>
            <div
              class="dir upleft"
              @mousedown="startPtzCommand('upleft')"
              @mouseup="stopPtzCommand()"
              @mouseleave="stopPtzCommand()"
            >
              ↖
            </div>
            <div
              class="dir upright"
              @mousedown="startPtzCommand('upright')"
              @mouseup="stopPtzCommand()"
              @mouseleave="stopPtzCommand()"
            >
              ↗
            </div>
            <div
              class="dir downleft"
              @mousedown="startPtzCommand('downleft')"
              @mouseup="stopPtzCommand()"
              @mouseleave="stopPtzCommand()"
            >
              ↙
            </div>
            <div
              class="dir downright"
              @mousedown="startPtzCommand('downright')"
              @mouseup="stopPtzCommand()"
              @mouseleave="stopPtzCommand()"
            >
              ↘
            </div>
            <div class="center">
              PTZ
            </div>
          </div>

          <div class="controls">
            <div class="row">
              <span class="label">速度</span>
              <ElSlider
                v-model="speed"
                :min="1"
                :max="10"
                :step="1"
                show-stops
              />
            </div>

            <div class="btn-group">
              <ElButton
                size="small"
                @mousedown="startZoomCommand('tele')"
                @mouseup="stopZoomCommand()"
                @mouseleave="stopZoomCommand()"
              >
                变倍 +
              </ElButton>
              <ElButton
                size="small"
                @mousedown="startZoomCommand('wide')"
                @mouseup="stopZoomCommand()"
                @mouseleave="stopZoomCommand()"
              >
                变倍 −
              </ElButton>
              <ElButton
                size="small"
                @mousedown="startFocusCommand('focus_far')"
                @mouseup="stopFocusCommand()"
                @mouseleave="stopFocusCommand()"
              >
                远焦
              </ElButton>
              <ElButton
                size="small"
                @mousedown="startFocusCommand('focus_near')"
                @mouseup="stopFocusCommand()"
                @mouseleave="stopFocusCommand()"
              >
                近焦
              </ElButton>
              <ElButton
                size="small"
                @click="irisCommand('iris_open')"
              >
                光圈 +
              </ElButton>
              <ElButton
                size="small"
                @click="irisCommand('iris_close')"
              >
                光圈 -
              </ElButton>
            </div>

            <div class="voice-speak">
              <VoiceTalkControl
                ref="voiceTalkRef"
                :device-id="ids?.deviceId || ''"
                :channel-id="ids?.channelId || ''"
                :debug="false"
                title="语音对讲"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 预置位 -->
      <div class="panel">
        <h3>预置位（1–255）</h3>
        <div
          id="presetList"
          class="preset-list"
        >
          <div
            v-for="i in 255"
            :key="i"
            class="preset"
          >
            <span v-if="isPresetSet(i)">{{ i }} · {{ getPresetName(i) }}</span>
            <span v-else>{{ i }} · 预置位{{ i }}</span>
            <div>
              <ElButton
                v-if="isPresetSet(i)"
                size="small"
                type="primary"
                @click="gotoPreset(i)"
              >
                调用
              </ElButton>
              <ElButton
                v-if="isPresetSet(i)"
                size="small"
                type="danger"
                @click="deletePreset(i)"
              >
                删除
              </ElButton>
              <ElButton
                v-if="!isPresetSet(i)"
                size="small"
                type="success"
                :loading="settingPresets.has(i)"
                @click="setPreset(i)"
              >
                设置
              </ElButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 巡航 -->
    <!-- <div
      class="panel"
      style="width: 100%; margin-top: 16px;"
    >
      <ElRow>
        <ElCol :span="12">
          <h3 style="margin-top: 0;">
            巡航（Cruise）
          </h3>
          <div class="controls">
            <div class="row">
              <span class="label">巡航号</span>
              <ElSelect
                v-model="cruiseId"
                size="small"
                @change="loadCruisePoints()"
              >
                <ElOption
                  value="1"
                  label="巡航 1"
                />
                <ElOption
                  value="2"
                  label="巡航 2"
                />
                <ElOption
                  value="3"
                  label="巡航 3"
                />
              </ElSelect>
            </div>

            <div class="row">
              <span class="label">停留(s)</span>
              <ElInputNumber
                v-model.number="cruiseStay"
                :min="1"
                :max="60"
                size="small"
              />
            </div>

            <div class="row">
              <span class="label">速度</span>
              <ElInputNumber
                v-model.number="cruiseSpeed"
                :min="1"
                :max="8"
                size="small"
              />
            </div>

            <div class="btn-group">
              <ElButton
                type="primary"
                @click="addToCruise()"
              >
                加入巡航
              </ElButton>
              <ElButton
                type="success"
                @click="startCruise()"
              >
                开始巡航
              </ElButton>
              <ElButton
                type="danger"
                @click="stopCruise()"
              >
                停止巡航
              </ElButton>
            </div>
          </div>
        </ElCol>
        <ElCol :span="12">
          <div style="margin-top: 0;">
            <h3>巡航点列表</h3>
            <div
              id="cruisePointList"
              class="preset-list"
            >
              <div
                v-for="(point, index) in cruisePoints"
                :key="index"
                class="preset"
              >
                <span>预置位 {{ point }} - 位置 {{ index + 1 }}</span>
                <ElButton
                  size="small"
                  type="danger"
                  @click="removeFromCruise(index)"
                >
                  移除
                </ElButton>
              </div>
            </div>
          </div>
        </ElCol>
      </ElRow>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, onMounted, watch, computed } from "vue";
import {
  ElSlider,
  ElButton,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElRow,
  ElCol,
  ElMessage,
  ElMessageBox
} from 'element-plus';
import { gb28181Api } from '@/api/gb28181Api';
import VoiceTalkControl from './VoiceTalkControl.vue';

// Define props for component communication
interface Props {
  channelId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  channelId: "",
});

// 预置位数据接口
interface Preset {
  id: number;
  device_id: string;
  channel_id: string;
  value: number;
  name: string;
  created_at: string;
  updated_at: string;
}

// State variables
const speed = ref(5);  // Speed range: 1-255
const isPtzActive = ref(false);  // Track if PTZ command is active (mouse was pressed)
const presets = ref<Preset[]>([]);  // 从后端获取的预置位列表
const settingPresets = ref<Set<number>>(new Set());  // 正在设置中的预置位
const cruiseId = ref("1");
const cruiseStay = ref(5);
const cruiseSpeed = ref(4);
const cruisePoints = ref<number[]>([]);

// Voice talk control ref
const voiceTalkRef = ref<{ canStop: { value: boolean }; stop: () => Promise<void>; isConnected: { value: boolean } } | null>(null);

// 创建预置位映射表，方便查找
const presetMap = computed(() => {
  const map = new Map<number, Preset>();
  presets.value.forEach(preset => {
    map.set(preset.value, preset);
  });
  return map;
});

// Helper function to parse channelId
// Format: {device_id}-{channel_id}
const parseChannelId = () => {
  if (!props.channelId) {
    return null;
  }

  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    return null;
  }

  return {
    deviceId: parts[0],
    channelId: parts[1]
  };
};

// Computed property for voice talk component
const ids = computed(() => parseChannelId());

// PTZ control functions
const startPtzCommand = async (direction: string) => {
  const ids = parseChannelId();
  if (!ids) {
    return;  // Silent fail on hover
  }

  try {
    await gb28181Api.ptzControl({
      device_id: ids.deviceId,
      channel_id: ids.channelId,
      command: direction,
      speed: speed.value
    });
    isPtzActive.value = true;  // Mark as active
    console.log(`PTZ ${direction} started with speed ${speed.value}`);
  } catch (error: any) {
    console.error('PTZ 控制命令发送失败:', error);
    ElMessage.error(error.message || `发送 PTZ 控制命令失败: ${direction}`);
  }
};

const stopPtzCommand = async () => {
  // Only send stop command if PTZ was actually started
  if (!isPtzActive.value) {
    return;
  }

  const ids = parseChannelId();
  if (!ids) {
    return;
  }

  try {
    await gb28181Api.ptzControl({
      device_id: ids.deviceId,
      channel_id: ids.channelId,
      command: 'stop',
      speed: speed.value
    });
    console.log('PTZ stopped');
  } catch (error: any) {
    console.error('停止 PTZ 控制命令发送失败:', error);
    ElMessage.error(error.message || '发送停止 PTZ 控制命令失败');
  } finally {
    isPtzActive.value = false;  // Reset flag
  }
};

const startZoomCommand = async (zoomDirection: string) => {
  const ids = parseChannelId();
  if (!ids) {
    return;  // Silent fail on hover
  }

  try {
    await gb28181Api.ptzControl({
      device_id: ids.deviceId,
      channel_id: ids.channelId,
      command: zoomDirection === 'tele' ? 'zoom_in' : 'zoom_out',
      speed: speed.value
    });
    isPtzActive.value = true;  // Mark as active
    console.log(`Zoom ${zoomDirection} started with speed ${speed.value}`);
  } catch (error: any) {
    console.error('变倍控制命令发送失败:', error);
    ElMessage.error(error.message || `发送变倍控制命令失败: ${zoomDirection}`);
  }
};

const stopZoomCommand = async () => {
  await stopPtzCommand();
};

// Focus commands
const startFocusCommand = async (focusDirection: string) => {
  const ids = parseChannelId();
  if (!ids) {
    return;
  }

  try {
    await gb28181Api.ptzControl({
      device_id: ids.deviceId,
      channel_id: ids.channelId,
      command: focusDirection,
      speed: speed.value
    });
    isPtzActive.value = true;
    console.log(`Focus ${focusDirection} started`);
  } catch (error: any) {
    console.error('对焦控制命令发送失败:', error);
    ElMessage.error(error.message || '发送对焦控制命令失败');
  }
};

const stopFocusCommand = async () => {
  await stopPtzCommand();
};

// Iris commands
const irisCommand = async (irisType: string) => {
  const ids = parseChannelId();
  if (!ids) {
    ElMessage.warning('请先选择通道');
    return;
  }

  try {
    await gb28181Api.ptzControl({
      device_id: ids.deviceId,
      channel_id: ids.channelId,
      command: irisType,
      speed: speed.value
    });
    console.log(`Iris ${irisType} executed`);
  } catch (error: any) {
    console.error('光圈控制命令发送失败:', error);
    ElMessage.error(error.message || '发送光圈控制命令失败');
  }
};

// Preset commands
const getPresetName = (value: number): string => {
  const preset = presetMap.value.get(value);
  return preset?.name || '';
};

// 检查预置位是否已设置（记录是否存在）
const isPresetSet = (value: number): boolean => {
  return presetMap.value.has(value);
};

// 加载预置位列表
const loadPresetList = async () => {
  const ids = parseChannelId();
  if (!ids) {
    return;
  }

  try {
    const data = await gb28181Api.getPresetList({
      device_id: ids.deviceId,
      channel_id: ids.channelId
    });
    presets.value = data || [];
    console.log('预置位列表加载成功:', presets.value.length, '个预置位');
  } catch (error: any) {
    console.error('加载预置位列表失败:', error);
    presets.value = [];
  }
};

// 调用预置位
const gotoPreset = async (value: number) => {
  const ids = parseChannelId();
  if (!ids) {
    ElMessage.warning('请先选择通道');
    return;
  }

  try {
    await gb28181Api.callPreset({
      device_id: ids.deviceId,
      channel_id: ids.channelId,
      value
    });
    ElMessage.success(`预置位 ${value} 调用成功`);
  } catch (error: any) {
    console.error('调用预置位失败:', error);
    ElMessage.error(error.message || '调用预置位失败');
  }
};

// 设置预置位
const setPreset = async (value: number) => {
  const ids = parseChannelId();
  if (!ids) {
    ElMessage.warning('请先选择通道');
    return;
  }

  const name = `预置位${value}`;

  try {
    settingPresets.value.add(value);
    await gb28181Api.setPreset({
      device_id: ids.deviceId,
      channel_id: ids.channelId,
      value,
      name
    });
    ElMessage.success(`预置位 ${value} 设置成功`);
    await loadPresetList();  // 重新加载预置位列表
  } catch (error: any) {
    console.error('设置预置位失败:', error);
    ElMessage.error(error.message || '设置预置位失败');
  } finally {
    settingPresets.value.delete(value);
  }
};

// 删除预置位
const deletePreset = async (value: number) => {
  const ids = parseChannelId();
  if (!ids) {
    ElMessage.warning('请先选择通道');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除预置位 ${value} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await gb28181Api.deletePreset({
      device_id: ids.deviceId,
      channel_id: ids.channelId,
      value
    });
    ElMessage.success(`预置位 ${value} 删除成功`);
    await loadPresetList();  // 重新加载预置位列表
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除预置位失败:', error);
      ElMessage.error(error.message || '删除预置位失败');
    }
  }
};

// Cruise commands (not implemented in current API)
const loadCruisePoints = async () => {
  ElMessage.info('巡航功能暂未实现');
};

const addToCruise = (id: number = 1) => {
  ElMessage.info('巡航功能暂未实现');
};

const startCruise = async () => {
  ElMessage.info('巡航功能暂未实现');
};

const stopCruise = async () => {
  ElMessage.info('巡航功能暂未实现');
};

const removeFromCruise = (index: number) => {
  ElMessage.info('巡航功能暂未实现');
};

// 监听 channelId 变化
watch(() => props.channelId, (newChannelId) => {
  if (newChannelId) {
    loadPresetList();
  }
});

// 监听 presets 变化，用于调试
watch(presets, (newPresets) => {
  console.log('预置位数据已更新:', newPresets.length, '个预置位');
  if (newPresets.length > 0) {
    console.log('预置位详情:', newPresets.map(p => ({ value: p.value, name: p.name })));
  }
}, { deep: true });

// 组件挂载时加载预置位列表
onMounted(() => {
  if (props.channelId) {
    loadPresetList();
  }
});

// Stop voice talk if active
const stopVoiceTalk = async () => {
  if (voiceTalkRef.value?.canStop?.value) {
    try {
      await voiceTalkRef.value.stop();
      console.log('Voice talk stopped successfully');
    } catch (error) {
      console.error('Failed to stop voice talk:', error);
    }
  }
};

// Check if voice talk is active
const isVoiceTalkActive = () => {
  return voiceTalkRef.value?.isConnected?.value || false;
};

// Expose methods for parent component
defineExpose({
  stopVoiceTalk,
  isVoiceTalkActive
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.page {
  padding: $spacing-md;
  background: linear-gradient(180deg, $bg-main, $bg-panel);
  color: $text-main;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.grid {
  @extend .responsive-grid;
}

.panel {
  @include panel;

  h3 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: #c7d2fe;
  }
}

/* ================= PTZ 主控 ================= */
.ptz-main {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
  align-items: center;
}

.pad {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle at center, $bg-main, #020617);
  border: 1px solid $border-base;
  position: relative;
}

.dir {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #020617;
  border: 1px solid $border-base;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-muted;
  cursor: pointer;
  transition: 0.15s;

  &:hover {
    color: $primary;
    border-color: $primary;
  }
}

.up {
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
}
.down {
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
}
.left {
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
}
.right {
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.upleft {
  top: 40px;
  left: 40px;
}
.upright {
  top: 40px;
  right: 40px;
}
.downleft {
  bottom: 40px;
  left: 40px;
}
.downright {
  bottom: 40px;
  right: 40px;
}

.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #020617;
  border: 1px solid $border-base;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: $text-muted;
}

/* ================= 参数区 ================= */
.controls {
  display: grid;
  gap: 14px;
}

.row {
  @extend .form-row;
}

.label {
  @extend .form-label;
}

/* Override Element Plus styles to match dark theme */
:deep(.el-slider) {
  flex: 1;
}

:deep(.el-slider__runway) {
  background-color: $border-light;
  height: 6px;
  border-radius: 3px;
}

:deep(.el-slider__bar) {
  background-color: $primary;
  height: 6px;
  border-radius: 3px;
}

:deep(.el-slider__button) {
  width: 16px;
  height: 16px;
  border: 2px solid $primary;
}

:deep(.el-input-number) {
  flex: 1;
}

:deep(.el-select .el-input__wrapper) {
  background-color: $bg-active;
  border: 1px solid $border-base;
  box-shadow: none;
  color: $text-main;
}

:deep(.el-select-dropdown__item) {
  color: $text-main;
}

:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
  background-color: $bg-hover;
}

.btn-group {
  @extend .btn-group;
}

.talk {
  display: flex;
  gap: 12px;
  margin-top: 12px;

  :deep(.el-button) {
    flex: 1;
  }
}

/* ================= 预置位 ================= */
.preset-list {
  @extend .preset-list;
}

.preset {
  @extend .preset-item;

  :deep(.el-button) {
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
  }
}
</style>