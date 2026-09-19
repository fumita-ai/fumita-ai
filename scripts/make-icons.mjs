/**
 * public/ のアイコン(SVG / PNG)を生成する。
 * PNG の書き出しには、この環境に用意されている Chromium を使う。
 *
 *   node scripts/make-icons.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { iconSvg } from './icon.mjs';

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium';
const OUT = resolve(import.meta.dirname, '../public');

const targets = [
  { file: 'icon-512.png', size: 512, padding: 10 },
  { file: 'icon-192.png', size: 192, padding: 10 },
  { file: 'apple-touch-icon.png', size: 180, padding: 10 },
  // maskable は外周が切り取られるため、中身を安全圏に収める。
  { file: 'icon-maskable-512.png', size: 512, padding: 30 },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

try {
  for (const { file, size, padding } of targets) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<!doctype html><meta charset="utf-8">
       <style>html,body{margin:0;padding:0;overflow:hidden}</style>
       ${iconSvg({ size, padding })}`,
    );
    await page.screenshot({ path: join(OUT, file) });
    await page.close();
    console.log(`generated ${file} (${size}x${size})`);
  }
} finally {
  await browser.close();
}

writeFileSync(join(OUT, 'favicon.svg'), iconSvg({ size: 64, padding: 10 }));
console.log('generated favicon.svg');
