/**
 * WebRTC Voice Talk Utility
 * Handles WebRTC audio streaming for GB28181 voice talk functionality
 *
 * Note: This utility requires the ZLMRTCClient library
 * Install: npm install @zlmrtc/client
 * Or use CDN: https://cdn.jsdelivr.net/npm/zlm-webrtc@1.0.0/dist/ZLMRTCClient.js
 */

// Types for ZLMRTCClient (if not using TypeScript types from the package)
declare const ZLMRTCClient: any;

/**
 * WebRTC connection state
 */
export type WebRTCState =
  | 'idle'          // Not started
  | 'connecting'    // Connecting to server
  | 'connected'     // Connected and streaming
  | 'disconnected'  // Disconnected
  | 'failed';       // Connection failed

/**
 * WebRTC event callbacks
 */
export interface WebRTCEventCallbacks {
  onConnecting?: () => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onFailed?: (error: Error) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onIceCandidateError?: (error: any) => void;
}

/**
 * WebRTC configuration options
 */
export interface WebRTCOptions {
  zlmsdpUrl: string;           // WebRTC server URL
  audioEnabled?: boolean;       // Enable audio (default: true)
  videoEnabled?: boolean;       // Enable video (default: false for voice talk)
  recvOnly?: boolean;          // Receive only mode (default: false for push)
  debug?: boolean;             // Enable debug logging
  iceServers?: RTCIceServer[]; // Custom ICE servers
}

/**
 * WebRTC Voice Talk Client
 * Manages WebRTC connection for audio streaming
 */
export class WebRTCVoiceClient {
  private rtc: any = null;
  private state: WebRTCState = 'idle';
  private localStream: MediaStream | null = null;
  private callbacks: WebRTCEventCallbacks = {};

  constructor(private options: WebRTCOptions) {}

  /**
   * Start WebRTC connection
   */
  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      console.warn('[WebRTC] Already connected or connecting');
      return;
    }

    try {
      this.setState('connecting');
      this.emit('onConnecting');

      // Check if ZLMRTCClient is available
      if (typeof ZLMRTCClient === 'undefined') {
        throw new Error('ZLMRTCClient is not loaded. Please include the ZLMRTCClient library.');
      }

      // Determine ICE servers
      const iceServers = this.options.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' }
      ];

      // Create WebRTC client configuration
      const config = {
        zlmsdpUrl: this.options.zlmsdpUrl,
        simulcast: false,
        useCamera: false,
        audioEnable: this.options.audioEnabled !== false,
        videoEnable: this.options.videoEnabled === true,
        recvOnly: this.options.recvOnly === true,
        debug: this.options.debug || false,
        iceServers
      };

      // Initialize ZLMRTCClient
      this.rtc = new ZLMRTCClient.Endpoint(config);

      // Setup event listeners
      this.setupEventListeners();

      if (this.options.debug) {
        console.log('[WebRTC] Connecting to:', this.options.zlmsdpUrl);
      }

    } catch (error) {
      this.setState('failed');
      this.emit('onFailed', error as Error);
      throw error;
    }
  }

  /**
   * Setup WebRTC event listeners
   */
  private setupEventListeners(): void {
    if (!this.rtc) return;

    // Connection state change
    this.rtc.on(ZLMRTCClient.Events.WEBRTC_ON_CONNECTION_STATE_CHANGE, (state: string) => {
      if (this.options.debug) {
        console.log('[WebRTC] Connection state:', state);
      }

      switch (state) {
        case 'connected':
          this.setState('connected');
          this.emit('onConnected');
          break;
        case 'disconnected':
        case 'failed':
          this.setState(state as WebRTCState);
          if (state === 'failed') {
            this.emit('onFailed', new Error('WebRTC connection failed'));
          } else {
            this.emit('onDisconnected');
          }
          break;
      }
    });

    // Local stream available (microphone access granted)
    this.rtc.on(ZLMRTCClient.Events.WEBRTC_ON_LOCAL_STREAM, (stream: MediaStream) => {
      if (this.options.debug) {
        console.log('[WebRTC] Local stream acquired:', stream);
      }
      this.localStream = stream;
      this.emit('onLocalStream', stream);
    });

    // ICE candidate error
    this.rtc.on(ZLMRTCClient.Events.WEBRTC_ICE_CANDIDATE_ERROR, (error: any) => {
      console.error('[WebRTC] ICE candidate error:', error);
      this.emit('onIceCandidateError', error);
    });

    // Not supported
    this.rtc.on(ZLMRTCClient.Events.WEBRTC_NOT_SUPPORT, (error: any) => {
      console.error('[WebRTC] Not supported:', error);
      this.setState('failed');
      this.emit('onFailed', new Error('WebRTC is not supported in this browser'));
    });

    // Offer/Answer exchange failed
    this.rtc.on(ZLMRTCClient.Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED, (error: any) => {
      console.error('[WebRTC] Offer/Answer exchange failed:', error);
      this.setState('failed');
      this.emit('onFailed', new Error(error.msg || 'Offer/Answer exchange failed'));
    });
  }

  /**
   * Close WebRTC connection
   */
  disconnect(): void {
    if (this.rtc) {
      try {
        this.rtc.close();
        if (this.options.debug) {
          console.log('[WebRTC] Disconnected');
        }
      } catch (error) {
        console.error('[WebRTC] Error closing connection:', error);
      }
      this.rtc = null;
    }

    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.setState('disconnected');
    this.emit('onDisconnected');
  }

  /**
   * Set event callbacks
   */
  on(callbacks: WebRTCEventCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current state
   */
  getState(): WebRTCState {
    return this.state;
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Set internal state and emit callback
   */
  private setState(state: WebRTCState): void {
    if (this.state !== state) {
      this.state = state;
      if (this.options.debug) {
        console.log('[WebRTC] State changed:', state);
      }
    }
  }

  /**
   * Emit event callback
   */
  private emit(event: keyof WebRTCEventCallbacks, data?: any): void {
    const callback = this.callbacks[event];
    if (typeof callback === 'function') {
      try {
        callback(data);
      } catch (error) {
        console.error(`[WebRTC] Error in ${event} callback:`, error);
      }
    }
  }
}

/**
 * Factory function to create a WebRTC voice client
 */
export function createVoiceClient(options: WebRTCOptions): WebRTCVoiceClient {
  return new WebRTCVoiceClient(options);
}

export default WebRTCVoiceClient;
