import {
  Program, Statement, Expression, Type,
  VariableDeclaration, FunctionDeclaration, IfStatement,
  ReturnStatement, ExpressionStatement,
} from './types';
import { TypeCheckError } from './errors';
import { Scope } from './scope';

interface CheckerOptions {
  strict?: boolean;
}

export class TypeChecker {
  private scope: Scope;
  private errors: TypeCheckError[] = [];
  private currentFunctionReturnType: Type | null = null;
  private strict: boolean;

  constructor(options: CheckerOptions = {}) {
    this.scope = new Scope();
    this.strict = options.strict ?? false;
  }

  check(program: Program): TypeCheckError[] {
    this.errors = [];
    this.scope = new Scope();

    for (const stmt of program.body) {
      this.checkStatement(stmt);
    }

    return this.errors;
  }

  private checkStatement(stmt: Statement): void {
    switch (stmt.type) {
      case 'VariableDeclaration': return this.checkVariableDeclaration(stmt);
      case 'FunctionDeclaration': return this.checkFunctionDeclaration(stmt);
      case 'IfStatement': return this.checkIfStatement(stmt);
      case 'ReturnStatement': return this.checkReturnStatement(stmt);
      case 'ExpressionStatement': return this.checkExpressionStatement(stmt);
      case 'TypeAliasDeclaration':
        this.scope.declareType(stmt.name, stmt.typeValue);
        return;
    }
  }

  private checkVariableDeclaration(decl: VariableDeclaration): void {
    const initType = this.inferType(decl.init);

    if (decl.typeAnnotation) {
      if (!this.isAssignable(initType, decl.typeAnnotation)) {
        this.errors.push(new TypeCheckError(
          `Type '${this.typeToString(initType)}' is not assignable to type '${this.typeToString(decl.typeAnnotation)}'`,
          decl.line, decl.column, 'error', 'TC2322'
        ));
      }
      this.scope.declare(decl.name, decl.typeAnnotation);
    } else {
      if (this.strict && initType.kind === 'any') {
        this.errors.push(new TypeCheckError(
          `Variable '${decl.name}' implicitly has an 'any' type`,
          decl.line, decl.column, 'warning', 'TC7005'
        ));
      }
      this.scope.declare(decl.name, initType);
    }
  }

  private checkFunctionDeclaration(fn: FunctionDeclaration): void {
    const paramTypes: Array<{ name: string; type: Type }> = fn.params.map(p => ({
      name: p.name,
      type: p.typeAnnotation || { kind: 'any' as const },
    }));

    const returnType: Type = fn.returnType || { kind: 'any' };
    const fnType: Type = { kind: 'function', params: paramTypes, returnType };
    this.scope.declare(fn.name, fnType);

    // Check strict mode: parameters without types
    if (this.strict) {
      for (const param of fn.params) {
        if (!param.typeAnnotation) {
          this.errors.push(new TypeCheckError(
            `Parameter '${param.name}' implicitly has an 'any' type`,
            fn.line, fn.column, 'warning', 'TC7006'
          ));
        }
      }
    }

    // Enter function scope
    this.scope = this.scope.child();
    const prevReturnType = this.currentFunctionReturnType;
    this.currentFunctionReturnType = fn.returnType || null;

    for (const param of fn.params) {
      this.scope.declare(param.name, param.typeAnnotation || { kind: 'any' });
    }

    for (const stmt of fn.body) {
      this.checkStatement(stmt);
    }

    this.currentFunctionReturnType = prevReturnType;
    this.scope = this.scope.parent!;
  }

  private checkIfStatement(ifStmt: IfStatement): void {
    this.inferType(ifStmt.condition); // check condition is valid

    this.scope = this.scope.child();
    for (const stmt of ifStmt.consequent) {
      this.checkStatement(stmt);
    }
    this.scope = this.scope.parent!;

    if (ifStmt.alternate) {
      this.scope = this.scope.child();
      for (const stmt of ifStmt.alternate) {
        this.checkStatement(stmt);
      }
      this.scope = this.scope.parent!;
    }
  }

  private checkReturnStatement(ret: ReturnStatement): void {
    if (!ret.value) return;

    const valueType = this.inferType(ret.value);

    if (this.currentFunctionReturnType) {
      if (!this.isAssignable(valueType, this.currentFunctionReturnType)) {
        this.errors.push(new TypeCheckError(
          `Type '${this.typeToString(valueType)}' is not assignable to return type '${this.typeToString(this.currentFunctionReturnType)}'`,
          ret.line, ret.column, 'error', 'TC2322'
        ));
      }
    }
  }

  private checkExpressionStatement(stmt: ExpressionStatement): void {
    if (stmt.expression.type === 'AssignmentExpression') {
      const varType = this.scope.lookup(stmt.expression.name);
      if (!varType) {
        this.errors.push(new TypeCheckError(
          `Cannot find name '${stmt.expression.name}'`,
          stmt.line, stmt.column, 'error', 'TC2304'
        ));
        return;
      }
      const valueType = this.inferType(stmt.expression.value);
      if (!this.isAssignable(valueType, varType)) {
        this.errors.push(new TypeCheckError(
          `Type '${this.typeToString(valueType)}' is not assignable to type '${this.typeToString(varType)}'`,
          stmt.line, stmt.column, 'error', 'TC2322'
        ));
      }
    } else {
      this.inferType(stmt.expression);
    }
  }

  // ─── Type Inference ────────────────────────────

