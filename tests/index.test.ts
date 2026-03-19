import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer';
import { Parser } from '../src/parser';
import { TokenType } from '../src/types';

describe('Lexer', () => {
  it('tokenizes numbers', () => {
    const lexer = new Lexer('42');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.Number);
    expect(tokens[0].value).toBe('42');
  });

  it('tokenizes floating point numbers', () => {
    const lexer = new Lexer('3.14');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.Number);
    expect(tokens[0].value).toBe('3.14');
  });

  it('tokenizes strings with double quotes', () => {
    const lexer = new Lexer('"hello"');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.String);
    expect(tokens[0].value).toBe('hello');
  });

  it('tokenizes strings with single quotes', () => {
    const lexer = new Lexer("'world'");
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.String);
    expect(tokens[0].value).toBe('world');
  });

  it('tokenizes keywords', () => {
    const lexer = new Lexer('let const function if else return type');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.Let);
    expect(tokens[1].type).toBe(TokenType.Const);
    expect(tokens[2].type).toBe(TokenType.Function);
    expect(tokens[3].type).toBe(TokenType.If);
    expect(tokens[4].type).toBe(TokenType.Else);
    expect(tokens[5].type).toBe(TokenType.Return);
    expect(tokens[6].type).toBe(TokenType.Type);
  });

  it('tokenizes identifiers', () => {
    const lexer = new Lexer('foo bar_baz');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.Identifier);
    expect(tokens[0].value).toBe('foo');
    expect(tokens[1].type).toBe(TokenType.Identifier);
    expect(tokens[1].value).toBe('bar_baz');
  });

  it('tokenizes boolean literals', () => {
    const lexer = new Lexer('true false');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.Boolean);
    expect(tokens[0].value).toBe('true');
    expect(tokens[1].type).toBe(TokenType.Boolean);
    expect(tokens[1].value).toBe('false');
  });

  it('tokenizes null', () => {
    const lexer = new Lexer('null');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.Null);
  });

  it('tokenizes operators', () => {
    const lexer = new Lexer('+ - * / = == === != < > <= >= && ||');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.Plus);
    expect(tokens[1].type).toBe(TokenType.Minus);
    expect(tokens[2].type).toBe(TokenType.Star);
    expect(tokens[3].type).toBe(TokenType.Slash);
    expect(tokens[4].type).toBe(TokenType.Equals);
    expect(tokens[5].type).toBe(TokenType.DoubleEquals);
    expect(tokens[6].type).toBe(TokenType.TripleEquals);
    expect(tokens[7].type).toBe(TokenType.NotEquals);
    expect(tokens[8].type).toBe(TokenType.LessThan);
    expect(tokens[9].type).toBe(TokenType.GreaterThan);
    expect(tokens[10].type).toBe(TokenType.LessEquals);
    expect(tokens[11].type).toBe(TokenType.GreaterEquals);
    expect(tokens[12].type).toBe(TokenType.And);
    expect(tokens[13].type).toBe(TokenType.Or);
  });

  it('tokenizes delimiters', () => {
    const lexer = new Lexer('( ) { } [ ] : ; , .');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.OpenParen);
    expect(tokens[1].type).toBe(TokenType.CloseParen);
    expect(tokens[2].type).toBe(TokenType.OpenBrace);
    expect(tokens[3].type).toBe(TokenType.CloseBrace);
    expect(tokens[4].type).toBe(TokenType.OpenBracket);
    expect(tokens[5].type).toBe(TokenType.CloseBracket);
    expect(tokens[6].type).toBe(TokenType.Colon);
    expect(tokens[7].type).toBe(TokenType.Semicolon);
    expect(tokens[8].type).toBe(TokenType.Comma);
    expect(tokens[9].type).toBe(TokenType.Dot);
  });

  it('skips line comments', () => {
    const lexer = new Lexer('42 // this is a comment\n43');
    const tokens = lexer.tokenize();
    expect(tokens[0].value).toBe('42');
    expect(tokens[1].value).toBe('43');
  });

  it('skips block comments', () => {
    const lexer = new Lexer('42 /* comment */ 43');
    const tokens = lexer.tokenize();
    expect(tokens[0].value).toBe('42');
    expect(tokens[1].value).toBe('43');
  });

  it('tracks line and column numbers', () => {
    const lexer = new Lexer('let x = 5');
    const tokens = lexer.tokenize();
    expect(tokens[0].line).toBe(1);
    expect(tokens[0].column).toBe(1);
  });

  it('always ends with EOF token', () => {
    const lexer = new Lexer('42');
    const tokens = lexer.tokenize();
    expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
  });

  it('throws on unexpected characters', () => {
    const lexer = new Lexer('@');
    expect(() => lexer.tokenize()).toThrow();
  });

  it('tokenizes arrow operator', () => {
    const lexer = new Lexer('=>');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.Arrow);
  });
});

