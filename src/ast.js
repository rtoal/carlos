import fs from "fs"
import ohm from "ohm-js"
import * as core from "./core.js"

const carlosGrammar = ohm.grammar(fs.readFileSync("src/carlos.ohm"))

const astBuilder = carlosGrammar.createSemantics().addOperation("ast", {
  Program(body) {
    return new core.Program(body.ast())
  },
  VarDecl(kind, id, _eq, initializer, _semicolon) {
    const variable = new core.Variable(id.sourceString, kind.sourceString == "const")
    return new core.VariableDeclaration(variable, initializer.ast())
  },
  TypeDecl(_struct, id, _left, fields, _right) {
    return new core.TypeDeclaration(new core.StructType(id.sourceString, fields.ast()))
  },
  Field(id, _colon, type) {
    return new core.Field(id.sourceString, type.ast())
  },
  FunDecl(_fun, id, _open, params, _close, _colons, returnType, body) {
    return new core.FunctionDeclaration(
      new core.Function(
        id.sourceString,
        params.asIteration().ast(),
        returnType.ast()[0] ?? null
      ),
      body.ast()
    )
  },
  Param(id, _colon, type) {
    return new core.Parameter(id.sourceString, type.ast())
  },
  Type_array(_left, baseType, _right) {
    return new core.ArrayType(baseType.ast())
  },
  Type_function(_left, inTypes, _right, _arrow, outType) {
    return new core.FunctionType(inTypes.asIteration().ast(), outType.ast())
  },
  Type_optional(baseType, _questionMark) {
    return new core.OptionalType(baseType.ast())
  },
  Type_id(id) {
    return Symbol.for(id.sourceString)
  },
  Statement_bump(variable, operator, _semicolon) {
    return operator.sourceString === "++"
      ? new core.Increment(variable.ast())
      : new core.Decrement(variable.ast())
  },
  Statement_assign(variable, _eq, expression, _semicolon) {
    return new core.Assignment(variable.ast(), expression.ast())
  },
  Statement_call(call, _semicolon) {
    return call.ast()
  },
  Statement_break(_break, _semicolon) {
    return new core.BreakStatement()
  },
  Statement_return(_return, expression, _semicolon) {
    return new core.ReturnStatement(expression.ast())
  },
  Statement_shortreturn(_return, _semicolon) {
    return new core.ShortReturnStatement()
  },
  IfStmt_long(_if, test, consequent, _else, alternate) {
    return new core.IfStatement(test.ast(), consequent.ast(), alternate.ast())
  },
  IfStmt_short(_if, test, consequent) {
    return new core.ShortIfStatement(test.ast(), consequent.ast())
  },
  LoopStmt_while(_while, test, body) {
    return new core.WhileStatement(test.ast(), body.ast())
  },
  LoopStmt_repeat(_repeat, count, body) {
    return new core.RepeatStatement(count.ast(), body.ast())
  },
  LoopStmt_range(_for, id, _in, low, op, high, body) {
    return new core.ForRangeStatement(
      id.sourceString,
      low.ast(),
      op.sourceString,
      high.ast(),
      body.ast()
    )
  },
  LoopStmt_collection(_for, id, _in, collection, body) {
    return new core.ForStatement(id.sourceString, collection.ast(), body.ast())
  },
  Block(_open, body, _close) {
    // No need for a block node, just return the list of statements
    return body.ast()
  },
  Exp_conditional(test, _questionMark, consequent, _colon, alternate) {
    return new core.Conditional(test.ast(), consequent.ast(), alternate.ast())
  },
  Exp1_unwrapelse(unwrap, op, alternate) {
    return new core.BinaryExpression(op.sourceString, unwrap.ast(), alternate.ast())
  },
  Exp2_or(left, _ops, right) {
    const operands = [left.ast(), ...right.ast()]
    return operands.reduce((x, y) => new core.BinaryExpression("||", x, y))
  },
  Exp2_and(left, _ops, right) {
    const operands = [left.ast(), ...right.ast()]
    return operands.reduce((x, y) => new core.BinaryExpression("&&", x, y))
  },
  Exp3_bitor(left, _ops, right) {
    const operands = [left.ast(), ...right.ast()]
    return operands.reduce((x, y) => new core.BinaryExpression("|", x, y))
  },
  Exp3_bitxor(left, _ops, right) {
    const operands = [left.ast(), ...right.ast()]
    return operands.reduce((x, y) => new core.BinaryExpression("^", x, y))
  },
  Exp3_bitand(left, _ops, right) {
    const operands = [left.ast(), ...right.ast()]
    return operands.reduce((x, y) => new core.BinaryExpression("&", x, y))
  },
  Exp4_compare(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp5_shift(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp6_add(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp7_multiply(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp8_power(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp8_unary(op, operand) {
    return new core.UnaryExpression(op.sourceString, operand.ast())
  },
  Exp9_emptyarray(_keyword, _left, _of, type, _right) {
    return new core.EmptyArray(type.ast())
  },
  Exp9_arrayexp(_left, args, _right) {
    return new core.ArrayExpression(args.asIteration().ast())
  },
  Exp9_emptyopt(_no, type) {
    return new core.EmptyOptional(type.ast())
  },
  Exp9_parens(_open, expression, _close) {
    return expression.ast()
  },
  Exp9_subscript(array, _left, subscript, _right) {
    return new core.SubscriptExpression(array.ast(), subscript.ast())
  },
  Exp9_member(object, _dot, field) {
    return new core.MemberExpression(object.ast(), field.sourceString)
  },
  Exp9_id(id) {
    return Symbol.for(id.sourceString)
  },
  Exp9_call(callee, _left, args, _right) {
    return new core.Call(callee.ast(), args.asIteration().ast())
  },
  true(_) {
    return true
  },
  false(_) {
    return false
  },
  intlit(_digits) {
    return BigInt(this.sourceString)
  },
  floatlit(_whole, _point, _fraction, _e, _sign, _exponent) {
    return Number(this.sourceString)
  },
  stringlit(_openQuote, chars, _closeQuote) {
    return chars.sourceString
  },
  _iter(...children) {
    return children.map(child => child.ast())
  },
})

export default function ast(sourceCode) {
  const match = carlosGrammar.match(sourceCode)
  if (!match.succeeded()) {
    throw new Error(match.message)
  }
  return astBuilder(match).ast()
}
