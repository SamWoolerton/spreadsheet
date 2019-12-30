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
    arguments: () => ({ name: "number" }),
    description: "arguments",
    variadic: true,
  },
  multiply: {
    fn: (...args) => args.reduce((acc, next) => acc * next),
    arguments: () => ({ name: "number" }),
    description: "arguments",
    variadic: true,
  },
  divide: {
    fn: (top, bottom, fallback = Fail("divide by 0")) =>
      bottom === 0 ? fallback : top / bottom,
    arguments: [
      { name: "top", type: "number" },
      { name: "bottom", type: "number" },
      { name: "fallback (if dividing by 0)" },
    ],
    description: "numbers given fallback",
    minArgs: 2,
    maxArgs: 3,
  },
  increment: {
    fn: n => n + 1,
    arguments: [{ name: "number" }],
    description: "add 1 to argument",
  },
  decrement: {
    fn: n => n - 1,
    arguments: [{ name: "number" }],
    description: "subtract 1 from argument",
  },
  to_power: {
    fn: (n, pow) => Math.pow(n, pow),
    arguments: [{ name: "number" }, { name: "exponent", type: "number" }],
    description: "raise a number to a power",
  },
  if: {
    fn: (pred, ifTrue, ifFalse) => (pred ? ifTrue : ifFalse),
    arguments: [
      { name: "test", type: "true/false" },
      { name: "value if true" },
      { name: "value if false" },
    ],
    description: "condition is true then this else that",
  },
  join: {
    fn: (sep, ...rest) => rest.join(sep),
    arguments: arg =>
      arg === 0 ? { name: "separator", type: "text" } : { name: "text" },
    description: "text with a chosen separator",
    variadic: true,
  },
  "": {
    fn: n => n,
  },
}
