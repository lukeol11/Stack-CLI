import { select } from '@inquirer/prompts';
import { DockerCompose } from './core/dockerCompose';
import { Makefile } from './core/makeFile';
import config from '../config.json';
import { Commands } from './core/commands';

enum ChoiceValues {
  DOCKER_COMPOSE = 'dockerCompose',
  MAKEFILE = 'makefile',
}

class StackCLI {
  private dockerCompose: DockerCompose;
  private makeFile: Makefile;
  private commands: Commands;
  private config: any;
  constructor() {
    this.config = config;
    this.commands = new Commands();
  }

  start = async (): Promise<void> => {
    try {
      const selectOptions = {
        message: 'Please select a function:',
        choices: [
          {
            name: 'Docker Compose',
            value: ChoiceValues.DOCKER_COMPOSE,
            disabled: !this.config?.dockerComposePath,
            description: 'Select Docker Compose services to start',
            theme: {
              style: {
                highlight: '#f00',
              },
            },
          },
          {
            name: 'Makefile',
            value: ChoiceValues.MAKEFILE,
            disabled: !this.config?.makefilePath,
            description: 'Select Makefile targets to make',
          },
        ],
      };

      this.commands.getTopLevelCommands()?.forEach((command: any) => {
        selectOptions.choices.push(command);
      });

      const choice = await select(selectOptions);

      switch (choice) {
        case ChoiceValues.DOCKER_COMPOSE: {
          this.dockerCompose = new DockerCompose();

          await this.dockerCompose.dockerComposeServiceSelector();
          break;
        }
        case ChoiceValues.MAKEFILE: {
          this.makeFile = new Makefile();

          await this.makeFile.makeFileServiceSelector();
          break;
        }
        default:
          this.commands.handleCommands(choice);
      }
    } catch (err) {
      if (err.message !== 'User force closed the prompt with SIGINT') {
        console.error('An error occurred while running the CLI:', err);
      }
    }
  };
}

const cli = new StackCLI();
cli.start();
