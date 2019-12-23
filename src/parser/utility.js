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

export function quotient(top, bottom) {
  return Math.floor(top / bottom)
}

export function getFirst([first]) {
  return first
}

export function isObject(obj) {
  return typeof obj === "object"
}
