export const checkName = (rule, value, callback) => {
  if (value.trim().length === 0) {
    callback(new Error('请输入摄像名称'))
  } else {
    callback()
  }
}

export const checkLiveUrl = (rule, value, callback) => {
  if (value) {
    if (!/^([hH][tT]{2}[pP]:\/\/|[hH][tT]{2}[pP][sS]:\/\/)(([A-Za-z0-9-~]+)\.)+([A-Za-z0-9-~\/])+$/.test(value)) {
      callback(new Error('请输入合法的地址'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

export const checkIpAndDn = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入ip地址或域名'))
  } else if (!/^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])|(([a-zA-Z\d][a-zA-Z\d-_]+\.)+[a-zA-Z\d-_][^ ]*))$/.test(value)) {
    callback(new Error('请输入合法的ip地址或域名'))
  } else {
    callback()
  }
}

export const checkHttpPort = (rule, value, callback) => {
  if (value) {
    if (!/^([1-9](\d{0,3}))$|^([1-5]\d{4})$|^(6[0-4]\d{3})$|^(65[0-4]\d{2})$|^(655[0-2]\d)$|^(6553[0-5])$/.test(value)) {
      callback(new Error('请输入合法的端口号'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

export const checkPort = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入端口'))
  }
  if (!/^([1-9](\d{0,3}))$|^([1-5]\d{4})$|^(6[0-4]\d{3})$|^(65[0-4]\d{2})$|^(655[0-2]\d)$|^(6553[0-5])$/.test(value)) {
    callback(new Error('请输入合法的端口号'))
  } else {
    callback()
  }
}

export const checkChannel = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入通道'))
  } else if (!/^[1-9]+[0-9]*$/.test(value)) {
    callback(new Error('通道的值只能为正整数'))
  } else {
    callback()
  }
}

export const checkBliveMainId = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入国标唯一编号'))
  } else if (!/^[a-zA-Z0-9]{1,20}$/.test(value)) {
    callback(new Error('长度在 1 到 32 个字符,数字,字母'))
  } else {
    callback()
  }
}

export const checkUserName = (rule, value, callback) => {
  if (value) {
    if (!/^[\u4E00-\u9FA5a-zA-Z0-9]{3,12}$/.test(value)) {
      callback(new Error('3到12位（字母，数字，中文）'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}
