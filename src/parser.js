// PARSER
//
// The parse() function uses Ohm to produce a match object for a given
// source code program, using the grammar in the carlos.ohm.

import fs from "fs"
import * as ohm from "ohm-js"

const grammar = ohm.grammar(fs.readFileSync("src/carlos.ohm"))

// Returns the Ohm match if successful, otherwise throws
export default function parse(sourceCode) {
  const match = grammar.match(sourceCode)
  if (!match.succeeded()) throw new Error(match.message)
  return match
}
