#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import chalk from 'chalk';
import { Lexer } from './lexer';
import { Parser } from './parser';
import { TypeChecker } from './checker';
import { TypeCheckError } from './errors';

const program = new Command();

program
  .name('type-checker')
  .description('Mini type checker for a subset of TypeScript')
  .version('1.0.0')
  .argument('<files...>', 'TypeScript files to check')
  .option('--strict', 'Enable strict mode (no implicit any)', false)
  .option('--verbose', 'Show detailed output', false)
  .action((files: string[], opts) => {
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.error(chalk.red(`File not found: ${file}`));
        process.exit(1);
      }

      const source = fs.readFileSync(file, 'utf8');
      console.log(chalk.cyan(`\nChecking ${file}...`));

      try {
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();

        if (opts.verbose) {
          console.log(chalk.gray(`  Tokens: ${tokens.length}`));
        }

        const parser = new Parser(tokens);
        const ast = parser.parse();

        if (opts.verbose) {
          console.log(chalk.gray(`  AST nodes: ${ast.body.length}`));
        }

        const checker = new TypeChecker({ strict: opts.strict });
        const errors = checker.check(ast);

        for (const error of errors) {
          console.log(error.format(file));
          if (error.severity === 'error') totalErrors++;
          else totalWarnings++;
        }

        if (errors.length === 0) {
          console.log(chalk.green(`  No type errors found.`));
        }
      } catch (e) {
        console.error(chalk.red(`  Parse error: ${(e as Error).message}`));
        totalErrors++;
      }
    }

    console.log(`\n${chalk.bold('Summary:')} ${totalErrors} error(s), ${totalWarnings} warning(s)`);
    process.exit(totalErrors > 0 ? 1 : 0);
  });

program.parse();
