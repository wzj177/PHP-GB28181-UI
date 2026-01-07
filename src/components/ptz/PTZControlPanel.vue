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
              >
                变倍 +
              </ElButton>
              <ElButton
                size="small"
                @mousedown="startZoomCommand('wide')"
                @mouseup="stopZoomCommand()"
              >
                变倍 −
              </ElButton>
              <ElButton
                size="small"
                @click="focusCommand('auto')"
              >
                自动对焦
              </ElButton>
              <ElButton
                size="small"
                @mousedown="startFocusCommand('far')"
                @mouseup="stopFocusCommand()"
              >
                远焦
              </ElButton>
              <ElButton
                size="small"
                @mousedown="startFocusCommand('near')"
                @mouseup="stopFocusCommand()"
              >
                近焦
              </ElButton>
              <ElButton
                size="small"
                @click="irisCommand('open')"
              >
                光圈
              </ElButton>
            </div>

            <div class="voice-speak">
              <h3 style="margin-top: 16px">
                语音对讲
              </h3>
              <div class="talk">
                <ElButton
                  type="primary"
                  :disabled="isTalkActive"
                  @click="startTalk()"
                >
                  开始对讲
                </ElButton>
                <ElButton
                  :disabled="!isTalkActive"
                  @click="stopTalk()"
                >
                  停止
                </ElButton>
              </div>
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
            <span>{{
              presetNames[i] ? i + " · " + presetNames[i] : i + " · 未设置"
            }}</span>
            <div>
              <ElButton
                size="small"
                type="primary"
                @click="gotoPreset(i)"
              >
                调用
              </ElButton>
              <ElButton
                size="small"
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
    <div
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineProps } from "vue";
import {
  ElSlider,
  ElButton,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElRow,
  ElCol,
  ElMessage
} from 'element-plus';
import { gb28181Api } from '@/api/gb28181Api';

// Define props for component communication
interface Props {
  channelId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  channelId: "",
});

// State variables
const speed = ref(5);
const presetNames = reactive({
  1: "大门入口",
  2: "停车场",
  5: "走廊",
});
const cruiseId = ref("1");
const cruiseStay = ref(5);
const cruiseSpeed = ref(4);
const cruisePoints = ref<number[]>([]);
const isTalkActive = ref(false);

// PTZ control functions
const startPtzCommand = async (direction: string) => {
  // Extract device_id from channelId (format is typically device_id:channel_id)
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  // Split the channelId to get device_id and channel_id
  // Assuming the format is {device_id}-{channel_id} or similar
  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId; // Or use the second part if needed

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: direction,
      speed: speed.value
    });

    if (response.code === 0) {
      ElMessage.success(`开始 ${direction} 方向 PTZ 控制`);
    } else {
      ElMessage.error(response.message || `PTZ 控制失败: ${direction}`);
    }
  } catch (error: any) {
    console.error('PTZ 控制命令发送失败:', error);
    ElMessage.error(error.message || `发送 PTZ 控制命令失败: ${direction}`);
  }
};

const stopPtzCommand = async () => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  // Split the channelId to get device_id
  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId;

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: 'stop'
    });

    if (response.code === 0) {
      ElMessage.success('停止 PTZ 控制');
    } else {
      ElMessage.error(response.message || '停止 PTZ 控制失败');
    }
  } catch (error: any) {
    console.error('停止 PTZ 控制命令发送失败:', error);
    ElMessage.error(error.message || '发送停止 PTZ 控制命令失败');
  }
};

const startZoomCommand = async (zoomDirection: string) => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId;

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: zoomDirection === 'tele' ? 'zoom_in' : 'zoom_out',
      speed: speed.value
    });

    if (response.code === 0) {
      ElMessage.success(`开始变倍 ${zoomDirection}`);
    } else {
      ElMessage.error(response.message || `变倍控制失败: ${zoomDirection}`);
    }
  } catch (error: any) {
    console.error('变倍控制命令发送失败:', error);
    ElMessage.error(error.message || `发送变倍控制命令失败: ${zoomDirection}`);
  }
};

const stopZoomCommand = async () => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId;

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: 'stop',
      speed: speed.value
    });

    if (response.code === 0) {
      ElMessage.success('停止变倍');
    } else {
      ElMessage.error(response.message || '停止变倍控制失败');
    }
  } catch (error: any) {
    console.error('停止变倍控制命令发送失败:', error);
    ElMessage.error(error.message || '发送停止变倍控制命令失败');
  }
};

const focusCommand = async (focusType: string) => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId;

  let command: string;
  switch (focusType) {
    case 'auto':
      command = 'focus_auto';
      break;
    default:
      command = 'focus_stop';
  }

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: command,
      speed: speed.value
    });

    if (response.code === 0) {
      ElMessage.success(`${focusType} 对焦`);
    } else {
      ElMessage.error(response.message || `对焦控制失败: ${focusType}`);
    }
  } catch (error: any) {
    console.error('对焦控制命令发送失败:', error);
    ElMessage.error(error.message || `发送对焦控制命令失败: ${focusType}`);
  }
};

