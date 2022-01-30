import { Type, FunctionType, Variable, Function, ArrayType } from "./core.js"

// Create objects for the five basic types, as well as an object
// for the ANY "pseudotype."" In the syntax, the basic types are
// represented as JavaScript symbols, but during semantic analysis
// these new objects are used instead.
Type.BOOLEAN = Object.assign(new Type(), { description: "boolean" })
Type.INT = Object.assign(new Type(), { description: "int" })
Type.FLOAT = Object.assign(new Type(), { description: "float" })
Type.STRING = Object.assign(new Type(), { description: "string" })
Type.VOID = Object.assign(new Type(), { description: "void" })
Type.ANY = Object.assign(new Type(), { description: "any" })

function makeConstant(name, type, value) {
  return Object.assign(new Variable(name, true), { type, value })
}

function makeFunction(name, type) {
  return Object.assign(new Function(name), { type })
}

const floatsType = new ArrayType(Type.FLOAT)
const floatFloatType = new FunctionType([Type.FLOAT], Type.FLOAT)
const floatFloatFloatType = new FunctionType([Type.FLOAT, Type.FLOAT], Type.FLOAT)
const stringToIntsType = new FunctionType([Type.STRING], floatsType)

export const types = {
  int: Type.INT,
  float: Type.FLOAT,
  boolean: Type.BOOLEAN,
  string: Type.STRING,
  void: Type.VOID,
}

export const constants = {
  π: makeConstant("π", Type.FLOAT, Math.PI),
}

export const functions = {
  print: makeFunction("print", new FunctionType([Type.ANY], Type.VOID)),
  sin: makeFunction("sin", floatFloatType),
  cos: makeFunction("cos", floatFloatType),
  exp: makeFunction("exp", floatFloatType),
  ln: makeFunction("ln", floatFloatType),
  hypot: makeFunction("hypot", floatFloatFloatType),
  bytes: makeFunction("bytes", stringToIntsType),
  codepoints: makeFunction("codepoints", stringToIntsType),
}
