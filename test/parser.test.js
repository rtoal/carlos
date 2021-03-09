import assert from "assert"
import parse from "../src/parser.js"

const syntaxChecks = [
  ["simplest syntactically correct program", "break"],
  ["multiple statements", "print(1)\nbreak\nx=5 return return"],
  ["variable declarations", "let e=99*1\nconst z=false"],
  ["struct declarations", "struct S {x:T1 y:T2 z:bool}"],
  ["function with no params, no return type", "function f() {}"],
  ["function with one param", "function f(x: int) {}"],
  ["function with two params", "function f(x: int, y: boolean) {}"],
  ["function with no params + return type", "function f(): int {}"],
  ["function types in params", "function f(g: (int)->boolean) {}"],
  ["function types returned", "function f(): (int)->(int)->void {}"],
  ["array type for param", "function f(x: [[[boolean]]]) {}"],
  ["array type returned", "function f(): [[int]] {}"],
  ["optional types", "function f(c: int?): float {}"],
  ["assignments", "++a a-- --b c++ abc=9*3 a=1"],
  ["call in statement", "let x = 1\nf(100)\nprint(1)"],
  ["call in exp", "print(5 * f(x, y, 2 * y))"],
  ["short if", "if true { print(1) }"],
  ["longer if", "if true { print(1) } else { print(1) }"],
  ["even longer if", "if true { print(1) } else if false { print(1)}"],
  ["forever with empty block", "for {}"],
  ["for-while with empty block", "for true {}"],
  ["for-while with one statement block", "for true { let x = 1 }"],
  ["for with long block", "for 2 times { print(1)\nprint(2)\nprint(3) }"],
  ["if inside for", "for 3 times { if true { print(1) } }"],
  ["for closed range", "for i in 2...9*1 {}"],
  ["for half-open range", "for i in 2..<9*1 {}"],
  ["for collection-as-id", "for i in things {}"],
  ["for collection-as-lit", "for i in [3,5,8] {}"],
  ["condiitonal", "return x?y:z?y:p"],
  ["??", "return a ?? b ?? c ?? d"],
  ["ors can be chained", "print(1 || 2 || 3 || 4 || 5)"],
  ["ands can be chained", "print(1 && 2 && 3 && 4 && 5)"],
  ["bitops", "return (1|2|3) + (4^5^6) + (7&8&9)"],
  ["relational operators", "print(1<2||1<=2||1==2||1!=2||1>=2||1>2)"],
  ["shifts", "return 3 << 5 >> 8 << 13 >> 21"],
  ["arithemetic", "return 2 * x + 3 / 5 - -1 % 7 ** 3 ** 3"],
  ["length", "return #c return #[1,2,3]"],
  ["boolean literals", "let x = false || true"],
  ["all numeric literal forms", "print(8 * 89.123 * 1.3E5 * 1.3E+5 * 1.3E-5)"],
  ["empty array literal", "print(emptyArrayOf(int))"],
  ["nonempty array literal", "print([1, 2, 3])"],
  ["some operator", "return some dog"],
  ["no operator", "return no dog"],
  ["parentheses", "print(83 * ((((((((-(13 / 21))))))))) + 1 - 0)"],
  ["variables in expression", "return r.p(3,1)[9]?.x?.y.z.p()(5)[1]"],
  ["more expression vars", "return c(3).p?.ohhhhhh(9)[2][2].p(1)[3](2)"],
  ["non-Latin letters in identifiers", "let コンパイラ = 100"],
  ["a simple string literal", 'print("hello😉😬💀🙅🏽‍♀️—`")'],
  ["string literal with escapes", 'return "a\\n\\tbc\\\\de\\"fg"'],
  [
    "code points",
    'print("\\u{a}\\u{2c}\\u{1e5}\\u{ae89}\\u{1f4a9}\\u{10ffe8}")',
  ],
  ["end of program inside comment", "print(0) // yay"],
  ["comments with no text", "print(1)//\nprint(0)//"],
]

const syntaxErrors = [
  ["non-letter in an identifier", "let ab😭c = 2", /Line 1, col 7:/],
  ["malformed int", "let x= 2.", /Line 1, col 10:/],
  ["a int with an E but no exponent", "let x = 5E * 11", /Line 1, col 12:/],
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
  ["unbalanced brackets", "function f(): int[", /Line 1, col 18/],
  ["fake array literal", "print([1,2,])", /Line 1, col 12/],
  ["empty subscript", "print(a[])", /Line 1, col 9/],
  ["true is reserved", "true = 1", /Line 1, col 1/],
  ["false is reserved", "false = 1", /Line 1, col 1/],
  ["no-paren function type", "function f(g:int->int) {}", /Line 1, col 17/],
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
