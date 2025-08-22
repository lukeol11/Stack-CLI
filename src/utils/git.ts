import chalk from 'chalk';
import { execaCommand } from 'execa';
import fs from 'fs/promises';
import ora from 'ora';
import path from 'path';

export type GitStatus = {
  inRepository: boolean;
  isMainBranch: boolean;
  isUpToDate: boolean;
};

/**
 * Verifies the Git status of a given repository path.
 *
 * This function checks if the specified path is part of a Git repository,
 * determines if the current branch is either "main" or "master", and verifies
 * if the repository is up-to-date with no uncommitted changes.
 *
 * @param repoPath - The file system path to the repository or a file within it.
 * @returns A promise that resolves to a `GitStatus` object containing:
 * - `inRepository`: `true` if the path is inside a Git repository, otherwise `false`.
 * - `isMainBranch`: `true` if the current branch is "main" or "master", otherwise `false`.
 * - `isUpToDate`: `true` if there are no uncommitted changes, otherwise `false`.
 */
export const verifyGitStatus = async (repoPath: string): Promise<GitStatus> => {
  const check: GitStatus = {
    inRepository: false,
    isMainBranch: false,
    isUpToDate: false,
  };
  let cwdPath = repoPath;
  let mainBranch: string = 'main';
  let gitRoot: string;

  try {
    const stat = await fs.stat(repoPath);
    if (!stat.isDirectory()) {
      cwdPath = path.dirname(repoPath);
    }
  } catch {
    return check;
  }

  const spinner = ora({
    text: 'Checking if file is inside a Git repository...',
    spinner: 'dots',
  }).start();

  try {
    const { stdout } = await execaCommand('git rev-parse --show-toplevel', {
      cwd: cwdPath,
      shell: true,
    });
    gitRoot = stdout.trim();
    check.inRepository = true;
  } catch {
    spinner.stop();
    return check;
  }

  spinner.start('Verifying Git Repository status...');

  try {
    const { stdout } = await execaCommand('git rev-parse --abbrev-ref HEAD', {
      cwd: gitRoot,
      shell: true,
    });
    mainBranch = stdout.trim();
    check.isMainBranch = ['main', 'master'].includes(stdout.trim());
  } catch (err) {
    spinner.fail(chalk.red('Failed to get current branch.'));
    console.error('Error checking current branch:', err);
  }

  try {
    const { stdout: remote } = await execaCommand(`git rev-parse origin/${mainBranch}`, {
      cwd: cwdPath,
      shell: true,
    });
    const { stdout: local } = await execaCommand(`git rev-parse ${mainBranch}`, {
      cwd: cwdPath,
      shell: true,
    });
    check.isUpToDate = local === remote;
  } catch (err) {
    spinner.fail(chalk.red('Failed to check if repository is up to date.'));
    console.error('Error checking repository status:', err);
  }

  if (!check.isMainBranch) {
    spinner.warn(chalk.yellow("Target file current branch is not 'main' or 'master'."));
  } else if (!check.isUpToDate) {
    spinner.warn(chalk.yellow('Target file repository is not up to date with remote repository or has changes.'));
  } else {
    spinner.stop();
  }

  return check;
};

export const fetchPackageVersion = async (): Promise<string> => {
  const packageJsonPath = path.join(__dirname, '../package.json');
  try {
    const data = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(data);
    return `v${packageJson.version}`;
  } catch (err) {
    console.error('Failed to read package.json:', err);
    return null;
  }
};

export const fetchLatestVersion = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.github.com/repos/lukeol11/Stack-CLI/releases/latest');
    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }
    const data = await response.json();
    return data.tag_name || 'unknown';
  } catch (err) {
    console.error('Failed to fetch latest version:', err);
    return null;
  }
};
