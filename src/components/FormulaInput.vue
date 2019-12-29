<template>
  <div class="relative">
  <div
    :id="id"
    contenteditable
    v-html="highlighted"
    @input="handleInput"
    @keydown.enter="$emit('update', $event)"
    @keydown.esc="$emit('cancel')"
      @keydown.tab="autocompleteOptions.length > 0 && chooseSuggestion(autocompleteOptions[0])"
      @keyup.left="updateCaret"
      @keyup.right="updateCaret"
      @click.stop="updateCaret"
    class="input"
    spellcheck="false"
  />
    <div class="suggestions">
      <!-- mousedown fires before blur -->
      <div
        v-for="suggestion in autocompleteOptions"
        :key="suggestion"
        @mousedown="chooseSuggestion(suggestion)"
      >{{ suggestion }}</div>
    </div>
  </div>
</template>

<script>
import { makeParser } from "../parser/index"
import { regen } from "../parser/regen_from_ast"
import { autocomplete } from "../parser/autocomplete"

const state = {}

const parse = makeParser(state, { ast: true })

export default {
  props: {
    id: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      default: "",
    },
    // don't have to use this for it to trigger a repaint
    updateTrigger: {
      type: String,
      default: "",
    },
    parseValue: {
      type: Function,
      required: true,
    },
  },
  data: () => ({
    el: null,
    highlighted: "",
    autocompleteOptions: [],
  }),
  computed: {
    active() {
      return document.activeElement === this.el
    },
  },
  watch: {
    value(next) {
      this.processInput(next)
    },
  },
  mounted() {
    this.el = document.getElementById(this.id)
    this.processInput(this.value, false)
  },
  methods: {
    handleInput(event) {
      if (event.target.textContent !== this.value) {
        this.cursor = getCaret(this.el)
        this.$emit("input", event)
      }
    },
    async processInput(val, set = true) {
      await this.$nextTick()
      const initialCaret = this.cursor

      const ast = parse(val)
      // default to this.value if regen fails (because invalid AST)
      const reg = regen(ast).reg || this.value
      this.highlighted = reg

      if (set && this.value.length > 0 && document.activeElement === this.el) {
        await this.$nextTick()
        this.afterChange(this.el, initialCaret)
      }
    },
    async setCaretEnd() {
      if (document.activeElement === this.el) {
        await this.$nextTick()
        this.afterChange(this.el, this.el.textContent.length)
      }
    },
    afterChange(root, pos) {
      const { node, offset } =
        document.activeElement === this.el && currentNode(root, pos)

      setCaretInNode(node, offset)

      if (node.parentNode.className === "input-partial") {
        this.getAutocompleteOptions(node.textContent)
      } else {
        this.autocompleteOptions = []
      }
    },
    getAutocompleteOptions(name) {
      const { options } = autocomplete(name)
      this.autocompleteOptions = options
    },
    chooseSuggestion(suggestion) {
      this.test = "testing!"
      const nextVal = "=" + suggestion
      console.log("Choosing suggestion")
      this.$emit("input", { target: { textContent: nextVal } })
  },
  },
}

// function getArgument(node, offset) {
//   console.log("going to get argument", node, offset)
//   return 1
// }

function currentNode(root, pos) {
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
function setCaretInNode(node, offset) {
  const range = document.createRange()
  const sel = window.getSelection()
  range.setStart(node, offset)
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
.input {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5em 1em;
  background: white;
  border: none;
  color: #777;
}

span {
  &.input-function {
    color: #b1384d;
  }
  &.input-reference {
    color: #a014ed;
  }
  &.input-string {
    color: #d26f21;
  }
  &.input-number {
    color: #335caf;
  }
  &.input-boolean {
    color: green;
  }
}

.suggestions {
  position: absolute;
  background: lightblue;
  top: 100%;
  width: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;

  .suggestion {
    cursor: pointer;
  }
}
</style>
