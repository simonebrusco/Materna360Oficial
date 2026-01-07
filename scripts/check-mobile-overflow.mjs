import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

const routes = [
  { name: 'Maternar', path: '/' },
  { name: 'Cuidar de Mim', path: '/maternar/cuidar-de-mim' },
  { name: 'Meu Filho', path: '/maternar/meu-filho' },
  { name: 'Meu Dia Leve', path: '/maternar/meu-dia-leve' },
  { name: 'Minha Jornada', path: '/maternar/minha-jornada' },
  { name: 'Minhas Conquistas', path: '/maternar/minhas-conquistas' },
];

const VIEWPORT = { width: 390, height: 844 };
const THRESHOLD = 2;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT });

  for (const route of routes) {
    console.log(`\n🔎 ${route.name} — ${route.path}`);
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });

    const offenders = await page.evaluate((THRESHOLD) => {
      const out = [];
      const all = Array.from(document.querySelectorAll('body *'));

      for (const el of all) {
        const style = getComputedStyle(el);
        if (style.position === 'fixed') continue;

        if (el.scrollWidth - el.clientWidth > THRESHOLD) {
          const cls = typeof el.className === 'string'
            ? el.className.slice(0, 80)
            : '';

          out.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class: cls,
            clientWidth: el.clientWidth,
            scrollWidth: el.scrollWidth,
            delta: el.scrollWidth - el.clientWidth,
          });
        }
      }

      return out.sort((a, b) => b.delta - a.delta).slice(0, 5);
    }, THRESHOLD);

    if (!offenders.length) {
      console.log('✅ nenhum overflow detectado');
      continue;
    }

    console.table(offenders);
  }

  await browser.close();
})();
