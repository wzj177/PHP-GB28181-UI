export const checkGoodsName = (rule, value, callback) => {
  if (value.trim().length === 0) {
    callback(new Error('请输入商品称'))
  } else {
    callback()
  }
}

export const checkNumber = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入商品编号'))
  } else if (!/^[a-z0-9-]*$/g.test(value)) {
    callback(new Error('小写字母,数字,中短划线'))
  } else {
    callback()
  }
}

export const checkSpecs = (rule, value, callback) => {
  if (value) {
    if (/[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/g.test(value)) {
      callback(new Error('不能包含中文字符'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

export const checkModel = (rule, value, callback) => {
  if (value) {
    if (/[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/g.test(value)) {
      callback(new Error('不能包含中文字符'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}
