import { functions } from "./config"

export function autocomplete(name) {
  if (name === "") return { name, options: [] }

  const options = Object.keys(functions).filter(
    f => f.startsWith(name) && f !== "",
  )
  return { name, options }
}
