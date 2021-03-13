// Abstract Syntax Tree Nodes
//
// This module defines classes for the AST nodes. Only the constructors are
// defined here. Semantic analysis methods, optimization methods, and code
// generation are handled by other modules. This keeps the compiler organized
// by phase.
//
// The root (Program) node has a custom inspect method, so you can console.log
// the root node and you'll get a lovely formatted string with details on the
// entire AST. It even works well if you analyze the AST and turn it into a
// graph with cycles.

import util from "util"

export class Program {
  constructor(statements) {
    this.statements = statements
  }
  [util.inspect.custom]() {
    return prettied(this)
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
  isAssignableTo(target) {
    return this === target
  }
}

export class FunctionType {
  constructor(parameterTypes, returnType) {
    Object.assign(this, { parameterTypes, returnType })
  }
  get name() {
    return `(${this.parameterTypes.map(t => t.name).join(",")})->${
      this.returnType.name
    }`
  }
  isAssignableTo(target) {
    return (
      target.constructor === FunctionType &&
      this.returnType.isAssignableTo(target.returnType) &&
      this.parameterTypes.length === target.parameterTypes.length &&
      this.parameterTypes.every((t, i) =>
        target.parameterTypes[i].isAssignableTo(t)
      )
    )
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

export class OptionalType {
  constructor(baseType) {
    this.baseType = baseType
  }
  get name() {
    return `${this.baseType.name}?`
  }
  isAssignableTo(target) {
    return (
      target.constructor === OptionalType && this.baseType === target.baseType
    )
  }
}

export class VariableDeclaration {
  constructor(name, readOnly, initializer) {
    Object.assign(this, { name, readOnly, initializer })
  }
}

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

export class Function {
  constructor(name) {
    // All other properties added during semantic analysis
    Object.assign(this, { name })
  }
}

export class Parameter {
  constructor(name, type) {
    Object.assign(this, { name, type })
  }
}

export class Increment {
  constructor(op, operand) {
    Object.assign(this, { op, operand })
  }
}

export class Decrement {
  constructor(op, operand) {
    Object.assign(this, { op, operand })
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
    Object.assign(this, { expression })
  }
}

export class ShortReturnStatement {
  // Intentionally empty
}

export class IfStatement {
  constructor(test, consequent, alternative) {
    Object.assign(this, { test, consequent, alternative })
  }
}

export class ShortIfStatement {
  constructor(test, consequent) {
    Object.assign(this, { test, consequent })
  }
}

export class ForeverStatement {
  constructor(body) {
    this.body = body
  }
}

export class WhileStatement {
  constructor(test, body) {
    Object.assign(this, { test, body })
  }
}

export class ForTimesStatement {
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
  constructor(iterator, range, body) {
    Object.assign(this, { iterator, range, body })
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
    Object.assign(this, { expression })
  }
}

export class EmptyOptional {
  constructor(baseType) {
    this.baseType = baseType
  }
}

export class SubscriptExpression {
  constructor(array, element) {
    Object.assign(this, { array, element })
  }
}

export class EmptyArray {
  constructor(baseType) {
    this.baseType = baseType
  }
}

export class ArrayLiteral {
  constructor(args) {
    Object.assign(this, { args })
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

export class NumericRange {
  constructor(low, high, open) {
    Object.assign(this, { low, high, open })
  }
}

export class IdentifierExpression {
  constructor(name) {
    this.name = name
  }
}

// Not a type, but rather a wrapper for a string designating a type to be
// looked up during static analysis. Similar to IdentifierExpressions in
// that these are syntax nodes only disappear after analysis.
export class TypeId {
  constructor(name) {
    this.name = name
  }
}

function prettied(node) {
  // Return a compact and pretty string representation of the node graph,
  // taking care of cycles. Written here from scratch because the built-in
  // inspect function, while nice, isn't nice enough.
  const tags = new Map()

  function tag(node) {
    if (tags.has(node) || typeof node !== "object" || node === null) return
    tags.set(node, tags.size + 1)
    for (const child of Object.values(node)) {
      Array.isArray(child) ? child.forEach(tag) : tag(child)
    }
  }

  function* lines() {
    function view(e) {
      if (tags.has(e)) return `#${tags.get(e)}`
      if (Array.isArray(e)) return `[${e.map(view)}]`
      return util.inspect(e)
    }
    for (let [node, id] of [...tags.entries()].sort((a, b) => a[1] - b[1])) {
      let [type, props] = [node.constructor.name, ""]
      Object.entries(node).forEach(([k, v]) => (props += ` ${k}=${view(v)}`))
      yield `${String(id).padStart(4, " ")} | ${type}${props}`
    }
  }

  tag(node)
  return [...lines()].join("\n")
}
