import assert from "node:assert/strict"
import optimize from "../src/optimizer.js"
import * as core from "../src/core.js"

// Make some test cases easier to read
const x = core.variable("x", false, core.intType)
const a = core.variable("a", false, core.arrayType(core.intType))
const xpp = core.increment(x)
const xmm = core.decrement(x)
const return1p1 = core.returnStatement(core.binary("+", 1, 1, core.intType))
const return2 = core.returnStatement(2)
const returnX = core.returnStatement(x)
const onePlusTwo = core.binary("+", 1, 2, core.intType)
const identity = Object.assign(core.fun("id", core.anyType), { body: returnX })
const voidInt = core.functionType([], core.intType)
const intFun = body => core.functionDeclaration("f", core.fun("f", voidInt), [], [body])
const callIdentity = args => core.functionCall(identity, args)
const or = (...d) => d.reduce((x, y) => core.binary("||", x, y))
const and = (...c) => c.reduce((x, y) => core.binary("&&", x, y))
const less = (x, y) => core.binary("<", x, y)
const eq = (x, y) => core.binary("==", x, y)
const times = (x, y) => core.binary("*", x, y)
const neg = x => core.unary("-", x)
const array = (...elements) => core.arrayExpression(elements)
const assign = (v, e) => core.assignment(v, e)
const emptyArray = core.emptyArray(core.intType)
const sub = (a, e) => core.subscript(a, e)
const unwrapElse = (o, e) => core.binary("??", o, e)
const emptyOptional = core.emptyOptional(core.intType)
const some = x => core.unary("some", x)
const program = core.program

const tests = [
  ["folds +", core.binary("+", 5, 8), 13],
  ["folds -", core.binary("-", 5n, 8n), -3n],
  ["folds *", core.binary("*", 5, 8), 40],
  ["folds /", core.binary("/", 5, 8), 0.625],
  ["folds **", core.binary("**", 5, 8), 390625],
  ["folds <", core.binary("<", 5, 8), true],
  ["folds <=", core.binary("<=", 5, 8), true],
  ["folds ==", core.binary("==", 5, 8), false],
  ["folds !=", core.binary("!=", 5, 8), true],
  ["folds >=", core.binary(">=", 5, 8), false],
  ["folds >", core.binary(">", 5, 8), false],
  ["optimizes +0", core.binary("+", x, 0), x],
  ["optimizes -0", core.binary("-", x, 0), x],
  ["optimizes *1", core.binary("*", x, 1), x],
  ["optimizes /1", core.binary("/", x, 1), x],
  ["optimizes *0", core.binary("*", x, 0), 0],
  ["optimizes 0*", core.binary("*", 0, x), 0],
  ["optimizes 0/", core.binary("/", 0, x), 0],
  ["optimizes 0+", core.binary("+", 0, x), x],
  ["optimizes 0-", core.binary("-", 0, x), neg(x)],
  ["optimizes 1*", core.binary("*", 1, x), x],
  ["folds negation", core.unary("-", 8), -8],
  ["optimizes 1**", core.binary("**", 1, x), 1],
  ["optimizes **0", core.binary("**", x, 0), 1],
  ["removes left false from ||", or(false, less(x, 1)), less(x, 1)],
  ["removes right false from ||", or(less(x, 1), false), less(x, 1)],
  ["removes left true from &&", and(true, less(x, 1)), less(x, 1)],
  ["removes right true from &&", and(less(x, 1), true), less(x, 1)],
  ["removes x=x at beginning", program([core.assignment(x, x), xpp]), program([xpp])],
  ["removes x=x at end", program([xpp, core.assignment(x, x)]), program([xpp])],
  ["removes x=x in middle", program([xpp, assign(x, x), xpp]), program([xpp, xpp])],
  ["optimizes if-true", core.ifStatement(true, [xpp], []), [xpp]],
  ["optimizes if-false", core.ifStatement(false, [], [xpp]), [xpp]],
  ["optimizes short-if-true", core.shortIfStatement(true, [xmm]), [xmm]],
  ["optimizes short-if-false", core.shortIfStatement(false, [xpp]), []],
  ["optimizes while-false", program([core.whileStatement(false, [xpp])]), program([])],
  ["optimizes repeat-0", program([core.repeatStatement(0, [xpp])]), program([])],
  ["optimizes for-range", core.forRangeStatement(x, 5, "...", 3, [xpp]), []],
  ["optimizes for-empty-array", core.forStatement(x, emptyArray, [xpp]), []],
  ["applies if-false after folding", core.shortIfStatement(eq(1, 1), [xpp]), [xpp]],
  ["optimizes away nil", unwrapElse(emptyOptional, 3), 3],
  ["optimizes left conditional true", core.conditional(true, 55, 89), 55],
  ["optimizes left conditional false", core.conditional(false, 55, 89), 89],
  ["optimizes in functions", program([intFun(return1p1)]), program([intFun(return2)])],
  ["optimizes in subscripts", sub(a, onePlusTwo), sub(a, 3)],
  ["optimizes in array literals", array(0, onePlusTwo, 9), array(0, 3, 9)],
  ["optimizes in arguments", callIdentity([times(3, 5)]), callIdentity([15])],
  [
    "passes through nonoptimizable constructs",
    ...Array(2).fill([
      core.program([core.shortReturnStatement()]),
      core.variableDeclaration("x", true, "z"),
      core.typeDeclaration([core.field("x", core.intType)]),
      core.assignment(x, core.binary("*", x, "z")),
      core.assignment(x, core.unary("not", x)),
      core.constructorCall(identity, core.memberExpression(x, ".", "f")),
      core.variableDeclaration("q", false, core.emptyArray(core.floatType)),
      core.variableDeclaration("r", false, core.emptyOptional(core.intType)),
      core.whileStatement(true, [core.breakStatement]),
      core.repeatStatement(5, [core.returnStatement(1)]),
      core.conditional(x, 1, 2),
      unwrapElse(some(x), 7),
      core.ifStatement(x, [], []),
      core.shortIfStatement(x, []),
      core.forRangeStatement(x, 2, "..<", 5, []),
      core.forStatement(x, array(1, 2, 3), []),
    ]),
  ],
]

describe("The optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(`${scenario}`, () => {
      assert.deepEqual(optimize(before), after)
    })
  }
})