  private inferType(expr: Expression): Type {
    switch (expr.type) {
      case 'NumberLiteral': return { kind: 'number' };
      case 'StringLiteral': return { kind: 'string' };
      case 'BooleanLiteral': return { kind: 'boolean' };
      case 'NullLiteral': return { kind: 'null' };
      case 'ArrayLiteral': {
        if (expr.elements.length === 0) return { kind: 'array', elementType: { kind: 'any' } };
        const elementType = this.inferType(expr.elements[0]);
        return { kind: 'array', elementType };
      }

      case 'Identifier': {
        const type = this.scope.lookup(expr.name);
        if (!type) {
          this.errors.push(new TypeCheckError(
            `Cannot find name '${expr.name}'`,
            expr.line, expr.column, 'error', 'TC2304'
          ));
          return { kind: 'any' };
        }
        return type;
      }

      case 'BinaryExpression':
        return this.checkBinaryExpression(expr);

      case 'CallExpression':
        return this.checkCallExpression(expr);

      case 'AssignmentExpression': {
        return this.inferType(expr.value);
      }
    }
  }

  private checkBinaryExpression(expr: Expression & { type: 'BinaryExpression' }): Type {
    const leftType = this.inferType(expr.left);
    const rightType = this.inferType(expr.right);
    const op = expr.operator;

    // Arithmetic operators
    if (['+', '-', '*', '/'].includes(op)) {
      if (op === '+') {
        // String concatenation
        if (leftType.kind === 'string' || rightType.kind === 'string') {
          return { kind: 'string' };
        }
        // Number addition
        if (leftType.kind === 'number' && rightType.kind === 'number') {
          return { kind: 'number' };
        }
        if (leftType.kind !== 'any' && rightType.kind !== 'any') {
          this.errors.push(new TypeCheckError(
            `Operator '+' cannot be applied to types '${this.typeToString(leftType)}' and '${this.typeToString(rightType)}'`,
            expr.line, expr.column, 'error', 'TC2365'
          ));
        }
        return { kind: 'any' };
      }

      // Other arithmetic: both must be numbers
      if (leftType.kind !== 'number' && leftType.kind !== 'any') {
        this.errors.push(new TypeCheckError(
          `The left-hand side of '${op}' must be of type 'number', got '${this.typeToString(leftType)}'`,
          expr.line, expr.column, 'error', 'TC2362'
        ));
      }
      if (rightType.kind !== 'number' && rightType.kind !== 'any') {
        this.errors.push(new TypeCheckError(
          `The right-hand side of '${op}' must be of type 'number', got '${this.typeToString(rightType)}'`,
          expr.line, expr.column, 'error', 'TC2363'
        ));
      }
      return { kind: 'number' };
    }

    // Comparison operators
    if (['==', '===', '!=', '<', '>', '<=', '>='].includes(op)) {
      return { kind: 'boolean' };
    }

    // Logical operators
    if (['&&', '||'].includes(op)) {
      return { kind: 'boolean' };
    }

    return { kind: 'any' };
  }

  private checkCallExpression(expr: Expression & { type: 'CallExpression' }): Type {
    const calleeType = this.inferType(expr.callee);

    if (calleeType.kind === 'any') return { kind: 'any' };

    if (calleeType.kind !== 'function') {
      this.errors.push(new TypeCheckError(
        `This expression is not callable`,
        expr.line, expr.column, 'error', 'TC2349'
      ));
      return { kind: 'any' };
    }

    // Check argument count
    if (expr.args.length !== calleeType.params.length) {
      this.errors.push(new TypeCheckError(
        `Expected ${calleeType.params.length} argument(s), but got ${expr.args.length}`,
        expr.line, expr.column, 'error', 'TC2554'
      ));
    }

    // Check argument types
    const checkCount = Math.min(expr.args.length, calleeType.params.length);
    for (let i = 0; i < checkCount; i++) {
      const argType = this.inferType(expr.args[i]);
      const paramType = calleeType.params[i].type;
      if (!this.isAssignable(argType, paramType)) {
        this.errors.push(new TypeCheckError(
          `Argument of type '${this.typeToString(argType)}' is not assignable to parameter of type '${this.typeToString(paramType)}'`,
          expr.args[i].line, expr.args[i].column, 'error', 'TC2345'
        ));
      }
    }

    return calleeType.returnType;
  }

  // ─── Type Compatibility ────────────────────────

  private isAssignable(source: Type, target: Type): boolean {
    if (target.kind === 'any' || source.kind === 'any') return true;
    if (source.kind === target.kind) return true;

    if (target.kind === 'union') {
      return target.types.some(t => this.isAssignable(source, t));
    }
    if (source.kind === 'null' && target.kind !== 'null') {
      // null is not assignable to non-null types in strict mode
      return !this.strict;
    }

    return false;
  }

  private typeToString(type: Type): string {
    switch (type.kind) {
      case 'number': return 'number';
      case 'string': return 'string';
      case 'boolean': return 'boolean';
      case 'null': return 'null';
      case 'undefined': return 'undefined';
      case 'any': return 'any';
      case 'void': return 'void';
      case 'array': return `${this.typeToString(type.elementType)}[]`;
      case 'union': return type.types.map(t => this.typeToString(t)).join(' | ');
      case 'function':
        const params = type.params.map(p => `${p.name}: ${this.typeToString(p.type)}`).join(', ');
        return `(${params}) => ${this.typeToString(type.returnType)}`;
      case 'object': return 'object';
    }
  }
}
