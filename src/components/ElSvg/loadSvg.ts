/**
 * SVG 加载器
 * 动态加载 SVG 文件并注入到页面作为 symbol，供 ElSvg 组件使用
 */

const loadedSvgs = new Set<string>()

/**
 * 加载 SVG 文件并注入到 DOM
 * @param name SVG 文件名（不带 .svg 后缀）
 */
export async function loadSvg(name: string): Promise<void> {
  // 如果已经加载过，直接返回
  if (loadedSvgs.has(name)) {
    return
  }

  try {
    // 动态导入 SVG 文件
    const module = await import(`@/assets/images/svgIcons/${name}.svg?raw`)
    const svgContent = module.default

    // 解析 SVG 内容
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgContent, 'image/svg+xml')
    const svgElement = doc.querySelector('svg')

    if (!svgElement) {
      throw new Error(`Invalid SVG content for ${name}`)
    }

    // 创建 symbol
    const symbolId = `icon-${name}`
    const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol')
    symbol.setAttribute('id', symbolId)
    symbol.setAttribute('viewBox', svgElement.getAttribute('viewBox') || '0 0 1024 1024')

    // 复制 SVG 内容到 symbol
    while (svgElement.firstChild) {
      symbol.appendChild(svgElement.firstChild)
    }

    // 查找或创建 svg sprite 容器
    let spriteContainer = document.getElementById('svg-sprite-container') as unknown as SVGSVGElement
    if (!spriteContainer) {
      spriteContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as unknown as SVGSVGElement
      spriteContainer.setAttribute('id', 'svg-sprite-container')
      spriteContainer.setAttribute('style', 'position: absolute; width: 0; height: 0; overflow: hidden;')
      document.body.appendChild(spriteContainer)
    }

    // 添加 symbol 到容器
    spriteContainer.appendChild(symbol)

    // 标记为已加载
    loadedSvgs.add(name)
  } catch (error) {
    console.error(`Failed to load SVG: ${name}`, error)
    throw error
  }
}

/**
 * 预加载多个 SVG
 * @param names SVG 文件名数组
 */
export async function loadSvgs(names: string[]): Promise<void> {
  await Promise.all(names.map(name => loadSvg(name)))
}

/**
 * 检查 SVG 是否已加载
 * @param name SVG 文件名
 */
export function isSvgLoaded(name: string): boolean {
  return loadedSvgs.has(name)
}
