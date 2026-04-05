> **Archived** — Kept for reference. Not part of the current portfolio. See [ts-toolkit](https://github.com/idirdev/ts-toolkit) instead.

# type-checker

[![TypeScript](https://img.shields.io/badge/TypeScript-4.5-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)

A mini type checker and linter for a subset of TypeScript. An educational project that implements lexing, parsing, and type checking from scratch.

## What It Does

This tool parses a subset of TypeScript and checks for type errors, similar to what `tsc --noEmit` does but for a simplified language. It is designed as a learning tool to understand how type systems work.

## Supported Syntax

- **Variable declarations**: `let x: number = 5;` and `const y: string = "hello";`
- **Function declarations**: `function add(a: number, b: number): number { return a + b; }`
- **Type annotations**: `number`, `string`, `boolean`, `void`, `any`, `null`, `undefined`
- **Union types**: `number | string`
- **Array types**: `number[]`
- **If/else statements**: `if (cond) { ... } else { ... }`
- **Return statements**: `return value;`
- **Binary operations**: `+`, `-`, `*`, `/`, `==`, `===`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`
- **Function calls**: `add(1, 2)`
- **Type aliases**: `type ID = number | string;`
- **Comments**: `// line` and `/* block */`

## Type Rules

| Rule | Code | Description |
|------|------|-------------|
| Assignment | TC2322 | Source type must be assignable to target type |
| Undefined name | TC2304 | All variables must be declared before use |
| Not callable | TC2349 | Only function types can be called |
| Arg count | TC2554 | Function calls must match parameter count |
| Arg type | TC2345 | Arguments must match parameter types |
| Arithmetic | TC2362 | `-`, `*`, `/` require number operands |
| Implicit any | TC7005 | Variable with untyped initializer (strict mode) |
| Param any | TC7006 | Parameter without type annotation (strict mode) |

## Installation

```bash
npm install
npm run build
```

## Usage

### CLI

```bash
# Check a file
type-checker examples/valid.ts

# Check multiple files
type-checker src/a.ts src/b.ts

# Strict mode (warns on implicit any)
type-checker --strict examples/valid.ts

# Verbose output
type-checker --verbose examples/invalid.ts
```

### Example Output

```
Checking examples/invalid.ts...
  examples/invalid.ts:3:1 - error (TC2322): Type 'string' is not assignable to type 'number'
  examples/invalid.ts:5:1 - error (TC2322): Type 'number' is not assignable to type 'string'
  examples/invalid.ts:11:1 - error (TC2322): Type 'number' is not assignable to type 'string'
  examples/invalid.ts:13:1 - error (TC2554): Expected 2 argument(s), but got 3
  examples/invalid.ts:15:5 - error (TC2345): Argument of type 'string' is not assignable to parameter of type 'number'
  examples/invalid.ts:18:1 - error (TC2322): Type 'number' is not assignable to type 'boolean'
  examples/invalid.ts:20:20 - error (TC2362): The left-hand side of '*' must be of type 'number', got 'boolean'
  examples/invalid.ts:22:1 - error (TC2304): Cannot find name 'undeclaredVariable'
  examples/invalid.ts:25:3 - error (TC2322): Type 'number' is not assignable to return type 'string'

Summary: 9 error(s), 0 warning(s)
```

## Architecture

The type checker has four stages:

```
Source Code --> Lexer --> Tokens --> Parser --> AST --> Checker --> Errors
```

1. **Lexer** (`src/lexer.ts`) -- Tokenizes source code into a stream of tokens (identifiers, numbers, strings, operators, keywords)
2. **Parser** (`src/parser.ts`) -- Parses tokens into an AST with variable declarations, function declarations, if statements, expressions
3. **Type Checker** (`src/checker.ts`) -- Walks the AST, infers types, checks assignments and function calls, reports mismatches
4. **Scope** (`src/scope.ts`) -- Manages variable scopes with parent chain lookup, declares built-in types and globals

## Limitations

This is an educational project and does not cover the full TypeScript language:

- No classes, interfaces, enums, or generics
- No destructuring or spread operators
- No modules or imports
- No template literals
- No optional chaining or nullish coalescing
- Object types are not deeply checked
- Limited control flow analysis

## License

MIT

---

## 🇫🇷 Documentation en français

### Description
**type-checker** est une bibliothèque TypeScript utilitaire pour la vérification et la validation des types à l'exécution. Elle fournit des gardes de type, des prédicats et des fonctions d'assertion pour s'assurer que les données correspondent aux types attendus, particulièrement utile pour valider des données JSON externes.

### Installation
```bash
npm install @idirdev/type-checker
```

### Utilisation
```typescript
import { isString, assertNumber } from "@idirdev/type-checker";
if (isString(value)) { /* value est typé string */ }
assertNumber(value);   // Lève une erreur si value n'est pas un nombre
```
