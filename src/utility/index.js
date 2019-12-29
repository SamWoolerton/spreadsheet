export function Ok(value) {
  return {
    ok: true,
    value,
  }
}

export function Fail(message) {
  return {
    ok: false,
    message,
  }
}

export const quotient = (top, bottom) => Math.floor(top / bottom)

export const isObject = obj => typeof obj === "object"

export const flatten = arr => [].concat(...arr)

export const round = (n, dp) => {
  const exp = Math.pow(10, dp)
  return Math.round(n * exp) / exp
}

export const max = (a, b) => (a > b ? a : b)

export const min = (a, b) => (a < b ? a : b)
