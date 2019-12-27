export function regen(ast, { highlight = true } = {}) {
  return { reg: rec("", ast) }

  function rec(str, { type, value }) {
    // go through each node and append to string, depth-first

    const next =
      type === "number"
        ? String(value)
        : type === "string"
        ? handleString(value)
        : type === "boolean"
        ? String(value)
        : type === "reference" ||
          type === "operator" ||
          type === "partial" ||
          type === "whitespace"
        ? value
        : type === "formula"
        ? rec(ast ? markup(type, "=") : "=", value)
        : type === "function"
        ? handleFunction(value)
        : type === "expression"
        ? handleExpression(value)
        : value

    return str + (highlight ? markup(type, next) : next)
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
    return `${fn}(${args
      .map(a => rec("", a) + (a.type === "whitespace" ? "" : ","))
      .join("")
      .slice(0, -1)})`
  }

  function handleExpression(values) {
    return values.map(val => rec("", val)).join("")
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
