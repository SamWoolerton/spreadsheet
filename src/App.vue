<template>
  <div id="app relative">
    <Spreadsheet />
    <Overlay />
  </div>
</template>

<script>
import Spreadsheet from "./components/Spreadsheet.vue"
import Overlay from "./components/Overlay"

export default {
  components: { Spreadsheet, Overlay },
}
</script>

<style lang="scss">
@import "./assets/styles/_entry";
</style>
