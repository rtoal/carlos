import {
  Variable,
  Type,
  FunctionType,
  ArrayType,
  StructType,
  OptionalType,
  Function,
  Token,
  error,
} from "./core.js"
import * as stdlib from "./stdlib.js"

// The rules for type equivalence and type compatibility are so intricate that
// they require a special section of this module to handle them.

Object.assign(Type.prototype, {
  // Equivalence: when are two types the same
  isEquivalentTo(target) {
    return this == target
  },
  // T1 assignable to T2 is when x:T1 can be assigned to y:T2. By default
  // this is only when two types are equivalent; however, for other kinds
  // of types there may be special rules. For example, in a language with
  // supertypes and subtypes, an object of a subtype would be assignable
  // to a variable constrained to a supertype.
  isAssignableTo(target) {
    return this.isEquivalentTo(target)
  },
})

Object.assign(ArrayType.prototype, {
  isEquivalentTo(target) {
    // [T] equivalent to [U] only when T is equivalent to U.
    return (
      target.constructor === ArrayType && this.baseType.isEquivalentTo(target.baseType)
    )
  },
  isAssignableTo(target) {
    // Arrays are INVARIANT in Carlos!
    return this.isEquivalentTo(target)
  },
})

Object.assign(FunctionType.prototype, {
  isEquivalentTo(target) {
    return (
      target.constructor === FunctionType &&
      this.returnType.isEquivalentTo(target.returnType) &&
      this.paramTypes.length === target.paramTypes.length &&
      this.paramTypes.every((t, i) => target.paramTypes[i].isEquivalentTo(t))
    )
  },
  isAssignableTo(target) {
    // Functions are covariant on return types, contravariant on parameters.
    return (
      target.constructor === FunctionType &&
      this.returnType.isAssignableTo(target.returnType) &&
      this.paramTypes.length === target.paramTypes.length &&
      this.paramTypes.every((t, i) => target.paramTypes[i].isAssignableTo(t))
    )
  },
})

Object.assign(OptionalType.prototype, {
  isEquivalentTo(target) {
    // T? equivalent to U? only when T is equivalent to U.
    return (
      target.constructor === OptionalType && this.baseType.isEquivalentTo(target.baseType)
    )
  },
  isAssignableTo(target) {
    // Optionals are INVARIANT in Carlos!
    return this.isEquivalentTo(target)
  },
})

/**************************
 *  VALIDATION FUNCTIONS  *
 *************************/

function check(condition, message, entity) {
  if (!condition) error(message, entity)
}

function checkType(e, types, expectation) {
  check(types.includes(e.type), `Expected ${expectation}`)
}

function checkNumeric(e) {
  checkType(e, [Type.INT, Type.FLOAT], "a number")
}

function checkNumericOrString(e) {
  checkType(e, [Type.INT, Type.FLOAT, Type.STRING], "a number or string")
}

function checkBoolean(e) {
  checkType(e, [Type.BOOLEAN], "a boolean")
}

function checkInteger(e) {
  checkType(e, [Type.INT], "an integer")
}

function checkIsAType(e) {
  check(
    e instanceof Type || (e instanceof Token && e.value instanceof Type),
    "Type expected",
    e
  )
}

function checkIsAnOptional(e) {
  check(e.type.constructor === OptionalType, "Optional expected")
}

function checkArray(e) {
  check(e.type.constructor === ArrayType, "Array expected")
}

function checkHaveSameType(e1, e2) {
  check(e1.type.isEquivalentTo(e2.type), "Operands do not have the same type")
}

function checkAllHaveSameType(expressions) {
  check(
    expressions.slice(1).every(e => e.type.isEquivalentTo(expressions[0].type)),
    "Not all elements have the same type"
  )
}

function checkNotRecursive(struct) {
  check(
    !struct.fields.map(f => f.type).includes(struct),
    "Struct type must not be recursive"
  )
}

function checkAssignable(e, { toType: type }) {
  check(
    type === Type.ANY || e.type.isAssignableTo(type),
    `Cannot assign a ${e.type.description} to a ${type.description}`
  )
}

