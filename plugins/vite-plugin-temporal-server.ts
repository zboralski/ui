import { chalk } from 'zx';
import type { Plugin } from 'vite';
import {
  type TemporalServer,
  createTemporalServer,
} from '../scripts/start-temporal-server';
import { createUIServer, UIServer } from '../scripts/start-ui-server';

const { cyan, magenta } = chalk;

let temporal: TemporalServer;
let uiServer: UIServer;

const shouldSkip = (): boolean => {
  if (process.env.VERCEL) return true;
  if (process.env.HISTOIRE) return true;
  if (process.env.VITEST) return true;
  if (temporal) return true;
  if (process.platform === 'win32') return true;

  return false;
};

const getPortFromApiEndpoint = (endpoint: string, fallback = 8233): number => {
  return validatePort(
    endpoint.slice(endpoint.lastIndexOf(':') + 1, endpoint.length),
    fallback,
  );
};

const isValidPort = (port: number): boolean => {
  if (typeof port !== 'number') return false;
  if (isNaN(port)) return false;
  if (port <= 1024) return false;
  if (port > 65536) return false;
  return true;
};

const validatePort = (port: number | string, fallback: number): number => {
  port = Number(port);

  if (isValidPort(port)) return port;

  console.error(`${port} is not a valid port. Falling back to ${fallback}.`);

  if (isValidPort(fallback)) return fallback;

  throw new Error(
    `Both the provided port, ${port}, and its fallback, ${fallback}, are invalid ports.`,
  );
};

export function temporalServer(): Plugin {
  return {
    name: 'vite-plugin-temporal-server',
    enforce: 'post',
    apply: 'serve',
    async configureServer(server) {
      if (shouldSkip()) return;

      const uiPort = getPortFromApiEndpoint(server.config.env.VITE_API);
      if (server.config.mode === 'ui-server') {
        console.log(magenta(`Starting local UI Server on Port ${uiPort}...`));
        uiServer = await createUIServer(uiPort);
        await uiServer.ready();
        console.log(magenta(`UI Server is running on Port ${uiPort}`));
      } else {
        const port = validatePort(server.config.env.VITE_TEMPORAL_PORT, 7233);

        console.log(magenta(`Starting Temporal Server on Port ${port}…`));
        console.log(cyan(`Starting Temporal UI Server on Port ${uiPort}…`));

        temporal = await createTemporalServer({
          port,
          uiPort,
        });

        await temporal.ready();

        console.log(magenta(`Temporal Server is running on Port ${port}.`));
        console.log(cyan(`Temporal UI Server is running on Port ${uiPort}.`));
      }
    },
    async closeBundle() {
      await temporal?.shutdown();
      await uiServer?.shutdown();
    },
  };
}

process.on('beforeExit', async () => {
  if (!temporal) return;
  await temporal?.shutdown();
});
