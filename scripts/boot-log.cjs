// scripts/boot-log.cjs
try {
  console.log('[boot] Node', process.version, 'cwd', process.cwd());
  process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err?.stack || err);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
  });
} catch (e) {
  console.error('[boot] init error', e);
}
