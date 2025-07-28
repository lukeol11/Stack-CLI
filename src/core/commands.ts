import { execaCommand } from 'execa';
import { isStringifiedJSON, kebabCaseToTitleCase } from '../utils/stringUtils';
import { select } from '@inquirer/prompts';
import config from '../../config.json';
import ora from 'ora';
import chalk from 'chalk';

export class Commands {
  private commands: any;
  constructor() {
    this.commands = config?.commands || {};
  }

  /**
   * Handles the execution of commands based on user input.
   *
   * This function processes a given choice, which can either be a stringified JSON object
   * or a plain string command. If the input is a stringified JSON object, it parses the object,
   * generates a list of selectable options, and recursively handles the selected option.
   * If the input is a plain string, it attempts to execute the string as a shell command.
   *
   * @param choice - The user input, which can be a stringified JSON object or a plain string command.
   * @returns A promise that resolves when the command handling is complete.
   *
   * @throws Will log an error if the command execution fails or if an invalid command format is provided.
   */
  handleCommands = async (choice: string): Promise<void> => {
    if (isStringifiedJSON(choice)) {
      const parsedChoice = JSON.parse(choice);

      if (typeof parsedChoice === 'object' && parsedChoice !== null) {
        const keys = Object.keys(parsedChoice);

        const selectOptions = {
          message: 'Please select a command:',
          choices: keys.map((key) => {
            const value = parsedChoice[key];
            return {
              name: kebabCaseToTitleCase(key),
              description: typeof value === 'string' ? value : 'Select for more options',
              value: typeof value === 'object' ? JSON.stringify(value) : value,
              disabled: false,
            };
          }),
        };
        try {
          const nextChoice = await select(selectOptions);
          await this.handleCommands(nextChoice);
          return;
        } catch (err) {
          if (err.message !== 'User force closed the prompt with SIGINT') {
            console.error('An error occurred while running the CLI:', err);
          }
          return;
        }
      }
    }

    if (typeof choice === 'string') {
      const spinner = ora({
        text: chalk.yellow(`Running command: ${choice}`),
        spinner: 'dots',
      });
      try {
        await execaCommand(choice, { stdio: 'inherit', shell: true });
        spinner.stop();
      } catch (error) {
        spinner.fail(chalk.red(`Command execution failed: ${choice}`));
        console.error(error);
      }
    } else {
      console.error('Invalid command format.');
    }
  };

  /**
   * Retrieves the top-level commands from the `commands` object.
   * Each command is transformed into an object containing its name, value, description, and disabled status.
   * If a command is a group (an object), its value is stringified, and the description indicates it has more options.
   *
   * @returns {Array<{ name: string; value: string | any; description: string; disabled: boolean }>}
   * An array of objects representing the top-level commands.
   * - `name`: The command name converted to title case.
   * - `value`: The command value, stringified if it is a group.
   * - `description`: A description indicating if the command is a group or a single value.
   * - `disabled`: A boolean indicating whether the command is disabled (always `false` in this implementation).
   */
  getTopLevelCommands = (): {
    name: string;
    value: string | any;
    description: string;
    disabled: boolean;
  }[] => {
    const commands = [];
    for (const command of Object.keys(this.commands)) {
      const cmdValue = this.commands[command];

      const isGroup = typeof cmdValue === 'object' && cmdValue !== null;

      commands.push({
        name: kebabCaseToTitleCase(command),
        value: isGroup ? JSON.stringify(cmdValue) : cmdValue,
        description: isGroup ? 'Select for more options' : cmdValue,
        disabled: false,
      });
    }
    return commands;
  };
}
