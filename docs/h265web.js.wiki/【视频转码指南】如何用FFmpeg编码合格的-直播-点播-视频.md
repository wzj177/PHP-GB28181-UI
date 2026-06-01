* [直播推流服务器推荐](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%A7%86%E9%A2%91%E8%BD%AC%E7%A0%81%E6%8C%87%E5%8D%97%E3%80%91%E5%A6%82%E4%BD%95%E7%94%A8FFmpeg%E7%BC%96%E7%A0%81%E5%90%88%E6%A0%BC%E7%9A%84-%E7%9B%B4%E6%92%AD-%E7%82%B9%E6%92%AD-%E8%A7%86%E9%A2%91#%E7%9B%B4%E6%92%AD%E6%8E%A8%E6%B5%81%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%8E%A8%E8%8D%90)
* [FFmpeg支持265的HTTP-FLV直播](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%A7%86%E9%A2%91%E8%BD%AC%E7%A0%81%E6%8C%87%E5%8D%97%E3%80%91%E5%A6%82%E4%BD%95%E7%94%A8FFmpeg%E7%BC%96%E7%A0%81%E5%90%88%E6%A0%BC%E7%9A%84-%E7%9B%B4%E6%92%AD-%E7%82%B9%E6%92%AD-%E8%A7%86%E9%A2%91#ffmpeg%E6%94%AF%E6%8C%81265%E7%9A%84http-flv%E7%9B%B4%E6%92%AD)
* [FFmpeg转码正确的 H.265编码视频](https://github.com/numberwolf/h265web.js/wiki/%E3%80%90%E8%A7%86%E9%A2%91%E8%BD%AC%E7%A0%81%E6%8C%87%E5%8D%97%E3%80%91%E5%A6%82%E4%BD%95%E7%94%A8FFmpeg%E7%BC%96%E7%A0%81%E5%90%88%E6%A0%BC%E7%9A%84-%E7%9B%B4%E6%92%AD-%E7%82%B9%E6%92%AD-%E8%A7%86%E9%A2%91#ffmpeg%E8%BD%AC%E7%A0%81%E6%AD%A3%E7%A1%AE%E7%9A%84-h265%E7%BC%96%E7%A0%81%E8%A7%86%E9%A2%91)

### 直播推流服务器推荐 ###

<font color="blue">流媒体服务推荐用 <a href="https://github.com/ZLMediaKit/ZLMediaKit">ZLMediaKit(https://github.com/ZLMediaKit/ZLMediaKit) - 更好用的流媒体服务</a></font>
</strong>

<br>

### FFmpeg支持265的HTTP-FLV直播 ###

* Github地址: https://github.com/numberwolf/FFmpeg-QuQi-H265-FLV-RTMP

<br>

### FFmpeg转码正确的 H.265编码视频 ###

* mp4编码 **(MOOV BOX必须前置 `-movflags faststart`)**

```bash
ffmpeg -i input.mp4 \
-vcodec libx265 -pix_fmt yuv420p \
-acodec aac -ac 2 -ar 44100 \
-preset medium -maxrate 1000k -bufsize 1000k \
-vtag hvc1 \
-movflags faststart \
-y video.mp4
```

* mp4 将`moov box`前置（不转码方法）

```bash
ffmpeg -i input.mp4 \
-vcodec copy \
-acodec copy \
-movflags faststart \
-y video.mp4
```

* 视频去除音频

```bash
ffmpeg -i input.mp4 \
-vcodec copy \
-an \
-movflags faststart \
-y video.mp4
```

* hls/m3u8 录屏

```bash
ffmpeg -f avfoundation -i 1:0 \
-q 4 -r 10 \
-filter_complex "scale=1280:720" \
-pix_fmt yuv420p \
-vcodec libx265 \
-ar 22050 -ab 64k -ac 1 -acodec aac \
-threads 4 \
-preset veryfast \
-f segment \
-segment_list test.m3u8 \
-segment_time 5 \
-y /Users/numberwolf/Documents/webroot/VideoMissile/VideoMissilePlayer/res/hls1/v-%03d.ts
```

* mpeg-ts

```bash
ffmpeg -ss 20 -t 10 -i ./res/xinxiaomen.mp4 \
-vcodec libx265 -x265-params "bframes=0:keyint=10" -r 24 -filter_complex "scale=720:1280" -preset fast -maxrate 800k -bufsize 800k \
-acodec aac -ar 22050 -ac 1 \
-pix_fmt yuv420p \
-f mpegts -y ./res/veilside2.ts
```