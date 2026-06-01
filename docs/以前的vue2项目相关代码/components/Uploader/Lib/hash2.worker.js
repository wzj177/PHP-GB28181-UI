import SparkMD5 from 'spark-md5'

// worker 多线程
onmessage = event => {
  getFileHash(event.data)
}

function getFileHash({ file, chunkSize }) {
  console.log({ file, chunkSize })
  const spark = new SparkMD5.ArrayBuffer()
  const render = new FileReader()
  // render.readAsDataURL(file)
  // render.addEventListener('loadstart', event => {
  //   console.log('loadstart:', event)
  // })
  // render.addEventListener('abort', event => {
  //   console.log('abort:', event)
  // })
  // render.addEventListener('process', event => {
  //   console.log('process:', event)
  // })
  // render.addEventListener('load', event => {
  //   console.log('load:', event)
  // })
  render.addEventListener('loadend', event => {
    const content = render.result
    // 抽样hash计算
    // 规则：每半个切片大小取前10个
    let i = 0
    while ((chunkSize / 2) * (i + 1) + 10 < file.size) {
      spark.append(content.slice((chunkSize / 2) * i, (chunkSize / 2) * i + 10))
      i++
    }

    const hash = spark.end()

    postMessage(hash)
  })

  render.addEventListener('error', err => {
    console.log('error:', err)
    postMessage(err)
  })
  render.readAsArrayBuffer(file)
}
// 用一个匿名函数自调用
// ;(function () {
//   function getFileHash({ file, chunkSize }) {
//     const spark = new SparkMD5.ArrayBuffer()
//     const render = new FileReader()
//     // render.readAsDataURL(file)
//     render.addEventListener('loadstart', event => {
//       // console.log('loadstart:', event)
//     })
//     render.addEventListener('abort', event => {
//       // console.log('abort:', event)
//     })
//     render.addEventListener('process', event => {
//       // console.log('process:', event)
//     })
//     render.addEventListener('load', event => {
//       // console.log('load:', event)
//     })
//     render.addEventListener('loadend', event => {
//       const content = render.result
//       // console.log('content:', content)
//       // 抽样hash计算
//       // 规则：每半个切片大小取前10个
//       let i = 0
//       while ((chunkSize / 2) * (i + 1) + 10 < file.size) {
//         spark.append(
//           content.slice((chunkSize / 2) * i, (chunkSize / 2) * i + 10)
//         )
//         i++
//       }

//       const hash = spark.end()

//       self.postMessage(hash)
//     })

//     render.addEventListener('error', err => {
//       // console.log('error:', err)
//       self.postMessage(err)
//     })
//     render.readAsArrayBuffer(file)
//   }
//   self.onmessage = e => {
//     // e是 事件对象 MessageEvent
//     // e.data是从外面传进worker的内容,假如传了 { a: 1 }
//     // console.log(e.data)
//     /* do something */
//     getFileHash(e.data)
//   }
// })()
