// Code Generator Carlos -> JavaScript
//
// Invoke generate(program) with the program node to get back the JavaScript
// translation as a string.

import { IfStatement, Type, Variable } from "./ast.js"
import * as stdlib from "./stdlib.js"

export default function generate(program) {
  const output = []

  const standardFunctions = new Map([
    [stdlib.functions.sin, x => `Math.sin(${x})`],
    [stdlib.functions.cos, x => `Math.cos(${x})`],
    [stdlib.functions.exp, x => `Math.exp(${x})`],
    [stdlib.functions.ln, x => `Math.log(${x})`],
    [stdlib.functions.hypot, (x, y) => `Math.hypot(${x},${y})`],
    [stdlib.functions.bytes, s => `[...Buffer.from(${s}, "utf8")]`],
  ])

  // Variable and function names in JS will be suffixed with _1, _2, _3,
  // etc. This is because "switch", for example, is a legal name in Carlos,
  // but not in JS. So we want to generate something like "switch_1".
  // We handle this by mapping each name to its suffix.
  const targetName = (mapping => {
    return entity => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1)
      }
      return `${entity.name}_${mapping.get(entity)}`
    }
  })(new Map())

  const gen = node => generators[node.constructor.name](node)

  const generators = {
    Program(p) {
      gen(p.statements)
    },
    VariableDeclaration(d) {
      output.push(`let ${gen(d.variable)} = ${gen(d.initializer)};`)
    },
    Variable(v) {
      if (v === stdlib.constants.π) {
        return "Math.PI"
      }
      return targetName(v)
    },
    StructDeclaration(d) {
      // Intentionally empty, JS does not need type declarations
    },
    Field(f) {
      // Intentionally empty, JS does not need type declarations
    },
    FunctionDeclaration(d) {
      output.push(`function ${gen(d.function)}(${gen(d.parameters).join(", ")}) {`)
      gen(d.body)
      output.push("}")
    },
    Function(f) {
      return targetName(f)
    },
    Parameter(p) {
      return targetName(p)
    },
    Increment(s) {
      output.push(`${gen(s)}++;`)
    },
    Decrement(s) {
      output.push(`${gen(s)}--;`)
    },
    Assignment(s) {
      output.push(`${gen(s.target)} = ${gen(s.source)};`)
    },
    BreakStatement(s) {
      output.push("break;")
    },
    ReturnStatement(s) {
      output.push(`return ${gen(s.expression)};`)
    },
    ShortReturnStatement(s) {
      output.push("return;")
    },
    IfStatement(s) {
      output.push(`if (${gen(s.test)}) {`)
      gen(s.consequent)
      if (s.alternate.constructor === IfStatement) {
        output.push("} else")
        gen(s.alternate)
      } else {
        output.push("} else {")
        gen(s.alternate)
        output.push("}")
      }
    },
    ShortIfStatement(s) {
      output.push(`if (${gen(s.test)}) {`)
      gen(s.consequent)
      output.push("}")
    },
    WhileStatement(s) {
      output.push(`while (${gen(s.test)}) {`)
      gen(s.body)
      output.push("}")
    },
    RepeatStatement(s) {
      const i = targetName(new Variable("i", false))
      output.push(`for (let ${i}=0; ${i}<${gen(s.count)}; ${i}++) {`)
      gen(s.body)
      output.push("}")
    },
    ForRangeStatement(s) {
      const i = targetName(new Variable("i", false))
      const op = { "..<": "<", "...": "<=" }[s.op]
      output.push(`for (let ${i}=${gen(s.low)}; ${i}${op}${gen(s.high)}; ${i}++) {`)
      gen(s.body)
      output.push("}")
    },
    ForStatement(s) {
      output.push(`for (let ${targetName(s.iterator)} of s.collection) {`)
      gen(s.body)
      output.push("}")
    },
    Conditional(e) {
      return `((${gen(e.test)}) ? (${gen(e.consequent)}) : (${gen(e.alternate)}))`
    },
    UnwrapElse(e) {
      return `((${gen(e.optional)}) ?? (${gen(e.alternate)}))`
    },
    OrExpression(e) {
      return `(${gen(e.disjuncts).join(" || ")})`
    },
    AndExpression(e) {
      return `(${gen(e.conjuncts).join(" && ")})`
    },
    BinaryExpression(e) {
      const op = { "==": "===", "!=": "!==" }[e.op] ?? e.op
      return `(${gen(e.left)} ${op} ${gen(e.right)})`
    },
    UnaryExpression(e) {
      return `${e.op}(${gen(e.operand)})`
    },
    EmptyOptional(e) {
      return "null"
    },
    SubscriptExpression(e) {
      return `${gen(e.array)}[${gen(e.element)}]`
    },
    ArrayExpression(e) {
      return `[${gen(e.args).join(",")}]`
    },
    EmptyArray(e) {
      return "[]"
    },
    MemberExpression(e) {
      return `(${gen(e.object)})['${gen(e.field)}']`
    },
    Call(c) {
      const callee = standardFunctions.get(c.callee) ?? gen(c.callee)
      const targetCode = `${callee}(${gen(c.args).join(", ")})`
      if (c.callee.type.returnType !== Type.VOID) {
        return targetCode
      }
      output.push(`${targetCode};`)
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
      return a.map(gen)
    },
  }

  gen(program)
  return output.join("\n")
}
