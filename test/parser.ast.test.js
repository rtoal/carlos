import assert from "assert"
import parse from "../src/parser.js"
import * as ast from "../src/ast.js"

// TODO: This test case needs a lot more work
const source = `
  let x = 1;
  const y = "hello";
  return [1.0, 2.0];
  return x.y;
  function f(x: int): [bool] {
    if (false) {break;}
  }
  struct S {
    m: (string, int?)->bool
  }
  f(3 * 7 ?? 1 && 2);
`

const expectedAST = new ast.Program([
  new ast.VariableDeclaration("x", false, 1n),
  new ast.VariableDeclaration("y", true, "hello"),
  new ast.ReturnStatement(new ast.ArrayExpression([1, 2])),
  new ast.ReturnStatement(new ast.MemberExpression(new ast.Identifier("x"), "y")),
  new ast.FunctionDeclaration(
    "f",
    [new ast.Parameter("x", new ast.Identifier("int"))],
    new ast.ArrayType(new ast.Identifier("bool")),
    [new ast.ShortIfStatement(false, [new ast.BreakStatement()])]
  ),
  new ast.StructDeclaration("S", [
    new ast.Field(
      "m",
      new ast.FunctionType(
        [new ast.Identifier("string"), new ast.OptionalType(new ast.Identifier("int"))],
        new ast.Identifier("bool")
      )
    ),
  ]),
  new ast.Call(new ast.Identifier("f"), [
    new ast.UnwrapElse(
      new ast.BinaryExpression("*", 3n, 7n),
      new ast.AndExpression([1n, 2n])
    ),
  ]),
])

describe("The parser", () => {
  it("produces a correct AST", () => {
    assert.deepStrictEqual(parse(source), expectedAST)
  })
})
