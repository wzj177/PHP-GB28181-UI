/**
 * 工具函数
 */
// 获取当前URL相对路径
export const getUrlRelativePath = (path) => {
  const arrUrl = path.split('//')
  return arrUrl[1].substring(arrUrl[1].indexOf('/'))
}

// 截取文件路径中的文件名
export const getFileName = (path) => {
  const pos = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  if (Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) < 0) {
    return path
  } else {
    return path.substring(pos + 1)
  }
}

// 截取文件路径中的域名相返回相对路径
export const getRelativePath = (path) => {
  if ((/^((ht|f)tps?):\/\/([\w-]+(\.[\w-]+)*\/?)+(\?([\w\-\.,@?^=%&:\/~\+#]*)+)?$/).test(path)) {
    return path.split('/').slice(3).join('/')
  } else {
    return path
  }
}

export const tradeNo = () => {
  const now = new Date()
  const year = now.getFullYear()
  let month = now.getMonth() + 1
  let day = now.getDate()
  let hour = now.getHours()
  let minutes = now.getMinutes()
  let seconds = now.getSeconds()
  String(month).length < 2 ? (month = Number('0' + month)) : month
  String(day).length < 2 ? (day = Number('0' + day)) : day
  String(hour).length < 2 ? (hour = Number('0' + hour)) : hour
  String(minutes).length < 2 ? (minutes = Number('0' + minutes)) : minutes
  String(seconds).length < 2 ? (seconds = Number('0' + seconds)) : seconds
  const yyyyMMddHHmmss = `${year}${month}${day}${hour}${minutes}${seconds}`
  return yyyyMMddHHmmss + '-' + Math.random().toString(36).substr(2, 6)
}

// 一维数组按指定数量分组
export const getArrayGroupByNum = (array, n) => {
  const arr = []
  for (let i = 0; i < array.length; i += n) {
    arr.push(array.slice(i, i + n))
  }
  return arr
}

// 二进制流文件下载
export const downloadFile = (file, name = '附件') => {
  const blob = new Blob([file])
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name + '.' + file.type.split('/')[1]
  a.click()
  window.URL.revokeObjectURL(url)
}
