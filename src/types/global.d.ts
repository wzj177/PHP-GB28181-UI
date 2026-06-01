// Axios 响应类型扩展
// 注意: 不要重新声明 AxiosResponse，会覆盖原始类型
declare module 'axios' {
  export interface AxiosRequestConfig {
    startTime?: number
  }
}

// mockjs 类型声明
declare module 'mockjs' {
  interface MockjsXHR {
    prototype: {
      send: Function
      [key: string]: any
    }
    [key: string]: any
  }

  interface MockjsRequestOptions {
    url: string
    type: string
    body: string
  }

  interface Mockjs {
    mock(template: Record<string, any>): any
    mock(rurl: string, template: Record<string, any>): void
    mock(rurl: string | RegExp, rtype: string, template: Record<string, any> | ((...args: any[]) => any)): void
    mock(rurl: string | RegExp, template: ((...args: any[]) => any)): void
    setup(options: { timeout?: string | number }): void
    XHR: MockjsXHR
    Random: {
      cname(): string
      guid(): string
      ip(): string
      datetime(pattern?: string): string
      now(format?: string): string
      image(size?: string, background?: string, foreground?: string, format?: string, text?: string): string
      pick<T>(arr: T[]): T
      natural(min?: number, max?: number): number
      cparagraph(min?: number, max?: number): string
      boolean(): boolean
      [key: string]: any
    }
  }

  const Mock: Mockjs
  export default Mock
}

// AMap 类型声明
declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, options: MapOptions)
    destroy(): void
    setZoom(zoom: number): void
    getZoom(): number
    setCenter(center: [number, number]): void
    getCenter(): LngLat
    add(control: any): void
    remove(control: any): void
    addOverlay(overlay: any): void
    removeOverlay(overlay: any): void
    setFitView(): void
    on(event: string, callback: (...args: any[]) => void): void
    off(event: string, callback?: (...args: any[]) => void): void
  }

  class LngLat {
    constructor(lng: number, lat: number)
    getLng(): number
    getLat(): number
  }

  class Marker {
    constructor(options: MarkerOptions)
    setPosition(position: [number, number]): void
    getPosition(): LngLat
    setMap(map: Map | null): void
    on(event: string, callback: (...args: any[]) => void): void
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions)
    setContent(content: string | HTMLElement): void
    open(map: Map, position: LngLat): void
    close(): void
    setPosition(position: LngLat): void
  }

  class ControlBar {
    constructor(options?: ControlBarOptions)
  }

  class ToolBar {
    constructor(options?: ToolBarOptions)
  }

  interface MapOptions {
    zoom?: number
    center?: [number, number]
    viewMode?: '2D' | '3D'
    showLabel?: boolean
  }

  interface MarkerOptions {
    position: [number, number]
    title?: string
    content?: string | HTMLElement
    icon?: any
    extData?: any
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement
    offset?: any
    closeWhenClickMap?: boolean
  }

  interface ControlBarOptions {
    showZoomBar?: boolean
    showControlButton?: boolean
    position?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
  }

  interface ToolBarOptions {
    position?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
  }
}

declare const AMap: typeof AMap

// 全局变量
declare const isMockEnabled: boolean

// gb28181Api 自动导入声明（Vite 自动导入插件）
declare const gb28181Api: any
declare const deviceApi: any

// WheelEvent 扩展
interface WheelEvent {
  wheelDelta?: number
}

// Vue Router 扩展
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    hidden?: boolean
    affix?: boolean
    noCache?: boolean
  }
}

// 设备树节点类型
interface DeviceTreeNode {
  id: string
  name: string
  online?: boolean
  type?: string
  status?: 'online' | 'offline' | 'motion_detect'
  children?: DeviceTreeNode[]
  channels?: DeviceTreeNode[]
  rtspUrl?: string
  device_id?: string
}

// Element Plus prop 类型覆盖
type EpPropType = 'primary' | 'success' | 'warning' | 'info' | 'danger' | string

// Vite ?raw 导入类型声明
declare module '*.svg?raw' {
  const content: string
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}
