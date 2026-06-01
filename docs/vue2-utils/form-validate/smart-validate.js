export const checkDeviceName = (rule, value, callback) => {
  if (value.trim().length === 0) {
    callback(new Error('请输入设备名称'))
  } else {
    callback()
  }
}

export const checkModelName = (rule, value, callback) => {
  if (value.trim().length !== 0) {
    if (/[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/g.test(value)) {
      callback(new Error('型号不能包含中文字符'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

export const checkDeviceCode = (rule, value, callback) => {
  if (value.trim().length !== 0) {
    if (/[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/g.test(value)) {
      callback(new Error('编号不能包含中文字符'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}
