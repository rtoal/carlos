// Abstract Syntax Tree Nodes
//
// This module defines classes for the AST nodes. Only the constructors are
// defined here. Semantic analysis methods, optimization methods, and code
// generation are handled by other modules. This keeps the compiler organized
// by phase.

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
  constructor(name, readOnly) {
    Object.assign(this, { name, readOnly })
  }
}

export class StructTypeDeclaration {
  // Example: struct S {x: int?, y: [double]}
  constructor(type) {
    this.type = type
  }
}

export class Field {
  constructor(name, type) {
    Object.assign(this, { name, type })
  }
}

export class FunctionDeclaration {
  // Example: function f(x: [int?], y: string): Vector {}
  constructor(name, parameters, returnType, body) {
    Object.assign(this, { name, parameters, returnType, body })
  }
}

export class Parameter {
  // Example: x: boolean
  constructor(name, type) {
    Object.assign(this, { name, type })
  }
}

export class Type {}

export class ArrayType extends Type {
  // Example: [int]
  constructor(baseType) {
    super()
    this.baseType = baseType
  }
  get description() {
    return `[${this.baseType.description}]`
  }
}

export class FunctionType extends Type {
  // Example: (boolean,[string]?)->float
  constructor(parameterTypes, returnType) {
    super()
    Object.assign(this, { parameterTypes, returnType })
  }
  get description() {
    return `(${this.parameterTypes.map(t => t.description).join(",")})->${
      this.returnType.description
    }`
  }
}

export class OptionalType extends Type {
  // Example: string?
  constructor(baseType) {
    super()
    this.baseType = baseType
  }
  get description() {
    return `${this.baseType.description}?`
  }
}

export class StructType extends Type {
  constructor(name, fields) {
    super()
    Object.assign(this, { name, fields })
  }
}

// Created during semantic analysis only!
export class Function {
  constructor(name) {
    this.name = name
    // Other properties set after construction
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
  }
}

export class UnwrapElse {
  // Example: locationOf("Carmen") ?? "Somewhere in the world"
  constructor(optional, alternate) {
    Object.assign(this, { optional, alternate })
  }
}

export class OrExpression {
  // Example: openDoor() || tryTheWindow() || breakTheDoorDown()
  constructor(disjuncts) {
    this.disjuncts = disjuncts
  }
}

export class AndExpression {
  // Example: swim() && bike() && run()
  constructor(conjuncts) {
    this.conjuncts = conjuncts
  }
}

export class BinaryExpression {
  // Example: 3 & 22
  constructor(op, left, right) {
    Object.assign(this, { op, left, right })
  }
}

export class UnaryExpression {
  // Example: -55
  constructor(op, operand) {
    Object.assign(this, { op, operand })
  }
}

export class EmptyOptional {
  // Example: no int
  constructor(baseType) {
    this.baseType = baseType
  }
}

export class SubscriptExpression {
  // Example: a[20]
  constructor(array, index) {
    Object.assign(this, { array, index })
  }
}

export class ArrayExpression {
  // Example: ["Emma", "Norman", "Ray"]
  constructor(elements) {
    this.elements = elements
  }
}

export class EmptyArray {
  // Example: [](of float)
  constructor(baseType) {
    this.baseType = baseType
  }
}

export class MemberExpression {
  // Example: state.population
  constructor(object, field) {
    Object.assign(this, { object, field })
  }
}

export class Call {
  // Example: move(player, 90, "west")
  constructor(callee, args) {
    Object.assign(this, { callee, args })
  }
}
