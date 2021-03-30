import assert from "assert"
import parse from "../src/parser.js"
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
      let x = 3.1 * 7.0;
      let y = true;
      y = 5.0 ** -x / -100.0 > - x || false;
      print((y && y) || false || (x*2.0) != 5.0);
    `,
    expected: dedent`
      let x_1 = 21.7;
      let y_2 = true;
      y_2 = ((((5 ** -(x_1)) / -100) > -(x_1)) || false);
      print_3(((y_2 && y_2) || false || ((x_1 * 2) !== 5)));
    `,
  },
  {
    name: "iffy",
    source: `
      let x = 0;
      if (x == 0) { print(1); }
      if (x == 0) { print(1); } else { print(2); }
      if (x == 0) { print(1); } else if (x == 2) { print(3); }
      if (x == 0) { print(1); } else if (x == 2) { print(3); } else { print(4); }
    `,
    expected: dedent`
      let x_1 = 0;
      if ((x_1 === 0)) {
        print_2(1);
      }
      if ((x_1 === 0)) {
        print_2(1);
      } else {
        print_2(2);
      }
      if ((x_1 === 0)) {
        print_2(1);
      } else {
        if ((x_1 === 2)) {
          print_2(3);
        }
      }
      if ((x_1 === 0)) {
        print_2(1);
      } else
        if ((x_1 === 2)) {
          print_2(3);
        } else {
          print_2(4);
        }
    `,
  },
  {
    name: "whiley",
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
          print_3((x_1 * y_2));
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
        print_5((Math.sin(x_3) > Math.PI));
        return;
      }
      function g_6() {
        return false;
      }
      f_2(z_1, g_6());
    `,
  },
  {
    name: "arrays",
    source: `
      let a = [true, false, true];
      let b = [10, 40 - 20, 30];
      const c = [](of [int]);
      print(a[1] || (b[0] < 88));
    `,
    expected: dedent`
      let a_1 = [true,false,true];
      let b_2 = [10,20,30];
      let c_3 = [];
      print_4((a_1[1] || (b_2[0] < 88)));
    `,
  },
]

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(parse(fixture.source))))
      assert.deepStrictEqual(actual, fixture.expected)
    })
  }
})
