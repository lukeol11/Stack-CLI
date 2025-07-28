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
  let gitRoot: string;

  try {
    const stat = await fs.stat(repoPath);
    if (!stat.isDirectory()) {
      cwdPath = path.dirname(repoPath);
    }
  } catch (err) {
    return check;
  }

  try {
    const { stdout } = await execaCommand('git rev-parse --show-toplevel', {
      cwd: cwdPath,
      shell: true,
    });
    gitRoot = stdout.trim();
    check.inRepository = true;
  } catch (err) {
    return check;
  }

  const spinner = ora({
    text: chalk.yellow('Verifying Git Repository status...'),
    spinner: 'dots',
  }).start();

  try {
    const { stdout } = await execaCommand('git rev-parse --abbrev-ref HEAD', {
      cwd: gitRoot,
      shell: true,
    });
    check.isMainBranch = ['main', 'master'].includes(stdout.trim());
  } catch (err) {
    console.error('Error checking current branch:', err);
  }

  try {
    const { stdout } = await execaCommand('git status --short', {
      cwd: gitRoot,
      shell: true,
    });
    check.isUpToDate = stdout.trim().length === 0;
  } catch (err) {
    console.error('Error checking repository status:', err);
  }
  spinner.stop();
  return check;
};
