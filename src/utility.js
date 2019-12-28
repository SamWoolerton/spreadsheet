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
