import { Fail } from "../utility"

export const operators = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => (b === 0 ? Fail("divide by 0") : a / b),
  ">": (a, b) => a > b,
  ">=": (a, b) => a >= b,
  "<": (a, b) => a < b,
  "<=": (a, b) => a <= b,
  "&": (a, b) => String(a).concat(b),
}
export const operatorsList = Object.keys(operators)

export const functions = {
  add: {
    fn: (...args) => args.reduce((acc, next) => acc + next),
    variadic: true,
  },
  multiply: {
    fn: (...args) => args.reduce((acc, next) => acc * next),
    variadic: true,
  },
  divide: {
    fn: (top, bottom, fallback = Fail("divide by 0")) =>
      bottom === 0 ? fallback : top / bottom,
    minArgs: 2,
    maxArgs: 3,
  },
  increment: {
    fn: n => n + 1,
  },
  decrement: {
    fn: n => n - 1,
  },
  to_power: {
    fn: (n, pow) => Math.pow(n, pow),
  },
  if: {
    fn: (pred, ifTrue, ifFalse) => (pred ? ifTrue : ifFalse),
  },
  join: {
    fn: (sep, ...rest) => rest.join(sep),
    variadic: true,
  },
  "": {
    fn: n => n,
  },
}
