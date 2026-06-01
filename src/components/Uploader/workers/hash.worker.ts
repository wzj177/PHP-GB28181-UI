import SparkMD5 from 'spark-md5'

// Worker 消息类型
interface HashWorkerMessage {
  file: File
  chunkSize: number
}

// 用一个匿名函数自调用
;(function () {
  function getFileHash({ file, chunkSize }: HashWorkerMessage) {
    const spark = new SparkMD5.ArrayBuffer()
    const render = new FileReader()
    render.addEventListener('loadend', (event) => {
      const content = render.result as ArrayBuffer
      // 抽样hash计算
      // 规则：每半个切片大小取前10个
      let i = 0
      while ((chunkSize / 2) * (i + 1) + 10 < file.size) {
        spark.append(content.slice((chunkSize / 2) * i, (chunkSize / 2) * i + 10))
        i++
      }

      const hash = spark.end()

      self.postMessage(hash)
    })

    render.addEventListener('error', (err) => {
      self.postMessage(err)
    })
    render.readAsArrayBuffer(file)
  }

  self.onmessage = (e: MessageEvent) => {
    getFileHash(e.data)
  }
})()

export {}
