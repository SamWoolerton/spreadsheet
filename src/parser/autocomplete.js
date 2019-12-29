import { functions } from "./config"

export function autocomplete(name) {
  const options = Object.keys(functions).filter(
    f => f.startsWith(name) && f !== "",
  )
  return { name, options }
}
