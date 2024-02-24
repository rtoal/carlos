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

export const boolType = { kind: "BoolType", description: "boolean" }
export const intType = { kind: "IntType", description: "int" }
export const floatType = { kind: "FloatType", description: "float" }
export const stringType = { kind: "StringType", description: "string" }
export const voidType = { kind: "VoidType", description: "void" }
export const anyType = { kind: "AnyType", description: "any" }

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
  return { kind: "ArrayType", baseType, description: `[${baseType.description}]` }
}

export function functionType(paramTypes, returnType) {
  // Example: (boolean,[string]?)->float
  return {
    kind: "FunctionType",
    paramTypes,
    returnType,
    description: `(${paramTypes.map(t => t.description).join(",")})->${
      returnType.description
    }`,
  }
}

export function optionalType(baseType) {
  return { kind: "OptionalType", baseType, description: `${baseType.description}?` }
}

export function Increment(variable) {
  return { kind: "Increment", variable }
}

export function Decrement(variable) {
  return { kind: "Decrement", variable }
}

export function assignment(target, source) {
  return { kind: "Assignment", target, source }
}

export function breakStatement() {
  return { kind: "BreakStatement" }
}

export function returnStatement(expression) {
  return { kind: "ReturnStatement", expression }
}

export function shortReturnStatement() {
  return { kind: "ShortReturnStatement" }
}

export function printStatement(expression) {
  return { kind: "PrintStatement", expression }
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
  return { kind: "FunctionCall", callee, args }
}

export function conditional(test, consequent, alternate) {
  return { kind: "Conditional", test, consequent, alternate }
}

export function binary(op, left, right) {
  return { kind: "BinaryExpression", op, left, right }
}

export function unary(op, operand) {
  return { kind: "UnaryExpression", op, operand }
}

export function emptyOptional(baseType) {
  return { kind: "EmptyOptional", baseType, type: optionalType(baseType) }
}

export function subscript(array, index) {
  return { kind: "SubscriptExpression", array, index }
}

export function array(elements) {
  return { kind: "ArrayExpression", elements }
}

export function emptyArray(type) {
  return { kind: "EmptyArray", type }
}

export function memberExpression(object, op, field) {
  return { kind: "MemberExpression", object, op, field }
}

export function constructorCall(callee, args) {
  return { kind: "ConstructorCall", callee, args }
}

export function call(callee, args, type) {
  return { kind: "Call", callee, args, type }
}

const floatToFloatType = functionType([floatType], floatType)
const floatFloatToFloatType = functionType([floatType, floatType], floatType)
const stringToIntsType = functionType([stringType], arrayType(intType))
const anysToVoidType = functionType([anyType], voidType)

export const standardLibrary = Object.freeze({
  int: intType,
  float: floatType,
  boolean: boolType,
  string: stringType,
  void: voidType,
  any: anyType,
  π: variable("π", true, floatType),
  print: fun("print", anysToVoidType),
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
