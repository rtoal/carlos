import assert from "assert"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"

const semanticChecks = [
  ["return in nested if", "function f() {if true {return;}}"],
  ["break in nested if", "while false {if true {break;}}"],
  ["assigned functions", "function f() {}\nlet g = f;g = f;"],
  ["call of assigned functions", "function f(x: int) {}\nlet g=f;g(1);"],
  [
    "call of assigned function in expression",
    `function f(x: int, y: boolean): int {}
    let g = f;
    print(g(1, true));
    f = g; // Type check here`,
  ],
  [
    "pass a function to a function",
    `function f(x: int, y: (boolean)->void): int { return 1; }
     function g(z: boolean) {}
     f(2, g);`,
  ],
  [
    "function return types",
    `function square(x: int): int { return x * x; }
     function compose(): (int)->int { return square; }`,
  ],
  ["built-in constants", "print(25.0 * π);"],
  ["built-in sin", "print(sin(π));"],
  ["built-in cos", "print(cos(93.999));"],
  ["built-in hypot", "print(hypot(-4.0, 3.00001));"],
]

const semanticErrors = [
  ["redeclarations", "print(x);", /Identifier x not declared/],
  ["non declared ids", "let x = 1;let x = 1;", /Identifier x already declared/],
  ["assign to const", "const x = 1;x = 2;", /Cannot assign to constant x/],
  ["assign bad type", "let x=1;x=true;", /Cannot assign a boolean to a int/],
  ["bad types for ||", "print(false||1);", /a boolean but got a int/],
  ["bad types for &&", "print(false&&1);", /a boolean but got a int/],
  ["bad types for ==", "print(false==1);", /Operands do not have the same type/],
  ["bad types for !=", "print(false==1);", /Operands do not have the same type/],
  ["bad types for +", "print(false+1);", /number or string but got a boolean/],
  ["bad types for -", "print(false-1);", /a number but got a boolean/],
  ["bad types for *", "print(false*1);", /a number but got a boolean/],
  ["bad types for /", "print(false/1);", /a number but got a boolean/],
  ["bad types for **", "print(false**1);", /a number but got a boolean/],
  ["bad types for <", "print(false<1);", /number or string but got a boolean/],
  ["bad types for <=", "print(false<=1);", /number or string but got a bool/],
  ["bad types for >", "print(false>1);", /number or string but got a bool/],
  ["bad types for >=", "print(false>=1);", /number or string but got a bool/],
  ["bad types for negation", "print(-true);", /a number but got a boolean/],
  ["non-boolean if test", "if 1 {}", /a boolean but got a int/],
  ["non-boolean while test", "while 1 {}", /a boolean but got a int/],
  ["shadowing", "let x = 1;\nwhile true {let x = 1;}", /Identifier x already declared/],
  ["break outside loop", "break;", /break can only appear in a loop/],
  [
    "break inside function",
    "while true {function f() {break;}}",
    /break can only appear in a loop/,
  ],
  [
    "return expression from void function",
    "function f() {return 1;}",
    /Cannot return a value here/,
  ],
  [
    "return nothing when should have",
    "function f(): int {return;}",
    /Something should be returned here/,
  ],
  [
    "Too many args",
    "function f(x: int) {}\nf(1,2);",
    /1 parameter\(s\) required but 2 argument\(s\) passed/,
  ],
  [
    "Too few args",
    "function f(x: int) {}\nf();",
    /1 parameter\(s\) required but 0 argument\(s\) passed/,
  ],
  [
    "Parameter type mismatch",
    "function f(x: int) {}\nf(false);",
    /Cannot assign a boolean to a int/,
  ],
  ["call of non-function", "let x = 1;\nprint(x());", /Call of non-function/],
  [
    "function type mismatch",
    `function f(x: int, y: (boolean)->void): int { return 1; }
     function g(z: boolean): int { return 5; }
     f(2, g);`,
    /Cannot assign a \(boolean\)->int to a \(boolean\)->void/,
  ],
  [
    "bad call to a standard library function",
    "print(sin(true));",
    /Cannot assign a boolean to a float/,
  ],
]

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(parse(source)))
    })
  }
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(parse(source)), errorMessagePattern)
    })
  }
})
