/**
 * 附件类型定义
 */

export type AttachmentType = 'image' | 'audio' | 'video' | 'file'

export interface Attachment {
  id: number
  name: string
  original_name: string
  path: string
  url: string
  size: number
  mime_type: string
  type: AttachmentType
  width?: number
  height?: number
  duration?: number
  created_at: string
  updated_at: string
}

export interface AttachmentFormData {
  name: string
  type: AttachmentType
  file?: File
}

export interface AttachmentListParams {
  keyword?: string
  type?: AttachmentType
  page?: number
  page_size?: number
}

export interface AttachmentUploadResponse {
  id: number
  url: string
  path: string
  name: string
}
