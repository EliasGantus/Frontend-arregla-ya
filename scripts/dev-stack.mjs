import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const backendRoot = path.resolve(frontendRoot, '..', 'Backend-arregla-ya');

export const resolveNpmExecutable = ({ env = process.env, platform = process.platform } = {}) => {
  if (env.npm_execpath) {
    return env.npm_execpath;
  }

  return platform === 'win32' ? 'npm.cmd' : 'npm';
};

export const createNpmRunCommand = ({
  args,
  env = process.env,
  platform = process.platform,
}) => {
  const npmExecutable = resolveNpmExecutable({ env, platform });

  if (platform === 'win32') {
    return {
      command: 'cmd.exe',
      args: ['/c', npmExecutable, ...args],
    };
  }

  return {
    command: npmExecutable,
    args,
  };
};

const run = (cwd, args, name) => {
  const { command, args: commandArgs } = createNpmRunCommand({ args });

  return spawn(command, commandArgs, {
    cwd,
    stdio: 'inherit',
    shell: false,
  }).on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} terminó con código ${code}.`);
    }
  });
};

export const startDevStack = () => {
  const children = [
    run(backendRoot, ['run', 'dev'], 'backend'),
    run(frontendRoot, ['run', 'dev', '--', '--host', '0.0.0.0'], 'frontend'),
  ];

  const shutdown = () => {
    for (const child of children) {
      child.kill('SIGINT');
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return children;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  startDevStack();
}
