import assert from "assert"
import parse from "../src/parser.js"
import * as ast from "../src/ast.js"

// Test cases for expected AST fragments
const breakNode = new ast.BreakStatement()
const returnNode = new ast.ShortReturnStatement()
const letXbe1Node = new ast.VariableDeclaration("x", false, 1n)
const constXbe1Node = new ast.VariableDeclaration("x", true, 1n)
const printIdNode = new ast.IdentifierExpression("print")
const print1CallNode = new ast.Call(printIdNode, [1n])
const noParamFunDeclNode = new ast.FunctionDeclaration("f", [], null, [])
const paramXNode = new ast.Parameter("x", new ast.TypeId("int"))
const oneParamFunDeclNode = new ast.FunctionDeclaration("f", [paramXNode], null, [])
const astChecks = [
  ["smallest", "break;", [breakNode]],
  ["vardecs", "let x = 1; const x = 1;", [letXbe1Node, constXbe1Node]],
  [
    "multiple statements",
    "print(1);break;return;return;",
    [print1CallNode, breakNode, returnNode, returnNode],
  ],
  ["function with no params, no return type", "function f() {}", [noParamFunDeclNode]],
  [
    "function with one param, no return type",
    "function f(x: int) {}",
    [oneParamFunDeclNode],
  ],
]

describe("The parser", () => {
  for (const [scenario, source, tree] of astChecks) {
    it(`produces the correct AST for ${scenario}`, () => {
      assert.deepStrictEqual(parse(source), new ast.Program(tree))
    })
  }
})
