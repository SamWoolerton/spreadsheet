import * as P from "parsimmon"
import { Ok, Fail, quotient, getFirst, isObject } from "./utility"

const operators = {
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
const operatorsList = Object.keys(operators)

const functions = {
  add: (a, b) => a + b,
  increment: n => n + 1,
  to_power: (n, pow) => Math.pow(n, pow),
  if: (pred, ifTrue, ifFalse) => (pred ? ifTrue : ifFalse),
  join: (sep, ...rest) => rest.join(sep),
  "": n => n,
}

const variables = {
  $current: 50,
}

const { main: parser } = P.createLanguage({
  main: r => P.alt(r.formula, r.primitive),
  formula: r =>
    P.seq(r.eq, r.optWhitespace, P.alt(r.expression, r.function))
      .map(removeNonValues)
      .map(getFirst)
      .desc("formula"),

  expression: r =>
    P.alt(r.function, r.variable, r.operator, r.primitive)
      .sepBy(P.alt(P.whitespace, P.string("")))
      .map(handleExtendedExpressions)
      .desc("expression without brackets"),

  eq: () => P.string("="),
  ampersand: () => P.string("&"),
  operator: () => P.alt(...operatorsList.map(P.string)).desc("operator"),
  lbracket: () => P.string("("),
  rbracket: () => P.string(")"),
  comma: () => P.string(","),
  optWhitespace: () => P.regexp(/\s?/).desc("optional whitespace"),

  primitive: r => P.alt(r.boolean, r.string, r.number).desc("primitive"),
  string: () =>
    P.regexp(/".*?"/)
      .map(removeEnclosingQuotes)
      .map(Ok)
      .desc("string"),
  boolean: () =>
    P.alt(P.string("true"), P.string("false"))
      .map(v => v === "true")
      .map(Ok)
      .desc("boolean"),
  number: () =>
    P.regexp(/-?(\d+)(\.\d+)?/)
      .map(Number)
      .map(Ok)
      .desc("number"),

  function: r =>
    P.seq(
      r.functionName,
      r.lbracket
        .then(r.functionArg.sepBy(addOptionalWhitespace(r, r.comma)))
        .skip(r.rbracket),
    )
      .map(handleFunction)
      .desc("function"),
  functionName: () => P.regexp(/[a-z_]*/).desc("function name"),
  functionArg: r => P.alt(r.function, r.expression, r.primitive),

  variable: () =>
    P.regexp(/\$[a-z_]+/)
      .map(handleVariable)
      .desc("variable"),
})

export function parse(input, { suppress = false } = {}) {
  try {
    // @ts-ignore
    return parser.tryParse(input)
  } catch ({ message }) {
    if (!suppress) console.log("Parsing error \n", message)
    return Fail("syntax")
  }
}

// utilities
function handleExpression([a, op, b]) {
  if (!a.ok) return a
  if (!b.ok) return b

  try {
    const result = operators[op](a.value, b.value)
    return isObject(result) ? result : Ok(result)
  } catch (err) {
    return Fail("invalid operation")
  }
}

function removeEnclosingQuotes(str) {
  return str.slice(1, -1)
}

function handleFunction([name, args]) {
  const fn = functions[name]

  const [fail] = args.filter(({ ok }) => !ok)
  if (fail) return fail
  if (!fn) return Fail(`unsupported function '${name}'`)
  return Ok(fn(...args.map(a => a.value)))
}

function handleExtendedExpressions([first, ...rest]) {
  if (rest.length === 0) return first

  const grouped = rest.reduce((acc, next, index) => {
    const ind = quotient(index, 2)
    if (!acc[ind]) acc[ind] = []
    acc[ind].push(next)
    return acc
  }, [])

  return grouped.reduce(
    (current, [op, val]) => handleExpression([current, op, val]),
    first,
  )
}

function handleVariable(name) {
  const variable = variables[name]
  if (!variable) return Fail(`missing variable '${name}'`)
  return Ok(variable)
}

function addOptionalWhitespace(r, el) {
  return P.seq(r.optWhitespace, el, r.optWhitespace)
}

function removeNonValues(args) {
  const blacklist = ["=", "(", ")", "", " "]
  return args.filter(val => !blacklist.includes(val))
}
