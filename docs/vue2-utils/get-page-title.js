import defaultSettings from '@/settings'

let title = defaultSettings.title || 'Vue Admin Template'

export default function getPageTitle(pageTitle, defaultTitle = null) {
  if (defaultTitle) {
    title = defaultTitle
  }
  if (pageTitle) {
    return `${pageTitle} - ${title}`
  }
  return `${title}`
}
