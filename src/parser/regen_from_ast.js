export function regen(ast, { highlight = true, caret = 0 } = {}) {
  let pos = {
    found: false,
    el: 0,
    offset: null,
    fn: null,
  }
  let length = 0

  return { reg: rec("", ast), pos }

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

    if (!pos.found) {
      pos.el += 1
      if (length + next.length >= caret) {
        // console.log("Found in", type)
        pos.found = true
        pos.offset = caret - length
        pos.fn = childNodes => childNodes[0]
      } else {
        length += next.length
      }
    }

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
