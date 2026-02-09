/**
 * WebSocket Composable
 * 用于实时接收服务器推送的消息
 */

import { ref, onUnmounted } from 'vue'

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WebSocketMessage {
  event: string
  data: any
}

export interface UseWebSocketOptions {
  url: string
  autoReconnect?: boolean
  reconnectInterval?: number
  onMessage?: (message: WebSocketMessage) => void
  onStatusChange?: (status: WebSocketStatus) => void
  onError?: (error: Event) => void
  debug?: boolean
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    autoReconnect = true,
    reconnectInterval = 3000,
    onMessage,
    onStatusChange,
    onError,
    debug = false
  } = options

  const ws = ref<WebSocket | null>(null)
  const status = ref<WebSocketStatus>('disconnected')
  const reconnectTimer = ref<number | null>(null)

  // 更新状态
  const updateStatus = (newStatus: WebSocketStatus) => {
    if (status.value !== newStatus) {
      status.value = newStatus
      if (debug) {
        console.log(`[WebSocket] Status: ${newStatus}`)
      }
      if (onStatusChange) {
        onStatusChange(newStatus)
      }
    }
  }

  // 连接
  const connect = () => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      if (debug) {
        console.log('[WebSocket] Already connected')
      }
      return
    }

    updateStatus('connecting')

    try {
      ws.value = new WebSocket(url)

      ws.value.onopen = () => {
        updateStatus('connected')
        if (debug) {
          console.log('[WebSocket] Connected')
        }
        // 清除重连定时器
        if (reconnectTimer.value) {
          clearTimeout(reconnectTimer.value)
          reconnectTimer.value = null
        }
      }

      ws.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          if (debug) {
            console.log('[WebSocket] Message:', message)
          }
          if (onMessage) {
            onMessage(message)
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      ws.value.onerror = (error) => {
        updateStatus('error')
        console.error('[WebSocket] Error:', error)
        if (onError) {
          onError(error)
        }
      }

      ws.value.onclose = () => {
        updateStatus('disconnected')
        if (debug) {
          console.log('[WebSocket] Disconnected')
        }
        // 自动重连
        if (autoReconnect && !reconnectTimer.value) {
          reconnectTimer.value = window.setTimeout(() => {
            reconnectTimer.value = null
            connect()
          }, reconnectInterval)
        }
      }
    } catch (error) {
      updateStatus('error')
      console.error('[WebSocket] Failed to connect:', error)
    }
  }

  // 断开连接
  const disconnect = () => {
    if (reconnectTimer.value) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  // 发送消息
  const send = (data: any) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      ws.value.send(message)
      if (debug) {
        console.log('[WebSocket] Sent:', message)
      }
    } else {
      console.warn('[WebSocket] Cannot send message, not connected')
    }
  }

  // 清理
  onUnmounted(() => {
    disconnect()
  })

  return {
    status,
    connect,
    disconnect,
    send
  }
}

/**
 * 报警事件 WebSocket
 * 专门用于接收实时报警推送
 */
export interface UseAlarmWebSocketOptions {
  baseUrl?: string
  onAlarm?: (alarm: any) => void
  debug?: boolean
}

export function useAlarmWebSocket(options: UseAlarmWebSocketOptions = {}) {
  const {
    baseUrl = '',
    onAlarm,
    debug = false
  } = options

  // 构建 WebSocket URL
  const wsUrl = `${baseUrl.replace(/^http/, 'ws')}/ws/alarm`

  const { status, connect, disconnect } = useWebSocket({
    url: wsUrl,
    onMessage: (message) => {
      if (message.event === 'alarm' && onAlarm) {
        onAlarm(message.data)
      }
    },
    debug
  })

  return {
    status,
    connect,
    disconnect
  }
}

export default useWebSocket
