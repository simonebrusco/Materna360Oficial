import { setTelemetryProvider, type TelemetryEvent, type TelemetryContext } from './telemetry';

type TelemetryEnvelope = {
  event: TelemetryEvent;
  payload: Record<string, unknown>;
  ctx: TelemetryContext;
  ts: string;
};

async function send(envelope: TelemetryEnvelope) {
  const url = process.env.ANALYTICS_URL;
  if (!url) {
    // eslint-disable-next-line no-console
    console.log('[telemetry][server]', envelope);
    return;
  }
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelope),
  }).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn('[telemetry] send failed', e);
  });
}

const buffer: TelemetryEnvelope[] = [];
const BATCH_SIZE = 10;
const FLUSH_MS = 3000;
let timer: ReturnType<typeof setTimeout> | null = null;

function queue(envelope: TelemetryEnvelope) {
  buffer.push(envelope);
  if (buffer.length >= BATCH_SIZE) {
    void flush();
  } else if (!timer) {
    timer = setTimeout(() => {
      void flush();
    }, FLUSH_MS);
  }
}

async function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const toSend = buffer.splice(0, buffer.length);
  if (!toSend.length) return;

  const url = process.env.ANALYTICS_BATCH_URL ?? process.env.ANALYTICS_URL;
  if (!url) {
    // eslint-disable-next-line no-console
    console.log('[telemetry][server][batch]', toSend);
    return;
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[telemetry] batch failed; falling back to single sends', e);
    for (const env of toSend) {
      await send(env);
    }
  }
}

setTelemetryProvider(async (event, payload = {}, ctx = {}) => {
  const envelope: TelemetryEnvelope = {
    event,
    payload,
    ctx,
    ts: new Date().toISOString(),
  };
  if (process.env.ANALYTICS_BATCH_URL) {
    queue(envelope);
  } else {
    await send(envelope);
  }
});

export async function flushTelemetry() {
  await flush();
}
