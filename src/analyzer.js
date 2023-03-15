import fs from "fs"
import * as ohm from "ohm-js"
import * as core from "./core.js"
import * as stdlib from "./stdlib.js"

const grammar = ohm.grammar(fs.readFileSync("src/carlos.ohm"))

// Save typing
const INT = core.Type.INT
const FLOAT = core.Type.FLOAT
const STRING = core.Type.STRING
const BOOLEAN = core.Type.BOOLEAN
const ANY = core.Type.ANY
const VOID = core.Type.VOID

function must(condition, message, errorLocation) {
  if (!condition) core.error(message, errorLocation)
}

function mustNotAlreadyBeDeclared(context, name) {
  must(!context.sees(name), `Identifier ${name} already declared`)
}

function mustHaveBeenFound(entity, name) {
  must(entity, `Identifier ${name} not declared`)
}

function mustHaveNumericType(e, at) {
  must([INT, FLOAT].includes(e.type), "Expected a number", at)
}

function mustHaveNumericOrStringType(e, at) {
  must([INT, FLOAT, STRING].includes(e.type), "Expected a number or string", at)
}

function mustHaveBooleanType(e, at) {
  must(e.type === BOOLEAN, "Expected a boolean", at)
}

function mustHaveIntegerType(e, at) {
  must(e.type === INT, "Expected an integer", at)
}

function mustHaveAnArrayType(e, at) {
  must(e.type instanceof core.ArrayType, "Expected an array", at)
}

function mustHaveAnOptionalType(e, at) {
  must(e.type instanceof core.OptionalType, "Expected an optional", at)
}

function mustHaveAStructType(e, at) {
  must(e.type instanceof core.StructType, "Expected a struct", at)
}

function mustHaveOptionalStructType(e, at) {
  must(
    e.type instanceof core.OptionalType && e.type.baseType.constructor == core.StructType,
    "Expected an optional struct",
    at
  )
}

function entityMustBeAType(e, at) {
  must(e instanceof core.Type, "Type expected", at)
}

function mustBeTheSameType(e1, e2, at) {
  must(e1.type.isEquivalentTo(e2.type), "Operands do not have the same type", at)
}

function mustAllHaveSameType(expressions, at) {
  must(
    expressions.slice(1).every(e => e.type.isEquivalentTo(expressions[0].type)),
    "Not all elements have the same type",
    at
  )
}

function mustNotBeRecursive(struct, at) {
  must(
    !struct.fields.map(f => f.type).includes(struct),
    "Struct type must not be recursive",
    at
  )
}

function mustBeAssignable(e, { toType: type }, at) {
  must(
    type === ANY || e.type.isAssignableTo(type),
    `Cannot assign a ${e.type.description} to a ${type.description}`,
    at
  )
}

function mustNotBeReadOnly(e, at) {
  must(!e.readOnly, `Cannot assign to constant ${e.name}`, at)
}

function fieldsMustBeDistinct(fields, at) {
  const fieldNames = new Set(fields.map(f => f.name))
  must(fieldNames.size === fields.length, "Fields must be distinct", at)
}

function memberMustBeDeclared(field, { in: structType }, at) {
  must(structType.fields.map(f => f.name).includes(field), "No such field", at)
}

function mustBeInLoop(context, at) {
  must(context.inLoop, "Break can only appear in a loop", at)
}

function mustBeInAFunction(context, at) {
  must(context.function, "Return can only appear in a function", at)
}

function mustBeCallable(e, at) {
  must(
    e instanceof core.StructType || e.type.constructor == core.FunctionType,
    "Call of non-function or non-constructor",
    at
  )
}

function mustNotReturnAnything(f, at) {
  must(f.type.returnType === VOID, "Something should be returned", at)
}

function mustReturnSomething(f, at) {
  must(f.type.returnType !== VOID, "Cannot return a value from this function", at)
}

function mustBeReturnable({ expression: e, from: f }, at) {
  mustBeAssignable(e, { toType: f.type.returnType }, at)
}

function argumentsMustMatch(args, targetTypes, at) {
  must(
    targetTypes.length === args.length,
    `${targetTypes.length} argument(s) required but ${args.length} passed`,
    at
  )
  targetTypes.forEach((type, i) => mustBeAssignable(args[i], { toType: type }))
}

function callArgumentsMustMatch(args, calleeType, at) {
  argumentsMustMatch(args, calleeType.paramTypes, at)
}

