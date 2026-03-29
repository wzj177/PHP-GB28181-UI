/**
 * GB28181 Voice Talk Composable
 * Reactive composable for managing GB28181 voice talk sessions
 */

import { ref, computed, onUnmounted, type Ref, type ComputedRef } from 'vue';
import { gb28181Api } from '@/api/gb28181Api';
import { userApi } from '@/api/userApi';
import { createVoiceClient, WebRTCVoiceClient } from '@/utils/webrtc';

/**
 * Voice talk session status
 */
export type VoiceTalkStatus =
  | 'idle'          // Not started
  | 'connecting'    // Connecting to server
  | 'established'   // Session established, audio streaming
  | 'ended';        // Session ended normally
  // 'failed' is handled by error state

/**
 * API response types
 */
interface BroadcastStartResponse {
  session_id: string;
  stream_id: string;
  mode: string;
  status: string;
  streams: {
    webrtc: string;
    webrtcs: string;
    rtmp: string;
    rtsp: string;
    srt: string;
  };
  reused: boolean;
}

/**
 * Voice talk session options
 */
export interface UseVoiceTalkOptions {
  deviceId: string;
  channelId: string;
  onStatusChange?: (status: VoiceTalkStatus) => void;
  onError?: (error: Error) => void;
  debug?: boolean;
}

/**
 * Voice talk composable return type
 */
export interface VoiceTalkReturn {
  // State
  status: Ref<VoiceTalkStatus>;
  isConnected: Ref<boolean>;
  sessionId: Ref<string | null>;
  error: Ref<Error | null>;
  // Methods
  start: () => Promise<void>;
  stop: () => Promise<void>;
  // Computed
  statusText: ComputedRef<string>;
  canStart: ComputedRef<boolean>;
  canStop: ComputedRef<boolean>;
}

/**
 * GB28181 Voice Talk Composable
 * Manages voice talk sessions with WebRTC streaming
 */
export function useVoiceTalk(options: UseVoiceTalkOptions): VoiceTalkReturn {
  const {
    deviceId,
    channelId,
    onStatusChange,
    onError,
    debug = false
  } = options;

  // Reactive state
  const status = ref<VoiceTalkStatus>('idle');
  const sessionId = ref<string | null>(null);
  const error = ref<Error | null>(null);
  const webrtcClient = ref<WebRTCVoiceClient | null>(null);

  // Computed properties
  const isConnected = computed(() => status.value === 'established');

  const statusText = computed(() => {
    const statusMap: Record<VoiceTalkStatus, string> = {
      idle: '未开始',
      connecting: '连接中',
      established: '对讲中',
      ended: '已结束'
    };
    return statusMap[status.value] || status.value;
  });

  const canStart = computed(() => status.value === 'idle' || status.value === 'ended');
  const canStop = computed(() =>
    status.value === 'connecting' ||
    status.value === 'established'
  );

  /**
   * Update status and trigger callback
   */
  function updateStatus(newStatus: VoiceTalkStatus) {
    if (status.value !== newStatus) {
      status.value = newStatus;
      if (debug) {
        console.log('[VoiceTalk] Status:', newStatus);
      }
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    }
  }

  /**
   * Start voice talk session
   */
  async function start(): Promise<void> {
    if (!canStart.value) {
      throw new Error('Cannot start voice talk in current status');
    }

    try {
      error.value = null;
      updateStatus('connecting');

      // Step 1: Get broadcast stream URL from API
      if (debug) {
        console.log('[VoiceTalk] Getting broadcast URL for', deviceId, channelId);
      }
      const broadcastResponse = await gb28181Api.broadcastStart(deviceId, channelId) as BroadcastStartResponse;

      if (!broadcastResponse.session_id || !broadcastResponse.streams) {
        throw new Error('Invalid broadcast response from server');
      }

      sessionId.value = broadcastResponse.session_id;

      // Step 2: Get user UUID from API
      if (debug) {
        console.log('[VoiceTalk] Getting user UUID...');
      }
      const uuidData = await userApi.showUUid();
      
      if (!uuidData || !uuidData.uuid) {
        throw new Error('Failed to get user UUID from server');
      }

      // Step 3: Build signature as adm_{uuid}
      const sign = `adm_${uuidData.uuid}`;

      // Step 4: Choose WebRTC URL based on protocol (HTTPS → webrtcs, HTTP → webrtc)
      const isHttps = window.location.protocol.includes('https');
      const rtcUrl = isHttps ? broadcastResponse.streams.webrtcs : broadcastResponse.streams.webrtc;

      // Step 5: Build complete WebRTC URL with signature (append &sign=)
      const finalUrl = `${rtcUrl}&sign=${encodeURIComponent(sign)}`;

      if (debug) {
        console.log('[VoiceTalk] Starting WebRTC to:', finalUrl.replace(sign, '***'));
      }

      // Step 6: Create and connect WebRTC client
      webrtcClient.value = createVoiceClient({
        zlmsdpUrl: finalUrl,
        audioEnabled: true,
        videoEnabled: false,
        recvOnly: false,
        debug
      });

      // Setup WebRTC event handlers
      webrtcClient.value.on({
        onConnecting: () => {
          if (debug) {
            console.log('[VoiceTalk] WebRTC connecting...');
          }
        },
        onConnected: () => {
          if (debug) {
            console.log('[VoiceTalk] WebRTC connected');
          }
          updateStatus('established');
        },
        onDisconnected: () => {
          if (debug) {
            console.log('[VoiceTalk] WebRTC disconnected');
          }
          updateStatus('ended');
        },
        onFailed: (err) => {
          console.error('[VoiceTalk] WebRTC failed:', err);
          error.value = err;
          if (onError) {
            onError(err);
          }
          updateStatus('ended');
        },
        onLocalStream: (stream) => {
          if (debug) {
            console.log('[VoiceTalk] Local stream acquired:', stream);
          }
        }
      });

      // Delay 2 seconds before connecting WebRTC
      if (debug) {
        console.log('[VoiceTalk] Waiting 2 seconds before WebRTC connection...');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Connect to WebRTC server
      await webrtcClient.value.connect();

    } catch (err) {
      // Extract error message from API response
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to start voice talk';

      const voiceError = new Error(errorMessage);
      error.value = voiceError;
      console.error('[VoiceTalk] Start error:', err);
      if (onError) {
        onError(voiceError);
      }
      updateStatus('ended');
      throw voiceError;
    }
  }

  /**
   * Stop voice talk session
   */
  async function stop(): Promise<void> {
    if (!canStop.value) {
      return;
    }

    try {
      // Close WebRTC connection
      if (webrtcClient.value) {
        webrtcClient.value.disconnect();
        webrtcClient.value = null;
      }

      // Notify server to stop session
      if (sessionId.value) {
        if (debug) {
          console.log('[VoiceTalk] Stopping session:', sessionId.value);
        }
        await gb28181Api.broadcastStop(sessionId.value);
        sessionId.value = null;
      }

      updateStatus('ended');

    } catch (err) {
      // Extract error message from API response
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to stop voice talk';

      const stopError = new Error(errorMessage);
      error.value = stopError;
      console.error('[VoiceTalk] Stop error:', err);
      if (onError) {
        onError(stopError);
      }
      throw stopError;
    }
  }

  /**
   * Cleanup on unmount
   */
  onUnmounted(() => {
    if (webrtcClient.value) {
      webrtcClient.value.disconnect();
    }
  });

  return {
    status,
    isConnected,
    sessionId,
    error,
    start,
    stop,
    statusText,
    canStart,
    canStop
  };
}

export default useVoiceTalk;
