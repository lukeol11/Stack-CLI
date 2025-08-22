import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import { GitStatus, verifyGitStatus } from '../utils/git';
import { kebabCaseToTitleCase } from '../utils/stringUtils';
import { ensureAwsSSOLogin } from '../utils/aws';
import { checkbox } from '@inquirer/prompts';
import config from '../../config.json';

export class Makefile {
  private makefilePath: string;
  private options: any;
  constructor() {
    this.options = config?.options || {};
    this.makefilePath = config?.makefilePath;
  }

  private async getTargets(): Promise<string[]> {
    try {
      await verifyGitStatus(this.makefilePath);

      const content = await fs.readFile(this.makefilePath, 'utf-8');
      const lines = content.split('\n');

      const targetSet = new Set<string>();

      for (const line of lines) {
        if (/^[a-zA-Z0-9][^$#\/\t=]*:([^=]|$)/.test(line)) {
          const target = line.split(':')[0].trim();
          targetSet.add(target);
        }
      }

      return Array.from(targetSet).sort();
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.error('Makefile not found.');
      } else {
        console.error('Failed to read Makefile:', err);
      }
      return [];
    }
  }

  private async runTargets(targetNames: string[]): Promise<void> {
    try {
      const makefileDir = path.dirname(this.makefilePath);
      for (const targetName of targetNames) {
        await execa('make', ['-f', this.makefilePath, targetName], {
          cwd: makefileDir,
          stdout: 'ignore',
          stderr: 'inherit',
        });
      }
    } catch (error) {
      console.error(`Failed to run selected targets`, error?.stderr || error?.message);
    }
  }

  /**
   * Asynchronously prompts the user to select targets to run and executes the selected targets.
   *
   * This method retrieves a list of available targets, displays them in a checkbox prompt,
   * and allows the user to select one or more targets. If no targets are selected, the method
   * logs a message and exits. If AWS options are configured and `useForMakefile` is enabled,
   * it ensures the user is logged into AWS before proceeding. Finally, it runs the selected targets.
   *
   * @throws {Error} If an error occurs during the execution of the targets, except when the user
   * forcefully closes the prompt with SIGINT.
   *
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  makeFileServiceSelector = async (): Promise<void> => {
    try {
      const targets = await this.getTargets();
      const selectedTargets = await checkbox({
        message: 'Select targets to run:',
        required: true,
        choices: targets.map((target) => ({
          name: kebabCaseToTitleCase(target),
          value: target,
        })),
      });
      if (selectedTargets.length === 0) {
        console.log('No targets selected.');
        return;
      }

      if (this.options?.aws?.sso?.useForMakefile) {
        await ensureAwsSSOLogin(this.options?.aws?.sso?.session);
      }

      await this.runTargets(selectedTargets);
    } catch (err) {
      if (!(err instanceof Error && err.name === 'ExitPromptError')) {
        throw new Error(`An error occurred while running Makefile targets: ${err.message}`);
      }
    }
  };
}