function constructorArgumentsMustMatch(args, structType, at) {
  const fieldTypes = structType.fields.map(f => f.type)
  argumentsMustMatch(args, fieldTypes, at)
}

class Context {
  constructor({ parent = null, locals = new Map(), inLoop = false, function: f = null }) {
    Object.assign(this, { parent, locals, inLoop, function: f })
  }
  sees(name) {
    // Search "outward" through enclosing scopes
    return this.locals.has(name) || this.parent?.sees(name)
  }
  add(name, entity) {
    mustNotAlreadyBeDeclared(this, name)
    this.locals.set(name, entity)
  }
  lookup(name) {
    const entity = this.locals.get(name) || this.parent?.lookup(name)
    mustHaveBeenFound(entity, name)
    return entity
  }
  newChildContext(props) {
    return new Context({ ...this, ...props, parent: this, locals: new Map() })
  }
}

export default function analyze(sourceCode) {
  let context = new Context({})

  const analyzer = grammar.createSemantics().addOperation("rep", {
    Program(body) {
      return new core.Program(body.rep())
    },

    VarDecl(modifier, id, _eq, initializer, _semicolon) {
      const e = initializer.rep()
      const readOnly = modifier.sourceString === "const"
      const v = new core.Variable(id.sourceString, readOnly, e.type)
      context.add(id.sourceString, v)
      return new core.VariableDeclaration(v, e)
    },

    TypeDecl(_struct, id, _left, fields, _right) {
      // To allow recursion, enter into context without any fields yet
      const type = new core.StructType(id.sourceString, [])
      context.add(id.sourceString, type)
      // Now add the types as you parse and analyze
      type.fields = fields.rep()
      fieldsMustBeDistinct(type.fields)
      mustNotBeRecursive(type)
      return new core.TypeDeclaration(type)
    },

    Field(id, _colon, type) {
      return new core.Field(id.rep(), type.rep())
    },

    FunDecl(_fun, id, _open, params, _close, _colons, returnType, body) {
      const rt = returnType.rep()[0] ?? VOID
      const paramReps = params.asIteration().rep()
      const paramTypes = paramReps.map(p => p.type)
      const f = new core.Function(id.sourceString, new core.FunctionType(paramTypes, rt))
      context.add(id.sourceString, f)
      context = context.newChildContext({ inLoop: false, function: f })
      for (const p of paramReps) context.add(p.name, p)
      const b = body.rep()
      context = context.parent
      return new core.FunctionDeclaration(id.sourceString, f, paramReps, b)
    },

    Param(id, _colon, type) {
      return new core.Variable(id.sourceString, false, type.rep())
    },

    Type_optional(baseType, _questionMark) {
      return new core.OptionalType(baseType.rep())
    },

    Type_array(_left, baseType, _right) {
      return new core.ArrayType(baseType.rep())
    },

    Type_function(_left, inTypes, _right, _arrow, outType) {
      return new core.FunctionType(inTypes.asIteration().rep(), outType.rep())
    },

    Type_id(id) {
      const entity = context.lookup(id.sourceString)
      entityMustBeAType(entity)
      return entity
    },

    Statement_bump(variable, operator, _semicolon) {
      const v = variable.rep()
      mustHaveIntegerType(v)
      return operator.sourceString === "++"
        ? new core.Increment(v)
        : new core.Decrement(v)
    },

    Statement_assign(variable, _eq, expression, _semicolon) {
      const e = expression.rep()
      const v = variable.rep()
      mustBeAssignable(e, { toType: v.type })
      mustNotBeReadOnly(v)
      return new core.Assignment(v, e)
    },

    Statement_call(call, _semicolon) {
      return call.rep()
    },

    Statement_break(_break, _semicolon) {
      mustBeInLoop(context)
      return new core.BreakStatement()
    },

    Statement_return(returnKeyword, expression, _semicolon) {
      mustBeInAFunction(context, returnKeyword)
      mustReturnSomething(context.function)
      const e = expression.rep()
      mustBeReturnable({ expression: e, from: context.function })
      return new core.ReturnStatement(e)
    },

    Statement_shortreturn(_return, _semicolon) {
      mustBeInAFunction(context)
      mustNotReturnAnything(context.function)
      return new core.ShortReturnStatement()
    },

    IfStmt_long(_if, test, consequent, _else, alternate) {
      const testRep = test.rep()
      mustHaveBooleanType(testRep)
      context = context.newChildContext()
      const consequentRep = consequent.rep()
      context = context.parent
      context = context.newChildContext()
      const alternateRep = alternate.rep()
      context = context.parent
      return new core.IfStatement(testRep, consequentRep, alternateRep)
    },

    IfStmt_elsif(_if, test, consequent, _else, alternate) {
      const testRep = test.rep()
      mustHaveBooleanType(testRep)
      context = context.newChildContext()
      const consequentRep = consequent.rep()
      // Do NOT make a new context for the alternate!
      const alternateRep = alternate.rep()
      return new core.IfStatement(testRep, consequentRep, alternateRep)
    },

    IfStmt_short(_if, test, consequent) {
      const testRep = test.rep()
      mustHaveBooleanType(testRep, test)
      context = context.newChildContext()
      const consequentRep = consequent.rep()
      context = context.parent
      return new core.ShortIfStatement(testRep, consequentRep)
    },

    LoopStmt_while(_while, test, body) {
      const t = test.rep()
      mustHaveBooleanType(t)
      context = context.newChildContext({ inLoop: true })
      const b = body.rep()
      context = context.parent
      return new core.WhileStatement(t, b)
    },

    LoopStmt_repeat(_repeat, count, body) {
      const c = count.rep()
      mustHaveIntegerType(c)
      context = context.newChildContext({ inLoop: true })
      const b = body.rep()
      context = context.parent
      return new core.RepeatStatement(c, b)
    },

    LoopStmt_range(_for, id, _in, low, op, high, body) {
      const [x, y] = [low.rep(), high.rep()]
      mustHaveIntegerType(x)
      mustHaveIntegerType(y)
      const iterator = new core.Variable(id.sourceString, INT, true)
      context = context.newChildContext({ inLoop: true })
      context.add(id.sourceString, iterator)
      const b = body.rep()
      context = context.parent
      return new core.ForRangeStatement(iterator, x, op.rep(), y, b)
    },

    LoopStmt_collection(_for, id, _in, collection, body) {
      const c = collection.rep()
      mustHaveAnArrayType(c)
      const i = new core.Variable(id.sourceString, true, c.type.baseType)
      context = context.newChildContext({ inLoop: true })
      context.add(i.name, i)
      const b = body.rep()
      context = context.parent
      return new core.ForStatement(i, c, b)
    },

    Block(_open, body, _close) {
      // No need for a block node, just return the list of statements
      return body.rep()
    },

    Exp_conditional(test, _questionMark, consequent, _colon, alternate) {
      const x = test.rep()
      mustHaveBooleanType(x)
      const [y, z] = [consequent.rep(), alternate.rep()]
      mustBeTheSameType(y, z)
      return new core.Conditional(x, y, z)
    },

    Exp1_unwrapelse(unwrap, op, alternate) {
      const [x, o, y] = [unwrap.rep(), op.sourceString, alternate.rep()]
      mustHaveAnOptionalType(x)
      mustBeAssignable(y, { toType: x.type.baseType })
      return new core.BinaryExpression(o, x, y, x.type)
    },

    Exp2_or(left, ops, right) {
      let [x, o, ys] = [left.rep(), ops.rep()[0], right.rep()]
      mustHaveBooleanType(x)
      for (let y of ys) {
        mustHaveBooleanType(y)
        x = new core.BinaryExpression(o, x, y, BOOLEAN)
      }
      return x
    },

    Exp2_and(left, ops, right) {
      let [x, o, ys] = [left.rep(), ops.rep()[0], right.rep()]
      mustHaveBooleanType(x)
      for (let y of ys) {
        mustHaveBooleanType(y)
        x = new core.BinaryExpression(o, x, y, BOOLEAN)
      }
      return x
    },

    Exp3_bitor(left, ops, right) {
      let [x, o, ys] = [left.rep(), ops.rep()[0], right.rep()]
      mustHaveIntegerType(x)
      for (let y of ys) {
        mustHaveIntegerType(y)
        x = new core.BinaryExpression(o, x, y, INT)
      }
      return x
    },

    Exp3_bitxor(left, ops, right) {
      let [x, o, ys] = [left.rep(), ops.rep()[0], right.rep()]
      mustHaveIntegerType(x)
      for (let y of ys) {
        mustHaveIntegerType(y)
        x = new core.BinaryExpression(o, x, y, INT)
      }
      return x
    },

    Exp3_bitand(left, ops, right) {
      let [x, o, ys] = [left.rep(), ops.rep()[0], right.rep()]
      mustHaveIntegerType(x)
      for (let y of ys) {
        mustHaveIntegerType(y)
        x = new core.BinaryExpression(o, x, y, INT)
      }
      return x
    },

    Exp4_compare(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()]
      if (["<", "<=", ">", ">="].includes(op.sourceString)) mustHaveNumericOrStringType(x)
      mustBeTheSameType(x, y)
      return new core.BinaryExpression(o, x, y, BOOLEAN)
    },

    Exp5_shift(left, op, right) {
      const [x, o, y] = [left.rep(), op.rep(), right.rep()]
      mustHaveIntegerType(x)
      mustHaveIntegerType(y)
      return new core.BinaryExpression(o, x, y, INT)
    },

    Exp6_add(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()]
      if (o === "+") {
        mustHaveNumericOrStringType(x)
      } else {
        mustHaveNumericType(x)
      }
      mustBeTheSameType(x, y)
      return new core.BinaryExpression(o, x, y, x.type)
    },

    Exp7_multiply(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()]
      mustHaveNumericType(x)
      mustBeTheSameType(x, y)
      return new core.BinaryExpression(o, x, y, x.type)
    },

    Exp8_power(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()]
      mustHaveNumericType(x)
      mustBeTheSameType(x, y)
      return new core.BinaryExpression(o, x, y, x.type)
    },

    Exp8_unary(op, operand) {
      const [o, x] = [op.sourceString, operand.rep()]
      let type
      if (o === "#") mustHaveAnArrayType(x), (type = INT)
      else if (o === "-") mustHaveNumericType(x), (type = x.type)
      else if (o === "!") mustHaveBooleanType(x), (type = BOOLEAN)
      else if (o === "some") type = new core.OptionalType(x.type)
      return new core.UnaryExpression(o, x, type)
    },

    Exp9_emptyarray(_keyword, _left, _of, type, _right) {
      return new core.EmptyArray(type.rep())
    },

    Exp9_arrayexp(_left, args, _right) {
      const elements = args.asIteration().rep()
      mustAllHaveSameType(elements)
      return new core.ArrayExpression(elements)
    },

    Exp9_emptyopt(_no, type) {
      return new core.EmptyOptional(type.rep())
    },

    Exp9_parens(_open, expression, _close) {
      return expression.rep()
    },

    Exp9_subscript(array, _left, subscript, _right) {
      const [a, i] = [array.rep(), subscript.rep()]
      mustHaveAnArrayType(a)
      mustHaveIntegerType(i)
      return new core.SubscriptExpression(a, i)
    },

    Exp9_member(object, dot, field) {
      const x = object.rep()
      const isOptional = dot.sourceString === "?."
      let structType
      if (isOptional) {
        mustHaveOptionalStructType(x)
        structType = x.type.baseType
      } else {
        mustHaveAStructType(x)
        structType = x.type
      }
      memberMustBeDeclared(field.sourceString, { in: structType })
      const f = structType.fields.find(f => f.name === field.sourceString)
      return new core.MemberExpression(x, f, isOptional)
    },

    Exp9_call(callee, _left, args, _right) {
      const [c, a] = [callee.rep(), args.asIteration().rep()]
      mustBeCallable(c)
      let callType
      if (c instanceof core.StructType) {
        constructorArgumentsMustMatch(a, c)
        callType = c
      } else {
        callArgumentsMustMatch(a, c.type)
        callType = c.type.returnType
      }
      return new core.Call(c, a, callType)
    },

    Exp9_id(_id) {
      // When an id appears in an expr, it had better have been declared
      return context.lookup(this.sourceString)
    },

    id(_first, _rest) {
      return this.sourceString
    },

    true(_) {
      return true
    },

    false(_) {
      return false
    },

    intlit(_digits) {
      // Carlos ints will be represented as plain JS bigints
      return BigInt(this.sourceString)
    },

    floatlit(_whole, _point, _fraction, _e, _sign, _exponent) {
      // Carlos floats will be represented as plain JS numbers
      return Number(this.sourceString)
    },

    stringlit(_openQuote, _chars, _closeQuote) {
      // Carlos strings will be represented as plain JS strings
      return this.sourceString
    },

    _terminal() {
      return this.sourceString
    },

    _iter(...children) {
      // Ohm shortcut to allow applying rep() directly to iter nodes
      return children.map(child => child.rep())
    },
  })

  // Analysis starts here
  for (const [name, type] of Object.entries(stdlib.contents)) {
    context.add(name, type)
  }
  const match = grammar.match(sourceCode)
  if (!match.succeeded()) core.error(match.message)
  return analyzer(match).rep()
}
