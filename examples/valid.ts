// Valid TypeScript code that should pass all type checks

let count: number = 42;
let name: string = "Alice";
let active: boolean = true;

const PI: number = 3.14159;
const greeting: string = "Hello, " + name;

function add(a: number, b: number): number {
  return a + b;
}

function greet(person: string): string {
  return "Hello, " + person;
}

let result: number = add(10, 20);
let message: string = greet("Bob");

function isPositive(n: number): boolean {
  if (n > 0) {
    return true;
  } else {
    return false;
  }
}

let check: boolean = isPositive(result);
let total: number = count + 10;
let doubled: number = total * 2;
