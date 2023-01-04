// STANDARD LIBRARY
//
// Carlos comes with a lot of predefined entities. Some are constants, some
// are types, and some are functions. Each are defined in this module, and
// exported in a single object

import { Type, FunctionType, Variable, Function, ArrayType } from "./core.js"

function makeConstant(name, type, value) {
  return Object.assign(new Variable(name, true, type), { value })
}

const floatsType = new ArrayType(Type.FLOAT)
const floatFloatType = new FunctionType([Type.FLOAT], Type.FLOAT)
const floatFloatFloatType = new FunctionType([Type.FLOAT, Type.FLOAT], Type.FLOAT)
const stringToIntsType = new FunctionType([Type.STRING], floatsType)

export const contents = Object.freeze({
  int: Type.INT,
  float: Type.FLOAT,
  boolean: Type.BOOLEAN,
  string: Type.STRING,
  void: Type.VOID,
  π: makeConstant("π", Type.FLOAT, Math.PI),
  print: new Function("print", new FunctionType([Type.ANY], Type.VOID)),
  sin: new Function("sin", floatFloatType),
  cos: new Function("cos", floatFloatType),
  exp: new Function("exp", floatFloatType),
  ln: new Function("ln", floatFloatType),
  hypot: new Function("hypot", floatFloatFloatType),
  bytes: new Function("bytes", stringToIntsType),
  codepoints: new Function("codepoints", stringToIntsType),
})
