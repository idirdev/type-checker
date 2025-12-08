import {
  Token, TokenType, Program, Statement, Expression, Type,
  VariableDeclaration, FunctionDeclaration, IfStatement,
  ReturnStatement, ExpressionStatement, TypeAliasDeclaration,
} from './types';

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const body: Statement[] = [];
    while (!this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    return { type: 'Program', body };
  }

  private parseStatement(): Statement {
    const token = this.peek();

    switch (token.type) {
      case TokenType.Let:
      case TokenType.Const:
        return this.parseVariableDeclaration();
      case TokenType.Function:
        return this.parseFunctionDeclaration();
      case TokenType.If:
        return this.parseIfStatement();
      case TokenType.Return:
        return this.parseReturnStatement();
      case TokenType.Type:
        return this.parseTypeAlias();
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseVariableDeclaration(): VariableDeclaration {
    const kindToken = this.consume();
    const kind = kindToken.value as 'let' | 'const';
    const nameToken = this.expect(TokenType.Identifier, 'Expected variable name');

    let typeAnnotation: Type | undefined;
    if (this.match(TokenType.Colon)) {
      typeAnnotation = this.parseTypeAnnotation();
    }

    this.expect(TokenType.Equals, 'Expected = in variable declaration');
    const init = this.parseExpression();
    this.matchSemicolon();

    return {
      type: 'VariableDeclaration', kind, name: nameToken.value,
      typeAnnotation, init, line: kindToken.line, column: kindToken.column,
    };
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    const fnToken = this.consume(); // function
    const nameToken = this.expect(TokenType.Identifier, 'Expected function name');
    this.expect(TokenType.OpenParen, 'Expected (');

    const params: Array<{ name: string; typeAnnotation?: Type }> = [];
    while (!this.check(TokenType.CloseParen) && !this.isAtEnd()) {
      const paramName = this.expect(TokenType.Identifier, 'Expected parameter name');
      let paramType: Type | undefined;
      if (this.match(TokenType.Colon)) {
        paramType = this.parseTypeAnnotation();
      }
      params.push({ name: paramName.value, typeAnnotation: paramType });
      if (!this.check(TokenType.CloseParen)) this.expect(TokenType.Comma, 'Expected ,');
    }
    this.expect(TokenType.CloseParen, 'Expected )');

    let returnType: Type | undefined;
    if (this.match(TokenType.Colon)) {
      returnType = this.parseTypeAnnotation();
    }

    this.expect(TokenType.OpenBrace, 'Expected {');
    const body = this.parseBlock();

    return {
      type: 'FunctionDeclaration', name: nameToken.value, params,
      returnType, body, line: fnToken.line, column: fnToken.column,
    };
  }

  private parseIfStatement(): IfStatement {
    const ifToken = this.consume(); // if
    this.expect(TokenType.OpenParen, 'Expected (');
    const condition = this.parseExpression();
    this.expect(TokenType.CloseParen, 'Expected )');
    this.expect(TokenType.OpenBrace, 'Expected {');
    const consequent = this.parseBlock();

    let alternate: Statement[] | null = null;
    if (this.match(TokenType.Else)) {
      this.expect(TokenType.OpenBrace, 'Expected {');
      alternate = this.parseBlock();
    }

    return { type: 'IfStatement', condition, consequent, alternate, line: ifToken.line, column: ifToken.column };
  }

  private parseReturnStatement(): ReturnStatement {
    const retToken = this.consume(); // return
    let value: Expression | null = null;
    if (!this.check(TokenType.Semicolon) && !this.check(TokenType.CloseBrace)) {
      value = this.parseExpression();
    }
    this.matchSemicolon();
    return { type: 'ReturnStatement', value, line: retToken.line, column: retToken.column };
  }

  private parseTypeAlias(): TypeAliasDeclaration {
    const typeToken = this.consume(); // type
    const nameToken = this.expect(TokenType.Identifier, 'Expected type name');
    this.expect(TokenType.Equals, 'Expected =');
    const typeValue = this.parseTypeAnnotation();
    this.matchSemicolon();
    return { type: 'TypeAliasDeclaration', name: nameToken.value, typeValue, line: typeToken.line, column: typeToken.column };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expr = this.parseExpression();
    this.matchSemicolon();
    return { type: 'ExpressionStatement', expression: expr, line: expr.line, column: expr.column };
  }

  private parseExpression(): Expression {
    return this.parseAssignment();
  }

  private parseAssignment(): Expression {
    const left = this.parseBinary();

    if (this.match(TokenType.Equals) && left.type === 'Identifier') {
      const value = this.parseExpression();
      return { type: 'AssignmentExpression', name: left.name, value, line: left.line, column: left.column };
    }

    return left;
  }

  private parseBinary(): Expression {
    let left = this.parseUnary();

    while (
      this.check(TokenType.Plus) || this.check(TokenType.Minus) ||
      this.check(TokenType.Star) || this.check(TokenType.Slash) ||
      this.check(TokenType.DoubleEquals) || this.check(TokenType.TripleEquals) ||
      this.check(TokenType.NotEquals) || this.check(TokenType.LessThan) ||
      this.check(TokenType.GreaterThan) || this.check(TokenType.LessEquals) ||
      this.check(TokenType.GreaterEquals) || this.check(TokenType.And) ||
      this.check(TokenType.Or)
    ) {
      const op = this.consume();
      const right = this.parseUnary();
      left = { type: 'BinaryExpression', operator: op.value, left, right, line: op.line, column: op.column };
    }

    return left;
  }

  private parseUnary(): Expression {
    return this.parseCallOrPrimary();
  }

  private parseCallOrPrimary(): Expression {
    let expr = this.parsePrimary();

    while (this.check(TokenType.OpenParen)) {
      this.consume(); // (
      const args: Expression[] = [];
      while (!this.check(TokenType.CloseParen) && !this.isAtEnd()) {
        args.push(this.parseExpression());
        if (!this.check(TokenType.CloseParen)) this.expect(TokenType.Comma, 'Expected ,');
      }
      this.expect(TokenType.CloseParen, 'Expected )');
      expr = { type: 'CallExpression', callee: expr, args, line: expr.line, column: expr.column };
    }

    return expr;
  }

  private parsePrimary(): Expression {
    const token = this.peek();

    if (token.type === TokenType.Number) {
      this.consume();
      return { type: 'NumberLiteral', value: parseFloat(token.value), line: token.line, column: token.column };
    }
    if (token.type === TokenType.String) {
      this.consume();
      return { type: 'StringLiteral', value: token.value, line: token.line, column: token.column };
    }
    if (token.type === TokenType.Boolean) {
      this.consume();
      return { type: 'BooleanLiteral', value: token.value === 'true', line: token.line, column: token.column };
    }
    if (token.type === TokenType.Null) {
      this.consume();
      return { type: 'NullLiteral', line: token.line, column: token.column };
    }
    if (token.type === TokenType.Identifier) {
      this.consume();
      return { type: 'Identifier', name: token.value, line: token.line, column: token.column };
    }
    if (token.type === TokenType.OpenParen) {
      this.consume();
      const expr = this.parseExpression();
      this.expect(TokenType.CloseParen, 'Expected )');
      return expr;
    }
    if (token.type === TokenType.OpenBracket) {
      this.consume();
      const elements: Expression[] = [];
      while (!this.check(TokenType.CloseBracket) && !this.isAtEnd()) {
        elements.push(this.parseExpression());
        if (!this.check(TokenType.CloseBracket)) this.expect(TokenType.Comma, 'Expected ,');
      }
      this.expect(TokenType.CloseBracket, 'Expected ]');
      return { type: 'ArrayLiteral', elements, line: token.line, column: token.column };
    }

    throw new Error(`Unexpected token '${token.value}' (${token.type}) at line ${token.line}, column ${token.column}`);
  }

  private parseTypeAnnotation(): Type {
    let baseType = this.parseSingleType();

    // Union types: number | string
    while (this.check(TokenType.Pipe)) {
      this.consume();
      const right = this.parseSingleType();
      if (baseType.kind === 'union') {
        (baseType as any).types.push(right);
      } else {
        baseType = { kind: 'union', types: [baseType, right] };
      }
    }

    return baseType;
  }

  private parseSingleType(): Type {
    const token = this.peek();

    if (token.type === TokenType.Identifier || token.type === TokenType.Null) {
      this.consume();
      const typeMap: Record<string, Type> = {
        number: { kind: 'number' },
        string: { kind: 'string' },
        boolean: { kind: 'boolean' },
        void: { kind: 'void' },
        any: { kind: 'any' },
        null: { kind: 'null' },
        undefined: { kind: 'undefined' },
      };

      const type = typeMap[token.value];
      if (!type) {
        // Could be a type alias reference -- treat as any for now
        return { kind: 'any' };
      }

      // Check for array type (number[])
      if (this.check(TokenType.OpenBracket) && this.tokens[this.pos + 1]?.type === TokenType.CloseBracket) {
        this.consume(); // [
        this.consume(); // ]
        return { kind: 'array', elementType: type };
      }

      return type;
    }

    throw new Error(`Expected type annotation at line ${token.line}, column ${token.column}`);
  }

  private parseBlock(): Statement[] {
    const statements: Statement[] = [];
    while (!this.check(TokenType.CloseBrace) && !this.isAtEnd()) {
      statements.push(this.parseStatement());
    }
    this.expect(TokenType.CloseBrace, 'Expected }');
    return statements;
  }

  // ─── Helpers ─────────────────────────────────

  private peek(): Token { return this.tokens[this.pos]; }
  private isAtEnd(): boolean { return this.peek().type === TokenType.EOF; }
  private check(type: TokenType): boolean { return this.peek().type === type; }

  private consume(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) { this.consume(); return true; }
    return false;
  }

  private matchSemicolon(): void {
    this.match(TokenType.Semicolon); // optional semicolons
  }

  private expect(type: TokenType, message: string): Token {
    if (this.check(type)) return this.consume();
    const token = this.peek();
    throw new Error(`${message}, got '${token.value}' (${token.type}) at line ${token.line}, column ${token.column}`);
  }
}
