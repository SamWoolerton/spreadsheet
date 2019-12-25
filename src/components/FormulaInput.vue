<template>
  <div>
    <div>Input below</div>
    <div :id="id" @input="handleInput" contenteditable v-html="value" />
  </div>
</template>

<script>
import { makeParser } from "../parser/index"
import { regen } from "../parser/regen_from_ast"

const state = {}

const parse = makeParser(state, { ast: true })

export default {
  props: {
    id: {
      type: String,
      required: true,
    },
    parseValue: {
      type: Function,
      required: true,
    },
  },
  data: () => ({
    value: "=increment(4)",
    el: null,
  }),
  mounted() {
    this.el = document.getElementById(this.id)
    this.processInput(this.value, false)
  },
  methods: {
    handleInput(e) {
      const { innerText: val } = e.target
      this.processInput(val)
    },
    async processInput(val, set = true) {
      const initialCaret = getCaret(this.el)
      console.log("Caret starts at", initialCaret)

      // AST can mask errors but parser will return error object to top level
      // this keeps existing spans etc in place
      if (!this.parseValue(val, { suppress: true }).ok) return

      const ast = parse(val)
      // console.log("ast is", ast)
      // const { reg, pos } = regen(ast, { initialCaret })
      const { reg } = regen(ast, { initialCaret })
      // console.log("regen output", reg, pos)
      this.value = reg

      if (set && this.value.length > 0) {
        await this.$nextTick()
        // setCaret(this.el, pos.fn(this.el.childNodes), pos.offset)
        setCaret(this.el, initialCaret)
      }
    },
  },
}

function setCaret(root, pos) {
  /**
   * find node
   * calculate offset
   * set caret
   */

  // find node
  const nodeContains = (node, current, pos) =>
    pos > current && pos <= node.textContent.length + current
  function getNode(node, current = 0) {
    console.log(
      "Checking a node",
      nodeContains(node, current, pos),
      node,
      current,
      pos,
      node.textContent,
    )
    return [...node.childNodes].reduce(
      (acc, next) => {
        const text = next.textContent
        const contains = nodeContains(next, acc.current, pos)
        console.log(
          "Checking child",
          contains,
          next.nodeName,
          next,
          text,
          acc.current,
          pos,
        )
        // if this node doesn't have it, return acc (go straight to next child node)
        if (!contains) {
          return {
            ...acc,
            current: acc.current + text.length,
          }
        }

        console.log("We found the node, so what's the name?", next.nodeName)

        // if text node then we found it! Return the node
        if (next.nodeName === "#text") {
          console.log("Found in text node", text)
          acc.node = next
          acc.current += text.length
          acc.len = text.length
          return acc
        }

        // else need to loop through child nodes to find it
        return getNode(next, acc.current)
      },
      { node, current, len: null },
    )
  }
  const { node, current: end, len } = getNode(root, 0, pos)

  // calculate offset
  console.log("########################")
  // const offset = len - (end - pos)
  // const offset = end - pos
  const start = end - len
  const offset = pos - start
  console.log("Found the node", node, { end, pos, len, start, offset })

  // set caret
  setCaretInNode(node, offset)
}

// originally from https://stackoverflow.com/a/6249440/7170445
function setCaretInNode(rangeStart, offset) {
  const range = document.createRange()
  const sel = window.getSelection()
  range.setStart(rangeStart, offset)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

// from https://stackoverflow.com/a/4812022/7170445
function getCaret(element) {
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
</script>

<style lang="scss">
span {
  &.input-function {
    color: #ce6d7e;
  }
  &.input-string {
    color: #e57b27;
  }
  &.input-number {
    color: #2626a9;
  }
  &.input-boolean {
    color: green;
  }
}
</style>
