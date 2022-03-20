import { error } from "./core.js"
import ast from "./ast.js"
import analyze from "./analyzer.js"
import optimize from "./optimizer.js"
import generate from "./generator.js"

export default function compile(source, outputType) {
  const program = ast(source)
  if (outputType === "ast") return program
  const analyzed = analyze(program)
  if (outputType === "analyzed") return analyzed
  const optimized = optimize(analyzed)
  if (outputType === "optimized") return optimized
  if (outputType === "js") {
    return generate(optimized)
  }
  error("Unknown output type")
}