describe('Parser', () => {
  function parse(source: string) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
  }

  it('parses a variable declaration with let', () => {
    const program = parse('let x = 42;');
    expect(program.body.length).toBe(1);
    expect(program.body[0].type).toBe('VariableDeclaration');
    const decl = program.body[0] as any;
    expect(decl.kind).toBe('let');
    expect(decl.name).toBe('x');
    expect(decl.init.type).toBe('NumberLiteral');
    expect(decl.init.value).toBe(42);
  });

  it('parses a variable declaration with const', () => {
    const program = parse('const name = "hello";');
    const decl = program.body[0] as any;
    expect(decl.kind).toBe('const');
    expect(decl.name).toBe('name');
    expect(decl.init.type).toBe('StringLiteral');
    expect(decl.init.value).toBe('hello');
  });

  it('parses a variable declaration with type annotation', () => {
    const program = parse('let x: number = 5;');
    const decl = program.body[0] as any;
    expect(decl.typeAnnotation).toBeDefined();
    expect(decl.typeAnnotation.kind).toBe('number');
  });

  it('parses a function declaration', () => {
    const program = parse('function add(a: number, b: number): number { return a + b; }');
    expect(program.body[0].type).toBe('FunctionDeclaration');
    const fn = program.body[0] as any;
    expect(fn.name).toBe('add');
    expect(fn.params).toHaveLength(2);
    expect(fn.params[0].name).toBe('a');
    expect(fn.params[0].typeAnnotation.kind).toBe('number');
    expect(fn.returnType.kind).toBe('number');
    expect(fn.body).toHaveLength(1);
    expect(fn.body[0].type).toBe('ReturnStatement');
  });

  it('parses an if statement', () => {
    const program = parse('if (x > 0) { return x; }');
    expect(program.body[0].type).toBe('IfStatement');
    const ifStmt = program.body[0] as any;
    expect(ifStmt.condition.type).toBe('BinaryExpression');
    expect(ifStmt.condition.operator).toBe('>');
    expect(ifStmt.consequent).toHaveLength(1);
  });

  it('parses if-else statement', () => {
    const program = parse('if (x > 0) { return 1; } else { return 0; }');
    const ifStmt = program.body[0] as any;
    expect(ifStmt.alternate).not.toBeNull();
    expect(ifStmt.alternate).toHaveLength(1);
  });

  it('parses binary expressions', () => {
    const program = parse('1 + 2;');
    const stmt = program.body[0] as any;
    expect(stmt.expression.type).toBe('BinaryExpression');
    expect(stmt.expression.operator).toBe('+');
    expect(stmt.expression.left.value).toBe(1);
    expect(stmt.expression.right.value).toBe(2);
  });

  it('parses function calls', () => {
    const program = parse('add(1, 2);');
    const stmt = program.body[0] as any;
    expect(stmt.expression.type).toBe('CallExpression');
    expect(stmt.expression.callee.name).toBe('add');
    expect(stmt.expression.args).toHaveLength(2);
  });

  it('parses boolean literals', () => {
    const program = parse('let x = true;');
    const decl = program.body[0] as any;
    expect(decl.init.type).toBe('BooleanLiteral');
    expect(decl.init.value).toBe(true);
  });

  it('parses array literals', () => {
    const program = parse('let arr = [1, 2, 3];');
    const decl = program.body[0] as any;
    expect(decl.init.type).toBe('ArrayLiteral');
    expect(decl.init.elements).toHaveLength(3);
  });

  it('parses type alias declarations', () => {
    const program = parse('type ID = number;');
    expect(program.body[0].type).toBe('TypeAliasDeclaration');
    const alias = program.body[0] as any;
    expect(alias.name).toBe('ID');
  });

  it('parses union type annotations', () => {
    const program = parse('let x: number | string = 42;');
    const decl = program.body[0] as any;
    expect(decl.typeAnnotation.kind).toBe('union');
    expect(decl.typeAnnotation.types).toHaveLength(2);
  });
});
