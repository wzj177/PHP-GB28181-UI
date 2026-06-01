/**
 * 视频广场 API 服务
 */
import request from '@/utils/request'
import type { VideoCard, OnlineStream } from '@/types/recording'

export const videoPlazaApi = {
  /**
   * 获取视频广场卡片数据（含缩略图）
   * GET /admin/video-plaza/cards
   */
  getVideoCards: (params?: {
    keyword?: string
    status?: 'online' | 'offline'
  }): Promise<VideoCard[]> => {
    return request.get('/admin/video-plaza/cards', { params })
  },

  /**
   * 获取在线流列表
   * GET /admin/video-plaza/streams
   */
  getOnlineStreams: (params?: {
    keyword?: string
    page?: number
    page_size?: number
  }): Promise<{ list: OnlineStream[]; total: number }> => {
    return request.get('/admin/video-plaza/streams', { params })
  },

  /**
   * 开始播放
   * POST /admin/video-plaza/play
   */
  play: (data: {
    device_id: string
    channel_id: string
  }): Promise<{ play_urls: Record<string, string> }> => {
    return request.post('/admin/video-plaza/play', data)
  },

  /**
   * 停止播放
   * POST /admin/video-plaza/stop
   */
  stop: (data: {
    device_id: string
    channel_id: string
  }): Promise<void> => {
    return request.post('/admin/video-plaza/stop', data)
  }
}

export default videoPlazaApi
