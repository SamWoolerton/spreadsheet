export function regen(ast, { highlight = true } = {}) {
  const { ok, str } = rec(Ok(""), ast)
  return { reg: ok ? str : "" }

  // go through each node and append to string, depth-first
  function rec({ ok, str }, { type, value }) {
    if (!ok || type === undefined) return Fail()

    const { ok: childOk, str: next } =
      type === "number"
        ? Ok(String(value))
        : type === "string"
        ? Ok(handleString(value))
        : type === "boolean"
        ? Ok(String(value))
        : type === "reference" ||
          type === "operator" ||
          type === "partial" ||
          type === "whitespace"
        ? Ok(value)
        : type === "formula"
        ? rec(Ok(highlight ? markup("eq", "=") : "="), value)
        : type === "function"
        ? handleFunction(value)
        : type === "expression"
        ? handleExpression(value)
        : Ok(value)

    if (!childOk) return Fail()

    return Ok(str + (highlight ? markup(type, next) : next))
  }

  function Ok(str) {
    return { ok: true, str }
  }

  function Fail() {
    return { ok: false, str: "" }
  }

  function markup(type, value) {
    return `<span class="input-${type}">${value}</span>`
  }

  function handleString(value) {
    return `"${escapeHtml(value)}"`
  }

  function handleFunction([fn, args]) {
    // recurse over arguments
    // whitespace complicates things - recreating a .join() by appending a comma (if not whitespace) and then slicing off the final comma
    const processedArgs = args.map(arg => {
      const { ok, str } = rec(Ok(""), arg)
      if (!ok) return { ok, str }
      const sep = arg.type === "whitespace" ? "" : ","
      return Ok(str + sep)
    })
    if (!processedArgs.every(({ ok }) => ok)) return Fail()
    const argsString = processedArgs
      .map(({ str }) => str)
      .join("")
      .slice(0, -1)
    return Ok(`${fn}(${argsString})`)
  }

  function handleExpression(values) {
    const processed = values.map(val => rec(Ok(""), val))
    if (!processed.every(v => v.ok)) return Fail()
    return Ok(processed.map(({ str }) => str).join(""))
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
