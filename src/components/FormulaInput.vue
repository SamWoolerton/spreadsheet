<template>
  <div class="relative">
    <div
      :id="id"
      contenteditable
      v-html="highlighted"
      @input="handleInput"
      @keydown.enter="$emit('update', $event)"
      @keydown.esc="$emit('cancel')"
      @keydown.tab.prevent="autocompleteOptions.length > 0 && chooseSuggestion(autocompleteOptions[0])"
      @keyup.left="updateCaret"
      @keyup.right="updateCaret"
      @keydown.down.prevent="focusFirstSuggestion"
      @mousedown.stop="updateCaret"
      @focus="handleFocus"
      class="input"
      spellcheck="false"
    />
    <div id="suggestions" class="suggestions" v-if="autocompleteOptions.length > 0">
      <div
        v-for="suggestion in autocompleteOptions"
        :key="suggestion"
        @mousedown.prevent="chooseSuggestion(suggestion)"
        @keydown.up.prevent="changeSuggestionFocus($event, suggestion)"
        @keydown.down.prevent="changeSuggestionFocus($event, suggestion)"
        @keydown.enter="chooseSuggestion(suggestion)"
        @keydown.tab.prevent="chooseSuggestion(suggestion)"
        @keydown.esc="el.focus()"
        class="suggestion"
        tabindex="0"
      >{{ suggestion }}</div>
    </div>
  </div>
</template>

<script>
import { makeParser } from "../parser/index"
import { regen } from "../parser/regen_from_ast"
import { autocomplete } from "../parser/autocomplete"
import { getCaret, setCaretInNode, currentNode } from "../utility/selection"
import { min } from "../utility/index"

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
    autocompletePrompt: "",
    activeNode: null,
  }),
  computed: {
    active() {
      return document.activeElement === this.el
    },
    autocompleteOptions() {
      return autocomplete(this.autocompletePrompt).options
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
      const { node, offset, start, len } =
        document.activeElement === this.el && currentNode(root, pos)

      // this would be a really weird error condition
      if (!node) return

      setCaretInNode(node, offset)

      if (node.parentNode.className === "input-partial") {
        this.autocompletePrompt = node.textContent
        this.activeNode = {
          node,
          offset,
          start,
          len,
        }
      } else {
        this.autocompletePrompt = ""
      }
    },
    async updateCaret() {
      this.$emit("input", { value: this.value, caret: getCaret(this.el) })
    },
    chooseSuggestion(suggestion) {
      const prior = this.value.slice(0, this.activeNode.start)
      const post = this.value.slice(this.activeNode.start + this.activeNode.len)
      const nextVal = prior + suggestion + "()" + post
      this.$emit("input", {
        value: nextVal,
        caret: this.activeNode.start + suggestion.length + 1,
      })
      this.el.focus()
    },
    focusFirstSuggestion() {
      const suggestionsEl = document.getElementById("suggestions")
      suggestionsEl.childNodes[0].focus()
    },
    changeSuggestionFocus(event, current) {
      const currentIndex = this.autocompleteOptions.indexOf(current)
      const direction = event.key === "ArrowDown" ? 1 : -1
      const numOptions = this.autocompleteOptions.length
      const newIndex = min(currentIndex + direction, numOptions - 1)

      if (newIndex < 0) return this.el.focus()

      const suggestionsEl = document.getElementById("suggestions")
      suggestionsEl.childNodes[newIndex].focus()
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
  background: white;
  top: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  box-shadow: 6px 6px 24px rgba(0, 0, 0, 0.12);

  .suggestion {
    cursor: pointer;
    padding: 0.5rem 0.75rem;

    &:hover,
    &:focus {
      background: #ebf2f4;
    }
  }
}
</style>
