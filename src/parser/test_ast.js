import { makeParser } from "./index"
import { Ok, Fail } from "../utility"

const deepEq = (o1, o2) => JSON.stringify(o1) === JSON.stringify(o2)

const state = {}

const parse = makeParser(state, { ast: true })

const tests = [
  ["Blank string", ``, Ok("")],
  ["Number", `3`, { type: "number", value: 3 }],
  ["Larger number", `123`, { type: "number", value: 123 }],
  ["String", `"str"`, { type: "string", value: "str" }],
  [
    "String with multiple words",
    `"multiple words"`,
    { type: "string", value: "multiple words" },
  ],
  ["Boolean true", `true`, { type: "boolean", value: true }],
  ["Boolean false", `false`, { type: "boolean", value: false }],
  [
    "Equation with number",
    `=7`,
    { type: "formula", value: { type: "number", value: 7 } },
  ],
  [
    "Basic expression",
    `=1+2`,
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
  ],
  [
    "Basic expression with brackets",
    `=(3+4)`,
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
  ],
  [
    "Divide by 0",
    `=1/0`,
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
  ],
  [
    "Function",
    `=increment(4)`,
    {
      type: "formula",
      value: {
        type: "function",
        value: ["increment", [{ type: "number", value: 4 }]],
      },
    },
  ],
  // ["Chained functions", `=increment(2) + increment(3) + increment(4)`, Ok(12)],
  // ["Expression inside function", `=increment(1+2)`, Ok(4)],
  // ["Function with multiple arguments", `=add(2,4)`, Ok(6)],
  // ["Function with underscore", `=to_power(3,2)`, Ok(9)],
  // [
  //   "String concat",
  //   `=join(" ","test", "another", "to", "concat")`,
  //   Ok("test another to concat"),
  // ],
  // [
  //   "Not real function",
  //   `=not_real_fn(3,2)`,
  //   Fail("unsupported function 'not_real_fn'"),
  // ],
  // [
  //   "Operation on not real function",
  //   `=4 + not_real_fn(3,2)`,
  //   Fail("unsupported function 'not_real_fn'"),
  // ],
  // ["Nested function", `=increment(add(2,3))`, Ok(6)],
  // ["Nested function with multiple arguments", `=add(5,add(2,3))`, Ok(10)],
  // ["Nested function with spaces", `=add(5, add(2,3))`, Ok(10)],
  // ["Nested function with many spaces", `=add(5 , add(2,3))`, Ok(10)],
  // ["Chained expression with function", `=2*increment(3)`, Ok(8)],
  // ["Chained expressions", `=1+2-3+17-5`, Ok(12)],
  // ["Brackets precedence", `=2*(3+4)`, Ok(14)],
  // ["If function with expression", `=if(4>2,10,3)`, Ok(10)],
  // ["Parser error", `=#`, Fail("syntax"), { suppress: true }],
  [
    "Reference",
    `=A1`,
    { type: "formula", value: { type: "reference", value: "A1" } },
  ],
  [
    "Reference without equals is error",
    `B3`,
    Fail("syntax"),
    { suppress: true },
  ],
  [
    "Reference in expression",
    `=5 + A1`,
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
  ],
  // ["Reference in chained expression", `=5 + (B3 * 2)`, Ok(31)],
  // ["Reference in function", `=increment(A1)`, Ok(6)],
  // ["Reference in nested function", `=add(increment(B3), 17)`, Ok(31)],
]

const outcomes = tests
  // @ts-ignore
  .map(([description, input, expected, { suppress } = {}]) => {
    const parsed = parse(input, { suppress })
    return {
      description,
      success: deepEq(parsed, expected),
      input,
      expected,
      parsed,
    }
  })
  .filter(({ success }) => !success)
if (outcomes.length === 0) {
  console.log("All passed")
} else {
  outcomes.forEach(o => console.log(o))
}
