import Cookies from 'js-cookie'
const TokenKey = 'byt_iot_v3_admin_auth_token'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(tokenRaw) {
  return Cookies.set(TokenKey, parseTokenRaw(tokenRaw))
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}

export function parseTokenRaw(tokenRaw) {
  if (!tokenRaw) {
    return ''
  }

  if (typeof tokenRaw === 'string') {
    return tokenRaw
  }

  const { token, token_type } = tokenRaw
  if (!token_type) {
    return token
  }

  return token_type + ' ' + token
}
