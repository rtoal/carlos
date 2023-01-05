// STANDARD LIBRARY
//
// Carlos comes with a lot of predefined entities. Some are constants, some
// are types, and some are functions. Each are defined in this module, and
// exported in a single object

import { Type, FunctionType, Variable, Function, ArrayType } from "./core.js"

const floatFloatType = new FunctionType([Type.FLOAT], Type.FLOAT)
const floatFloatFloatType = new FunctionType([Type.FLOAT, Type.FLOAT], Type.FLOAT)
const stringToIntsType = new FunctionType([Type.STRING], new ArrayType(Type.INT))

export const contents = Object.freeze({
  int: Type.INT,
  float: Type.FLOAT,
  boolean: Type.BOOLEAN,
  string: Type.STRING,
  void: Type.VOID,
  π: new Variable("π", true, Type.FLOAT),
  print: new Function("print", new FunctionType([Type.ANY], Type.VOID)),
  sin: new Function("sin", floatFloatType),
  cos: new Function("cos", floatFloatType),
  exp: new Function("exp", floatFloatType),
  ln: new Function("ln", floatFloatType),
  hypot: new Function("hypot", floatFloatFloatType),
  bytes: new Function("bytes", stringToIntsType),
  codepoints: new Function("codepoints", stringToIntsType),
})
