import chalk from 'chalk';

export type Severity = 'error' | 'warning';

export class TypeCheckError {
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly severity: Severity;
  readonly code: string;

  constructor(
    message: string,
    line: number,
    column: number,
    severity: Severity = 'error',
    code: string = 'TC0000'
  ) {
    this.message = message;
    this.line = line;
    this.column = column;
    this.severity = severity;
    this.code = code;
  }

  /**
   * Format the error for terminal output with colors.
   */
  format(filename?: string): string {
    const location = filename
      ? `${filename}:${this.line}:${this.column}`
      : `${this.line}:${this.column}`;

    const severityLabel = this.severity === 'error'
      ? chalk.red('error')
      : chalk.yellow('warning');

    const codeLabel = chalk.gray(`(${this.code})`);

    return `  ${chalk.cyan(location)} - ${severityLabel} ${codeLabel}: ${this.message}`;
  }

  /**
   * Format without colors (for testing or file output).
   */
  toString(): string {
    return `${this.line}:${this.column} ${this.severity} ${this.code}: ${this.message}`;
  }

  /**
   * Convert to a structured object.
   */
  toJSON(): Record<string, unknown> {
    return {
      message: this.message,
      line: this.line,
      column: this.column,
      severity: this.severity,
      code: this.code,
    };
  }
}
