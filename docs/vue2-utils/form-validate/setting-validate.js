export const checkIpList = (rule, value, callback) => {
  if (value) {
    if (!value.split('\n').every(value => {
      return (/^(?:(?:1[0-9][0-9]\.)|(?:2[0-4][0-9]\.)|(?:25[0-5]\.)|(?:[1-9][0-9]\.)|(?:[0-9/*]\.)){3}(?:(?:1[0-9][0-9])|(?:2[0-4][0-9])|(?:25[0-5])|(?:[1-9][0-9])|(?:[0-9/*]))$/.test(value))
    })) {
      callback(new Error('IP地址格式错误'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}
