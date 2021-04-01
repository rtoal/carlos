#! /usr/bin/env node

import fs from "fs/promises"
import util from "util"
import process from "process"
import { Program } from "./ast.js"
import parse from "./parser.js"
import analyze from "./analyzer.js"
import optimize from "./optimizer.js"
import generate from "./generator.js"

const help = `Carlos compiler

Syntax: carlos <filename> <outputType>

Prints to stdout according to <outputType>, which must be one of:

  ast        the abstract syntax tree
  analyzed   the semantically analyzed representation
  optimized  the optimized semantically analyzed representation
  js         the translation to JavaScript
`

function compile(source, outputType) {
  if (outputType === "ast") {
    return parse(source)
  } else if (outputType === "analyzed") {
    return analyze(parse(source))
  } else if (outputType === "optimized") {
    return optimize(analyze(parse(source)))
  } else if (outputType === "js") {
    return generate(optimize(analyze(parse(source))))
  } else {
    return "Unknown output type"
  }
}

Program.prototype[util.inspect.custom] = function () {
  // Return a compact and pretty string representation of the node graph,
  // taking care of cycles. Written here from scratch because the built-in
  // inspect function, while nice, isn't nice enough. Defined properly in
  // the AST root class prototype so it automatically runs on console.log.
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
      if (typeof e === "symbol") return e.description
      if (Array.isArray(e)) return `[${e.map(view)}]`
      return util.inspect(e)
    }
    for (let [node, id] of [...tags.entries()].sort((a, b) => a[1] - b[1])) {
      let [type, props] = [node.constructor.name, ""]
      Object.entries(node).forEach(([k, v]) => (props += ` ${k}=${view(v)}`))
      yield `${String(id).padStart(4, " ")} | ${type}${props}`
    }
  }

  tag(this)
  return [...lines()].join("\n")
}

async function compileFromFile(filename, outputType) {
  try {
    const buffer = await fs.readFile(filename)
    console.log(compile(buffer.toString(), outputType))
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  }
}

if (process.argv.length !== 4) {
  console.log(help)
} else {
  compileFromFile(process.argv[2], process.argv[3])
}
