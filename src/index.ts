import { select } from '@inquirer/prompts';
import { DockerCompose } from './core/dockerCompose';
import { Makefile } from './core/makeFile';
import config from '../config.json';
import { Commands } from './core/commands';
import chalk from 'chalk';
import figlet from 'figlet';
import miniwi from 'figlet/importable-fonts/miniwi';
import { fetchLatestVersion, fetchPackageVersion, verifyGitStatus } from './utils/git';

figlet.parseFont('miniwi', miniwi);

enum ChoiceValues {
  DOCKER_COMPOSE = 'dockerCompose',
  MAKEFILE = 'makefile',
}

class StackCLI {
  private dockerCompose!: DockerCompose;
  private makeFile!: Makefile;
  private commands: Commands;
  private config: any;
  constructor() {
    this.config = config;
    this.commands = new Commands();
  }

  private printBanner = () => {
    figlet.text(
      this.config?.options?.name || 'Stack CLI',
      {
        font: 'miniwi',
      },
      (err, data) => {
        if (err) {
          console.error(err);
        }
        console.log(chalk.bold(data));
      },
    );
  };

  public start = async (): Promise<void> => {
    await this.printBanner();

    const [latestVersion, localVersion] = await Promise.all([fetchLatestVersion(), fetchPackageVersion()]);

    if (latestVersion !== localVersion) {
      console.log(
        chalk.yellow('Your Stack CLI version is outdated!'),
        chalk.cyan(`\n Your Version:  ${localVersion}\n Latest Version: ${latestVersion}`),
      );
      console.log(chalk.cyan(`Changelog: https://github.com/lukeol11/Stack-CLI/releases/tag/${latestVersion}\n`));
    } else {
      console.log(chalk.red('Could not fetch version information.'));
    }

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
      if (!(err instanceof Error && err.name === 'ExitPromptError')) {
        console.error('An error occurred while running the CLI:', err);
      }
    }
  };
}

const cli = new StackCLI();
cli.start();
