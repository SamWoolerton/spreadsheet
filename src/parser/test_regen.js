import { regen } from "./regen_from_ast"

const deepEq = (o1, o2) => JSON.stringify(o1) === JSON.stringify(o2)

const tests = [
  ["Blank string", { ok: true, value: "" }, ``],
  ["Number", { type: "number", value: 3 }, `3`],
  ["Larger number", { type: "number", value: 123 }, `123`],
  ["String", { type: "string", value: "str" }, `"str"`],
  [
    "String with multiple words",
    { type: "string", value: "multiple words" },
    `"multiple words"`,
  ],
  ["Boolean true", { type: "boolean", value: true }, `true`],
  ["Boolean false", { type: "boolean", value: false }, `false`],
  [
    "Equation with number",
    {
      type: "formula",
      value: { type: "number", value: 7 },
    },
    `=7`,
  ],
  [
    "Basic expression",
    {
      type: "formula",
      value: {
        type: "operator",
        value: [
          "+",
          { type: "number", value: 1 },
          { type: "number", value: 2 },
        ],
      },
    },
    `=1 + 2`,
  ],
  [
    "Basic expression with brackets",
    {
      type: "formula",
      value: {
        type: "function",
        value: [
          "",
          [
            {
              type: "operator",
              value: [
                "+",
                { type: "number", value: 3 },
                { type: "number", value: 4 },
              ],
            },
          ],
        ],
      },
    },
    `=(3 + 4)`,
  ],
  [
    "Divide by 0",
    {
      type: "formula",
      value: {
        type: "operator",
        value: [
          "/",
          { type: "number", value: 1 },
          { type: "number", value: 0 },
        ],
      },
    },
    `=1 / 0`,
  ],
  [
    "Function",
    {
      type: "formula",
      value: {
        type: "function",
        value: ["increment", [{ type: "number", value: 4 }]],
      },
    },
    `=increment(4)`,
  ],
  // // ["Chained functions", `=increment(2) + increment(3) + increment(4)`, Ok(12)],
  // // [
  // //   "String concat",
  // //   `=join(" ","test", "another", "to", "concat")`,
  // //   Ok("test another to concat"),
  // // ],
  [
    "Nested function",
    {
      type: "formula",
      value: {
        type: "function",
        value: [
          "increment",
          [
            {
              type: "function",
              value: ["increment", [{ type: "number", value: 1 }]],
            },
          ],
        ],
      },
    },
    `=increment(increment(1))`,
  ],
  [
    "Deep nested function",
    {
      type: "formula",
      value: {
        type: "function",
        value: [
          "increment",
          [
            {
              type: "function",
              value: [
                "add",
                [
                  {
                    type: "function",
                    value: ["increment", [{ type: "number", value: 1 }]],
                  },
                  { type: "number", value: 3 },
                ],
              ],
            },
          ],
        ],
      },
    },
    `=increment(add(increment(1), 3))`,
  ],
  [
    "Reference",
    {
      type: "formula",
      value: { type: "reference", value: "A1" },
    },
    `=A1`,
  ],
  [
    "Reference in expression",
    {
      type: "formula",
      value: {
        type: "operator",
        value: [
          "+",
          { type: "number", value: 5 },
          { type: "reference", value: "A1" },
        ],
      },
    },
    `=5 + A1`,
  ],
  [
    "Reference in function",
    {
      type: "formula",
      value: {
        type: "function",
        value: ["increment", [{ type: "reference", value: "A1" }]],
      },
    },
    `=increment(A1)`,
  ],
]

const outcomes = tests
  // @ts-ignore
  .map(([description, ast, expected]) => {
    const { reg: regenerated } = regen(ast, { highlight: false })
    return {
      description,
      success: deepEq(regenerated, expected),
      ast,
      expected,
      regenerated,
    }
  })
  .filter(({ success }) => !success)
if (outcomes.length === 0) {
  console.log("All passed")
} else {
  outcomes.forEach(o => console.log(o))
}