function checkNotReadOnly(e) {
  const readOnly = e instanceof Token ? e.value.readOnly : e.readOnly
  check(!readOnly, `Cannot assign to constant ${e?.lexeme ?? e.name}`, e)
}

function checkFieldsAllDistinct(fields) {
  check(
    new Set(fields.map(f => f.name.lexeme)).size === fields.length,
    "Fields must be distinct"
  )
}

function checkMemberDeclared(field, { in: struct }) {
  check(struct.type.fields.map(f => f.name.lexeme).includes(field), "No such field")
}

function checkInLoop(context) {
  check(context.inLoop, "Break can only appear in a loop")
}

function checkInFunction(context) {
  check(context.function, "Return can only appear in a function")
}

function checkCallable(e) {
  check(
    e.constructor === StructType || e.type.constructor == FunctionType,
    "Call of non-function or non-constructor"
  )
}

function checkReturnsNothing(f) {
  check(f.type.returnType === Type.VOID, "Something should be returned here")
}

function checkReturnsSomething(f) {
  check(f.type.returnType !== Type.VOID, "Cannot return a value here")
}

function checkReturnable({ expression: e, from: f }) {
  checkAssignable(e, { toType: f.type.returnType })
}

function checkArgumentsMatch(args, targetTypes) {
  check(
    targetTypes.length === args.length,
    `${targetTypes.length} argument(s) required but ${args.length} passed`
  )
  targetTypes.forEach((type, i) => checkAssignable(args[i], { toType: type }))
}

function checkFunctionCallArguments(args, calleeType) {
  checkArgumentsMatch(args, calleeType.paramTypes)
}

function checkConstructorArguments(args, structType) {
  const fieldTypes = structType.fields.map(f => f.type)
  checkArgumentsMatch(args, fieldTypes)
}

/***************************************
 *  ANALYSIS TAKES PLACE IN A CONTEXT  *
 **************************************/

