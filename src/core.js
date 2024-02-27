export function program(statements) {
  return { kind: "Program", statements }
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer }
}

export function variable(name, readOnly, type) {
  return { kind: "Variable", name, readOnly, type }
}

export function typeDeclaration(type) {
  return { kind: "TypeDeclaration", type }
}

export const boolType = { kind: "BoolType" }
export const intType = { kind: "IntType" }
export const floatType = { kind: "FloatType" }
export const stringType = { kind: "StringType" }
export const voidType = { kind: "VoidType" }
export const anyType = { kind: "AnyType" }

export function structType(name, fields) {
  return { kind: "StructType", name, fields }
}

export function field(name, type) {
  return { kind: "Field", name, type }
}

export function functionDeclaration(name, fun, params, body) {
  return { kind: "FunctionDeclaration", name, fun, params, body }
}

export function fun(name, type) {
  return { kind: "Function", name, type }
}

export function arrayType(baseType) {
  return { kind: "ArrayType", baseType }
}

export function functionType(paramTypes, returnType) {
  // Example: (boolean,[string]?)->float
  return {
    kind: "FunctionType",
    paramTypes,
    returnType,
  }
}

export function optionalType(baseType) {
  return { kind: "OptionalType", baseType }
}

export function increment(variable) {
  return { kind: "Increment", variable }
}

export function decrement(variable) {
  return { kind: "Decrement", variable }
}

export function assignment(target, source) {
  return { kind: "Assignment", target, source }
}

export const breakStatement = { kind: "BreakStatement" }

export function returnStatement(expression) {
  return { kind: "ReturnStatement", expression }
}

export function shortReturnStatement() {
  return { kind: "ShortReturnStatement" }
}

export function ifStatement(test, consequent, alternate) {
  return { kind: "IfStatement", test, consequent, alternate }
}

export function shortIfStatement(test, consequent) {
  return { kind: "ShortIfStatement", test, consequent }
}

export function whileStatement(test, body) {
  return { kind: "WhileStatement", test, body }
}

export function repeatStatement(count, body) {
  return { kind: "RepeatStatement", count, body }
}

export function forRangeStatement(iterator, low, op, high, body) {
  return { kind: "ForRangeStatement", iterator, low, op, high, body }
}

export function forStatement(iterator, collection, body) {
  return { kind: "ForStatement", iterator, collection, body }
}

export function functionCall(callee, args) {
  return { kind: "FunctionCall", callee, args, type: callee.type.returnType }
}

export function conditional(test, consequent, alternate, type) {
  return { kind: "Conditional", test, consequent, alternate, type }
}

export function binary(op, left, right, type) {
  return { kind: "BinaryExpression", op, left, right, type }
}

export function unary(op, operand, type) {
  return { kind: "UnaryExpression", op, operand, type }
}

export function emptyOptional(baseType) {
  return { kind: "EmptyOptional", baseType, type: optionalType(baseType) }
}

export function subscript(array, index) {
  return { kind: "SubscriptExpression", array, index, type: array.type.baseType }
}

export function arrayExpression(elements) {
  return { kind: "ArrayExpression", elements, type: arrayType(elements[0].type) }
}

export function emptyArray(type) {
  return { kind: "EmptyArray", type }
}

export function memberExpression(object, op, field) {
  return { kind: "MemberExpression", object, op, field, type: field.type }
}

export function constructorCall(callee, args) {
  return { kind: "ConstructorCall", callee, args, type: callee }
}

// These local constants are used to simplify the standard library definitions.
const floatToFloatType = functionType([floatType], floatType)
const floatFloatToFloatType = functionType([floatType, floatType], floatType)
const stringToIntsType = functionType([stringType], arrayType(intType))
const anyToVoidType = functionType([anyType], voidType)

export const standardLibrary = Object.freeze({
  int: intType,
  float: floatType,
  boolean: boolType,
  string: stringType,
  void: voidType,
  any: anyType,
  π: variable("π", true, floatType),
  print: fun("print", anyToVoidType),
  sin: fun("sin", floatToFloatType),
  cos: fun("cos", floatToFloatType),
  exp: fun("exp", floatToFloatType),
  ln: fun("ln", floatToFloatType),
  hypot: fun("hypot", floatFloatToFloatType),
  bytes: fun("bytes", stringToIntsType),
  codepoints: fun("codepoints", stringToIntsType),
})

// We want every expression to have a type property. But we aren't creating
// special entities for numbers, strings, and booleans; instead, we are
// just using JavaScript values for those. Fortunately we can monkey patch
// the JS classes for these to give us what we want.
String.prototype.type = stringType
Number.prototype.type = floatType
BigInt.prototype.type = intType
Boolean.prototype.type = boolType
