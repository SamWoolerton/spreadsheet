export function currentNode(root, pos) {
  // find node
  const nodeContains = (node, current, pos) =>
    pos >= current && pos <= node.textContent.length + current
  function getNode(node, current = 0) {
    return [...node.childNodes].reduce(
      (acc, next) => {
        // otherwise child nodes after found will still increment length and throw it off
        if (acc.found) return acc

        const text = next.textContent
        const contains = nodeContains(next, acc.current, pos)
        // if this node doesn't have it, return acc (go straight to next child node)
        if (!contains) {
          return {
            ...acc,
            current: acc.current + text.length,
          }
        }

        // if text node then we found it! Return the node
        if (next.nodeName === "#text") {
          acc.node = next
          acc.current += text.length
          acc.len = text.length
          acc.found = true
          return acc
        }

        // else need to loop through child nodes to find it
        return getNode(next, acc.current)
      },
      { node, current, len: null, found: false },
    )
  }
  const { node, current: end, len } = getNode(root, 0, pos)

  // calculate offset
  const start = end - len
  const offset = pos - start

  return { node, offset }
}

// originally from https://stackoverflow.com/a/6249440/7170445
export function setCaretInNode(node, offset) {
  const range = document.createRange()
  const sel = window.getSelection()
  range.setStart(node, offset)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

// from https://stackoverflow.com/a/4812022/7170445
export function getCaret(element) {
  var caretOffset = 0
  var doc = element.ownerDocument || element.document
  var win = doc.defaultView || doc.parentWindow
  var sel
  if (typeof win.getSelection != "undefined") {
    sel = win.getSelection()
    if (sel.rangeCount > 0) {
      var range = win.getSelection().getRangeAt(0)
      var preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(element)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      caretOffset = preCaretRange.toString().length
    }
  } else if ((sel = doc.selection) && sel.type != "Control") {
    var textRange = sel.createRange()
    var preCaretTextRange = doc.body.createTextRange()
    preCaretTextRange.moveToElementText(element)
    preCaretTextRange.setEndPoint("EndToEnd", textRange)
    caretOffset = preCaretTextRange.text.length
  }
  return caretOffset
}
