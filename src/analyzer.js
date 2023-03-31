// ANALYZER
//
// The analyze() function takes the grammar match object (the CST) from Ohm
// and produces a decorated Abstract Syntax "Tree" (technically a graph) that
// includes all entities including those from the standard library.

import * as core from "./core.js"
import * as stdlib from "./stdlib.js"

// A few declarations to save typing
const INT = core.Type.INT
const FLOAT = core.Type.FLOAT
const STRING = core.Type.STRING
const BOOLEAN = core.Type.BOOLEAN
const ANY = core.Type.ANY
const VOID = core.Type.VOID

// A single point for error checking. Pass in a condition that must be true.
// Use errorLocation to give contextual information about the error that will
// appear: this should be either a node from the concrete syntax tree or an
// object in which the node is the value of the "at" property. If this location
// is a well-formed CST node, Ohm's getLineAndColumnMessage will be used to
// generate a helpful error message.
function must(condition, message, errorLocation) {
  if (!condition) {
    const token = errorLocation?.at ?? errorLocation
    const prefix = token?.source?.getLineAndColumnMessage?.()
    throw new Error(`${prefix}${message}`)
  }
}

function mustNotAlreadyBeDeclared(context, name) {
  must(!context.lookup(name), `Identifier ${name} already declared`)
}

function mustHaveBeenFound(entity, name, at) {
  must(entity, `Identifier ${name} not declared`, at)
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
  must(equivalent(e1.type, e2.type), "Operands do not have the same type", at)
}

