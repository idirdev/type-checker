import { Type } from './types';

export class Scope {
  private variables: Map<string, Type> = new Map();
  private types: Map<string, Type> = new Map();
  public parent: Scope | null;

  constructor(parent: Scope | null = null) {
    this.parent = parent;

    // If this is the root scope, declare built-in types and globals
    if (!parent) {
      this.declareBuiltIns();
    }
  }

  /**
   * Declare a variable in the current scope.
   */
  declare(name: string, type: Type): void {
    this.variables.set(name, type);
  }

  /**
   * Look up a variable, walking up the scope chain.
   */
  lookup(name: string): Type | null {
    const type = this.variables.get(name);
    if (type) return type;
    if (this.parent) return this.parent.lookup(name);
    return null;
  }

  /**
   * Check if a variable is declared in the current scope (not parents).
   */
  isDeclaredLocally(name: string): boolean {
    return this.variables.has(name);
  }

  /**
   * Declare a type alias.
   */
  declareType(name: string, type: Type): void {
    this.types.set(name, type);
  }

  /**
   * Look up a type alias.
   */
  lookupType(name: string): Type | null {
    const type = this.types.get(name);
    if (type) return type;
    if (this.parent) return this.parent.lookupType(name);
    return null;
  }

  /**
   * Create a child scope.
   */
  child(): Scope {
    return new Scope(this);
  }

  /**
   * Get all variable names in this scope.
   */
  getLocalVariables(): string[] {
    return [...this.variables.keys()];
  }

  /**
   * Register built-in types and global functions.
   */
  private declareBuiltIns(): void {
    // Built-in type aliases
    this.types.set('number', { kind: 'number' });
    this.types.set('string', { kind: 'string' });
    this.types.set('boolean', { kind: 'boolean' });
    this.types.set('void', { kind: 'void' });
    this.types.set('any', { kind: 'any' });
    this.types.set('null', { kind: 'null' });
    this.types.set('undefined', { kind: 'undefined' });

    // Global functions
    this.declare('console', {
      kind: 'object',
      properties: new Map([
        ['log', {
          kind: 'function' as const,
          params: [{ name: 'args', type: { kind: 'any' as const } }],
          returnType: { kind: 'void' as const },
        }],
      ]),
    });

    // Math-like functions
    this.declare('parseInt', {
      kind: 'function',
      params: [{ name: 'str', type: { kind: 'string' } }],
      returnType: { kind: 'number' },
    });

    this.declare('parseFloat', {
      kind: 'function',
      params: [{ name: 'str', type: { kind: 'string' } }],
      returnType: { kind: 'number' },
    });

    this.declare('isNaN', {
      kind: 'function',
      params: [{ name: 'value', type: { kind: 'number' } }],
      returnType: { kind: 'boolean' },
    });

    this.declare('String', {
      kind: 'function',
      params: [{ name: 'value', type: { kind: 'any' } }],
      returnType: { kind: 'string' },
    });

    this.declare('Number', {
      kind: 'function',
      params: [{ name: 'value', type: { kind: 'any' } }],
      returnType: { kind: 'number' },
    });

    this.declare('Boolean', {
      kind: 'function',
      params: [{ name: 'value', type: { kind: 'any' } }],
      returnType: { kind: 'boolean' },
    });
  }
}
