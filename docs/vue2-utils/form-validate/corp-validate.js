export const checkAccount = (rule, value, callback) => {
  if (value.trim().length === 0) {
    callback(new Error('请输入管理员账号'))
  } else {
    callback()
  }
}

export const checkPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else {
    callback()
  }
}

export const checkCorpEmail = (rule, value, callback) => {
  if (value) {
    if (!/^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/.test(value)) {
      callback(new Error('邮箱格式错误'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

export const checkMobile = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3456789]\d{9}$/.test(value)) {
    callback(new Error('手机号格式错误'))
  } else {
    callback()
  }
}