class Context {
  constructor({ parent = null, locals = new Map(), inLoop = false, function: f = null }) {
    Object.assign(this, { parent, locals, inLoop, function: f })
  }
  sees(name) {
    // Search "outward" through enclosing scopes
    return this.locals.has(name) || this.parent?.sees(name)
  }
  add(name, entity) {
    // No shadowing! Prevent addition if id anywhere in scope chain! This is
    // a Carlos thing. Many other languages allow shadowing, and in these,
    // we would only have to check that name is not in this.locals
    if (this.sees(name)) error(`Identifier ${name} already declared`)
    this.locals.set(name, entity)
  }
  lookup(name) {
    const entity = this.locals.get(name)
    if (entity) {
      return entity
    } else if (this.parent) {
      return this.parent.lookup(name)
    }
    error(`Identifier ${name} not declared`)
  }
  analyze(node) {
    return this[node.constructor.name](node)
  }
  Program(p) {
    this.analyze(p.statements)
  }
  VariableDeclaration(d) {
    this.analyze(d.initializer)
    d.variable.value = new Variable(d.variable.lexeme, d.modifier.lexeme === "const")
    d.variable.value.type = d.initializer.type
    this.add(d.variable.lexeme, d.variable.value)
  }
  TypeDeclaration(d) {
    // Add early to allow recursion
    this.add(d.type.description, d.type)
    this.analyze(d.type.fields)
    checkFieldsAllDistinct(d.type.fields)
    checkNotRecursive(d.type)
  }
  Field(f) {
    this.analyze(f.type)
    if (f.type instanceof Token) f.type = f.type.value
    checkIsAType(f.type)
  }
  FunctionDeclaration(d) {
    if (d.returnType) this.analyze(d.returnType)
    d.fun.value = new Function(
      d.fun.lexeme,
      d.parameters,
      d.returnType?.value ?? d.returnType ?? Type.VOID
    )
    checkIsAType(d.fun.value.returnType)
    // When entering a function body, we must reset the inLoop setting,
    // because it is possible to declare a function inside a loop!
    const childContext = new Context({ ...this, inLoop: false, function: d.fun.value })
    childContext.analyze(d.fun.value.parameters)
    d.fun.value.type = new FunctionType(
      d.fun.value.parameters.map(p => p.type),
      d.fun.value.returnType ?? Type.VOID
    )
    // Add before analyzing the body to allow recursion
    this.add(d.fun.lexeme, d.fun.value)
    childContext.analyze(d.body)
  }
  Parameter(p) {
    this.analyze(p.type)
    if (p.type instanceof Token) p.type = p.type.value
    checkIsAType(p.type)
    this.add(p.name.lexeme, p)
  }
  ArrayType(t) {
    this.analyze(t.baseType)
    if (t.baseType instanceof Token) t.baseType = t.baseType.value
  }
  FunctionType(t) {
    this.analyze(t.paramTypes)
    t.paramTypes = t.paramTypes.map(p => (p instanceof Token ? p.value : p))
    this.analyze(t.returnType)
    if (t.returnType instanceof Token) t.returnType = t.returnType.value
  }
  OptionalType(t) {
    this.analyze(t.baseType)
    if (t.baseType instanceof Token) t.baseType = t.baseType.value
  }
  Increment(s) {
    this.analyze(s.variable)
    checkInteger(s.variable)
  }
  Decrement(s) {
    this.analyze(s.variable)
    checkInteger(s.variable)
  }
  Assignment(s) {
    this.analyze(s.source)
    this.analyze(s.target)
    checkAssignable(s.source, { toType: s.target.type })
    checkNotReadOnly(s.target)
  }
  BreakStatement(s) {
    checkInLoop(this)
  }
  ReturnStatement(s) {
    checkInFunction(this)
    checkReturnsSomething(this.function)
    this.analyze(s.expression)
    checkReturnable({ expression: s.expression, from: this.function })
  }
  ShortReturnStatement(s) {
    checkInFunction(this)
    checkReturnsNothing(this.function)
  }
  IfStatement(s) {
    this.analyze(s.test)
    checkBoolean(s.test)
    new Context({ ...this }).analyze(s.consequent)
    if (s.alternate.constructor === Array) {
      // It's a block of statements, make a new context
      new Context({ ...this }).analyze(s.alternate)
    } else if (s.alternate) {
      // It's a trailing if-statement, so same context
      this.analyze(s.alternate)
    }
  }
  ShortIfStatement(s) {
    this.analyze(s.test)
    checkBoolean(s.test)
    new Context({ ...this }).analyze(s.consequent)
  }
  WhileStatement(s) {
    this.analyze(s.test)
    checkBoolean(s.test)
    new Context({ ...this, inLoop: true }).analyze(s.body)
  }
  RepeatStatement(s) {
    this.analyze(s.count)
    checkInteger(s.count)
    new Context({ ...this, inLoop: true }).analyze(s.body)
  }
  ForRangeStatement(s) {
    this.analyze(s.low)
    checkInteger(s.low)
    this.analyze(s.high)
    checkInteger(s.high)
    s.iterator = new Variable(s.iterator.lexeme, true)
    s.iterator.type = Type.INT
    const bodyContext = new Context({ ...this, inLoop: true })
    bodyContext.add(s.iterator.name, s.iterator)
    bodyContext.analyze(s.body)
  }
  ForStatement(s) {
    this.analyze(s.collection)
    checkArray(s.collection)
    s.iterator = new Variable(s.iterator.lexeme, true)
    s.iterator.type = s.collection.type.baseType
    const bodyContext = new Context({ ...this, inLoop: true })
    bodyContext.add(s.iterator.name, s.iterator)
    bodyContext.analyze(s.body)
  }
  Conditional(e) {
    this.analyze(e.test)
    checkBoolean(e.test)
    this.analyze(e.consequent)
    this.analyze(e.alternate)
    checkHaveSameType(e.consequent, e.alternate)
    e.type = e.consequent.type
  }
  BinaryExpression(e) {
    this.analyze(e.left)
    this.analyze(e.right)
    if (["&", "|", "^", "<<", ">>"].includes(e.op.lexeme)) {
      checkInteger(e.left)
      checkInteger(e.right)
      e.type = Type.INT
    } else if (["+"].includes(e.op.lexeme)) {
      checkNumericOrString(e.left)
      checkHaveSameType(e.left, e.right)
      e.type = e.left.type
    } else if (["-", "*", "/", "%", "**"].includes(e.op.lexeme)) {
      checkNumeric(e.left)
      checkHaveSameType(e.left, e.right)
      e.type = e.left.type
    } else if (["<", "<=", ">", ">="].includes(e.op.lexeme)) {
      checkNumericOrString(e.left)
      checkHaveSameType(e.left, e.right)
      e.type = Type.BOOLEAN
    } else if (["==", "!="].includes(e.op.lexeme)) {
      checkHaveSameType(e.left, e.right)
      e.type = Type.BOOLEAN
    } else if (["&&", "||"].includes(e.op.lexeme)) {
      checkBoolean(e.left)
      checkBoolean(e.right)
      e.type = Type.BOOLEAN
    } else if (["??"].includes(e.op.lexeme)) {
      checkIsAnOptional(e.left)
      checkAssignable(e.right, { toType: e.left.type.baseType })
      e.type = e.left.type
    }
  }
  UnaryExpression(e) {
    this.analyze(e.operand)
    if (e.op.lexeme === "#") {
      checkArray(e.operand)
      e.type = Type.INT
    } else if (e.op.lexeme === "-") {
      checkNumeric(e.operand)
      e.type = e.operand.type
    } else if (e.op.lexeme === "!") {
      checkBoolean(e.operand)
      e.type = Type.BOOLEAN
    } else {
      // Operator is "some"
      e.type = new OptionalType(e.operand.type?.value ?? e.operand.type)
    }
  }
  EmptyOptional(e) {
    this.analyze(e.baseType)
    e.type = new OptionalType(e.baseType?.value ?? e.baseType)
  }
  SubscriptExpression(e) {
    this.analyze(e.array)
    e.type = e.array.type.baseType
    this.analyze(e.index)
    checkInteger(e.index)
  }
  ArrayExpression(a) {
    this.analyze(a.elements)
    checkAllHaveSameType(a.elements)
    a.type = new ArrayType(a.elements[0].type)
  }
  EmptyArray(e) {
    this.analyze(e.baseType)
    e.type = new ArrayType(e.baseType?.value ?? e.baseType)
  }
  MemberExpression(e) {
    this.analyze(e.object)
    checkMemberDeclared(e.field.lexeme, { in: e.object })
    e.field = e.object.type.fields.find(f => f.name.lexeme === e.field.lexeme)
    e.type = e.field.type
  }
  Call(c) {
    this.analyze(c.callee)
    const callee = c.callee?.value ?? c.callee
    checkCallable(callee)
    this.analyze(c.args)
    if (callee.constructor === StructType) {
      checkConstructorArguments(c.args, callee)
      c.type = callee
    } else {
      checkFunctionCallArguments(c.args, callee.type)
      c.type = callee.type.returnType
    }
  }
  Token(t) {
    // For ids being used, not defined
    if (t.category === "Id") {
      t.value = this.lookup(t.lexeme)
      t.type = t.value.type
    }
    if (t.category === "Int") [t.value, t.type] = [BigInt(t.lexeme), Type.INT]
    if (t.category === "Float") [t.value, t.type] = [Number(t.lexeme), Type.FLOAT]
    if (t.category === "Str") [t.value, t.type] = [t.lexeme, Type.STRING]
    if (t.category === "Bool") [t.value, t.type] = [t.lexeme === "true", Type.BOOLEAN]
  }
  Array(a) {
    a.forEach(item => this.analyze(item))
  }
}

export default function analyze(node) {
  const initialContext = new Context({})
  for (const [name, type] of Object.entries(stdlib.contents)) {
    initialContext.add(name, type)
  }
  initialContext.analyze(node)
  return node
}
