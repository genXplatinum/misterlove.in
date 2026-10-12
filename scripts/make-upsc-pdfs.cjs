// Render already-built public reading pages. Playwright + Chromium are needed
// only when refreshing these committed PDFs, not by the Pages build.
const { chromium } = require('playwright');
const { resolve } = require('node:path');

const slugs = ['start-here', 'study-plan', 'starting-check', 'lesson-01', 'mentor-instructions', 'exam-guide'];
const origin = process.argv[2] || 'http://127.0.0.1:8766';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.UPSC_CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    for (const slug of slugs) {
      const response = await page.goto(`${origin}/upsc/materials/${slug}.html`, { waitUntil: 'networkidle' });
      if (!response || response.status() !== 200) throw new Error(`Could not load ${slug}`);
      // Answer guides are collapsed on the web, but must appear in printed PDFs.
      await page.locator('details').evaluateAll(nodes => nodes.forEach(node => { node.open = true; }));
      await page.pdf({
        path: resolve(__dirname, '../public/upsc/materials', `${slug}.pdf`),
        format: 'A4', printBackground: true, preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: '<div style="font:9px sans-serif;width:100%;text-align:center;color:#52695f">UPSC Study Desk · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      });
      console.log(`Rendered ${slug}.pdf`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
