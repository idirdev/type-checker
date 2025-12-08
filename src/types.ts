// ─── Type System ─────────────────────────────────────────

export type Type =
  | NumberType
  | StringType
  | BooleanType
  | ArrayType
  | ObjectType
  | FunctionType
  | UnionType
  | NullType
  | UndefinedType
  | AnyType
  | VoidType;

export interface NumberType { kind: 'number'; }
export interface StringType { kind: 'string'; }
export interface BooleanType { kind: 'boolean'; }
export interface NullType { kind: 'null'; }
export interface UndefinedType { kind: 'undefined'; }
export interface AnyType { kind: 'any'; }
export interface VoidType { kind: 'void'; }

export interface ArrayType {
  kind: 'array';
  elementType: Type;
}

export interface ObjectType {
  kind: 'object';
  properties: Map<string, Type>;
}

export interface FunctionType {
  kind: 'function';
  params: Array<{ name: string; type: Type }>;
  returnType: Type;
}

export interface UnionType {
  kind: 'union';
  types: Type[];
}

// ─── Token Types ─────────────────────────────────────────

export enum TokenType {
  // Literals
  Number = 'Number',
  String = 'String',
  Boolean = 'Boolean',
  Null = 'Null',
  Identifier = 'Identifier',

  // Keywords
  Let = 'Let',
  Const = 'Const',
  Function = 'Function',
  If = 'If',
  Else = 'Else',
  Return = 'Return',
  Type = 'Type',

  // Operators
  Plus = 'Plus',
  Minus = 'Minus',
  Star = 'Star',
  Slash = 'Slash',
  Equals = 'Equals',
  DoubleEquals = 'DoubleEquals',
  TripleEquals = 'TripleEquals',
  NotEquals = 'NotEquals',
  LessThan = 'LessThan',
  GreaterThan = 'GreaterThan',
  LessEquals = 'LessEquals',
  GreaterEquals = 'GreaterEquals',
  And = 'And',
  Or = 'Or',
  Not = 'Not',
  Pipe = 'Pipe',

  // Delimiters
  OpenParen = 'OpenParen',
  CloseParen = 'CloseParen',
  OpenBrace = 'OpenBrace',
  CloseBrace = 'CloseBrace',
  OpenBracket = 'OpenBracket',
  CloseBracket = 'CloseBracket',
  Colon = 'Colon',
  Semicolon = 'Semicolon',
  Comma = 'Comma',
  Arrow = 'Arrow',
  Dot = 'Dot',

  // Special
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// ─── AST Node Types ─────────────────────────────────────

export interface Program {
  type: 'Program';
  body: Statement[];
}

export type Statement =
  | VariableDeclaration
  | FunctionDeclaration
  | IfStatement
  | ReturnStatement
  | ExpressionStatement
  | TypeAliasDeclaration;

export interface VariableDeclaration {
  type: 'VariableDeclaration';
  kind: 'let' | 'const';
  name: string;
  typeAnnotation?: Type;
  init: Expression;
  line: number;
  column: number;
}

export interface FunctionDeclaration {
  type: 'FunctionDeclaration';
  name: string;
  params: Array<{ name: string; typeAnnotation?: Type }>;
  returnType?: Type;
  body: Statement[];
  line: number;
  column: number;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: Expression;
  consequent: Statement[];
  alternate: Statement[] | null;
  line: number;
  column: number;
}

export interface ReturnStatement {
  type: 'ReturnStatement';
  value: Expression | null;
  line: number;
  column: number;
}

export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: Expression;
  line: number;
  column: number;
}

export interface TypeAliasDeclaration {
  type: 'TypeAliasDeclaration';
  name: string;
  typeValue: Type;
  line: number;
  column: number;
}

export type Expression =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | IdentifierExpr
  | BinaryExpression
  | CallExpression
  | AssignmentExpression
  | ArrayLiteralExpr;

export interface NumberLiteral { type: 'NumberLiteral'; value: number; line: number; column: number; }
export interface StringLiteral { type: 'StringLiteral'; value: string; line: number; column: number; }
export interface BooleanLiteral { type: 'BooleanLiteral'; value: boolean; line: number; column: number; }
export interface NullLiteral { type: 'NullLiteral'; line: number; column: number; }
export interface IdentifierExpr { type: 'Identifier'; name: string; line: number; column: number; }

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
  line: number;
  column: number;
}

export interface CallExpression {
  type: 'CallExpression';
  callee: Expression;
  args: Expression[];
  line: number;
  column: number;
}

export interface AssignmentExpression {
  type: 'AssignmentExpression';
  name: string;
  value: Expression;
  line: number;
  column: number;
}

export interface ArrayLiteralExpr {
  type: 'ArrayLiteral';
  elements: Expression[];
  line: number;
  column: number;
}
