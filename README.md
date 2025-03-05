<img src="https://raw.githubusercontent.com/rtoal/carlos-lang/main/docs/carlos-logo.png" height=100>

# Carlos

Carlos is a simple scripting language with a modern feel. It was created as an example language for a Compiler Construction class: it's simple enough to be implementable in a semester, but not too simple to be uninteresting.

```
const languageName = "Carlos";

function greeting(): string {
  return random(["Welcome", "こんにちは", "Bienvenido"]);
}

print("👋👋👋");
repeat 5 {
  print(greeting() + " " + languageName);
}
```

## Language Specification

The language is specified at its [home page](https://cs.lmu.edu/~ray/notes/carlos/).

Features include:

- Basic types: `int`, `float`, `string`, `boolean`
- Type constructors: arrays, structures, optionals, functions
- A user-accessible bottom type, `void`
- A user-accessible top type, `any`
- No billion dollar mistake!
- Fully statically typed
- Fully strongly typed (no implicit type conversions, not even between `int` and `float`)
- Type inference for local variables
- Manifest types required for empty arrays and empty optionals
- Fully first-class functions
- Function assignment covariant in return type, contravariant in parameter types
- No explicit pointers
- Sensible operators for optionals (`?.`, `?[]`, `??`)

Carlos is completely null-safe. There is no `null` value, and no `null` reference of any kind. Optionals are used for information that is not required.

## Building

Nodejs is required to build and run this project. Make sure you have a recent version of Node, since the source code uses a fair amount of very modern JavaScript.

Clone the repo, then run `npm install`.

You can then run `npm test`.

## Usage

To run from the command line:

```
node src/carlos.js <filename> <outputType>
```

The `outputType` indicates what you wish to print to standard output:

<table>
<tr><th>Option</th><th>Description</th></tr>
<tr><td>parsed</td><td>A message indicating the syntax is ok</td></tr>
<tr><td>analyzed</td><td>The program representation (AST-like)</td></tr>
<tr><td>optimized</td><td>The optimized representation</td></tr>
<tr><td>js</td><td>The translation of the program to JavaScript</td></tr>
</table>

Example runs, using the sample introductory program above:

```
$ node src/carlos.js examples/intro.carlos parsed
Syntax is ok
```

```
$ node src/carlos.js examples/intro.carlos analyzed
   1 | Program statements=[#2,#4,#11,#12]
   2 | VariableDeclaration variable=#3 initializer='"Carlos"'
   3 | Variable name='languageName' mutable=false type='string'
   4 | FunctionDeclaration fun=#5 params=[] body=[#7]
   5 | Function name='greeting' type=#6
   6 | FunctionType paramTypes=[] returnType='string'
   7 | ReturnStatement expression=#8
   8 | UnaryExpression op='random' operand=#9 type='string'
   9 | ArrayExpression elements=['"Welcome"','"こんにちは"','"Bienvenido"'] type=#10
  10 | ArrayType baseType='string'
  11 | Print args=['"👋👋👋"']
  12 | RepeatStatement count=5n body=[#13]
  13 | Print args=[#14]
  14 | BinaryExpression op='+' left=#15 right=#3 type='string'
  15 | BinaryExpression op='+' left=#16 right='" "' type='string'
  16 | FunctionCall callee=#5 args=[] type='string'
```

```
$ node src/carlos.js examples/intro.carlos optimized
   1 | Program statements=[#2,#4,#11,#12]
   2 | VariableDeclaration variable=#3 initializer='"Carlos"'
   3 | Variable name='languageName' mutable=false type='string'
   4 | FunctionDeclaration fun=#5 params=[] body=[#7]
   5 | Function name='greeting' type=#6
   6 | FunctionType paramTypes=[] returnType='string'
   7 | ReturnStatement expression=#8
   8 | UnaryExpression op='random' operand=#9 type='string'
   9 | ArrayExpression elements=['"Welcome"','"こんにちは"','"Bienvenido"'] type=#10
  10 | ArrayType baseType='string'
  11 | Print args=['"👋👋👋"']
  12 | RepeatStatement count=5n body=[#13]
  13 | Print args=[#14]
  14 | BinaryExpression op='+' left=#15 right=#3 type='string'
  15 | BinaryExpression op='+' left=#16 right='" "' type='string'
  16 | FunctionCall callee=#5 args=[] type='string'
```

```
$ node src/carlos.js examples/intro.carlos js
let languageName_1 = "Carlos";
function greeting_2() {
return ((a=>a[~~(Math.random()*a.length)])(["Welcome","こんにちは","Bienvenido"]));
}
console.log("👋👋👋");
for (let i_3 = 0; i_3 < 5; i_3++) {
console.log(((greeting_2() + " ") + languageName_1));
}
```

Pipe the output back into node to compile and run on the same line:

```
$ node src/carlos.js examples/intro.carlos js | node
👋👋👋
こんにちは Carlos
Welcome Carlos
Bienvenido Carlos
Welcome Carlos
こんにちは Carlos
```

Errors are displayed with a little bit of context:

```
$ node src/carlos.js examples/bad.carlos js
Error: Line 5, col 9:
  4 | let z = some S(1);
> 5 | let w = z.x;
              ^
  6 | print(w);
Expected a struct
```

## Contributing

I’m happy to take PRs. As usual, be nice when filing issues and contributing. Do remember the idea is to keep the language tiny; if you’d like to extend the language, you’re probably better forking into a new project. However, I would love to see any improvements you might have for the implementation or the pedagogy.

Make sure to run `npm test` before submitting the PR.

## Thanks

This project uses [Ohm](https://ohmjs.org) for much of the front end. Ohm is maintained by [Patrick Dubroy](https://github.com/sponsors/pdubroy).
