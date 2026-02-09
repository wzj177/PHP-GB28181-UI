<template>
  <div class="voice-talk-control">
    <h3>{{ title }}</h3>

    <!-- Status Display -->
    <div class="status-display">
      <div class="status-indicator" :class="statusClass"></div>
      <span class="status-text">{{ statusText }}</span>
    </div>

    <!-- Control Buttons -->
    <div class="controls">
      <ElButton
        type="primary"
        :disabled="!canStart"
        :loading="status === 'connecting'"
        @click="handleStart"
      >
        {{ startButtonText }}
      </ElButton>
      <ElButton
        type="danger"
        :disabled="!canStop"
        @click="handleStop"
      >
        停止对讲
      </ElButton>
    </div>

    <!-- Session Info (debug) -->
    <div v-if="showSessionInfo && sessionId" class="session-info">
      <span class="label">会话ID:</span>
      <span class="value">{{ sessionId }}</span>
    </div>

    <!-- Audio Level Indicator (visual feedback) -->
    <div v-if="isConnected" class="audio-indicator">
      <div class="audio-wave" :class="{ active: isConnected }">
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
      </div>
      <span class="audio-text">正在传输音频...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted } from 'vue';
import {
  ElButton,
  ElMessage
} from 'element-plus';
import { useVoiceTalk, type VoiceTalkStatus } from '@/composables/useVoiceTalk';

/**
 * Voice Talk Control Component
 *
 * Props:
 * - deviceId: GB28181 device ID (20 digits)
 * - channelId: GB28181 channel ID (20 digits)
 * - showSessionInfo: Show session info for debugging (default: false)
 * - debug: Enable debug logging (default: false)
 * - title: Component title (default: '语音对讲')
 *
 * Events:
 * - statusChange: Emitted when voice talk status changes
 * - error: Emitted when an error occurs
 */

interface Props {
  deviceId?: string;
  channelId?: string;
  showSessionInfo?: boolean;
  debug?: boolean;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showSessionInfo: false,
  debug: false,
  title: '语音对讲'
});

const emit = defineEmits<{
  statusChange: [status: VoiceTalkStatus];
  error: [error: Error];
}>();

// Initialize voice talk composable
const voiceTalk = useVoiceTalk({
  deviceId: props.deviceId || '',
  channelId: props.channelId || '',
  onStatusChange: (status) => {
    emit('statusChange', status);
  },
  onError: (error) => {
    emit('error', error);
    ElMessage.error(error.message);
  },
  debug: props.debug
});

// Destructure from composable
const {
  status,
  isConnected,
  sessionId,
  start,
  stop,
  statusText,
  canStart,
  canStop
} = voiceTalk;

// Computed properties
const statusClass = computed(() => {
  const classMap: Record<VoiceTalkStatus, string> = {
    idle: 'idle',
    connecting: 'connecting',
    established: 'active',
    ended: 'idle'
  };
  return classMap[status.value] || 'idle';
});

const startButtonText = computed(() => {
  if (status.value === 'connecting') {
    return '连接中...';
  }
  return '开始对讲';
});

// Event handlers
async function handleStart() {
  if (!props.deviceId || !props.channelId) {
    ElMessage.warning('请先选择设备和通道');
    return;
  }

  try {
    await start();
  } catch (err) {
    console.error('启动语音对讲失败:', err);
  }
}

async function handleStop() {
  try {
    await stop();
  } catch (err) {
    console.error('停止语音对讲失败:', err);
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (canStop.value) {
    stop().catch(console.error);
  }
});

// Expose methods for parent component
defineExpose({
  canStop,
  stop,
  isConnected,
  status
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.voice-talk-control {
  @include panel;

  h3 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: #c7d2fe;
  }
}

.status-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  margin-bottom: 12px;

  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #475569;
    box-shadow: 0 0 8px rgba(71, 85, 105, 0.5);

    &.connecting {
      background: #f59e0b;
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
      animation: pulse 1.5s infinite;
    }

    &.active {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
      animation: pulse 2s infinite;
    }
  }

  .status-text {
    font-size: 13px;
    color: $text-main;
  }
}

.controls {
  display: flex;
  gap: 12px;

  :deep(.el-button) {
    flex: 1;
  }
}

.session-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 6px;
  margin-top: 12px;
  font-size: 12px;

  .label {
    color: $text-muted;
  }

  .value {
    color: $text-main;
    font-family: monospace;
  }
}

.audio-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  margin-top: 12px;

  .audio-wave {
    display: flex;
    align-items: center;
    gap: 4px;

    &.active .wave-bar {
      animation: wave 1s ease-in-out infinite;
    }
  }

  .wave-bar {
    width: 4px;
    height: 20px;
    background: #10b981;
    border-radius: 2px;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.2s; }
    &:nth-child(4) { animation-delay: 0.3s; }
    &:nth-child(5) { animation-delay: 0.4s; }
  }

  .audio-text {
    font-size: 12px;
    color: #10b981;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes wave {
  0%, 100% {
    height: 8px;
  }
  50% {
    height: 20px;
  }
}
</style>