const startFocusCommand = async (focusDirection: string) => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId;

  let command: string;
  switch (focusDirection) {
    case 'far':
      command = 'focus_far';
      break;
    case 'near':
      command = 'focus_near';
      break;
    default:
      command = 'focus_stop';
  }

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: command,
      speed: speed.value
    });

    if (response.code === 0) {
      ElMessage.success(`开始 ${focusDirection} 对焦`);
    } else {
      ElMessage.error(response.message || `对焦控制失败: ${focusDirection}`);
    }
  } catch (error: any) {
    console.error('对焦控制命令发送失败:', error);
    ElMessage.error(error.message || `发送对焦控制命令失败: ${focusDirection}`);
  }
};

const stopFocusCommand = async () => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId;

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: 'focus_stop',
      speed: speed.value
    });

    if (response.code === 0) {
      ElMessage.success('停止对焦');
    } else {
      ElMessage.error(response.message || '停止对焦控制失败');
    }
  } catch (error: any) {
    console.error('停止对焦控制命令发送失败:', error);
    ElMessage.error(error.message || '发送停止对焦控制命令失败');
  }
};

const irisCommand = async (irisType: string) => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId;

  let command: string;
  switch (irisType) {
    case 'open':
      command = 'iris_open';
      break;
    case 'close':
      command = 'iris_close';
      break;
    default:
      command = 'iris_stop';
  }

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: command,
      speed: speed.value
    });

    if (response.code === 0) {
      ElMessage.success(`光圈 ${irisType}`);
    } else {
      ElMessage.error(response.message || `光圈控制失败: ${irisType}`);
    }
  } catch (error: any) {
    console.error('光圈控制命令发送失败:', error);
    ElMessage.error(error.message || `发送光圈控制命令失败: ${irisType}`);
  }
};

// Preset functions
const gotoPreset = async (id: number) => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId;

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: 'goto_preset',
      speed: id  // Using speed field to pass preset ID
    });

    if (response.code === 0) {
      ElMessage.success(`调用预置位 ${id}`);
    } else {
      ElMessage.error(response.message || `调用预置位 ${id} 失败`);
    }
  } catch (error: any) {
    console.error(`调用预置位 ${id} 失败:`, error);
    ElMessage.error(error.message || `调用预置位 ${id} 失败`);
  }
};

const setPreset = async (id: number) => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId;

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: 'set_preset',
      speed: id  // Using speed field to pass preset ID
    });

    if (response.code === 0) {
      ElMessage.success(`设置预置位 ${id}`);
    } else {
      ElMessage.error(response.message || `设置预置位 ${id} 失败`);
    }
  } catch (error: any) {
    console.error(`设置预置位 ${id} 失败:`, error);
    ElMessage.error(error.message || `设置预置位 ${id} 失败`);
  }
};

// Cruise functions
const loadCruisePoints = async () => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  // For now, just show a message that loading is simulated
  ElMessage.info("加载巡航点（模拟）");
  console.log("LOAD_CRUISE_POINTS", cruiseId.value, props.channelId);
  // This would load saved cruise points from backend when implemented
};

const addToCruise = (id: number = 1) => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  // Simple implementation - in reality, this would add the current preset
  // For now we'll just add presets to the array
  const nextPreset = (cruisePoints.value.length + 1) % 255;
  cruisePoints.value.push(nextPreset || 1);
  ElMessage.success(`添加预置位 ${nextPreset} 到巡航`);
  console.log("ADD_TO_CRUISE", nextPreset, props.channelId);
};

const startCruise = async () => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  if (cruisePoints.value.length === 0) {
    ElMessage.warning('请先添加预置位到巡航');
    return;
  }

  // Extract device_id from channelId
  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId;

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: 'start_cruise',
      speed: cruiseSpeed.value
    });

    if (response.code === 0) {
      ElMessage.success("开始巡航");
    } else {
      ElMessage.error(response.message || "开始巡航失败");
    }
  } catch (error: any) {
    console.error('开始巡航失败:', error);
    ElMessage.error(error.message || "开始巡航失败");
  }

  console.log("START_CRUISE", {
    id: cruiseId.value,
    stay: cruiseStay.value,
    speed: cruiseSpeed.value,
    points: cruisePoints.value,
    channelId: props.channelId,
  });
};

const stopCruise = async () => {
  if (!props.channelId) {
    ElMessage.error('未指定通道ID');
    return;
  }

  // Extract device_id from channelId
  const parts = props.channelId.split('-');
  if (parts.length < 2) {
    ElMessage.error('无效的通道ID格式');
    return;
  }

  const deviceId = parts[0];
  const channelId = props.channelId;

  try {
    const response = await gb28181Api.ptz.control({
      device_id: deviceId,
      channel_id: channelId,
      command: 'stop_cruise'
    });

    if (response.code === 0) {
      ElMessage.success("停止巡航");
    } else {
      ElMessage.error(response.message || "停止巡航失败");
    }
  } catch (error: any) {
    console.error('停止巡航失败:', error);
    ElMessage.error(error.message || "停止巡航失败");
  }

  console.log("STOP_CRUISE", props.channelId);
};

const removeFromCruise = (index: number) => {
  const removedPreset = cruisePoints.value[index];
  cruisePoints.value.splice(index, 1);
  ElMessage.warning(`移除巡航点: 预置位 ${removedPreset}`);
};

// Talk functions
const startTalk = () => {
  isTalkActive.value = true;
  ElMessage.success("开始对讲");
  console.log("START_TALK", props.channelId);
  // Start audio streaming - this would require additional implementation
};

const stopTalk = () => {
  isTalkActive.value = false;
  ElMessage.info("停止对讲");
  console.log("STOP_TALK", props.channelId);
  // Stop audio streaming
};
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