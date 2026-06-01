export const checkCrModel = (rule, value, callback) => {
  if (value) {
    if (!/^[a-zA-Z0-9_]{1,20}$/.test(value)) {
      callback(new Error('1到20位（字母，数字，下划线）'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

export const checkEqName = (rule, value, callback) => {
  if (value.trim().length === 0) {
    callback(new Error('请输入设备名称'))
  } else {
    callback()
  }
}
