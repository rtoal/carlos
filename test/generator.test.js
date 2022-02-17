import assert from "assert/strict"
import ast from "../src/ast.js"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import generate from "../src/generator.js"

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim()
}

const fixtures = [
  {
    name: "small",
    source: `
      let x = 3 * 7;
      x++;
      x--;
      let y = true;
      y = 5 ** -x / -100 > - x || false;
      print((y && y) || false || (x*2) != 5);
    `,
    expected: dedent`
      let x_1 = 21;
      x_1++;
      x_1--;
      let y_2 = true;
      y_2 = (((5 ** -(x_1)) / -(100)) > -(x_1));
      console.log(((y_2 && y_2) || ((x_1 * 2) !== 5)));
    `,
  },
  {
    name: "if",
    source: `
      let x = 0;
      if (x == 0) { print("1"); }
      if (x == 0) { print(1); } else { print(2); }
      if (x == 0) { print(1); } else if (x == 2) { print(3); }
      if (x == 0) { print(1); } else if (x == 2) { print(3); } else { print(4); }
    `,
    expected: dedent`
      let x_1 = 0;
      if ((x_1 === 0)) {
        console.log("1");
      }
      if ((x_1 === 0)) {
        console.log(1);
      } else {
        console.log(2);
      }
      if ((x_1 === 0)) {
        console.log(1);
      } else {
        if ((x_1 === 2)) {
          console.log(3);
        }
      }
      if ((x_1 === 0)) {
        console.log(1);
      } else
        if ((x_1 === 2)) {
          console.log(3);
        } else {
          console.log(4);
        }
    `,
  },
  {
    name: "while",
    source: `
      let x = 0;
      while x < 5 {
        let y = 0;
        while y < 5 {
          print(x * y);
          y = y + 1;
          break;
        }
        x = x + 1;
      }
    `,
    expected: dedent`
      let x_1 = 0;
      while ((x_1 < 5)) {
        let y_2 = 0;
        while ((y_2 < 5)) {
          console.log((x_1 * y_2));
          y_2 = (y_2 + 1);
          break;
        }
        x_1 = (x_1 + 1);
      }
    `,
  },
  {
    name: "functions",
    source: `
      let z = 0.5;
      function f(x: float, y: boolean) {
        print(sin(x) > π);
        return;
      }
      function g(): boolean {
        return false;
      }
      f(z, g());
    `,
    expected: dedent`
      let z_1 = 0.5;
      function f_2(x_3, y_4) {
        console.log((Math.sin(x_3) > Math.PI));
        return;
      }
      function g_5() {
        return false;
      }
      f_2(z_1, g_5());
    `,
  },
  {
    name: "arrays",
    source: `
      let a = [true, false, true];
      let b = [10, 40 - 20, 30];
      const c = [](of [int]);
      print(a[1] || (b[0] < 88 ? false : true));
    `,
    expected: dedent`
      let a_1 = [true,false,true];
      let b_2 = [10,20,30];
      let c_3 = [];
      console.log((a_1[1] || (((b_2[0] < 88)) ? (false) : (true))));
    `,
  },
  {
    name: "structs",
    source: `
      struct S { x: int }
      let x = S(3);
      print(x.x);
    `,
    expected: dedent`
      class S_1 {
      constructor(x_2) {
      this["x_2"] = x_2;
      }
      }
      let x_3 = new S_1(3);
      console.log((x_3["x_2"]));
    `,
  },
  {
    name: "optionals",
    source: `
      let x = no int;
      let y = x ?? 2;
    `,
    expected: dedent`
      let x_1 = undefined;
      let y_2 = (x_1 ?? 2);
    `,
  },
  {
    name: "for loops",
    source: `
      for i in 1..<50 {
        print(i);
      }
      for j in [10, 20, 30] {
        print(j);
      }
      repeat 3 {
        // hello
      }
      for k in 1...10 {
      }
    `,
    expected: dedent`
      for (let i_1 = 1; i_1 < 50; i_1++) {
        console.log(i_1);
      }
      for (let j_2 of [10,20,30]) {
        console.log(j_2);
      }
      for (let i_3 = 0; i_3 < 3; i_3++) {
      }
      for (let k_4 = 1; k_4 <= 10; k_4++) {
      }
    `,
  },
  {
    name: "standard library",
    source: `
      let x = 0.5;
      print(sin(x) - cos(x) + exp(x) * ln(x) / hypot(2.3, x));
      print(bytes("∞§¶•"));
      print(codepoints("💪🏽💪🏽🖖👩🏾💁🏽‍♀️"));
    `,
    expected: dedent`
      let x_1 = 0.5;
      console.log(((Math.sin(x_1) - Math.cos(x_1)) + ((Math.exp(x_1) * Math.log(x_1)) / Math.hypot(2.3,x_1))));
      console.log([...Buffer.from("∞§¶•", "utf8")]);
      console.log([...("💪🏽💪🏽🖖👩🏾💁🏽‍♀️")].map(s=>s.codePointAt(0)));
    `,
  },
]

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(ast(fixture.source))))
      assert.deepEqual(actual, fixture.expected)
    })
  }
})
