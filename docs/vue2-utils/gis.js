/**
 * 经纬度降维
 * @param {*} latLngs
 * @returns
 */
export function latLngsToPoints(latLngs) {
  return latLngs.map(latLng => {
    if (typeof latLng === 'object') {
      return [latLng.lng, latLng.lat]
    }
    return [latLng[0], latLng[1]]
  })
}

/**
 * 判断两多边形线段是否相交
 * @param {*} segA
 * @param {*} segB
 * @returns
 */
export function isSegmentsIntersectant(segA, segB) {
  const abc =
    (segA[0][0] - segB[0][0]) * (segA[1][1] - segB[0][1]) -
    (segA[0][1] - segB[0][1]) * (segA[1][0] - segB[0][0])
  const abd =
    (segA[0][0] - segB[1][0]) * (segA[1][1] - segB[1][1]) -
    (segA[0][1] - segB[1][1]) * (segA[1][0] - segB[1][0])
  if (abc * abd >= 0) {
    return false
  }
  const cda =
    (segB[0][0] - segA[0][0]) * (segB[1][1] - segA[0][1]) -
    (segB[0][1] - segA[0][1]) * (segB[1][0] - segA[0][0])
  const cdb = cda + abc - abd
  console.log('线段是否相交：', !(cda * cdb >= 0))
  return !(cda * cdb >= 0)
}
/**
 * 面面是否相交
 * @param {*} plyA
 * @param {*} plyB
 * @returns
 */
export function isPolygonsIntersectant(plyA, plyB) {
  for (let i = 0, il = plyA.length; i < il; i++) {
    for (let j = 0, jl = plyB.length; j < jl; j++) {
      const segA = [plyA[i], plyA[i === il - 1 ? 0 : i + 1]]
      const segB = [plyB[j], plyB[j === jl - 1 ? 0 : j + 1]]
      if (isSegmentsIntersectant(segA, segB)) {
        console.log('边界相交：')
        return true
      }
    }
  }
  console.log('边界不相交：')
  return false
}

/**
 * 判断点是否在另一平面图中
 * @param {*} point
 * @param {*} vs
 * @returns
 */
export function pointInPolygon(point, vs) {
  const x = point[0]
  const y = point[1]
  let inside = false
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0]
    const yi = vs[i][1]
    const xj = vs[j][0]
    const yj = vs[j][1]

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) {
      inside = !inside
    }
  }
  console.log(inside)
  return inside
}

/**
 * 判断两多变形是否存在点与区域的包含关系(A的点在B的区域内或B的点在A的区域内)
 * @param {*} plyA
 * @param {*} plyB
 * @returns
 */
export function isPointInPolygonBidirectional(plyA, plyB) {
  // 面面
  let [a, b] = [false, false]
  a = plyA.some((item) => pointInPolygon(item, plyB))
  if (!a) {
    b = plyB.some((item) => pointInPolygon(item, plyA))
  }
  console.log('包含关系：', a || b)
  return a || b
}

/**
 * 判断多边形是否重合
 * @param {*} plyA
 * @param {*} plyB
 * @returns
 */
export function isPolygonsOverlap(plyA, plyB) {
  return (
    isPolygonsIntersectant(plyA, plyB) ||
    isPointInPolygonBidirectional(plyA, plyB)
  )
}
/**
 * 获取多边形中心点
 * @param {*} latlngs
 */
export function getPolygonCenter(latlngs) {
  if (!latlngs || latlngs.length === 0) {
    return null
  }
  // eslint-disable-next-line
  const polygon = L.polygon(latlngs)
  if (!polygon) {
    return null
  }

  return polygon.getBounds().getCenter()
}

/**
 * 区域筛选 => 多边形
 * @param checkPoint 点坐标（经纬度）
 * @param polygonPoints  区域组成坐标（经纬度）
 *
 */
