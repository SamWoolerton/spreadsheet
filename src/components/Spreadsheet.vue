<template>
  <div>
    <div>
      <div class="toolbars">
        <div class="formula-bar">
          <FormulaInput
            v-if="selected.pos"
            :value="state[selected.pos].formula"
            @input="formulaInput(selected.pos, $event)"
            :id="'formula-bar-input'"
            :parseValue="parse"
            @update="updateCell(selected.pos, $event)"
            @cancel="cancelUpdate(selected.pos)"
            :updateTrigger="inputChanged"
          />
          <input v-else disabled value="No cell selected" />
        </div>
        <div class="formatting-bar">
          <div class="formatting-block">
            <div class="toolbar-desc">Align</div>
            <div
              v-for="[align, copy] in [
                ['left', 'Left'],
                ['center', 'Center'],
                ['right', 'Right'],
              ]"
              :key="align"
              @click="setFormat({ align })"
              :class="[
                'toolbar-option',
                {
                  selected:
                    ((state[selected.pos] || { formatting: { align: false } })
                      .formatting.align || null) === align,
                },
              ]"
            >{{ copy }}</div>
          </div>
        </div>
      </div>

      <div class="mx-auto">
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
                    @click="selected.pos = cell.self"
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
                    :value="state[cell.self].formula"
                    @input="formulaInput(cell.self, $event)"
                    :id="`cell-input-${cell.self}`"
                    :parseValue="parse"
                    @update="updateCell(cell.self, $event)"
                    @cancel="cancelUpdate(cell.self)"
                    :updateTrigger="inputChanged"
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

import { makeParser } from "../parser/index"
import { Ok, Fail } from "../utility"

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
  components: { FormulaInput },
  data: () => ({
    numColumns: between(6, 1, 26 * 26),
    numRows: between(6, 1, 100),
    state: startingState,
    editing: {
      pos: null,
      initial: "",
    },
    selected: {
      pos: null,
    },
    valueChanged: null,
    inputChanged: null,
    parse,
  }),
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
      const cells = this.rows.map(r => this.columns.map(c => c + r))

      // make sure that the state object has an entry for every cell so less error handling is required later
      cells.forEach(row =>
        row.forEach(
          // TODO: remove this once it's all working, mutations by reference are a dirty hack
          pos => !startingState[pos] && (startingState[pos] = Cell()),
        ),
      )

      return cells
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
    async editCell(pos) {
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
    updateCell(position, event) {
      this.editing.pos = null

      // "" is falsy so can get a false positive fallback to an undefined value
      let formula = event.target.value || event.target.textContent || ""
      if (formula === "=") {
        formula = ""
        this.state[position].formula = ""
      }

      // identical formula is no-op
      if (this.editing.initial === formula)
        return this.focus(`cell-${position}`)

      const cell = this.state[position]
      const { refs } = cell
      const newRefs = this.getReferences(formula)

      if (!eqSets(refs, newRefs)) this.updateReferences(position, refs, newRefs)

      this.focus(`cell-${position}`)

      this.recalculateCell(position)
    },
    async cancelUpdate(pos) {
      this.state[pos].formula = this.editing.initial
      await this.$nextTick()
      this.editing.pos = null
    },
    getReferences(formula) {
      return set([...formula.matchAll(referenceRegex)].map(([ref]) => ref))
    },
    updateReferences(self, current, next) {
      const childFullRefs = [...next]
        .map(pos => [...this.state[pos].fullRefs])
        .flat()
      const fullRefs = set([...next, ...childFullRefs])
      console.log(
        "updating references",
        self,
        fullRefs,
        childFullRefs,
        current,
        next,
      )

      // update cell references
      this.state[self].refs = next
      this.state[self].fullRefs = fullRefs

      // calc changes
      const changes = {
        add: [],
        delete: [],
      }
      console.log("Changes", self, changes)
      const all = set([...current, ...next])
      all.forEach(pos => {
        if (!current.has(pos)) {
          changes.add.push(pos)
        } else if (!next.has(pos)) {
          changes.delete.push(pos)
        }
      })

      // handle dependencies
      changes.delete.forEach(ref => this.state[ref].deps.delete(self))
      changes.add.forEach(ref => this.state[ref].deps.add(self))
    },
    recalculateCell(position) {
      // destructuring in two steps to get the reference for later
      const cell = this.state[position]
      const { value: initialValue, deps, fullRefs } = cell
      let value

      // check for circular references
      if (fullRefs.has(position)) {
        cell.value = Fail("circular reference")
      } else {
        value = parse(cell.formula)
        if (deepEq(value, initialValue)) return
        cell.value = value
      }
      deps.forEach(this.recalculateCell)

      // cells computed property doesn't update otherwise
      this.valueChanged = value
    },
    setFormat(update) {
      const cell = this.state[this.selected.pos]
      if (!cell) return

      Object.entries(update).forEach(
        ([key, val]) => (cell.formatting[key] = val),
      )

      this.valueChanged = JSON.stringify(cell.formatting)
    },
    formulaInput(pos, event) {
      this.state[pos].formula = event.target.textContent
      this.inputChanged = event.target.textContent
    },
  },
}
</script>

<style lang="scss">
.toolbars {
  display: flex;
  flex-wrap: wrap;
  background: #f0f0f0;
  padding: 0.25rem;

  & > div {
    flex-grow: 1;
  }
}

.formula-bar {
  max-width: 400px;
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

.formatting-bar {
  height: 100%;
  align-self: center;

  .formatting-block {
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    background: white;
    margin-right: 0.25rem;

    & > * {
      height: 100%;
      padding: 0.5rem 0.75rem;
    }
  }

  .toolbar-desc {
    font-style: italic;
  }

  .toolbar-option {
    cursor: pointer;

    &.selected {
      font-weight: bold;
      background: #f0f0f0;
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
  border: 1px solid #ddd;
}

th,
.row-numbers {
  position: sticky;
  background: white;
  font-weight: bold;
  cursor: default;
  user-select: none;
  border: none;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    border: 1px solid #ddd;
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
  height: 1.5em;
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

      & > div {
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
