import assert from "assert"
import optimize from "../src/optimizer.js"
import * as ast from "../src/ast.js"

// Make some test cases easier to read
const x = new ast.Variable("x", false)
const xpp = new ast.Increment(x)
const return1p1 = new ast.ReturnStatement(new ast.BinaryExpression("+", 1, 1))
const onePlusTwo = new ast.BinaryExpression("+", 1, 2)
const identity = Object.assign(new ast.Function("id"), {
  parameters: [new ast.Parameter("x")],
  type: new ast.FunctionType([ast.Type.INT], ast.Type.INT),
  body: new ast.ReturnStatement(x),
})
const or = (...disjuncts) => new ast.OrExpression(disjuncts)
const and = (...conjuncts) => new ast.AndExpression(conjuncts)
const less = (x, y) => new ast.BinaryExpression("<", x, y)
const eq = (x, y) => new ast.BinaryExpression("==", x, y)
const emptyArray = new ast.EmptyArray(ast.Type.INT)
const sub = (a, e) => new ast.SubscriptExpression(a, e)
const unwrapElse = (o, e) => new ast.UnwrapElse(o, e)
const conditional = (x, y, z) => new ast.Conditional(x, y, z)
const emptyOptional = new ast.EmptyOptional(ast.Type.INT)

const tests = [
  ["folds +", new ast.BinaryExpression("+", 5, 8), 13],
  ["folds -", new ast.BinaryExpression("-", 5n, 8n), -3n],
  ["folds *", new ast.BinaryExpression("*", 5, 8), 40],
  ["folds /", new ast.BinaryExpression("/", 5, 8), 0.625],
  ["folds **", new ast.BinaryExpression("**", 5, 8), 390625],
  ["folds <", new ast.BinaryExpression("<", 5, 8), true],
  ["folds <=", new ast.BinaryExpression("<=", 5, 8), true],
  ["folds ==", new ast.BinaryExpression("==", 5, 8), false],
  ["folds !=", new ast.BinaryExpression("!=", 5, 8), true],
  ["folds >=", new ast.BinaryExpression(">=", 5, 8), false],
  ["folds >", new ast.BinaryExpression(">", 5, 8), false],
  ["optimizes +0", new ast.BinaryExpression("+", x, 0), x],
  ["optimizes -0", new ast.BinaryExpression("-", x, 0), x],
  ["optimizes *1", new ast.BinaryExpression("*", x, 1), x],
  ["optimizes /1", new ast.BinaryExpression("/", x, 1), x],
  ["optimizes *0", new ast.BinaryExpression("*", x, 0), 0],
  ["optimizes 0*", new ast.BinaryExpression("*", 0, x), 0],
  ["optimizes 0/", new ast.BinaryExpression("/", 0, x), 0],
  ["optimizes 0+", new ast.BinaryExpression("+", 0, x), x],
  ["optimizes 0-", new ast.BinaryExpression("-", 0, x), new ast.UnaryExpression("-", x)],
  ["optimizes 1*", new ast.BinaryExpression("*", 1, x), x],
  ["folds negation", new ast.UnaryExpression("-", 8), -8],
  ["optimizes 1**", new ast.BinaryExpression("**", 1, x), 1],
  ["optimizes **0", new ast.BinaryExpression("**", x, 0), 1],
  ["removes disjuncts after true", or(less(x, 1), true, false), or(less(x, 1), true)],
  ["removes conjuncts after false", and(less(x, 1), false, true), and(less(x, 1), false)],
  ["removes x=x at beginning", [new ast.Assignment(x, x), xpp], [xpp]],
  ["removes x=x at end", [xpp, new ast.Assignment(x, x)], [xpp]],
  ["removes x=x in middle", [xpp, new ast.Assignment(x, x), xpp], [xpp, xpp]],
  ["optimizes if-true", new ast.IfStatement(true, xpp, []), xpp],
  ["optimizes if-false", new ast.IfStatement(false, [], xpp), xpp],
  ["optimizes short-if-true", new ast.ShortIfStatement(true, xpp), xpp],
  ["optimizes short-if-false", [new ast.ShortIfStatement(false, xpp)], []],
  ["optimizes while-false", [new ast.WhileStatement(false, xpp)], []],
  ["optimizes repeat-0", [new ast.RepeatStatement(0, xpp)], []],
  ["optimizes for-range", [new ast.ForRangeStatement(x, 5, "...", 3, xpp)], []],
  ["optimizes for-empty-array", [new ast.ForStatement(x, emptyArray, xpp)], []],
  ["applies if-false after folding", new ast.ShortIfStatement(eq(1, 1), xpp), xpp],
  ["optimizes away nil", unwrapElse(emptyOptional, 3), 3],
  ["optimizes conditional true", conditional(true, 55, 89), 55],
  ["optimizes conditional false", conditional(false, 55, 89), 89],
  [
    "optimizes in functions",
    new ast.FunctionDeclaration("f", [], "int", return1p1),
    new ast.FunctionDeclaration("f", [], "int", new ast.ReturnStatement(2)),
  ],
  ["optimizes in subscripts", sub(x, onePlusTwo), sub(x, 3)],
  [
    "optimizes in array literals",
    new ast.ArrayExpression([0, onePlusTwo, 9]),
    new ast.ArrayExpression([0, 3, 9]),
  ],
  [
    "optimizes in arguments",
    new ast.Call(identity, [new ast.BinaryExpression("*", 3, 5)]),
    new ast.Call(identity, [15]),
  ],
  [
    "passes through nonoptimizable constructs",
    ...Array(2).fill([
      new ast.VariableDeclaration("x", true, "z"),
      new ast.Assignment(x, new ast.BinaryExpression("*", x, "z")),
      new ast.Assignment(x, new ast.UnaryExpression("not", x)),
      new ast.Call(identity, new ast.MemberExpression(x, "f")),
      new ast.VariableDeclaration("q", false, new ast.EmptyArray(ast.Type.FLOAT)),
      new ast.VariableDeclaration("r", false, new ast.EmptyOptional(ast.Type.INT)),
    ]),
  ],
]

describe("The optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(`${scenario}`, () => {
      assert.deepStrictEqual(optimize(before), after)
    })
  }
})
