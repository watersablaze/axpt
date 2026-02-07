import { ChainMirrorService } from './service';
import { log } from './logger';

async function main() {
  const svc = new ChainMirrorService();

  process.on('SIGINT', () => {
    log('warn', 'SIGINT received, stopping...');
    svc.stop();
  });
  process.on('SIGTERM', () => {
    log('warn', 'SIGTERM received, stopping...');
    svc.stop();
  });

  await svc.start();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});