// Optimizer
//
// This module exports a single function to perform machine-independent
// optimizations on the analyzed semantic graph.
//
// The only optimizations supported here are:
//
//   - assignments to self (x = x) turn into no-ops
//   - constant folding
//   - some strength reductions (+0, -0, *0, *1, etc.)
//   - turn references to built-ins true and false to be literals
//   - remove all disjuncts in || list after literal true
//   - remove all conjuncts in && list after literal false
//   - while-false becomes a no-op
//   - repeat-0 is a no-op
//   - for-loop over empty array is a no-op
//   - for-loop with low > high is a no-op
//   - if-true and if-false reduce to only the taken arm

import * as ast from "./ast.js"

export default function optimize(node) {
  return optimizers[node.constructor.name](node)
}

const optimizers = {
  Program(p) {
    p.statements = optimize(p.statements)
    return p
  },
  VariableDeclaration(d) {
    d.initializer = optimize(d.initializer)
    return d
  },
  StructTypeDeclaration(d) {
    return d
  },
  StructType(d) {
    return d
  },
  FunctionDeclaration(d) {
    d.body = optimize(d.body)
    return d
  },
  Variable(v) {
    return v
  },
  Function(f) {
    return f
  },
  Parameter(p) {
    return p
  },
  Increment(s) {
    return s
  },
  Decrement(s) {
    return s
  },
  Assignment(s) {
    s.source = optimize(s.source)
    s.target = optimize(s.target)
    if (s.source === s.target) {
      return []
    }
    return s
  },
  BreakStatement(s) {
    return s
  },
  ReturnStatement(s) {
    s.expression = optimize(s.expression)
    return s
  },
  ShortReturnStatement(s) {
    return s
  },
  IfStatement(s) {
    s.test = optimize(s.test)
    s.consequent = optimize(s.consequent)
    s.alternate = optimize(s.alternate)
    if (s.test.constructor === Boolean) {
      return s.test ? s.consequent : s.alternate
    }
    return s
  },
  ShortIfStatement(s) {
    s.test = optimize(s.test)
    s.consequent = optimize(s.consequent)
    if (s.test.constructor === Boolean) {
      return s.test ? s.consequent : []
    }
    return s
  },
  WhileStatement(s) {
    s.test = optimize(s.test)
    if (s.test === false) {
      // while false is a no-op
      return []
    }
    s.body = optimize(s.body)
    return s
  },
  RepeatStatement(s) {
    s.count = optimize(s.count)
    if (s.count === 0) {
      // repeat 0 times is a no-op
      return []
    }
    s.body = optimize(s.body)
    return s
  },
  ForRangeStatement(s) {
    s.low = optimize(s.low)
    s.high = optimize(s.high)
    s.body = optimize(s.body)
    if (s.low.constructor === Number) {
      if (s.high.constructor === Number) {
        if (s.low > s.high) {
          return []
        }
      }
    }
    return s
  },
  ForStatement(s) {
    s.collection = optimize(s.collection)
    s.body = optimize(s.body)
    if (s.collection.constructor === ast.EmptyArray) {
      return []
    }
    return s
  },
  Conditional(e) {
    e.test = optimize(e.test)
    e.consequent = optimize(e.consequent)
    e.alternate = optimize(e.alternate)
    if (e.test.constructor === Boolean) {
      return e.test ? e.consequent : e.alternate
    }
    return e
  },
  UnwrapElse(e) {
    e.optional = optimize(e.optional)
    e.alternate = optimize(e.alternate)
    if (e.optional.constructor === ast.EmptyOptional) {
      return e.alternate
    }
    return e
  },
  OrExpression(e) {
    // Get rid of all disjuncts after a literal true
    const optimizedDisjuncts = []
    for (const disjunct of e.disjuncts) {
      const optimized = optimize(disjunct)
      optimizedDisjuncts.push(optimized)
      if (optimized === true) {
        break
      }
    }
    e.disjuncts = optimizedDisjuncts
    return e
  },
  AndExpression(e) {
    // Get rid of all conjuncts after a literal false
    const optimizedConjuncts = []
    for (const conjunct of e.conjuncts) {
      const optimized = optimize(conjunct)
      optimizedConjuncts.push(optimized)
      if (optimized === false) {
        break
      }
    }
    e.conjuncts = optimizedConjuncts
    return e
  },
  BinaryExpression(e) {
    e.left = optimize(e.left)
    e.right = optimize(e.right)
    if ([Number, BigInt].includes(e.left.constructor)) {
      if ([Number, BigInt].includes(e.right.constructor)) {
        if (e.op === "+") {
          return e.left + e.right
        } else if (e.op === "-") {
          return e.left - e.right
        } else if (e.op === "*") {
          return e.left * e.right
        } else if (e.op === "/") {
          return e.left / e.right
        } else if (e.op === "**") {
          return e.left ** e.right
        } else if (e.op === "<") {
          return e.left < e.right
        } else if (e.op === "<=") {
          return e.left <= e.right
        } else if (e.op === "==") {
          return e.left === e.right
        } else if (e.op === "!=") {
          return e.left !== e.right
        } else if (e.op === ">=") {
          return e.left >= e.right
        } else if (e.op === ">") {
          return e.left > e.right
        }
      } else if (e.left === 0 && e.op === "+") {
        return e.right
      } else if (e.left === 1 && e.op === "*") {
        return e.right
      } else if (e.left === 0 && e.op === "-") {
        return new ast.UnaryExpression("-", e.right)
      } else if (e.left === 1 && e.op === "**") {
        return 1
      } else if (e.left === 0 && ["*", "/"].includes(e.op)) {
        return 0
      }
    } else if (e.right.constructor === Number) {
      if (["+", "-"].includes(e.op) && e.right === 0) {
        return e.left
      } else if (["*", "/"].includes(e.op) && e.right === 1) {
        return e.left
      } else if (e.op === "*" && e.right === 0) {
        return 0
      } else if (e.op === "**" && e.right === 0) {
        return 1
      }
    }
    return e
  },
  UnaryExpression(e) {
    e.operand = optimize(e.operand)
    if (e.operand.constructor === Number) {
      if (e.op === "-") {
        return -e.operand
      }
    }
    return e
  },
  EmptyOptional(e) {
    return e
  },
  SubscriptExpression(e) {
    e.array = optimize(e.array)
    e.index = optimize(e.index)
    return e
  },
  ArrayExpression(e) {
    e.elements = optimize(e.elements)
    return e
  },
  EmptyArray(e) {
    return e
  },
  MemberExpression(e) {
    e.object = optimize(e.object)
    return e
  },
  Call(c) {
    c.callee = optimize(c.callee)
    c.args = optimize(c.args)
    return c
  },
  BigInt(e) {
    return e
  },
  Number(e) {
    return e
  },
  Boolean(e) {
    return e
  },
  String(e) {
    return e
  },
  Array(a) {
    // Flatmap since each element can be an array
    return a.flatMap(optimize)
  },
}
