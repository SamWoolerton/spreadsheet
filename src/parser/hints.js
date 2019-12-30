import { functions } from "./config"
import { quotient, last } from "../utility/index"

export function getHints(node) {
  const isRootNode = node => node.className === "input formula-input"
  if (isRootNode(node)) return {}

  return findFunction(node)

  function findFunction(node) {
    const parent = node.parentNode

    if (isRootNode(parent)) return {}

    if (parent.className === "input-function") {
      const nameNode = parent.childNodes[0]
      const text = nameNode.textContent
      const name = text.slice(0, text.length - 1)
      const fn = functions[name]
      if (!fn || name === "") return {}
      if (node === nameNode) {
        const description = fn.description
        return { fn: { name, description } }
      }

      // closing bracket
      if (node === last(parent.childNodes)) return {}
      // Otherwise parentNode is function and the type hinting jumps around.
      // Could alternatively wrap the commas in their own spans but would need to rework AST regen and caret positioning
      if (node.textContent === ",") return {}

      const argumentNodeIndex = [...parent.childNodes]
        .map(c => c === node)
        .indexOf(true)
      const argumentNumber = quotient(argumentNodeIndex, 2)
      const argumentDetails = Array.isArray(fn.arguments)
        ? fn.arguments[argumentNumber]
        : fn.arguments(argumentNumber)
      return {
        argument: {
          number: argumentNumber,
          ...argumentDetails,
        },
      }
    }

    return findFunction(parent)
  }
}
