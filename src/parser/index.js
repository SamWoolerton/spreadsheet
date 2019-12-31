import * as P from "parsimmon"
import { Ok, Fail, quotient, isObject, flatten, round } from "../utility"
import { operators, operatorsList, functions } from "./config"

export function makeParser(references, { ast = false } = {}) {
  const { main: parser } = P.createLanguage({
    main: r => P.alt(r.formula, r.primitive),
    formula: r =>
      P.seq(r.eq, P.alt(r.expression, r.function))
        .map(removeNonValues(ast))
        .map(([, value]) => value)
        .map(value => (ast ? { type: "formula", value } : value))
        .desc("formula"),

    expression: r =>
      addOptionalWhitespace(
        r,
        P.alt(
          r.function,
          r.reference,
          r.operator,
          r.primitive,
          r.partialFunction,
        ),
      )
        .sepBy(P.string(""))
        .map(handleExtendedExpressions(ast))
        .desc("expression without brackets"),

    eq: () =>
      P.string("=").map(value => (ast ? { type: "eq", value } : Ok(value))),
    operator: () => P.alt(...operatorsList.map(P.string)).desc("operator"),
    lbracket: () => P.string("("),
    rbracket: () => P.string(")"),
    comma: () => P.string(","),
    whitespace: () => P.regexp(/\s/).desc("whitespace"),
    optWhitespace: () => P.regexp(/\s*/).desc("optional whitespace"),

    primitive: r => P.alt(r.boolean, r.string, r.number).desc("primitive"),
    string: () =>
      P.regexp(/".*?"/)
        .map(removeEnclosingQuotes)
        .map(value => (ast ? { type: "string", value } : Ok(value)))
        .desc("string"),
    boolean: () =>
      P.alt(P.string("true"), P.string("false"))
        .map(v => v === "true")
        .map(value => (ast ? { type: "boolean", value } : Ok(value)))
        .desc("boolean"),
    number: () =>
      P.regexp(/-?(\d+)(\.\d+)?/)
        .map(Number)
        .map(value => (ast ? { type: "number", value } : Ok(value)))
        .desc("number"),

    function: r =>
      P.seq(
        r.functionName,
        r.lbracket
          .then(addOptionalWhitespace(r, r.functionArg).sepBy(r.comma))
          .skip(r.rbracket),
      )
        .map(handleFunction(ast))
        .desc("function"),
    functionName: () => P.regexp(/[a-z_]*/).desc("function name"),
    functionArg: r => P.alt(r.function, r.expression, r.primitive),
    partialFunction: () =>
      P.regexp(/[a-z_]+/)
        .map(value =>
          ast ? { type: "partial", value } : Fail("function without arguments"),
        )
        .desc("partial function"),

    reference: () =>
      P.regexp(/[A-Z]+\d+/)
        .map(ref => handleReference(ast)(references, ref))
        .desc("reference"),
  })

  return function parse(input) {
    try {
      // @ts-ignore
      if (input === "") return Ok("")
      if (input === "=") return Ok("=")
      if (ast) return parser.tryParse(input)

      const { ok, value, message } = parser.tryParse(input)
      return ok
        ? { ok, value: typeof value === "number" ? round(value, 5) : value }
        : { ok, message }
    } catch ({ message }) {
      return Fail("syntax")
    }
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

function handleFunction(ast = false) {
  return ([name, initArgs]) => {
    const args = initArgs.reduce(
      (acc, next) => [
        ...acc,
        ...next
          .filter(arg => (ast ? arg !== "" : typeof arg !== "string"))
          .map(value =>
            typeof value === "string" ? { type: "whitespace", value } : value,
          ),
      ],
      [],
    )
    if (ast) return { type: "function", value: [name, args] }

    const func = functions[name]
    if (!func) return Fail(`unsupported function '${name}'`)
    if (!func.variadic) {
      if ((func.maxArgs || func.fn.length) < args.length) {
        return Fail(`too many arguments passed to '${name}'`)
      }
      if ((func.minArgs || func.fn.length) > args.length) {
        return Fail(`not enough arguments passed to '${name}'`)
      }
    }

    const [fail] = args.filter(({ ok }) => !ok)
    if (fail) return fail

    const result = func.fn(...args.map(a => a.value))
    // if function fails explicitly then return that, otherwise wrap in Ok
    return result.ok === false ? result : Ok(result)
  }
}

function handleExtendedExpressions(ast = false) {
  return init => {
    const processed = flatten(init).filter(v => v !== "")

    if (ast) {
      const value = processed.map(value =>
        typeof value === "string"
          ? operatorsList.includes(value)
            ? { type: "operator", value }
            : { type: "whitespace", value }
          : value,
      )

      return {
        type: "expression",
        value,
      }
    }

    const [first, ...rest] = processed.filter(
      value => typeof value !== "string" || operatorsList.includes(value),
    )

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
}

function handleReference(ast = false) {
  return (references, name) => {
    if (ast) return { type: "reference", value: name }

    const reference = references[name]
    if (!reference) return Fail(`missing reference '${name}'`)

    const {
      value: { ok, value },
    } = reference
    return ok ? Ok(value) : Fail(`error in referenced cell '${name}'`)
  }
}

function addOptionalWhitespace(r, el) {
  return P.seq(r.optWhitespace, el, r.optWhitespace)
}

function removeNonValues(ast) {
  return args => {
    const blacklist = ["=", "(", ")", ""]

    if (ast) return args.filter(val => !blacklist.includes(val))

    return args.filter(
      val => !blacklist.includes(typeof val === "string" && val.trim()),
    )
  }
}
