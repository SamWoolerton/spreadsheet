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
        : type === "reference"
        ? value
        : type === "formula"
        ? rec("=", value)
        : type === "function"
        ? handleFunction(value)
        : type === "operator"
        ? handleExpression(value)
        : value

    return (
      str + (highlight ? `<span class="input-${type}">${next}</span>` : next)
    )
  }

  function handleString(value) {
    return `"${escapeHtml(value)}"`
  }

  function handleFunction([fn, args]) {
    return `${fn}(${args.map(a => rec("", a)).join(", ")})`
  }

  function handleExpression([op, a, b]) {
    return `${rec("", a)} ${op} ${rec("", b)}`
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
