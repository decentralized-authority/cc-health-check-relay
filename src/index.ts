import fs from 'fs-extra';
import path from 'path';
import { RelayServer } from './relay-server';

const { version } = fs.readJsonSync(path.resolve(__dirname, '../package.json'));
console.log(`Starting CC Health Check Relay v${version}`);

const relayServer = new RelayServer(3100, version);
relayServer
  .start()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
