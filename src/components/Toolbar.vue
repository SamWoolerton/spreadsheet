<template>
  <div class="formatting-bar">
    <div class="formatting-block">
      <div class="toolbar-desc">Align</div>
      <div
        v-for="[align, copy] in [['left', 'Left'], ['center', 'Center'], ['right', 'Right']]"
        :key="align"
        @click="$emit('update', { align })"
        :class="['toolbar-option', { selected: (selectedFormatting.formatting.align) === align } ]"
      >{{ copy }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    selectedFormatting: {
      type: Object,
      default: () => ({ formatting: { align: false } }),
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
