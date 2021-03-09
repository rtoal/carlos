import assert from "assert"
import parse from "../src/parser.js"

const syntaxChecks = [
  ["simplest syntactically correct program", "break"],
  ["multiple statements", "print(1)\nbreak\nx=5 return return"],
  ["variable declarations", "let e=99*1\nconst z=false"],
  ["struct declarations", "struct S {x:T1 y:T2 z:bool}"],
  ["function with no params, no return type", "function f() {}"],
  ["function with one param", "function f(x: number) {}"],
  ["function with two params", "function f(x: number, y: boolean) {}"],
  ["function with no params + return type", "function f(): number {}"],

  ["all numeric literal forms", "print(8 * 89.123 * 1.3E5 * 1.3E+5 * 1.3E-5)"],
  ["complex expressions", "print(83 * ((((((((-(13 / 21))))))))) + 1 - 0)"],
  ["end of program inside comment", "print(0) // yay"],
  ["comments with no text", "print(1)//\nprint(0)//"],
  ["non-Latin letters in identifiers", "let コンパイラ = 100"],
  ["ors can be chained", "print(1 || 2 || 3 || 4 || 5)"],
  ["ands can be chained", "print(1 && 2 && 3 && 4 && 5)"],
  ["relational operators", "print(1<2||1<=2||1==2||1!=2||1>=2||1>2)"],
  ["short if", "if true { print(1) }"],
  ["longer if", "if true { print(1) } else { print(1) }"],
  ["even longer if", "if true { print(1) } else if false { print(1)}"],
  ["while with empty block", "for true {}"],
  ["while with one statement block", "for true { let x = 1 }"],
  ["while with long block", "for true { print(1)\nprint(2)\nprint(3) }"],
  ["if inside while", "for 3 times { if true { print(1) } }"],
  ["call in exp", "print(5 * f(x, y, 2 * y))"],
  ["call in statement", "let x = 1\nf(100)\nprint(1)"],
  ["array type for param", "function f(x: [[[boolean]]]) {}"],
  ["array type returned", "function f(): [[number]] {}"],
  ["empty array literal", "print(emptyArrayOf(int))"],
  ["nonempty array literal", "print([1, 2, 3])"],
  ["subscript", "print(a[100 - (3 * x)])"],
  ["subscript exp is writable", "a[2] = 50"],
  ["boolean literals", "let x = false || true"],
  ["function types in params", "function f(g: (number)->boolean) {}"],
  ["function types returned", "function f(): (number)->(number)->void {}"],
  ["a simple string literal", 'print("hello😉😬💀🙅🏽‍♀️—`")'],
  ["string literal with escapes", 'return "a\\n\\tbc\\\\de\\"fg"'],
  [
    "string literal code points",
    'print("\\u{a}\\u{2c}\\u{1e5}\\u{ae89}\\u{1f4a9}\\u{10ffe8}")',
  ],
]

const syntaxErrors = [
  ["non-letter in an identifier", "let ab😭c = 2", /Line 1, col 7:/],
  ["malformed number", "let x= 2.", /Line 1, col 10:/],
  ["a number with an E but no exponent", "let x = 5E * 11", /Line 1, col 12:/],
  ["a missing right operand", "print(5 -)", /Line 1, col 10:/],
  ["a non-operator", "print(7 * ((2 _ 3))", /Line 1, col 15:/],
  ["an expression starting with a )", "print )", /Line 1, col 7:/],
  ["a statement starting with expression", "x * 5", /Line 1, col 3:/],
  ["an illegal statement on line 2", "print(5)\nx * 5", /Line 2, col 3:/],
  ["a statement starting with a )", "print(5)\n)", /Line 2, col 1:/],
  ["an expression starting with a *", "let x = * 71", /Line 1, col 9:/],
  ["negation before exponentiation", "print(-2**2)", /Line 1, col 10:/],
  ["mixing ands and ors", "print(1 && 2 || 3)", /Line 1, col 15:/],
  ["mixing ors and ands", "print(1 || 2 && 3)", /Line 1, col 15:/],
  ["associating relational operators", "print(1 < 2 < 3)", /Line 1, col 13:/],
  ["for without braces", "for true\nprint(1)", /Line 2, col 1/],
  ["if without braces", "if x < 3\nprint(1)", /Line 2, col 1/],
  ["while as identifier", "let for = 3", /Line 1, col 5/],
  ["if as identifier", "let if = 8", /Line 1, col 5/],
  ["unbalanced brackets", "function f(): number[", /Line 1, col 21/],
  ["fake array literal", "print([1,2,])", /Line 1, col 12/],
  ["empty subscript", "print(a[])", /Line 1, col 9/],
  ["true is reserved", "true = 1", /Line 1, col 1/],
  ["false is reserved", "false = 1", /Line 1, col 1/],
  [
    "non-parenthesized function type",
    "function f(g:number->number) {}",
    /Line 1, col 20/,
  ],
  ["stringlit with unknown escape", 'print("ab\\zcdef")', /col 11/],
  ["stringlit with newline", 'print("ab\\zcdef")', /col 11/],
  ["stringlit with quote", 'print("ab\\zcdef")', /col 11/],
  ["stringlit with code point too long", 'print("\\u{1111111}")', /col 17/],
]

describe("The parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`recognizes ${scenario}`, () => {
      assert(parse(source))
    })
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => parse(source), errorMessagePattern)
    })
  }
})
