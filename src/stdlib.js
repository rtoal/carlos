import { Type, FunctionType, Variable, Function, ArrayType } from "./ast.js"

Type.BOOLEAN = new Type("boolean")
Type.INT = new Type("int")
Type.FLOAT = new Type("float")
Type.STRING = new Type("string")
Type.VOID = new Type("void")
Type.TYPE = new Type("type")
Type.ANY = new Type("any")

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
