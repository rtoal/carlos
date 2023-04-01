export class Program {
  // Example: let x = 1; print(x * 5); print("done");
  constructor(statements) {
    this.statements = statements
  }
}

export class VariableDeclaration {
  // Example: const dozen = 12;
  constructor(variable, initializer) {
    Object.assign(this, { variable, initializer })
  }
}

export class Variable {
  // Generated when processing a variable declaration
  constructor(name, readOnly, type) {
    Object.assign(this, { name, readOnly, type })
  }
}

export class TypeDeclaration {
  // Example: struct S {x: int?, y: [double]}
  constructor(type) {
    this.type = type
  }
}

export class Type {
  // Type of all basic type int, float, string, etc. and superclass of others
  static BOOLEAN = new Type("boolean")
  static INT = new Type("int")
  static FLOAT = new Type("float")
  static STRING = new Type("string")
  static VOID = new Type("void")
  static ANY = new Type("any")
  constructor(description) {
    // The description is a convenient way to view the type. For basic
    // types or structs, it will just be the names. For arrays, you will
    // see "[T]". For optionals, "T?". For functions "(T1,...Tn)->T0".
    Object.assign(this, { description })
  }
}

export class StructType extends Type {
  // Generated when processing a type declaration
  constructor(name, fields) {
    super(name)
    Object.assign(this, { fields })
  }
}

export class Field {
  constructor(name, type) {
    Object.assign(this, { name, type })
  }
}

export class FunctionDeclaration {
  // Example: function f(x: [int?], y: string): Vector {}
  constructor(name, fun, params, body) {
    Object.assign(this, { name, fun, params, body })
  }
}

export class Function {
  // Generated when processing a function declaration
  constructor(name, type) {
    Object.assign(this, { name, type })
  }
}

export class ArrayType extends Type {
  // Example: [int]
  constructor(baseType) {
    super(`[${baseType.description}]`)
    this.baseType = baseType
  }
}

export class FunctionType extends Type {
  // Example: (boolean,[string]?)->float
  constructor(paramTypes, returnType) {
    super(`(${paramTypes.map(t => t.description).join(",")})->${returnType.description}`)
    Object.assign(this, { paramTypes, returnType })
  }
}

export class OptionalType extends Type {
  // Example: string?
  constructor(baseType) {
    super(`${baseType.description}?`)
    this.baseType = baseType
  }
}

export class Increment {
  // Example: count++
  constructor(variable) {
    this.variable = variable
  }
}

export class Decrement {
  // Example: count--
  constructor(variable) {
    this.variable = variable
  }
}

export class Assignment {
  // Example: a[z].p = 50 * 22 ** 3 - x
  constructor(target, source) {
    Object.assign(this, { target, source })
  }
}

export class BreakStatement {
  // Intentionally empty
}

export class ReturnStatement {
  // Example: return c[5]
  constructor(expression) {
    this.expression = expression
  }
}

export class ShortReturnStatement {
  // Intentionally empty
}

export class IfStatement {
  // Example: if x < 3 { print(100); } else { break; }
  constructor(test, consequent, alternate) {
    Object.assign(this, { test, consequent, alternate })
  }
}

export class ShortIfStatement {
  // Example: if x < 3 { print(100); }
  constructor(test, consequent) {
    Object.assign(this, { test, consequent })
  }
}

export class WhileStatement {
  // Example: while level != 90 { level += random(-3, 8); }
  constructor(test, body) {
    Object.assign(this, { test, body })
  }
}

export class RepeatStatement {
  // Example: repeat 10 { print("Hello"); }
  constructor(count, body) {
    Object.assign(this, { count, body })
  }
}

export class ForRangeStatement {
  // Example: for i in 0..<10 { process(i << 2); }
  constructor(iterator, low, op, high, body) {
    Object.assign(this, { iterator, low, high, op, body })
  }
}

export class ForStatement {
  // Example: for ball in balls { ball.bounce();  }
  constructor(iterator, collection, body) {
    Object.assign(this, { iterator, collection, body })
  }
}

export class Conditional {
  // Example: latitude >= 0 ? "North" : "South"
  constructor(test, consequent, alternate) {
    Object.assign(this, { test, consequent, alternate })
    this.type = consequent.type
  }
}

export class BinaryExpression {
  // Example: 3 & 22
  constructor(op, left, right, type) {
    Object.assign(this, { op, left, right, type })
  }
}

export class UnaryExpression {
  // Example: -55
  constructor(op, operand, type) {
    Object.assign(this, { op, operand, type })
  }
}

export class EmptyOptional {
  // Example: no int
  constructor(baseType) {
    this.baseType = baseType
    this.type = new OptionalType(baseType)
  }
}

export class SubscriptExpression {
  // Example: a[20]
  constructor(array, index) {
    Object.assign(this, { array, index })
    this.type = array.type.baseType
  }
}

export class ArrayExpression {
  // Example: ["Emma", "Norman", "Ray"]
  constructor(elements) {
    this.elements = elements
    this.type = new ArrayType(elements[0].type)
  }
}

export class EmptyArray {
  // Example: [](of float)
  constructor(baseType) {
    this.baseType = baseType
    this.type = new ArrayType(baseType)
  }
}

export class MemberExpression {
  // Example: state.population
  // Example: winner?.city
  constructor(object, op, field) {
    Object.assign(this, { object, op, field })
    this.type = op == "?." ? new OptionalType(field.type) : field.type
  }
}

export class FunctionCall {
  // Example: move(player, 90, "west")
  constructor(callee, args, type) {
    Object.assign(this, { callee, args, type })
  }
}

export class ConstructorCall {
  // Syntactically similar to but semantically different from function calls
  constructor(callee, args, type) {
    Object.assign(this, { callee, args, type })
  }
}

const floatToFloatType = new FunctionType([Type.FLOAT], Type.FLOAT)
const floatFloatToFloatType = new FunctionType([Type.FLOAT, Type.FLOAT], Type.FLOAT)
const stringToIntsType = new FunctionType([Type.STRING], new ArrayType(Type.INT))

export const standardLibrary = Object.freeze({
  int: Type.INT,
  float: Type.FLOAT,
  boolean: Type.BOOLEAN,
  string: Type.STRING,
  void: Type.VOID,
  π: new Variable("π", true, Type.FLOAT),
  print: new Function("print", new FunctionType([Type.ANY], Type.VOID)),
  sin: new Function("sin", floatToFloatType),
  cos: new Function("cos", floatToFloatType),
  exp: new Function("exp", floatToFloatType),
  ln: new Function("ln", floatToFloatType),
  hypot: new Function("hypot", floatFloatToFloatType),
  bytes: new Function("bytes", stringToIntsType),
  codepoints: new Function("codepoints", stringToIntsType),
})

// We want every expression to have a type property. But we aren't creating
// special entities for numbers, strings, and booleans; instead, we are
// just using JavaScript values for those. Fortunately we can monkey patch
// the JS classes for these to give us what we want.
String.prototype.type = Type.STRING
Number.prototype.type = Type.FLOAT
BigInt.prototype.type = Type.INT
Boolean.prototype.type = Type.BOOLEAN
