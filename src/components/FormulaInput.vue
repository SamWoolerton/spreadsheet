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
      class="input formula-input"
      spellcheck="false"
    />
    <div
      id="suggestions"
      class="suggestions"
      v-if="autocompleteOptions.length > 0"
      :style="`left: ${this.offsetPxNode}px`"
    >
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
    <div class="hints" v-if="currentFunction || hint" :style="`left: ${this.offsetPxNode}px;`">
      <span v-if="currentFunction">
        <span class="font-bold">{{ currentFunction.name }}</span>
        {{ currentFunction.description }}
      </span>
      <span v-else-if="hint">
        <span class="font-bold">{{ hint.name }}</span>
        <span v-if="hint.type">({{ hint.type }})</span>
      </span>
    </div>
    <div
      v-if="functionOverview"
      class="function-overview"
      :style="`left: ${this.offsetPxFunction}px;`"
    >{{ functionOverview }}</div>
  </div>
</template>

<script>
import { makeParser } from "../parser/index"
import { regen } from "../parser/regen_from_ast"
import { autocomplete } from "../parser/autocomplete"
import { getHints } from "../parser/hints"
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
    currentFunction: null,
    hint: null,
    offsetPxNode: 0,
    offsetPxFunction: 0,
    functionOverview: "",
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
      this.offsetPxNode = node.parentNode.offsetLeft
      this.currentFunction = null
      this.hint = null

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
        const { fn, argument, overview, functionNode } = getHints(node)
        this.functionOverview = overview
        if (functionNode !== undefined)
          this.offsetPxFunction = functionNode.offsetLeft
        if (fn !== undefined) this.currentFunction = fn
        if (argument !== undefined) this.hint = argument
      }
    },
    async updateCaret() {
      const caret = getCaret(this.el)
      this.$emit("input", { value: this.value, caret })
      this.afterChange(this.el, caret)
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

.hints {
  position: absolute;
  background: white;
  top: 100%;
  width: 230px;
  box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.08);
}

.function-overview {
  position: absolute;
  bottom: 100%;
  background: #ebf2f4;
  font-size: 0.85em;
  white-space: nowrap;
}
</style>