export function polygonFilter(checkPoint, polygonPoints) {
  let counter = 0
  let i = 1
  let xinters
  let p1, p2
  const pointCount = polygonPoints.length
  p1 = polygonPoints[0]

  for (i; i <= pointCount; i++) {
    p2 = polygonPoints[i % pointCount]
    if (
      checkPoint.lat > Math.min(p1.lat, p2.lat) &&
      checkPoint.lat <= Math.max(p1.lat, p2.lat)
    ) {
      if (checkPoint.lng <= Math.max(p1.lng, p2.lng)) {
        if (p1.lat !== p2.lat) {
          xinters =
            ((checkPoint.lat - p1.lat) * (p2.lng - p1.lng)) /
              (p2.lat - p1.lat) +
            p1.lng
          if (p1.lng === p2.lng || checkPoint.lng <= xinters) {
            counter++
          }
        }
      }
    }
    p1 = p2
  }
  if (counter % 2 === 0) {
    return false
  }

  return true
}

// 经纬度转换成三角函数中度分表形式。
function rad(d) {
  return (d * Math.PI) / 180.0
}

/**
 * 计算两个经纬度间的距离
 * @param lat1  纬度
 * @param lng1  经度
 * @param lat2  纬度
 * @param lng2  经度
 */
export function geoDistance(lat1, lng1, lat2, lng2) {
  const radLat1 = rad(lat1)
  const radLat2 = rad(lat2)
  const a = radLat1 - radLat2
  const b = rad(lng1) - rad(lng2)
  let s =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) +
          Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
      )
    )
  s = s * 6378.137 // EARTH_RADIUS
  s = Math.round(s * 10000) / 10000 // 输出为公里
  return s
}

/**
 * 百度坐标转火星坐标
 * @param {*} baiduPoint
 * @returns
 */
export function baiduTomars(baiduPoint) {
  const x_pi = (3.14159265358979324 * 3000.0) / 180.0
  const marsPoint = { lng: 0, lat: 0 }
  const x = baiduPoint.lng - 0.0065
  const y = baiduPoint.lat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi)
  marsPoint.lng = z * Math.cos(theta)
  marsPoint.lat = z * Math.sin(theta)

  return marsPoint
}

/**
 * 火星坐标转百度坐标
 * @param {*} mars_point
 * @returns
 */
export function marsTobaidu(marsPoint) {
  const x_pi = (3.14159265358979324 * 3000.0) / 180.0
  const baiduPoint = { lat: 0, lng: 0 }
  const x = marsPoint.lng
  const y = marsPoint.lat
  const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi)
  const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi)
  baiduPoint.lng = z * Math.cos(theta) + 0.0065
  baiduPoint.lat = z * Math.sin(theta) + 0.006

  return baiduPoint
}

/**
 * 百度坐标转高德
 * @param {*} bdLng
 * @param {*} bdLat
 * @returns
 */
export function baiduToGaoDe(bdLng, bdLat) {
  var X_PI = (Math.PI * 3000.0) / 180.0
  var x = bdLng - 0.0065
  var y = bdLat - 0.006
  var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI)
  var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI)
  var ggLng = z * Math.cos(theta)
  var ggLat = z * Math.sin(theta)
  return { lng: ggLng, lat: ggLat }
}

/**
 * 高德坐标转百度坐标
 * @param {*} ggLng
 * @param {*} ggLat
 * @returns
 */
export function gaoDeToBaiDu(ggLng, ggLat) {
  var X_PI = (Math.PI * 3000.0) / 180.0
  var x = ggLng
  var y = ggLat
  var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * X_PI)
  var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * X_PI)
  var bdLng = z * Math.cos(theta) + 0.0065
  var bdLat = z * Math.sin(theta) + 0.006
  return {
    lng: bdLng,
    lat: bdLat
  }
}

/**
 * 墨卡托转经纬度
 * @param {*} mercator
 * @returns
 */
export function mercatorTolonlat(mercator) {
  const lonlat = { lng: 0, lat: 0 }

  const x = (mercator.x / 20037508.34) * 180
  let y = (mercator.y / 20037508.34) * 180

  y =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((y * Math.PI) / 180)) - Math.PI / 2)

  lonlat.lng = x
  lonlat.lat = y

  return lonlat
}

/**
 * 经纬度转墨卡托
 * @param {*} lngLat
 * @returns
 */
export function lonlatToMercator(lngLat) {
  const mercator = {}

  const x = (lngLat.lng * 20037508.34) / 180
  let y =
    Math.log(Math.tan(((90 + lngLat.lat) * Math.PI) / 360)) / (Math.PI / 180)

  y = (y * 20037508.34) / 180

  mercator.lng = x
  mercator.lat = y

  return mercator
}
