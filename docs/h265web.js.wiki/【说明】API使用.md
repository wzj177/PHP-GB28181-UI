* [加载播放器](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E5%8A%A0%E8%BD%BD%E6%92%AD%E6%94%BE%E5%99%A8)
* [获取当前播放状态](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E8%8E%B7%E5%8F%96%E5%BD%93%E5%89%8D%E6%92%AD%E6%94%BE%E7%8A%B6%E6%80%81)
* [开始播放](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E5%BC%80%E5%A7%8B%E6%92%AD%E6%94%BE)
* [暂停播放](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E6%9A%82%E5%81%9C%E6%92%AD%E6%94%BE)
* [渲染过程中回调YUV帧数据](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E6%B8%B2%E6%9F%93%E8%BF%87%E7%A8%8B%E4%B8%AD%E5%9B%9E%E8%B0%83yuv%E5%B8%A7%E6%95%B0%E6%8D%AE)
* [Seek跳转到某个时刻](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#seek%E8%B7%B3%E8%BD%AC%E5%88%B0%E6%9F%90%E4%B8%AA%E6%97%B6%E5%88%BB)
* [调整音量](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E8%B0%83%E6%95%B4%E9%9F%B3%E9%87%8F)
* [获取媒资数据](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E8%8E%B7%E5%8F%96%E5%AA%92%E8%B5%84%E6%95%B0%E6%8D%AE)
* [全屏播放](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E5%85%A8%E5%B1%8F%E6%92%AD%E6%94%BE)
* [退出全屏播放](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E9%80%80%E5%87%BA%E5%85%A8%E5%B1%8F%E6%92%AD%E6%94%BE)
* [逐帧播放](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E9%80%90%E5%B8%A7%E6%92%AD%E6%94%BE)
* [截取当前帧图像](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E6%88%AA%E5%8F%96%E5%BD%93%E5%89%8D%E5%B8%A7%E5%9B%BE%E5%83%8F)
* [设置播放速率(H.264/AV1)](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E8%AE%BE%E7%BD%AE%E6%92%AD%E6%94%BE%E9%80%9F%E7%8E%87h264av1)
* [获取当前播放速率(H.264/AV1)](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E8%8E%B7%E5%8F%96%E5%BD%93%E5%89%8D%E6%92%AD%E6%94%BE%E9%80%9F%E7%8E%87h264av1)
* [Resize缩放](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#resize)
* [释放播放器](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91API%E4%BD%BF%E7%94%A8#%E9%87%8A%E6%94%BE%E6%92%AD%E6%94%BE%E5%99%A8)

### 播放器API能力 ###

#### 加载播放器 ####

> 一般在配置完成【播放器配置】和【事件】之后进行播放器加载

* 示例

```javascript
player.do();
```

<br>

#### 获取当前播放状态 ####

|  调用函数 | 返回 | 说明 |
|  ---- | ----  | ---- |
| isPlaying() | bool | 是否正在播放中 |

* 示例

```javascript
if (player.isPlaying()) {
	// 正在播放中
} else {
	// 当前是暂停状态
}
```

<br>

#### 开始播放 ####

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| play()  | - | 开始播放 |

* 示例

```javascript
player.play();
```

<br>

#### 暂停播放 ####

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| pause()  | - | 暂停播放 |

* 示例

```javascript
player.pause();
```

<br>

#### 渲染过程中回调YUV帧数据 ####

> 开启之后，`onRender`事件才可以收到数据

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| setRenderScreen(`{param1}`)  | - | 开启/关闭渲染过程中 回调YUV帧数据 |

* 参数

|  参数 | 类型 | 默认值 | 说明 |
|  ----  | ---- | ----  | ---- |
| param1 | bool | false | 开启/关闭渲染过程中 回调YUV帧数据 |

* 示例

```javascript
// 开启
player.setRenderScreen(true);
// 关闭
player.setRenderScreen(false);
```

<br>

#### Seek跳转到某个时刻 ####

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| seek(`{pts}`)  | - | Seek到某一个时刻 |

* 参数

|  参数 | 类型 | 默认值 | 说明 |
|  ----  | ---- | ----  | ---- |
| pts | float64 | - | Seek到某一个时刻的时间点 |

* 示例

```javascript
// Seek到10.01秒
player.seek(10.01);
```

<br>

#### 调整音量 ####

> 调整视频的播放音量

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| setVoice(`{volume}`)  | - | 调整音量 |

* 参数

|  参数 | 类型 | 默认值 | 说明 |
|  ----  | ---- | ----  | ---- |
| volume | float64 | - | 范围区间是`[0, 1.0]`, 0为mute，1.0为全开音量 |

* 示例

```javascript
// 音量开启一半
player.setVoice(0.5);
```

<br>

#### 获取媒资数据 ####

> 获取当前播放的视频文件的信息数据

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| mediaInfo()  | Object | 媒资详情 |

* 返回值示例

```json
meta:
	audioNone: false // 是否不包含音频轨
	durationMs: 600000 // 时长 毫秒级
	fps: 25 // 帧率
	sampleRate: 44100 // 音频采样率
	size: // 视频分辨率
		height: 720
		width: 1280
	videoCodec: 0 // 0:HEVC/H.265 1:其他编码
	isHEVC: true // 是否是H265编码视频
videoType: "vod" // 点播vod 直播live
```

* 示例

```javascript
let mediaInfo = player.mediaInfo();
```
<br>

#### 全屏播放 ####

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| fullScreen()  | - | 全屏播放 |

* 示例

```javascript
player.fullScreen();
```
<br>

#### 退出全屏播放 ####

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| closeFullScreen()  | - | 退出全屏 |

* 示例

```javascript
player.closeFullScreen();
```

<br>




#### 逐帧播放 ####

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| playNextFrame()  | - | 逐帧播放 播放下一帧 |

<br>


#### 截取当前帧图像 ####

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| snapshot()  | - | 截取当前帧图像 |

* 示例

```javascript
const snapCanvas = document.getElementById("snapshot-player"); // create canvas
h265Object.snapshot(snapCanvas); // snapshot to canvas
```

<br>

#### 设置播放速率(H.264/AV1) ####

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| setPlaybackRate(rate)  | - | 设置倍速 默认1.0 |

* 示例

```javascript
h265Object.setPlaybackRate(0.5);
```

<br>

#### 获取当前播放速率(H.264/AV1) ####

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| getPlaybackRate()  | Double | 获取当前速率 |

* 示例

```javascript
let rate = h265Object.getPlaybackRate();
```

<br>

#### resize ####

|  调用函数 | 返回 | 说明 |
| ---- | ---- | ----|
| resize(width, height) | true/false | resize |

<br>


#### 释放播放器 ####

|  调用函数 | 返回 | 说明 |
|  ----  | ----  | ---- |
| release()  | - | 释放播放器资源 |

* 示例

```javascript
player.release();
```