function mustAllHaveSameType(expressions, at) {
  // Used to check array elements, for example
  must(
    expressions.slice(1).every(e => equivalent(e.type, expressions[0].type)),
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

function equivalent(t1, t2) {
  return (
    t1 === t2 ||
    (t1 instanceof core.OptionalType &&
      t2 instanceof core.OptionalType &&
      equivalent(t1.baseType, t2.baseType)) ||
    (t1 instanceof core.ArrayType &&
      t2 instanceof core.ArrayType &&
      equivalent(t1.baseType, t2.baseType)) ||
    (t1.constructor === core.FunctionType &&
      t2.constructor === core.FunctionType &&
      equivalent(t1.returnType, t2.returnType) &&
      t1.paramTypes.length === t2.paramTypes.length &&
      t1.paramTypes.every((t, i) => equivalent(t, t2.paramTypes[i])))
  )
}

function assignable(fromType, toType) {
  return (
    toType == ANY ||
    equivalent(fromType, toType) ||
    (fromType.constructor === core.FunctionType &&
      toType.constructor === core.FunctionType &&
      // covariant in return types
      assignable(fromType.returnType, toType.returnType) &&
      fromType.paramTypes.length === toType.paramTypes.length &&
      // contravariant in parameter types
      toType.paramTypes.every((t, i) => assignable(t, fromType.paramTypes[i])))
  )
}

function mustBeAssignable(e, { toType: type }, at) {
  must(
    assignable(e.type, type),
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
  add(name, entity) {
    mustNotAlreadyBeDeclared(this, name)
    this.locals.set(name, entity)
  }
  lookup(name) {
    return this.locals.get(name) || this.parent?.lookup(name)
  }
  newChildContext(props) {
    return new Context({ ...this, ...props, parent: this, locals: new Map() })
  }
}

export default function analyze(match) {
  let context = new Context({})

  const analyzer = match.matcher.grammar.createSemantics().addOperation("rep", {
    Program(statements) {
      return new core.Program(statements.rep())
    },

    VarDecl(modifier, id, _eq, exp, _semicolon) {
      const initializer = exp.rep()
      const readOnly = modifier.sourceString === "const"
      const variable = new core.Variable(id.sourceString, readOnly, initializer.type)
      context.add(id.sourceString, variable)
      return new core.VariableDeclaration(variable, initializer)
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

    FunDecl(_fun, id, _open, paramList, _close, _colons, type, block) {
      const returnType = type.rep()[0] ?? VOID
      const params = paramList.asIteration().rep()
      const paramTypes = params.map(param => param.type)
      const funType = new core.FunctionType(paramTypes, returnType)
      const fun = new core.Function(id.sourceString, funType)
      context.add(id.sourceString, fun)
      context = context.newChildContext({ inLoop: false, function: fun })
      for (const param of params) context.add(param.name, param)
      const body = block.rep()
      context = context.parent
      return new core.FunctionDeclaration(id.sourceString, fun, params, body)
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
      mustHaveBeenFound(entity, id.sourceString, { at: id })
      entityMustBeAType(entity, { at: id })
      return entity
    },

    Statement_bump(exp, operator, _semicolon) {
      const variable = exp.rep()
      mustHaveIntegerType(variable, { at: exp })
      return operator.sourceString === "++"
        ? new core.Increment(variable)
        : new core.Decrement(variable)
    },

    Statement_assign(variable, _eq, expression, _semicolon) {
      const source = expression.rep()
      const target = variable.rep()
      mustBeAssignable(source, { toType: target.type })
      mustNotBeReadOnly(target, { at: variable })
      return new core.Assignment(target, source)
    },

    Statement_call(call, _semicolon) {
      return call.rep()
    },

    Statement_break(breakKeyword, _semicolon) {
      mustBeInLoop(context, { at: breakKeyword })
      return new core.BreakStatement()
    },

    Statement_return(returnKeyword, exp, _semicolon) {
      mustBeInAFunction(context, { at: returnKeyword })
      mustReturnSomething(context.function)
      const returnExpression = exp.rep()
      mustBeReturnable({ expression: returnExpression, from: context.function })
      return new core.ReturnStatement(returnExpression)
    },

    Statement_shortreturn(returnKeyword, _semicolon) {
      mustBeInAFunction(context, { at: returnKeyword })
      mustNotReturnAnything(context.function)
      return new core.ShortReturnStatement()
    },

    IfStmt_long(_if, exp, thenBlock, _else, elseBlock) {
      const test = exp.rep()
      mustHaveBooleanType(test, { at: exp })
      context = context.newChildContext()
      const consequent = thenBlock.rep()
      context = context.parent
      context = context.newChildContext()
      const alternate = elseBlock.rep()
      context = context.parent
      return new core.IfStatement(test, consequent, alternate)
    },

    IfStmt_elsif(_if, exp, block, _else, trailingIfStatement) {
      const test = exp.rep()
      mustHaveBooleanType(test, { at: exp })
      context = context.newChildContext()
      const consequent = block.rep()
      // Do NOT make a new context for the alternate!
      const alternate = trailingIfStatement.rep()
      return new core.IfStatement(test, consequent, alternate)
    },

    IfStmt_short(_if, exp, block) {
      const test = exp.rep()
      mustHaveBooleanType(test, { at: exp })
      context = context.newChildContext()
      const consequent = block.rep()
      context = context.parent
      return new core.ShortIfStatement(test, consequent)
    },

    LoopStmt_while(_while, exp, block) {
      const test = exp.rep()
      mustHaveBooleanType(test, { at: exp })
      context = context.newChildContext({ inLoop: true })
      const body = block.rep()
      context = context.parent
      return new core.WhileStatement(test, body)
    },

    LoopStmt_repeat(_repeat, exp, block) {
      const count = exp.rep()
      mustHaveIntegerType(count, { at: exp })
      context = context.newChildContext({ inLoop: true })
      const body = block.rep()
      context = context.parent
      return new core.RepeatStatement(count, body)
    },

    LoopStmt_range(_for, id, _in, exp1, op, exp2, block) {
      const [low, high] = [exp1.rep(), exp2.rep()]
      mustHaveIntegerType(low, { at: exp1 })
      mustHaveIntegerType(high, { at: exp2 })
      const iterator = new core.Variable(id.sourceString, INT, true)
      context = context.newChildContext({ inLoop: true })
      context.add(id.sourceString, iterator)
      const body = block.rep()
      context = context.parent
      return new core.ForRangeStatement(iterator, low, op.sourceString, high, body)
    },

    LoopStmt_collection(_for, id, _in, exp, block) {
      const collection = exp.rep()
      mustHaveAnArrayType(collection, { at: exp })
      const iterator = new core.Variable(id.sourceString, true, collection.type.baseType)
      context = context.newChildContext({ inLoop: true })
      context.add(iterator.name, iterator)
      const body = block.rep()
      context = context.parent
      return new core.ForStatement(iterator, collection, body)
    },

    Block(_open, body, _close) {
      // No need for a block node, just return the list of statements
      return body.rep()
    },

    Exp_conditional(exp, _questionMark, thenExp, colon, elseExp) {
      const test = exp.rep()
      mustHaveBooleanType(test, { at: exp })
      const [consequent, alternate] = [thenExp.rep(), elseExp.rep()]
      mustBeTheSameType(consequent, alternate, { at: colon })
      return new core.Conditional(test, consequent, alternate)
    },

    Exp1_unwrapelse(exp, op, elseExp) {
      const [optional, o, alternate] = [exp.rep(), op.sourceString, elseExp.rep()]
      mustHaveAnOptionalType(optional, { at: exp })
      mustBeAssignable(alternate, { toType: optional.type.baseType })
      return new core.BinaryExpression(o, optional, alternate, optional.type)
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

    Exp5_shift(exp1, shiftOp, exp2) {
      const [left, op, right] = [exp1.rep(), shiftOp.rep(), exp2.rep()]
      mustHaveIntegerType(left, { at: exp1 })
      mustHaveIntegerType(right, { at: exp2 })
      return new core.BinaryExpression(op, left, right, INT)
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

    Exp7_multiply(exp1, multiplicativeOp, exp2) {
      const [left, op, right] = [exp1.rep(), multiplicativeOp.rep(), exp2.rep()]
      mustHaveNumericType(left, { at: exp1 })
      mustBeTheSameType(left, right, { at: multiplicativeOp })
      return new core.BinaryExpression(op, left, right, left.type)
    },

    Exp8_power(exp1, powerOp, exp2) {
      const [left, op, right] = [exp1.rep(), powerOp.rep(), exp2.rep()]
      mustHaveNumericType(left, { at: exp1 })
      mustBeTheSameType(left, right, { at: powerOp })
      return new core.BinaryExpression(op, left, right, left.type)
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

    Exp9_emptyarray(_brackets, _left, _of, type, _right) {
      return new core.EmptyArray(type.rep())
    },

    Exp9_arrayexp(_open, args, _close) {
      const elements = args.asIteration().rep()
      mustAllHaveSameType(elements, { at: args })
      return new core.ArrayExpression(elements)
    },

    Exp9_emptyopt(_no, type) {
      return new core.EmptyOptional(type.rep())
    },

    Exp9_parens(_open, expression, _close) {
      return expression.rep()
    },

    Exp9_subscript(exp1, _open, exp2, _close) {
      const [array, subscript] = [exp1.rep(), exp2.rep()]
      mustHaveAnArrayType(array, { at: exp1 })
      mustHaveIntegerType(subscript, { at: exp2 })
      return new core.SubscriptExpression(array, subscript)
    },

    Exp9_member(exp, dot, id) {
      const object = exp.rep()
      const isOptional = dot.sourceString === "?."
      let structType
      if (isOptional) {
        mustHaveOptionalStructType(object, { at: exp })
        structType = object.type.baseType
      } else {
        mustHaveAStructType(object, { at: exp })
        structType = object.type
      }
      memberMustBeDeclared(id.sourceString, { in: structType })
      const field = structType.fields.find(f => f.name === id.sourceString)
      return new core.MemberExpression(object, field, isOptional)
    },

    Exp9_call(exp, _open, exps, _close) {
      const [callee, args] = [exp.rep(), exps.asIteration().rep()]
      mustBeCallable(callee, { at: exp })
      if (callee instanceof core.StructType) {
        constructorArgumentsMustMatch(args, callee)
        return new core.ConstructorCall(callee, args, callee)
      } else {
        callArgumentsMustMatch(args, callee.type)
        return new core.FunctionCall(callee, args, callee.type.returnType)
      }
    },

    Exp9_id(id) {
      // When an id appears in an expression, it had better have been declared
      const entity = context.lookup(id.sourceString)
      mustHaveBeenFound(entity, id.sourceString, { at: id })
      return entity
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
  return analyzer(match).rep()
}
