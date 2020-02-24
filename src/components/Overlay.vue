<template>
  <div class="overlay fixed shadow-md bg-blue-600 text-white rounded-lg flex">
    <a href="https://samwoolerton.com" class="px-4 pr-3 py-3">See more</a>
    <div class="divider">&nbsp;</div>
    <a href="https://github.com/SamWoolerton/spreadsheet" class="px-4 pl-3 py-3">Source code</a>
  </div>
</template>

<style lang="scss" scoped>
.overlay {
  right: 2rem;
  bottom: 2rem;
}

.divider {
  @apply bg-white h-full py-3 inline-block;

  width: 2px;
  align-self: center;
}
</style>
