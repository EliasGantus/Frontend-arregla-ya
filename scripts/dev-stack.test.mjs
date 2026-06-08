import { describe, expect, it } from 'vitest';

import { createNpmRunCommand, resolveNpmExecutable } from './dev-stack.mjs';

describe('dev-stack command resolution', () => {
  it('uses npm_execpath on Windows when npm provides it', () => {
    const command = createNpmRunCommand({
      args: ['run', 'dev'],
      env: {
        npm_execpath: 'C:\\Users\\dev\\AppData\\Roaming\\npm\\node_modules\\npm\\bin\\npm-cli.js',
      },
      platform: 'win32',
    });

    expect(command).toEqual({
      command: 'cmd.exe',
      args: [
        '/c',
        'C:\\Users\\dev\\AppData\\Roaming\\npm\\node_modules\\npm\\bin\\npm-cli.js',
        'run',
        'dev',
      ],
    });
  });

  it('falls back to npm.cmd on Windows without hardcoded machine paths', () => {
    expect(resolveNpmExecutable({ env: {}, platform: 'win32' })).toBe('npm.cmd');
  });

  it('uses npm directly on non-Windows platforms', () => {
    const command = createNpmRunCommand({
      args: ['run', 'dev'],
      env: {},
      platform: 'linux',
    });

    expect(command).toEqual({
      command: 'npm',
      args: ['run', 'dev'],
    });
  });
});
