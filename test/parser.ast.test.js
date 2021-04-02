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
  new ast.VariableDeclaration(new ast.Variable("x", false), 1n),
  new ast.VariableDeclaration(new ast.Variable("y", true), "hello"),
  new ast.ReturnStatement(new ast.ArrayExpression([1, 2])),
  new ast.ReturnStatement(new ast.MemberExpression(Symbol.for("x"), "y")),
  new ast.FunctionDeclaration(
    new ast.Function(
      "f",
      [new ast.Parameter("x", Symbol.for("int"))],
      new ast.ArrayType(Symbol.for("bool"))
    ),
    [new ast.ShortIfStatement(false, [new ast.BreakStatement()])]
  ),
  new ast.TypeDeclaration(
    new ast.Type("S", [
      new ast.Field(
        "m",
        new ast.FunctionType(
          [Symbol.for("string"), new ast.OptionalType(Symbol.for("int"))],
          Symbol.for("bool")
        )
      ),
    ])
  ),
  new ast.Call(Symbol.for("f"), [
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
