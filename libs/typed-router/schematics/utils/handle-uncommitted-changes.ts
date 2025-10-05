import { SchematicsException } from '@angular-devkit/schematics';
import { spawnSync } from 'child_process';

const hasUncommittedChanges = () => {
  try {
    const gitVersionResult = spawnSync('git', ['--version']);
    if (gitVersionResult.status !== 0) {
      return false;
    }

    const gitRevParseResult = spawnSync('git', [
      'rev-parse',
      '--is-inside-work-tree',
    ]);
    if (gitRevParseResult.status !== 0) {
      return false;
    }

    const result = spawnSync('git', ['status', '--porcelain']);
    if (result.status !== 0) {
      throw new SchematicsException(
        `Failed to execute git status: ${result.stderr.toString()}`
      );
    }

    // If output is not empty, there are uncommitted changes
    return result.stdout.toString().trim() !== '';
  } catch (error) {
    throw new SchematicsException(
      'Error checking Git status: ' + (error as Error).message
    );
  }
};

export const handleUncommittedChanges = (options: {
  allowDirty?: boolean | undefined;
}) => {
  return () => {
    if (hasUncommittedChanges()) {
      if (!options.allowDirty) {
        throw new SchematicsException(
          'Operation aborted due to uncommitted changes. ' +
            'Use --allow-dirty flag to bypass this check.'
        );
      }
    }
  };
};
