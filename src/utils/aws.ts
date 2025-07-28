import chalk from 'chalk';
import { execaCommand } from 'execa';
import ora from 'ora';

/**
 * Ensures that the user is logged into AWS. If the user is not logged in,
 * it attempts to log in using AWS SSO with the provided SSO session.
 *
 * @param ssoSession - The name of the AWS SSO session to use for login.
 * @returns A promise that resolves when the login process is complete.
 * @throws An error if the AWS SSO login fails.
 */
export const ensureAwsLogin = async (ssoSession: string): Promise<void> => {
  const spinner = ora({
    text: chalk.yellow('Ensuring AWS login...'),
    spinner: 'dots',
  }).start();
  try {
    await execaCommand('aws sts get-caller-identity --query Account --output text', {
      shell: true,
      stdout: 'ignore',
      stderr: 'ignore',
    });
    spinner.succeed(chalk.bold('AWS is already logged in.'));
  } catch (err) {
    spinner.info(chalk.yellow('Logging into AWS SSO...'));
    try {
      await execaCommand(`aws sso login --sso-session ${ssoSession}`, {
        shell: true,
        stdio: 'inherit',
      });
      spinner.succeed(chalk.bold('Successfully logged into AWS SSO.'));
    } catch (loginErr) {
      console.error('AWS SSO login failed:', loginErr);
      spinner.fail(chalk.red('Failed to log into AWS SSO.'));
      throw loginErr;
    }
  }
};
