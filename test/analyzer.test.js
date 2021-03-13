import assert from "assert"
import util from "util"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"

const source = `
  let x = 1024
  function next(n: number): [number] {
    let a = [number](1, 2, 3)
    a[1] = 100
    return a
  }
  while x > 3 {
    let y = false && (true || 2 >= x)
    x = (0 + x) / 2 ** next(0)[0] // call in expression
    if false {
      const hello = 5
      function g() { print hello return }
      break
    } else if true {
      next(99)   // call statement
      let hello = y // a different hello
    } else {
      break
    }
    print x   // TADA 🥑
  }
`

const expectedAst = `
   1 | Program statements=[#2,#5,#17]
   2 | VariableDeclaration name='x' readOnly=false initializer=1024 variable=#3
   3 | Variable name='x' readOnly=false type=#4
   4 | Type name='number'
   5 | FunctionDeclaration name='next' parameters=[#6] returnType=#7 body=[#8,#12,#14] function=#15
   6 | Parameter name='n' type=#4
   7 | ArrayType baseType=#4
   8 | VariableDeclaration name='a' readOnly=false initializer=#9 variable=#11
   9 | ArrayLiteral arrayType=#10 args=[1,2,3] type=#10
  10 | ArrayType baseType=#4
  11 | Variable name='a' readOnly=false type=#10
  12 | Assignment target=#13 source=100
  13 | SubscriptExpression array=#11 element=1 type=#4
  14 | ReturnStatement expression=#11
  15 | Function name='next' type=#16
  16 | FunctionType parameterTypes=[#4] returnType=#7
  17 | WhileStatement test=#18 body=[#20,#25,#31,#46]
  18 | BinaryExpression op='>' left=#3 right=3 type=#19
  19 | Type name='boolean'
  20 | VariableDeclaration name='y' readOnly=false initializer=#21 variable=#24
  21 | AndExpression conjuncts=[false,#22] type=#19
  22 | OrExpression disjuncts=[true,#23] type=#19
  23 | BinaryExpression op='>=' left=2 right=#3 type=#19
  24 | Variable name='y' readOnly=false type=#19
  25 | Assignment target=#3 source=#26
  26 | BinaryExpression op='/' left=#27 right=#28 type=#4
  27 | BinaryExpression op='+' left=0 right=#3 type=#4
  28 | BinaryExpression op='**' left=2 right=#29 type=#4
  29 | SubscriptExpression array=#30 element=0 type=#4
  30 | Call callee=#15 args=[0] type=#7
  31 | IfStatement test=false consequent=[#32,#34,#40] alternative=#41
  32 | VariableDeclaration name='hello' readOnly=true initializer=5 variable=#33
  33 | Variable name='hello' readOnly=true type=#4
  34 | FunctionDeclaration name='g' parameters=[] returnType=#35 body=[#36,#37] function=#38
  35 | Type name='void'
  36 | PrintStatement argument=#33
  37 | ShortReturnStatement
  38 | Function name='g' type=#39
  39 | FunctionType parameterTypes=[] returnType=#35
  40 | BreakStatement
  41 | IfStatement test=true consequent=[#42,#43] alternative=[#45]
  42 | Call callee=#15 args=[99] type=#7
  43 | VariableDeclaration name='hello' readOnly=false initializer=#24 variable=#44
  44 | Variable name='hello' readOnly=false type=#19
  45 | ContinueStatement
  46 | PrintStatement argument=#3
`.slice(1, -1)

const semanticChecks = [
  ["return in nested if", "function f() {if true {return;}}"],
  ["break in nested if", "for false {if true {break;}}"],
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
  [
    "bad types for ==",
    "print(false==1);",
    /Operands do not have the same type/,
  ],
  [
    "bad types for !=",
    "print(false==1);",
    /Operands do not have the same type/,
  ],
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
  ["non-boolean for test", "for 1 {}", /a boolean but got a int/],
  [
    "shadowing",
    "let x = 1;\nfor true {let x = 1;}",
    /Identifier x already declared/,
  ],
  ["break outside loop", "break;", /'break' can only appear in a loop/],
  [
    "break inside function",
    "for true {function f() {break;}}",
    /'break' can only appear in a loop/,
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
  it("can analyze all the nodes", () => {
    assert.deepStrictEqual(util.format(analyze(parse(source))), expectedAst)
  })
})
