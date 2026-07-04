import { spawn } from 'node:child_process';

const routes = ['/', '/tratamente', '/oferte', '/recenzii', '/scor-igiena', '/articole', '/ebook'];
const port = 4174;

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: false });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} failed with ${code}`)));
  });
}

async function waitFor(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

await run('npm', ['run', 'build']);
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'pipe', detached: true });
let exitCode = 0;
try {
  await waitFor(`http://127.0.0.1:${port}/`);
  for (const route of routes) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    const text = await response.text();
    if (!response.ok || !text.includes('<div id="root"></div>')) throw new Error(`Smoke failed for ${route}`);
    console.log(`ok ${route}`);
  }
} catch (error) {
  console.error(error.message);
  exitCode = 1;
} finally {
  try { process.kill(-server.pid, 'SIGTERM'); } catch {}
}
process.exit(exitCode);
