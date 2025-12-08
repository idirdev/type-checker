import { Token, TokenType } from './types';

const KEYWORDS: Record<string, TokenType> = {
  let: TokenType.Let,
  const: TokenType.Const,
  function: TokenType.Function,
  if: TokenType.If,
  else: TokenType.Else,
  return: TokenType.Return,
  type: TokenType.Type,
  true: TokenType.Boolean,
  false: TokenType.Boolean,
  null: TokenType.Null,
};

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    this.tokens = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;

    while (this.pos < this.source.length) {
      this.skipWhitespaceAndComments();
      if (this.pos >= this.source.length) break;

      const ch = this.source[this.pos];

      // Numbers
      if (this.isDigit(ch)) {
        this.readNumber();
        continue;
      }

      // Strings
      if (ch === '"' || ch === "'") {
        this.readString(ch);
        continue;
      }

      // Identifiers and keywords
      if (this.isAlpha(ch) || ch === '_') {
        this.readIdentifier();
        continue;
      }

      // Two-character operators
      const next = this.source[this.pos + 1];
      if (ch === '=' && next === '=') {
        if (this.source[this.pos + 2] === '=') {
          this.emit(TokenType.TripleEquals, '===', 3);
        } else {
          this.emit(TokenType.DoubleEquals, '==', 2);
        }
        continue;
      }
      if (ch === '!' && next === '=') { this.emit(TokenType.NotEquals, '!=', 2); continue; }
      if (ch === '<' && next === '=') { this.emit(TokenType.LessEquals, '<=', 2); continue; }
      if (ch === '>' && next === '=') { this.emit(TokenType.GreaterEquals, '>=', 2); continue; }
      if (ch === '&' && next === '&') { this.emit(TokenType.And, '&&', 2); continue; }
      if (ch === '|' && next === '|') { this.emit(TokenType.Or, '||', 2); continue; }
      if (ch === '=' && next === '>') { this.emit(TokenType.Arrow, '=>', 2); continue; }

      // Single-character tokens
      const singleTokens: Record<string, TokenType> = {
        '+': TokenType.Plus, '-': TokenType.Minus,
        '*': TokenType.Star, '/': TokenType.Slash,
        '=': TokenType.Equals, '<': TokenType.LessThan,
        '>': TokenType.GreaterThan, '!': TokenType.Not,
        '|': TokenType.Pipe,
        '(': TokenType.OpenParen, ')': TokenType.CloseParen,
        '{': TokenType.OpenBrace, '}': TokenType.CloseBrace,
        '[': TokenType.OpenBracket, ']': TokenType.CloseBracket,
        ':': TokenType.Colon, ';': TokenType.Semicolon,
        ',': TokenType.Comma, '.': TokenType.Dot,
      };

      if (singleTokens[ch]) {
        this.emit(singleTokens[ch], ch, 1);
        continue;
      }

      throw new Error(`Unexpected character '${ch}' at line ${this.line}, column ${this.column}`);
    }

    this.tokens.push({ type: TokenType.EOF, value: '', line: this.line, column: this.column });
    return this.tokens;
  }

  private readNumber(): void {
    const start = this.pos;
    const startCol = this.column;
    while (this.pos < this.source.length && (this.isDigit(this.source[this.pos]) || this.source[this.pos] === '.')) {
      this.advance();
    }
    this.tokens.push({ type: TokenType.Number, value: this.source.slice(start, this.pos), line: this.line, column: startCol });
  }

  private readString(quote: string): void {
    const startCol = this.column;
    this.advance(); // opening quote
    const start = this.pos;
    while (this.pos < this.source.length && this.source[this.pos] !== quote) {
      if (this.source[this.pos] === '\\') this.advance(); // skip escaped char
      this.advance();
    }
    const value = this.source.slice(start, this.pos);
    this.advance(); // closing quote
    this.tokens.push({ type: TokenType.String, value, line: this.line, column: startCol });
  }

  private readIdentifier(): void {
    const start = this.pos;
    const startCol = this.column;
    while (this.pos < this.source.length && (this.isAlphaNumeric(this.source[this.pos]) || this.source[this.pos] === '_')) {
      this.advance();
    }
    const word = this.source.slice(start, this.pos);
    const tokenType = KEYWORDS[word] || TokenType.Identifier;
    this.tokens.push({ type: tokenType, value: word, line: this.line, column: startCol });
  }

  private skipWhitespaceAndComments(): void {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
      } else if (ch === '\n') {
        this.pos++;
        this.line++;
        this.column = 1;
      } else if (ch === '/' && this.source[this.pos + 1] === '/') {
        // Line comment
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
          this.advance();
        }
      } else if (ch === '/' && this.source[this.pos + 1] === '*') {
        // Block comment
        this.advance(); this.advance();
        while (this.pos < this.source.length - 1 && !(this.source[this.pos] === '*' && this.source[this.pos + 1] === '/')) {
          if (this.source[this.pos] === '\n') { this.line++; this.column = 0; }
          this.advance();
        }
        this.advance(); this.advance(); // */
      } else {
        break;
      }
    }
  }

  private emit(type: TokenType, value: string, length: number): void {
    this.tokens.push({ type, value, line: this.line, column: this.column });
    for (let i = 0; i < length; i++) this.advance();
  }

  private advance(): void {
    this.pos++;
    this.column++;
  }

  private isDigit(ch: string): boolean { return ch >= '0' && ch <= '9'; }
  private isAlpha(ch: string): boolean { return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z'); }
  private isAlphaNumeric(ch: string): boolean { return this.isAlpha(ch) || this.isDigit(ch); }
}
