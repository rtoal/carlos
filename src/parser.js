import fs from "fs"
import ohm from "ohm-js"
import * as ast from "./ast.js"

const carlosGrammar = ohm.grammar(fs.readFileSync("src/carlos.ohm"))

const astBuilder = carlosGrammar.createSemantics().addOperation("ast", {
  Program(body) {
    return new ast.Program(body.ast())
  },
  VarDecl(kind, id, _eq, initializer) {
    const [name, readOnly] = [id.sourceString, kind.sourceString == "const"]
    return new ast.VariableDeclaration(name, readOnly, initializer.ast())
  },
  StructDecl(_struct, id, _left, fields, _right) {
    return new ast.StructDeclaration(id.sourceString, fields.ast())
  },
  Field(id, _colon, type) {
    return new ast.Field(id.sourceString, type.ast())
  },
  FunDecl(_fun, id, parameters, _colons, returnType, body) {
    const returnTypeTree = returnType.ast()
    return new ast.FunctionDeclaration(
      id.sourceString,
      parameters.ast(),
      returnTypeTree.length === 0 ? null : returnTypeTree[0],
      body.ast()
    )
  },
  Params(_left, bindings, _right) {
    return bindings.asIteration().ast()
  },
  Param(id, _colon, type) {
    return new ast.Parameter(id.sourceString, type.ast())
  },
  TypeExp_array(_left, baseType, _right) {
    return new ast.ArrayType(baseType.ast())
  },
  TypeExp_function(_left, inputTypes, _right, _arrow, outputType) {
    return new ast.FunctionType(inputTypes.ast(), outputType.ast())
  },
  TypeExp_optional(baseType, _questionMark) {
    return new ast.OptionalType(baseType.ast())
  },
  TypeExp_named(id) {
    return new ast.TypeName(id.sourceString)
  },
  TypeExps(memberTypeList) {
    return memberTypeList.asIteration().ast()
  },
  Assignment_prefix(operator, variable) {
    return operator.sourceString === "++"
      ? new ast.Increment(variable.ast())
      : new ast.Decrement(variable.ast())
  },
  Assignment_postfix(variable, operator) {
    return operator.sourceString === "++"
      ? new ast.Increment(variable.ast())
      : new ast.Decrement(variable.ast())
  },
  Assignment_assign(variable, _eq, expression) {
    return new ast.Assignment(variable.ast(), expression.ast())
  },
  break(_) {
    return new ast.BreakStatement()
  },
  Statement_return(_return, expression) {
    const returnValueTree = expression.ast()
    if (returnValueTree.length === 0) {
      return new ast.ShortReturnStatement()
    }
    return new ast.ReturnStatement(returnValueTree[0])
  },
  IfStmt_long(_if, test, consequent, _else, alternative) {
    return new ast.IfStatement(test.ast(), consequent.ast(), alternative.ast())
  },
  IfStmt_short(_if, test, consequent) {
    return new ast.ShortIfStatement(test.ast(), consequent.ast())
  },
  ForStmt_forever(_for, body) {
    return new ast.ForeverStatement(body.ast())
  },
  ForStmt_while(_for, test, body) {
    return new ast.WhileStatement(test.ast(), body.ast())
  },
  ForStmt_times(_for, count, _times, body) {
    return new ast.ForTimesStatement(count.ast(), body.ast())
  },
  ForStmt_iteration(_for, id, _in, range, body) {
    return new ast.ForStatement(id.sourceString, range.ast(), body.ast())
  },
  Block(_open, body, _close) {
    // This one is fun, don't wrap the statements, just return the list
    return body.ast()
  },
  Exp_conditional(test, _questionMark, consequent, _colon, alternate) {
    return new ast.Conditional(test.ast(), consequent.ast(), alternate.ast())
  },
  Exp1_unwrapelse(unwrap, _op, alternate) {
    return new ast.UnwrapElse(unwrap.ast(), alternate.ast())
  },
  Exp2_or(first, _ors, rest) {
    return new ast.OrExpression([first.ast(), ...rest.ast()])
  },
  Exp2_and(first, _ors, rest) {
    return new ast.AndExpression([first.ast(), ...rest.ast()])
  },
  Exp3_bitor(left, op, right) {
    return new ast.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp3_bitxor(left, op, right) {
    return new ast.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp3_bitand(left, op, right) {
    return new ast.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp4_compare(left, op, right) {
    return new ast.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp5_shift(left, op, right) {
    return new ast.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp6_add(left, op, right) {
    return new ast.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp7_multiply(left, op, right) {
    return new ast.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp8_power(left, op, right) {
    return new ast.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp8_length(op, operand) {
    return new ast.UnaryExpression(op.sourceString, operand.ast())
  },
  Exp8_negate(op, operand) {
    return new ast.UnaryExpression(op.sourceString, operand.ast())
  },
  Exp9_emptyarray(_keyword, _left, type, _right) {
    return new ast.EmptyArray(type.ast())
  },
  Exp9_arrayexp(_left, args, _right) {
    return new ast.ArrayLiteral(args.asIteration().ast())
  },
  Exp9_wrappedopt(_some, expression) {
    return new ast.SomeExpression(expression.ast())
  },
  Exp9_emptyopt(_no, type) {
    return new ast.EmptyOptional(type.ast())
  },
  Exp9_parens(_open, expression, _close) {
    return expression.ast()
  },
  Var_subscript(array, _left, subscript, _right) {
    return new ast.SubscriptExpression(array.ast(), subscript.ast())
  },
  Var_member(object, _dot, field) {
    return new ast.MemberExpression(object.ast(), field.sourceString)
  },
  Var_unwrapmember(object, _dot, field) {
    return new ast.MemberExpression(object.ast(), field.sourceString)
  },
  Var_id(id) {
    return new ast.IdentifierExpression(id.sourceString)
  },
  Call(callee, _left, args, _right) {
    return new ast.Call(callee.ast(), args.asIteration().ast())
  },
  Range_numeric(low, kind, high) {
    return new ast.NumericRange(low.ast(), kind.sourceString, high.ast())
  },
  Range_collection(expression) {
    return expression.ast()
  },
  true(_) {
    return true
  },
  false(_) {
    return false
  },
  intlit(_digits) {
    return Number(this.sourceString)
  },
  floatlit(_whole, _point, _fraction, _e, _sign, _exponent) {
    return Number(this.sourceString)
  },
  stringlit(_open, chars, _close) {
    return chars.sourceString
  },
})

export default function parse(sourceCode) {
  const match = carlosGrammar.match(sourceCode)
  if (!match.succeeded()) {
    throw new Error(match.message)
  }
  return astBuilder(match).ast()
}
