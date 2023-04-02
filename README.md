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
<tr><td>analyzed</td><td>The decorated AST</td></tr>
<tr><td>optimized</td><td>The optimized decorated AST</td></tr>
<tr><td>js</td><td>The translation of the program to JavaScript</td></tr>
</table>

Example runs, using the sample introductory program above:

```
$ node src/carlos.js examples/intro.carlos parsed
Syntax is ok
```

```
$ node src/carlos.js examples/intro.carlos analyzed

```

```
$ node src/carlos.js examples/small.carlos optimized

```

```
$ node src/carlos.js examples/small.carlos js

```

Errors are displayed with a little bit of context:

```
 node src/carlos.js examples/bad.carlos js

```

## Contributing

I’m happy to take PRs. As usual, be nice when filing issues and contributing. Do remember the idea is to keep the language tiny; if you’d like to extend the language, you’re probably better forking into a new project. However, I would love to see any improvements you might have for the implementation or the pedagogy.

Make sure to run `npm test` before submitting the PR.

## Thanks

This project uses [Ohm](https://ohmjs.org) for much of the front end. Ohm is maintained by [Patrick Dubroy](https://github.com/sponsors/pdubroy).
