import fs from "fs"
import ohm from "ohm-js"
import * as core from "./core.js"

const carlosGrammar = ohm.grammar(fs.readFileSync("src/carlos.ohm"))

const astBuilder = carlosGrammar.createSemantics().addOperation("ast", {
  Program(body) {
    return new core.Program(body.ast())
  },
  VarDecl(modifier, id, _eq, initializer, _semicolon) {
    return new core.VariableDeclaration(modifier.ast(), id.ast(), initializer.ast())
  },
  TypeDecl(_struct, id, _left, fields, _right) {
    return new core.TypeDeclaration(new core.StructType(id.ast(), fields.ast()))
  },
  Field(id, _colon, type) {
    return new core.Field(id.ast(), type.ast())
  },
  FunDecl(_fun, id, _open, params, _close, _colons, returnType, body) {
    return new core.FunctionDeclaration(
      id.ast(),
      params.asIteration().ast(),
      returnType.ast()[0] ?? null,
      body.ast()
    )
  },
  Param(id, _colon, type) {
    return new core.Parameter(id.ast(), type.ast())
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
  Statement_bump(variable, operator, _semicolon) {
    return operator.ast().lexeme === "++"
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
      id.ast(),
      low.ast(),
      op.ast(),
      high.ast(),
      body.ast()
    )
  },
  LoopStmt_collection(_for, id, _in, collection, body) {
    return new core.ForStatement(id.ast(), collection.ast(), body.ast())
  },
  Block(_open, body, _close) {
    // No need for a block node, just return the list of statements
    return body.ast()
  },
  Exp_conditional(test, _questionMark, consequent, _colon, alternate) {
    return new core.Conditional(test.ast(), consequent.ast(), alternate.ast())
  },
  Exp1_unwrapelse(unwrap, op, alternate) {
    return new core.BinaryExpression(op.ast(), unwrap.ast(), alternate.ast())
  },
  Exp2_or(left, ops, right) {
    return new binaryOperationChain(left, ops, right)
  },
  Exp2_and(left, ops, right) {
    return new binaryOperationChain(left, ops, right)
  },
  Exp3_bitor(left, ops, right) {
    return new binaryOperationChain(left, ops, right)
  },
  Exp3_bitxor(left, ops, right) {
    return new binaryOperationChain(left, ops, right)
  },
  Exp3_bitand(left, ops, right) {
    return new binaryOperationChain(left, ops, right)
  },
  Exp4_compare(left, op, right) {
    return new core.BinaryExpression(op.ast(), left.ast(), right.ast())
  },
  Exp5_shift(left, op, right) {
    return new core.BinaryExpression(op.ast(), left.ast(), right.ast())
  },
  Exp6_add(left, op, right) {
    return new core.BinaryExpression(op.ast(), left.ast(), right.ast())
  },
  Exp7_multiply(left, op, right) {
    return new core.BinaryExpression(op.ast(), left.ast(), right.ast())
  },
  Exp8_power(left, op, right) {
    return new core.BinaryExpression(op.ast(), left.ast(), right.ast())
  },
  Exp8_unary(op, operand) {
    return new core.UnaryExpression(op.ast(), operand.ast())
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
    return new core.MemberExpression(object.ast(), field.ast())
  },
  Exp9_call(callee, _left, args, _right) {
    return new core.Call(callee.ast(), args.asIteration().ast())
  },
  id(_first, _rest) {
    return new core.Token("Id", this.source)
  },
  true(_) {
    return new core.Token("Bool", this.source)
  },
  false(_) {
    return new core.Token("Bool", this.source)
  },
  intlit(_digits) {
    return new core.Token("Int", this.source)
  },
  floatlit(_whole, _point, _fraction, _e, _sign, _exponent) {
    return new core.Token("Float", this.source)
  },
  stringlit(_openQuote, _chars, _closeQuote) {
    return new core.Token("Str", this.source)
  },
  _terminal() {
    return new core.Token("Sym", this.source)
  },
  _iter(...children) {
    return children.map(child => child.ast())
  },
})

function binaryOperationChain(left, operators, right) {
  let [root, ops, more] = [left.ast(), operators.ast(), right.ast()]
  for (let i = 0; i < ops.length; i++) {
    root = new core.BinaryExpression(ops[i], root, more[i])
  }
  return root
}

export default function ast(sourceCode) {
  const match = carlosGrammar.match(sourceCode)
  if (!match.succeeded()) {
    throw new Error(match.message)
  }
  return astBuilder(match).ast()
}
