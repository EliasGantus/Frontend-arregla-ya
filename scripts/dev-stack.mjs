import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const backendRoot = path.resolve(frontendRoot, '..', 'Backend-arregla-ya');
const isWindows = process.platform === 'win32';
const npmExecutable = isWindows ? 'C:\\nvm4w\\nodejs\\npm.cmd' : 'npm';

const run = (cwd, args, name) => {
  const command = isWindows ? 'cmd.exe' : npmExecutable;
  const commandArgs = isWindows ? ['/c', npmExecutable, ...args] : args;

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
