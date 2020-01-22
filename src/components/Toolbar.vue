<template>
  <div class="formatting-bar">
    <div v-for="[option, properties] in processedTree" :key="option" class="formatting-block">
      <div class="toolbar-desc">{{ option }}</div>
      <div
        v-for="({ value, copy, selected }) in properties"
        :key="value"
        @click="$emit('update', { [option.toLowerCase()]: value })"
        :class="['toolbar-option', { selected } ]"
      >{{ copy }}</div>
    </div>
  </div>
</template>

<script>
const baseTree = {
  Align: [
    ["left", "Left"],
    ["center", "Center"],
    ["right", "Right"],
  ],
}

export default {
  props: {
    selectedFormatting: {
      type: Object,
      required: true,
    },
  },
  watch: {
    selectedFormatting: {
      handler() {
        this.processedTree = Object.entries(this.baseTree).map(
          ([option, properties]) => [
            option,
            properties.map(([value, copy]) => ({
              value,
              copy,
              selected: this.selectedFormatting[option.toLowerCase()] === value,
            })),
          ],
        )
      },
      immediate: true,
      deep: true,
    },
  },
  data: () => ({
    baseTree,
    processedTree: null,
  }),
  computed: {
    options() {
      return Object.entries(this.tree).map(([option, properties]) => [
        option,
        properties.map(([value, copy]) => ({
          value,
          copy,
          selected: this.selectedFormatting[option.toLowerCase()] === value,
        })),
      ])
    },
  },
}
</script>

<style lang="scss">
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
</style>
