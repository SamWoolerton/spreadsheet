<template>
  <div>
    <div id="parent-container" class="parent-container" @mousedown="handleClick($event, null)">
      <div class="toolbars">
        <div class="formula-bar">
          <FormulaInput
            v-if="selected.pos"
            :id="'formula-bar-input'"
            :value="state[selected.pos].formula"
            :caret="inputCaret"
            :parseValue="parse"
            :updateTrigger="inputChanged"
            @input="formulaInput(selected.pos, $event)"
            @update="updateCell(selected.pos, $event)"
            @updateBlur="updateCell(selected.pos, $event, true)"
            @cancel="cancelUpdate(selected.pos, true)"
            @focus="editing.pos = selected.pos"
          />
          <input v-else disabled value="No cell selected" />
        </div>
        <Toolbar :selectedFormatting="state[selected.pos].formatting" @update="setFormat" />
      </div>

      <div class="mx-auto table-container">
        <table>
          <thead>
            <tr>
              <th></th>
              <th v-for="col in columns" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in cells" :key="index">
              <td class="row-numbers">{{ index + 1 }}</td>
              <td v-for="cell in row" :key="cell.self" class="cell">
                <div>
                  <div
                    v-if="!cell.editing"
                    :id="`cell-${cell.self}`"
                    @mousedown.stop.prevent="handleClick($event, cell.self)"
                    @dblclick="editCell(cell.self)"
                    tabindex="0"
                    @focus="selected.pos = cell.self"
                    @keydown="cellKeydown(cell.self, $event)"
                    :class="cell.classes"
                  >
                    {{
                    cell.value
                    ? cell.value.ok
                    ? cell.value.value
                    : `#ERR: ${cell.value.message}`
                    : ""
                    }}
                  </div>
                  <FormulaInput
                    v-else
                    :id="`cell-input-${cell.self}`"
                    :value="state[cell.self].formula"
                    :caret="inputCaret"
                    :parseValue="parse"
                    :updateTrigger="inputChanged"
                    @input="formulaInput(cell.self, $event)"
                    @update="updateCell(cell.self, $event)"
                    @updateBlur="updateCell(cell.self, $event, true)"
                    @cancel="cancelUpdate(cell.self, true)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import FormulaInput from "./FormulaInput"
import Toolbar from "./Toolbar"

import { makeParser } from "../parser/index"
import { Ok, Fail } from "../utility/index"

const startingState = {}
const parse = makeParser(startingState)

// utility
const set = (...args) => new Set(Array.isArray(args[0]) ? args[0] : args)
const createArr = len => [...new Array(len)]
const eqSets = (a, b) =>
  a.size === b.size && [...a].every(value => b.has(value))
const getColLetter = i => String.fromCharCode(i + 64)
const getLargeColLetter = i => {
  const first = getColLetter(Math.floor(i / 26))
  const remainder = getColLetter(i % 26)
  return first + remainder
}
// eslint-disable-next-line
const ignore = (...args) => {}
const between = (num, lower, upper) =>
  num > upper ? upper : num < lower ? lower : num
// const clone = obj => JSON.parse(JSON.stringify(obj))
const deepEq = (o1, o2) => JSON.stringify(o1) === JSON.stringify(o2)
const referenceRegex = /[A-Z]+\d+/gm

const formattingMapping = {
  align: "text",
}

const Cell = ({
  refs = [],
  fullRefs = [],
  deps = [],
  formula = "",
  value = formula ? parse(formula) : Ok(""),
  formatting = {},
} = {}) => ({
  refs: set(refs),
  fullRefs: set(fullRefs),
  deps: set(deps),
  formula,
  value,
  formatting,
})

startingState.A1 = Cell({ formula: "3" })
startingState.A2 = Cell({ formula: "1" })
startingState.B2 = Cell({ formula: "=increment(4)", deps: ["C2"] })
startingState.C2 = Cell({ formula: "=B2 + 4", refs: ["B2"], fullRefs: ["B2"] })

Object.keys(startingState).forEach(
  pos =>
    startingState[pos].formula &&
    (startingState[pos].value = parse(startingState[pos].formula)),
)

