* [Seek完成](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#seek%E5%AE%8C%E6%88%90)
* [YUV帧数据渲染](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#yuv%E5%B8%A7%E6%95%B0%E6%8D%AE%E6%B8%B2%E6%9F%93)
* [媒体文件加载完成事件](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#%E5%AA%92%E4%BD%93%E6%96%87%E4%BB%B6%E5%8A%A0%E8%BD%BD%E5%AE%8C%E6%88%90%E4%BA%8B%E4%BB%B6)
* [播放器当前播放PTS时刻更新](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#%E6%92%AD%E6%94%BE%E5%99%A8%E5%BD%93%E5%89%8D%E6%92%AD%E6%94%BEpts%E6%97%B6%E5%88%BB%E6%9B%B4%E6%96%B0)
* [播放器媒体播放结束事件](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#%E6%92%AD%E6%94%BE%E5%99%A8%E5%AA%92%E4%BD%93%E6%92%AD%E6%94%BE%E7%BB%93%E6%9D%9F%E4%BA%8B%E4%BB%B6)
* [播放器缓冲进度回调](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#%E6%92%AD%E6%94%BE%E5%99%A8%E7%BC%93%E5%86%B2%E8%BF%9B%E5%BA%A6%E5%9B%9E%E8%B0%83)
* [播放器封面图加载完成](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#%E6%92%AD%E6%94%BE%E5%99%A8%E5%B0%81%E9%9D%A2%E5%9B%BE%E5%8A%A0%E8%BD%BD%E5%AE%8C%E6%88%90)
* [当前正在缓存帧数据](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#%E5%BD%93%E5%89%8D%E6%AD%A3%E5%9C%A8%E7%BC%93%E5%AD%98%E5%B8%A7%E6%95%B0%E6%8D%AE)
* [帧数据缓存完成](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#%E5%B8%A7%E6%95%B0%E6%8D%AE%E7%BC%93%E5%AD%98%E5%AE%8C%E6%88%90)
* [开启全屏事件](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#%E5%BC%80%E5%90%AF%E5%85%A8%E5%B1%8F%E4%BA%8B%E4%BB%B6)
* [关闭全屏事件](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#%E5%85%B3%E9%97%AD%E5%85%A8%E5%B1%8F%E4%BA%8B%E4%BB%B6)
* [播放器播放状态](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%AF%B4%E6%98%8E%E3%80%91Event%E4%BA%8B%E4%BB%B6-%E5%9B%9E%E8%B0%83#%E6%92%AD%E6%94%BE%E5%99%A8%E6%92%AD%E6%94%BE%E7%8A%B6%E6%80%81)

### 播放器相关事件绑定 ###

#### Seek完成 ####

> 主要用于SEEK完成做一些操作

* 示例

```javascript
player.onSeekFinish = () => {
    // todo
};
```

<br>

#### YUV帧数据渲染 ####

|  回调参数 | 类型 | 默认值 | 必填 | 说明 | 
|  ----  | ----  | ---- | ---- | ---- |
| width  | int | - | - | YUV宽度 |
| height  | int | - | - | YUV高度 |
| imageBufferY  | Uint8Array | - | - | Y分量 |
| imageBufferB  | Uint8Array | - | - | ChromaB分量 |
| imageBufferR  | Uint8Array | - | - | ChromaR分量 |

> 可以利用事件回调的YUV做全屏播放

> 需要调用 `setRenderScreen` 函数开启才可以收到事件回调数据, 下方`1.5 API`会说明

* 示例

```javascript
player.onRender = (width, height, imageBufferY, imageBufferB, imageBufferR) => {
	// todo
};
```

<br>

#### 媒体文件加载完成事件 ####

> 媒体文件当前加载成功，可以进行播放

* 示例

```javascript
player.onLoadFinish = () => {
	// todo
};
```

<br>

#### 播放器当前播放PTS时刻更新 ####

|  回调参数 | 类型 | 默认值 | 必填 | 说明 | 
|  ----  | ----  | ---- | ---- | ---- |
| videoPTS  | float64 | - | - | 当前播放时间 |

* 示例

```javascript
player.onPlayTime = (videoPTS) => {
	// todo
	console.log(videoPTS)
};
```

#### 播放器媒体播放结束事件 ####

* 示例

```javascript
player.onPlayFinish = () => {
    // finished
};
```

#### 播放器缓冲进度回调 ####

|  回调参数 | 类型 | 默认值 | 必填 | 说明 | 
|  ----  | ----  | ---- | ---- | ---- |
| cPts  | float64 | - | - | 当前缓冲进度时间 |

* 示例

```javascript
player.onCacheProcess = (cPts) => {
    // console.log("onCacheProcess => ", cPts);
};
```

#### 播放器封面图加载完成 ####

* 示例

```javascript
player.onReadyShowDone = () => {
    // console.log("onReadyShowDone");
    // to play 封面图加载完成了
};
```

#### 当前正在缓存帧数据 ####

* 示例

```javascript
player.onLoadCache = () => {
	// caching frames
};
```


#### 帧数据缓存完成 ####

* 示例

```javascript
player.onLoadCacheFinshed = () => {
    // cache finished
};
```

#### 开启全屏事件 ####

* 示例

```javascript
player.onOpenFullScreen = () => {
    // todo
};
```

#### 关闭全屏事件 ####

* 示例

```javascript
player.onCloseFullScreen = () => {
    // todo
};
```

#### 播放器播放状态 ####

* 示例

```javascript
player.onPlayState = (state) => {
    // state
    // true: playing / false: paused
};
```

