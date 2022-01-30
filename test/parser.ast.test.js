import assert from "assert"
import parse from "../src/parser.js"
import * as core from "../src/core.js"

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

const expectedAST = new core.Program([
  new core.VariableDeclaration(new core.Variable("x", false), 1n),
  new core.VariableDeclaration(new core.Variable("y", true), "hello"),
  new core.ReturnStatement(new core.ArrayExpression([1, 2])),
  new core.ReturnStatement(new core.MemberExpression(Symbol.for("x"), "y")),
  new core.FunctionDeclaration(
    new core.Function(
      "f",
      [new core.Parameter("x", Symbol.for("int"))],
      new core.ArrayType(Symbol.for("bool"))
    ),
    [new core.ShortIfStatement(false, [new core.BreakStatement()])]
  ),
  new core.TypeDeclaration(
    new core.StructType("S", [
      new core.Field(
        "m",
        new core.FunctionType(
          [Symbol.for("string"), new core.OptionalType(Symbol.for("int"))],
          Symbol.for("bool")
        )
      ),
    ])
  ),
  new core.Call(Symbol.for("f"), [
    new core.BinaryExpression(
      "??",
      new core.BinaryExpression("*", 3n, 7n),
      new core.BinaryExpression("&&", 1n, 2n)
    ),
  ]),
])

describe("The parser", () => {
  it("produces a correct AST", () => {
    assert.deepStrictEqual(parse(source), expectedAST)
  })
})
