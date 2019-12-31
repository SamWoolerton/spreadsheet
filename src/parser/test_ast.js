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
    {
      type: "formula",
      value: { type: "expression", value: [{ type: "number", value: 7 }] },
    },
  ],
  [
    "Basic expression",
    `=1+2`,
    {
      type: "formula",
      value: {
        type: "expression",
        value: [
          { type: "number", value: 1 },
          {
            type: "operator",
            value: "+",
          },
          { type: "number", value: 2 },
        ],
      },
    },
  ],
  [
    "Basic expression with spaces",
    `=3 + 6`,
    {
      type: "formula",
      value: {
        type: "expression",
        value: [
          { type: "number", value: 3 },
          { type: "whitespace", value: " " },
          {
            type: "operator",
            value: "+",
          },
          { type: "whitespace", value: " " },
          { type: "number", value: 6 },
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
        type: "expression",
        value: [
          {
            type: "function",
            value: [
              "",
              [
                {
                  type: "expression",
                  value: [
                    { type: "number", value: 3 },
                    {
                      type: "operator",
                      value: "+",
                    },
                    { type: "number", value: 4 },
                  ],
                },
              ],
            ],
          },
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
        type: "expression",
        value: [
          { type: "number", value: 1 },
          {
            type: "operator",
            value: "/",
          },
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
        type: "expression",
        value: [
          {
            type: "function",
            value: [
              "increment",
              [{ type: "expression", value: [{ type: "number", value: 4 }] }],
            ],
          },
        ],
      },
    },
  ],
  [
    "Function after space",
    `= increment(4)`,
    {
      type: "formula",
      value: {
        type: "expression",
        value: [
          { type: "whitespace", value: " " },
          {
            type: "function",
            value: [
              "increment",
              [{ type: "expression", value: [{ type: "number", value: 4 }] }],
            ],
          },
        ],
      },
    },
  ],
  [
    "Function argument order",
    `=join("a","b","c","d","e")`,
    {
      type: "formula",
      value: {
        type: "expression",
        value: [
          {
            type: "function",
            value: [
              "join",
              [
                { type: "expression", value: [{ type: "string", value: "a" }] },
                { type: "expression", value: [{ type: "string", value: "b" }] },
                { type: "expression", value: [{ type: "string", value: "c" }] },
                { type: "expression", value: [{ type: "string", value: "d" }] },
                { type: "expression", value: [{ type: "string", value: "e" }] },
              ],
            ],
          },
        ],
      },
    },
  ],
  [
    "Function with spaces",
    `=add(2, 3)`,
    {
      type: "formula",
      value: {
        type: "expression",
        value: [
          {
            type: "function",
            value: [
              "add",
              [
                { type: "expression", value: [{ type: "number", value: 2 }] },
                { type: "whitespace", value: " " },
                { type: "expression", value: [{ type: "number", value: 3 }] },
              ],
            ],
          },
        ],
      },
    },
  ],
  [
    "Partial function",
    `=add`,
    {
      type: "formula",
      value: {
        type: "expression",
        value: [
          {
            type: "partial",
            value: "add",
          },
        ],
      },
    },
  ],
  [
    "Reference",
    `=A1`,
    {
      type: "formula",
      value: {
        type: "expression",
        value: [{ type: "reference", value: "A1" }],
      },
    },
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
        type: "expression",
        value: [
          { type: "number", value: 5 },
          { type: "whitespace", value: " " },
          { type: "operator", value: "+" },
          { type: "whitespace", value: " " },
          { type: "reference", value: "A1" },
        ],
      },
    },
  ],
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
      es: JSON.stringify(expected),
      ep: JSON.stringify(parsed),
    }
  })
  .filter(({ success }) => !success)
if (outcomes.length === 0) {
  console.log("All passed")
} else {
  outcomes.forEach(o => console.log(o))
}
