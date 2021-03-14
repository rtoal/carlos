// Abstract Syntax Tree Nodes
//
// This module defines classes for the AST nodes. Only the constructors are
// defined here. Semantic analysis methods, optimization methods, and code
// generation are handled by other modules. This keeps the compiler organized
// by phase.

export class Program {
  constructor(statements) {
    this.statements = statements
  }
}

export class Type {
  constructor(name) {
    this.name = name
  }
  static BOOLEAN = new Type("boolean")
  static INT = new Type("int")
  static FLOAT = new Type("float")
  static STRING = new Type("string")
  static VOID = new Type("void")
  static TYPE = new Type("type")
  static ANY = new Type("any")
  isAssignableTo(target) {
    return this === target
  }
}

export class ArrayType {
  constructor(baseType) {
    this.baseType = baseType
  }
  get name() {
    return `[${this.baseType.name}]`
  }
  isAssignableTo(target) {
    return target.constructor === ArrayType && this.baseType === target.baseType
  }
}

export class FunctionType {
  constructor(parameterTypes, returnType) {
    Object.assign(this, { parameterTypes, returnType })
  }
  get name() {
    return `(${this.parameterTypes.map(t => t.name).join(",")})->${this.returnType.name}`
  }
  isAssignableTo(target) {
    return (
      target.constructor === FunctionType &&
      this.returnType.isAssignableTo(target.returnType) &&
      this.parameterTypes.length === target.parameterTypes.length &&
      this.parameterTypes.every((t, i) => target.parameterTypes[i].isAssignableTo(t))
    )
  }
}

export class OptionalType {
  constructor(baseType) {
    this.baseType = baseType
  }
  get name() {
    return `${this.baseType.name}?`
  }
  isAssignableTo(target) {
    return target.constructor === OptionalType && this.baseType === target.baseType
  }
}

export class VariableDeclaration {
  constructor(name, readOnly, initializer) {
    Object.assign(this, { name, readOnly, initializer })
  }
}

// These nodes are created during semantic analysis only
export class Variable {
  constructor(name, readOnly) {
    Object.assign(this, { name, readOnly })
  }
}

export class StructDeclaration {
  constructor(name, fields) {
    Object.assign(this, { name, fields })
  }
}

export class Field {
  constructor(name, type) {
    Object.assign(this, { name, type })
  }
}

export class FunctionDeclaration {
  constructor(name, parameters, returnType, body) {
    Object.assign(this, { name, parameters, returnType, body })
  }
}

// These nodes are created during semantic analysis only
export class Function {
  constructor(name) {
    Object.assign(this, { name })
    // Other properties set after construction
  }
}

export class Parameter {
  constructor(name, type) {
    Object.assign(this, { name, type })
  }
}

export class Increment {
  constructor(variable) {
    this.variable = variable
  }
}

export class Decrement {
  constructor(variable) {
    this.variable = variable
  }
}

export class Assignment {
  constructor(target, source) {
    Object.assign(this, { target, source })
  }
}

export class BreakStatement {
  // Intentionally empty
}

export class ReturnStatement {
  constructor(expression) {
    this.expression = expression
  }
}

export class ShortReturnStatement {
  // Intentionally empty
}

export class IfStatement {
  constructor(test, consequent, alternate) {
    Object.assign(this, { test, consequent, alternate })
  }
}

export class ShortIfStatement {
  constructor(test, consequent) {
    Object.assign(this, { test, consequent })
  }
}

export class WhileStatement {
  constructor(test, body) {
    Object.assign(this, { test, body })
  }
}

export class RepeatStatement {
  constructor(count, body) {
    Object.assign(this, { count, body })
  }
}

export class ForRangeStatement {
  constructor(iterator, low, op, high, body) {
    Object.assign(this, { iterator, low, high, op, body })
  }
}

export class ForStatement {
  constructor(iterator, collection, body) {
    Object.assign(this, { iterator, collection, body })
  }
}

export class Conditional {
  constructor(test, consequent, alternate) {
    Object.assign(this, { test, consequent, alternate })
  }
}

export class UnwrapElse {
  constructor(optional, alternate) {
    Object.assign(this, { optional, alternate })
  }
}

export class OrExpression {
  constructor(disjuncts) {
    this.disjuncts = disjuncts
  }
}

export class AndExpression {
  constructor(conjuncts) {
    this.conjuncts = conjuncts
  }
}

export class BinaryExpression {
  constructor(op, left, right) {
    Object.assign(this, { op, left, right })
  }
}

export class UnaryExpression {
  constructor(op, operand) {
    Object.assign(this, { op, operand })
  }
}

export class SomeExpression {
  constructor(expression) {
    this.expression = expression
  }
}

export class EmptyOptional {
  constructor(baseType) {
    this.baseType = baseType
  }
}

export class SubscriptExpression {
  constructor(array, index) {
    Object.assign(this, { array, index })
  }
}

export class ArrayExpression {
  constructor(elements) {
    this.elements = elements
  }
}

export class EmptyArray {
  constructor(baseType) {
    this.baseType = baseType
  }
}

export class MemberExpression {
  constructor(object, field) {
    Object.assign(this, { object, field })
  }
}

export class Call {
  constructor(callee, args) {
    Object.assign(this, { callee, args })
  }
}

// Appears in the syntax tree only and disappears after semantic analysis
// since references to the Id node will be replaced with references to the
// actual variable or function node the the id refers to.
export class IdentifierExpression {
  constructor(name) {
    this.name = name
  }
}

// Appears in the syntax tree only and disappears after semantic analysis
// since references to the Id node will be replaced with references to the
// actual type node the the id refers to.
export class TypeId {
  constructor(name) {
    this.name = name
  }
}
