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
      @focus="handleFocus"
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
import { getCaret, setCaretInNode, currentNode } from "../utility/selection"

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
    caret: {
      type: Number,
      default: 0,
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
      const value = event.target.textContent
      if (value !== this.value) {
        const caret = getCaret(this.el)
        this.$emit("input", { value, caret })
      }
    },
    async processInput(val, set = true) {
      await this.$nextTick()
      const initialCaret = this.caret

      const ast = parse(val)
      // default to this.value if regen fails (because invalid AST)
      const reg = regen(ast).reg || this.value
      this.highlighted = reg

      if (set && this.value.length > 0 && document.activeElement === this.el) {
        await this.$nextTick()
        this.afterChange(this.el, initialCaret)
      }
    },
    handleFocus() {
      this.setCaretEnd()
      this.$emit("focus")
    },
    async setCaretEnd() {
      if (document.activeElement === this.el) {
        await this.$nextTick()
        this.afterChange(this.el, this.el.textContent.length)
        this.$emit("input", { value: this.value, caret: this.caret })
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
    async updateCaret() {
      this.$emit("input", { value: this.value, caret: getCaret(this.el) })
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