export default {
  components: { FormulaInput, Toolbar },
  data: () => ({
    numColumns: between(30, 1, 26 * 26),
    numRows: between(50, 1, 100),
    state: startingState,
    editing: {
      pos: null,
      initial: "",
    },
    selected: {
      pos: "A1",
    },
    valueChanged: null,
    inputChanged: null,
    parse,
    inputCaret: 0,
  }),
  beforeMount() {
    this.fillState()
  },
  computed: {
    columns() {
      return createArr(this.numColumns).map((_a, i) =>
        i > 25 ? getLargeColLetter(i + 1) : getColLetter(i + 1),
      )
    },
    rows() {
      return createArr(this.numRows).map((_a, i) => i + 1)
    },
    baseCells() {
      return this.rows.map(r => this.columns.map(c => c + r))
    },
    cells() {
      ignore(this.valueChanged)
      return this.baseCells.map(row =>
        row.map(self => {
          const { value, formula, formatting } = this.state[self]
          const editing = self === this.editing.pos
          const selected = self === this.selected.pos
          const classes =
            (value.ok === false ? "error " : selected ? "selected " : " ") +
            Object.entries(formatting)
              .map(([key, val]) => `${formattingMapping[key] || key}-${val}`)
              .join(" ")

          return {
            self,
            editing,
            selected,
            classes,
            value,
            formula,
          }
        }),
      )
    },
  },
  methods: {
    fillState() {
      // make sure that the state object has an entry for every cell
      this.baseCells.forEach(row =>
        row.forEach(
          pos => !startingState[pos] && (startingState[pos] = Cell()),
        ),
      )
    },
    handleClick(e, pos = null) {
      // click in the current cell or formula bar should do nothing
      const targetId = e.target.id
      if (
        targetId.replace("cell-input-", "") === this.editing.pos ||
        targetId === "formula-bar-input"
      ) {
        return
      }

      // selecting an autocomplete suggestion should do nothing in parent
      if (e.target.className === "suggestion") return

      // Clicked on document or toolbar options
      // If editing then exit, otherwise no change to selection
      if (pos === null) {
        if (this.editing.pos) {
          const cell = this.state[this.editing.pos]
          this.updateCell(
            this.editing.pos,
            { target: { textContent: cell.formula } },
            true,
          )
        }
      } else {
        // if editing then insert cell reference at cursor and update cursor position
        if (this.editing.pos) {
          const cell = this.state[this.editing.pos]
          const caret = this.inputCaret
          cell.formula =
            cell.formula.slice(0, caret) + pos + cell.formula.slice(caret)
          this.inputCaret = caret + pos.length
          this.inputChanged = pos
          this.focus(`cell-input-${this.editing.pos}`)
        } else {
          // otherwise select and focus cell
          this.selected.pos = pos
          this.focus(`cell-${pos}`)
        }
      }
    },
    async editCell(pos) {
      if (this.editing.pos !== null) await this.cancelUpdate(this.editing.pos)

      this.selected.pos = pos
      this.editing.pos = pos
      this.editing.initial = this.state[pos].formula
      this.focus(`cell-input-${pos}`)
    },
    async cellKeydown(position, event) {
      if (event.ctrlKey || event.altKey || event.metaKey) return

      const cell = this.state[position]
      const { key } = event
      if (key === "Delete") {
        this.editing.initial = cell.formula
        cell.formula = ""
        return this.updateCell(position, { target: { value: "" } })
      }

      if (key === "Enter") {
        this.editCell(this.selected.pos)
        return event.preventDefault()
      }

      if (key.startsWith("Arrow")) {
        const direction = key.replace("Arrow", "")
        const [h, v] = {
          Left: [-1, 0],
          Right: [1, 0],
          Up: [0, -1],
          Down: [0, 1],
        }[direction]

        const [, currentCol, currentRow] = /([A-Z]+)(\d+)/.exec(position)
        const colIndex = this.columns.indexOf(currentCol)
        const rowIndex = this.rows.indexOf(+currentRow)

        const nextCol = this.columns[colIndex + h]
        const nextRow = this.rows[rowIndex + v]
        if (nextCol === undefined || nextRow === undefined) return

        const nextPos = nextCol + nextRow
        this.focus(`cell-${nextPos}`, { wait: false })
      }

      const validKey = /^[a-zA-Z0-9_+\-*/&><="]$/.exec(key) !== null
      if (validKey) {
        this.editing.initial = cell.formula
        this.editing.pos = position
        cell.formula = ""
        this.focus(`cell-input-${position}`)
      }
    },
    async focus(id, { wait = true } = {}) {
      if (wait) await this.$nextTick()
      document.getElementById(id).focus()
    },
    updateCell(position, event, blur = false) {
      this.editing.pos = null

      // "" is falsy so can get a false positive fallback to an undefined value
      let formula = event.target.value || event.target.textContent || ""
      if (formula === "=") {
        formula = ""
        this.state[position].formula = ""
      }

      if (!blur) this.focus(`cell-${position}`)

      // identical formula is no-op
      if (this.editing.initial === formula) return

      const cell = this.state[position]
      const { refs } = cell
      const newRefs = this.getReferences(formula)

      if (!eqSets(refs, newRefs)) this.updateReferences(position, refs, newRefs)

      this.recalculateCell(position)

      this.inputCaret = null
    },
    async cancelUpdate(pos, focus = false) {
      this.state[pos].formula = this.editing.initial
      await this.$nextTick()
      this.editing.pos = null
      this.inputCaret = null
      if (focus) this.focus(`cell-${pos}`)
    },
    getReferences(formula) {
      return set([...formula.matchAll(referenceRegex)].map(([ref]) => ref))
    },
    updateReferences(self, current, next) {
      this.state[self].refs = next

      // calc changes
      const changes = {
        add: [],
        delete: [],
      }
      const all = set([...current, ...next])
      all.forEach(pos => {
        if (!current.has(pos)) {
          changes.add.push(pos)
        } else if (!next.has(pos)) {
          changes.delete.push(pos)
        }
      })

      // handle dependencies
      changes.add.forEach(pos => this.state[pos].deps.add(self))
      changes.delete.forEach(pos => this.state[pos].deps.delete(self))

      changes.add.forEach(this.dependenciesUpdated)
      changes.delete.forEach(this.dependenciesUpdated)
      this.dependenciesUpdated(self)
    },
    dependenciesUpdated(pos) {
      const cell = this.state[pos]

      const childFullRefs = [...cell.refs]
        .map(c => [...this.state[c].fullRefs])
        .flat()
      const fullRefs = set([...cell.refs, ...childFullRefs])

      // update cell references
      this.state[pos].fullRefs = fullRefs
    },
    recalculateCell(position) {
      // destructuring in two steps to get the reference for later
      const cell = this.state[position]
      const { value: initialValue, deps, fullRefs } = cell
      let value

      // check for circular references
      if (fullRefs.has(position) || deps.has(position)) {
        cell.value = Fail("circular reference")
      } else {
        value = parse(cell.formula)
        if (deepEq(value, initialValue)) return
        cell.value = value
      }
      // new set without current cell to prevent infinite loop for self reference
      const depsWithoutSelf = new Set([...deps])
      depsWithoutSelf.delete(position)
      ;[...depsWithoutSelf].forEach(this.recalculateCell)

      // cells computed property doesn't update otherwise
      this.valueChanged = value
    },
    setFormat(update) {
      const cell = this.state[this.selected.pos]
      if (!cell) return

      Object.entries(update).forEach(([key, val]) =>
        this.$set(this.state[this.selected.pos].formatting, key, val),
      )

      this.valueChanged = JSON.stringify(cell.formatting)
    },
    formulaInput(pos, { value, caret }) {
      this.state[pos].formula = value
      this.inputChanged = value
      this.inputCaret = caret
    },
  },
}
</script>

<style lang="scss">
.parent-container {
  height: 100vh;
  max-height: 100vh;

  .table-container {
    height: calc(100vh - 3rem);
    max-height: calc(100vh - 3rem);
    overflow: scroll;
  }
}

.toolbars {
  display: flex;
  flex-wrap: wrap;
  background: #f0f0f0;

  & > div {
    flex-grow: 1;
  }
}

.formula-bar {
  width: 100%;
  max-width: 400px;
  margin: 0.25em;
  margin-right: 0.5em;

  input {
    width: 100%;
    padding: 0.5em 1em;
    background: white;
    border: none;

    &:disabled {
      background: #eee;
    }
  }
}

table {
  border-collapse: collapse;
}

table,
thead,
tbody {
  position: relative;
}

td {
  border: 1px solid hsla(195, 12%, 91%, 1);
}

th,
.row-numbers {
  position: sticky;
  background: hsla(195, 30%, 94%, 1);
  font-weight: bold;
  cursor: default;
  user-select: none;
  border: none;
  color: #3f6772;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    border: 1px solid #cfdde1;
  }
}

.row-numbers {
  width: 1.5em;
  text-align: center;
  left: 0;
  z-index: 2;
}

th {
  height: 1.75em;
  top: 0;
  z-index: 3;
}

td {
  height: 2em;
}

.cell {
  width: 5em;
  height: 32px;
  padding: 0;

  & > div {
    position: relative;
    height: 100%;
    width: 100%;

    & > div {
      height: 100%;
      padding: 0 0.125em;
      width: 4.75em;
      min-width: 100%;
      border: 2px solid transparent;

      & > .input {
        // align text vertically in center of cell
        height: 100%;
        display: flex;
        align-items: center;
      }

      &.error {
        background: #ffcbd4;
        color: #741818;
      }

      &.selected {
        background: white;
        border-color: #85b1f1;

        &:focus {
          outline: none;
        }
      }
    }
  }

  input,
  .input {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    min-width: 100%;
    background: white;
    border: none;
    z-index: 5;
    padding: 0 0.25em;
    white-space: nowrap;
    width: auto;
  }
}
</style>
