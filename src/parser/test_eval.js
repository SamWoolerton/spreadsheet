import { makeParser } from "./index"
import { Ok, Fail } from "../utility"

const state = {
  A1: { value: Ok(5) },
  B3: { value: Ok(13) },
  C8: { value: Fail("syntax") },
}

const parse = makeParser(state)

const tests = [
  ["Blank string", ``, Ok("")],
  ["Number", `3`, Ok(3)],
  ["Larger number", `123`, Ok(123)],
  ["String", `"str"`, Ok("str")],
  ["String with multiple words", `"multiple words"`, Ok("multiple words")],
  ["Boolean true", `true`, Ok(true)],
  ["Boolean false", `false`, Ok(false)],
  ["Equation with number", `=7`, Ok(7)],
  ["Basic expression", `=1+2`, Ok(3)],
  ["Basic expression with spaces", `= 1 + 2`, Ok(3)],
  ["Basic expression with brackets", `=(3+4)`, Ok(7)],
  ["Nested expression", `=1 + (3+4)`, Ok(8)],
  ["Decimals rounded to max 5dp", `=1/3`, Ok(0.33333)],
  ["Decimals rounded not truncated", `=2/3`, Ok(0.66667)],
  ["Divide by 0", `=1/0`, Fail("divide by 0")],
  ["String concat", `="first" & "string"`, Ok("firststring")],
  ["Chained string concat", `="first" & " " & "another"`, Ok("first another")],
  ["Function", `=increment(4)`, Ok(5)],
  ["Chained functions", `=increment(2) + increment(3) + increment(4)`, Ok(12)],
  ["Expression inside function", `=increment(1+2)`, Ok(4)],
  ["Function with multiple arguments", `=add(2,4)`, Ok(6)],
  [
    "Function arguments applied in order",
    `=join(" ", "a", "b", "c", "d", "e")`,
    Ok("a b c d e"),
  ],
  [
    "Function with too many arguments",
    `=increment(2,4)`,
    Fail("too many arguments passed to 'increment'"),
  ],
  [
    "Function with not enough arguments",
    `=to_power(2)`,
    Fail("not enough arguments passed to 'to_power'"),
  ],
  ["Function with underscore", `=to_power(3,2)`, Ok(9)],
  [
    "String concat (variadic)",
    `=join(" ","test", "another", "to", "concat")`,
    Ok("test another to concat"),
  ],
  ["Partial function", `=add`, Fail("function without arguments")],
  [
    "Not real function",
    `=not_real_fn(3,2)`,
    Fail("unsupported function 'not_real_fn'"),
  ],
  [
    "Operation on not real function",
    `=4 + not_real_fn(3,2)`,
    Fail("unsupported function 'not_real_fn'"),
  ],
  ["Nested function", `=increment(add(2,3))`, Ok(6)],
  ["Nested function with multiple arguments", `=add(5,add(2,3))`, Ok(10)],
  ["Nested function with spaces", `=add(5, add(2,3))`, Ok(10)],
  ["Nested function with many spaces", `=  add(5 , add(2,3))`, Ok(10)],
  ["Chained expression with function", `=2*increment(3)`, Ok(8)],
  ["Chained expressions", `=1+2-3+17-5`, Ok(12)],
  ["Brackets precedence", `=2*(3+4)`, Ok(14)],
  ["If function with expression", `=if(4>2,10,3)`, Ok(10)],
  ["Divide function with fallback", `=divide(2,0, 6)`, Ok(6)],
  ["Divide function can fail", `=divide(2,0)`, Fail("divide by 0")],
  ["Function with nested error", `=increment(1 / 0)`, Fail("divide by 0")],
  ["Parser error", `=#`, Fail("syntax"), { suppress: true }],
  ["Reference", `=A1`, Ok(5)],
  [
    "Reference without equals is error",
    `B3`,
    Fail("syntax"),
    { suppress: true },
  ],
  ["Reference in expression", `=5 + A1`, Ok(10)],
  ["Reference in chained expression", `=5 + (B3 * 2)`, Ok(31)],
  ["Reference in function", `=increment(A1)`, Ok(6)],
  ["Reference in nested function", `=add(increment(B3), 17)`, Ok(31)],
  ["Reference to error", `=C8`, Fail("error in referenced cell 'C8'")],
]

const outcomes = tests
  // @ts-ignore
  .map(([description, input, expected, { suppress } = {}]) => {
    const parsed = parse(input, { suppress })
    const success = parsed.ok
      ? parsed.value === expected.value
      : parsed.message === expected.message
    return { description, success, input, expected, parsed }
  })
  .filter(({ success }) => !success)
if (outcomes.length === 0) {
  console.log("All passed")
} else {
  outcomes.forEach(o => console.log(o))
}
