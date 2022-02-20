import assert from "assert"
import util from "util"
import ast from "../src/ast.js"

// TODO: This test case needs a lot more work
const source = `
  let x = 1;
  const y = "hello";
  return [1.0, 2.0];
  return x.y;
  function f(x: int): [bool] {
    if (false) {break;}
  }
  struct S {
    m: (string, int?)->bool
  }
  f(3 * 7 ?? 1 && 2);
`

const expected = `   1 | Program statements=[#2,#3,#4,#6,#8,#13,#18]
   2 | VariableDeclaration modifier='let' variable=(Id,"x") initializer=(Int,"1")
   3 | VariableDeclaration modifier='const' variable=(Id,"y") initializer=(Str,""hello"")
   4 | ReturnStatement expression=#5
   5 | ArrayExpression elements=[(Float,"1.0"),(Float,"2.0")]
   6 | ReturnStatement expression=#7
   7 | MemberExpression object=(Id,"x") field='y'
   8 | FunctionDeclaration fun=(Id,"f") parameters=[#9] returnType=#10 body=[#11]
   9 | Parameter name='x' type=(Id,"int")
  10 | ArrayType description='[bool]' baseType=(Id,"bool")
  11 | ShortIfStatement test=(Bool,"false") consequent=[#12]
  12 | BreakStatement 
  13 | TypeDeclaration type=#14
  14 | StructType description='S' fields=[#15]
  15 | Field name=(Id,"m") type=#16
  16 | FunctionType description='(string,int?)->bool' paramTypes=[(Id,"string"),#17] returnType=(Id,"bool")
  17 | OptionalType description='int?' baseType=(Id,"int")
  18 | Call callee=(Id,"f") args=[#19]
  19 | BinaryExpression op='??' left=#20 right=#21
  20 | BinaryExpression op='*' left=(Int,"3") right=(Int,"7")
  21 | BinaryExpression op='&&' left=(Int,"1") right=(Int,"2")`

describe("The AST generator", () => {
  it("produces a correct AST", () => {
    assert.deepStrictEqual(util.format(ast(source)), expected)
  })
})
