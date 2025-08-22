import { execa } from 'execa';
import fs from 'fs/promises';
import yaml from 'yaml';
import { verifyGitStatus, type GitStatus } from '../utils/git';
import { kebabCaseToTitleCase } from '../utils/stringUtils';
import { checkbox, confirm } from '@inquirer/prompts';
import { ensureAwsSSOLogin } from '../utils/aws';
import config from '../../config.json';

export class DockerCompose {
  private options: any;
  private configPath: string;
  constructor() {
    this.options = config?.options || {};
    this.configPath = config?.dockerComposePath;
  }
  private services: Record<string, any> = {};

  private async getServices(): Promise<string[]> {
    try {
      await verifyGitStatus(this.configPath);

      const data = await fs.readFile(this.configPath, 'utf-8');
      const parsed = yaml.parse(data);

      if (parsed && typeof parsed.services === 'object') {
        const services = Object.keys(parsed.services);
        services.forEach((service) => {
          this.services[service] = parsed.services[service];
        });
        services.sort();
        return services;
      } else {
        console.error('No services defined in Docker Compose file.');
        return [];
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.error('Docker Compose file not found.');
      } else {
        console.error('Failed to read Docker Compose file:', err);
      }
      return [];
    }
  }

  private async pullServices(serviceNames: string[]): Promise<void> {
    try {
      for (const serviceName of serviceNames) {
        await execa('docker', ['compose', '-f', this.configPath, 'pull', serviceName], {
          stdout: 'ignore',
          stderr: 'inherit',
        });
      }
    } catch (error: any) {
      console.error(`Failed to pull services: "${serviceNames?.join(', ')}":`, error.stderr || error.message);
    }
  }

  private async startServices(serviceNames: string[]): Promise<void> {
    try {
      for (const serviceName of serviceNames) {
        await execa('docker', ['compose', '-f', this.configPath, 'up', '-d', serviceName], {
          stdout: 'ignore',
          stderr: 'inherit',
        });
      }
      this.printPorts(serviceNames);
    } catch (error: any) {
      console.error(`Failed to start services: "${serviceNames?.join(', ')}":`, error.stderr || error.message);
    }
  }

  private async printPorts(services: string[]) {
    console.log('\n📡 Service ports:');

    services.forEach((service) => {
      console.log(`    ✅ ${service}: `, this.services[service].ports?.join(', '));
    });
  }

  /**
   * Prompts the user to select Docker Compose services to start, optionally pulls the latest images,
   * and starts the selected services. Handles AWS login if required by the options.
   *
   * @async
   * @returns {Promise<void>} Resolves when the services are successfully started or no services are selected.
   */
  dockerComposeServiceSelector = async (): Promise<void> => {
    try {
      const services = await this.getServices();
      const selectedServices = await checkbox({
        message: 'Select services to start:',
        required: true,
        theme: {
          icon: {
            checked: '🐳',
          },
        },
        choices: services.map((service) => ({
          name: kebabCaseToTitleCase(service),
          value: service,
        })),
      });

      if (selectedServices.length === 0) {
        console.log('No services selected.');
        return;
      }

      if (this.options?.aws?.sso?.useForDockerCompose) {
        await ensureAwsSSOLogin(this.options?.aws?.sso?.session);
      }

      const pullFirst = await confirm({
        message: 'Do you want to pull the latest images before starting the services?',
        default: true,
      });
      if (pullFirst) {
        await this.pullServices(selectedServices);
      }

      await this.startServices(selectedServices);
    } catch (err: any) {
      if (!(err instanceof Error && err.name === 'ExitPromptError')) {
        throw new Error(`Failed to select Docker Compose services: ${err.message}`);
      }
    }
  };
}
