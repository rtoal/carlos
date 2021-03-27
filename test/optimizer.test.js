import assert from "assert"
import optimize from "../src/optimizer.js"
import * as ast from "../src/ast.js"

// Make some test cases easier to read
const x = new ast.Variable("x", false)
const xpp = new ast.Increment(x)
const return1p1 = new ast.ReturnStatement(new ast.BinaryExpression("+", 1, 1))
const onePlusTwo = new ast.BinaryExpression("+", 1, 2)

const tests = [
  // ["folds +", new ast.BinaryExpression("+", 5, 8), 13],
  // ["folds -", new ast.BinaryExpression("-", 5, 8), -3],
  // ["folds *", new ast.BinaryExpression("*", 5, 8), 40],
  // ["folds /", new ast.BinaryExpression("/", 5, 8), 0.625],
  // ["folds **", new ast.BinaryExpression("**", 5, 8), 390625],
  // ["folds <", new ast.BinaryExpression("<", 5, 8), true],
  // ["folds <=", new ast.BinaryExpression("<=", 5, 8), true],
  // ["folds ==", new ast.BinaryExpression("==", 5, 8), false],
  // ["folds !=", new ast.BinaryExpression("!=", 5, 8), true],
  // ["folds >=", new ast.BinaryExpression(">=", 5, 8), false],
  // ["folds >", new ast.BinaryExpression(">", 5, 8), false],
  // ["optimizes +0", new ast.BinaryExpression("+", x, 0), x],
  // ["optimizes -0", new ast.BinaryExpression("-", x, 0), x],
  // ["optimizes *1", new ast.BinaryExpression("*", x, 1), x],
  // ["optimizes /1", new ast.BinaryExpression("/", x, 1), x],
  // ["optimizes *0", new ast.BinaryExpression("*", x, 0), 0],
  // ["optimizes 0*", new ast.BinaryExpression("*", 0, x), 0],
  // ["optimizes 0/", new ast.BinaryExpression("/", 0, x), 0],
  // ["optimizes 0+", new ast.BinaryExpression("+", 0, x), x],
  // ["optimizes 0-", new ast.BinaryExpression("-", 0, x), new ast.UnaryExpression("-", x)],
  // ["optimizes 1*", new ast.BinaryExpression("*", 1, x), x],
  // ["folds negation", new ast.UnaryExpression("-", 8), -8],
  // ["optimizes 1**", new ast.BinaryExpression("**", 1, x), 1],
  // ["optimizes **0", new ast.BinaryExpression("**", x, 0), 1],
  // [
  //   "removes disjuncts after true",
  //   new ast.OrExpression([new ast.BinaryExpression("<", x, 1), true, false]),
  //   new ast.OrExpression([new ast.BinaryExpression("<", x, 1), true]),
  // ],
  // [
  //   "removes conjuncts after false",
  //   new ast.AndExpression([new ast.BinaryExpression("<", x, 1), false, true]),
  //   new ast.AndExpression([new ast.BinaryExpression("<", x, 1), false]),
  // ],
  // ["removes x=x at beginning", [new ast.Assignment(x, x), xpp], [xpp]],
  // ["removes x=x at end", [xpp, new ast.Assignment(x, x)], [xpp]],
  // ["removes x=x in middle", [xpp, new ast.Assignment(x, x), xpp], [xpp, xpp]],
  // ["optimizes if-true", new ast.IfStatement(true, xpp, []), xpp],
  // ["optimizes if-false", new ast.IfStatement(false, [], xpp), xpp],
  // ["optimizes short-if-true", new ast.ShortIfStatement(true, xpp), xpp],
  // ["optimizes short-if-false", [new ast.ShortIfStatement(false, xpp)], []],
  // ["optimizes while-false", [new ast.WhileStatement(false, xpp)], []],
  // [
  //   "applies if-false after folding",
  //   new ast.ShortIfStatement(new ast.BinaryExpression("==", 1, 1), xpp),
  //   xpp,
  // ],
  // [
  //   "optimizes in functions",
  //   new ast.FunctionDeclaration("f", [], "int", return1p1),
  //   new ast.FunctionDeclaration("f", [], "int", new ast.ReturnStatement(2)),
  // ],
  [
    "optimizes in subscripts",
    new ast.SubscriptExpression(x, onePlusTwo),
    new ast.SubscriptExpression(x, 3),
  ],
  [
    "optimizes in array literals",
    new ast.ArrayExpression([0, onePlusTwo, 9]),
    new ast.ArrayExpression([0, 3, 9]),
  ],
  // [
  //   "optimizes in arguments to standard functions",
  //   new ast.Call(sin, [new ast.BinaryExpression("*", π, 1)]),
  //   new ast.Call(sin, [π]),
  // ],
  [
    "passes through nonoptimizable constructs",
    ...Array(2).fill([
      new ast.VariableDeclaration("x", true, 0),
      new ast.Assignment(x, new ast.BinaryExpression("*", x, 100)),
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
