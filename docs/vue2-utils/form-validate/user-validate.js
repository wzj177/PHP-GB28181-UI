export const checkNickname = (rule, value, callback) => {
  if (value.trim().length === 0) {
    callback(new Error('请输入用户名称'))
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
export const checkEditPassword = (rule, value, callback) => {
  if (value) {
    if (!/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,16}$/.test(value)) {
      callback(new Error('密码格式不正确'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

export const checkTruename = (rule, value, callback) => {
  if (value.trim().length === 0) {
    callback(new Error('请输入真实姓名'))
  } else {
    callback()
  }
}

export const checkEmail = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入邮箱'))
  } else if (!/^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/.test(value)) {
    callback(new Error('邮箱格式错误'))
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
