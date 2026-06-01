import { defineStore } from 'pinia'
import { ref } from 'vue'

interface TagView {
  name?: string
  title: string
  path: string
  fullPath: string
  affix?: boolean
  noCache?: boolean
}

export const useTagsViewStore = defineStore('tagsView', () => {
  const visitedViews = ref<TagView[]>([])
  const cachedViews = ref<string[]>([])

  function addView(view: TagView) {
    if (visitedViews.value.some(v => v.path === view.path)) return

    if (!view.title || !view.path) return

    visitedViews.value.push({
      name: view.name,
      title: view.title,
      path: view.path,
      fullPath: view.fullPath,
      affix: view.affix,
      noCache: view.noCache
    })
  }

  function addVisitedView(view: TagView) {
    // Alias for addView
    addView(view);
  }

  function addCachedView(view: TagView) {
    if (!view.name) return
    if (cachedViews.value.includes(view.name)) return
    if (view.noCache) return
    cachedViews.value.push(view.name)
  }

  function delView(view: TagView) {
    return new Promise<void>(resolve => {
      visitedViews.value = visitedViews.value.filter(v => v.path !== view.path)
      if (cachedViews.value.includes(view.name as string)) {
        cachedViews.value = cachedViews.value.filter(v => v !== view.name)
      }
      resolve()
    })
  }

  function delVisitedView(view: TagView) {
    // Alias for delView
    delView(view);
  }

  function delCachedView(view: TagView) {
    return new Promise<void>(resolve => {
      if (cachedViews.value.includes(view.name as string)) {
        cachedViews.value = cachedViews.value.filter(v => v !== view.name)
      }
      resolve()
    })
  }

  function delOtherViews(view: TagView) {
    visitedViews.value = visitedViews.value.filter(v => {
      return v.affix || v.path === view.path
    })
    cachedViews.value = cachedViews.value.filter(v => {
      return v === view.name
    })
  }

  function delOthersViews(view: TagView) {
    // Remove other views keeping only the provided one and affix views
    visitedViews.value = visitedViews.value.filter(v => {
      return v.affix || v.path === view.path
    })
    cachedViews.value = cachedViews.value.filter(v => {
      return v === view.name
    })
  }

  function delAllViews(view: TagView) {
    // Keep affix tags
    visitedViews.value = visitedViews.value.filter(v => v.affix)
    cachedViews.value = []
  }

  function updateVisitedView(view: TagView) {
    for (const v of visitedViews.value) {
      if (v.path === view.path) {
        Object.assign(v, {
          title: view.title,
          fullPath: view.fullPath
        })
        break
      }
    }
  }

  function delOtherCachedViews(view: TagView) {
    if (view.name) {
      cachedViews.value = cachedViews.value.filter(v => {
        return v === view.name
      })
    }
  }

  function delAllCachedViews() {
    cachedViews.value = []
  }

  return {
    visitedViews,
    cachedViews,
    addView,
    addVisitedView,
    addCachedView,
    delView,
    delVisitedView,
    delCachedView,
    delOtherViews,
    delOthersViews,
    delAllViews,
    updateVisitedView,
    delOtherCachedViews,
    delAllCachedViews
  }
})