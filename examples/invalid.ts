// Invalid TypeScript code with intentional type errors

let count: number = "not a number";

let name: string = 42;

function add(a: number, b: number): number {
  return a + b;
}

let result: string = add(1, 2);

add(1, 2, 3);

add("hello", "world");

let x: number = 10;
let y: boolean = x - 5;

let z: number = true * 10;

undeclaredVariable;

function multiply(a: number, b: number): string {
  return a * b;
}
