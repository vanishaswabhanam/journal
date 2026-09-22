// Builds the web-ready media for each journal's product page from the raw
// photos / GIFs, so every product gets treated identically.
//
//   npm run media                    # all journals in scripts/product-media.json
//   npm run media -- the-nightwatch  # just one (by slug)
//   npm run media -- --force         # rebuild even if outputs look up to date
//
// Reads  : raw files described in scripts/product-media.json (paths are
//          relative to the project root, or to $MEDIA_SOURCE_ROOT if set)
// Writes : public/images/products/<slug>/
//            hero.webp            main product image (from the transparent cutout)
//            hero-thumb.webp
//            1.webp, 2.webp …     photos, cropped to 4:5     (+ N-thumb.webp)
//            walkthrough.mp4      the GIF, cropped to a wide band, cleaned up
//            walkthrough-poster.webp
//
// Needs: sharp (npm dependency) and ffmpeg on the PATH (only for videos).
// Then prints the frontmatter to paste into the journal's file in
// src/content/grid/ — see CONTENT.md.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = process.env.MEDIA_SOURCE_ROOT ?? projectRoot;
const outRoot = path.join(projectRoot, 'public', 'images', 'products');

// ---- The look, in one place ------------------------------------------------
const PHOTO = { width: 1200, height: 1500, thumbWidth: 240, thumbHeight: 300, quality: 82 }; // 4:5
const HERO = { width: 1200, height: 1600, thumbWidth: 240, thumbHeight: 320, quality: 88 }; // 3:4, transparent
// Portrait phone shots have the journal small in the middle of a lot of
// linen, so keep only this fraction of the width (landscape shots keep it all).
const PORTRAIT_KEEP_WIDTH = 0.6;
// The walkthrough is the GIF's middle horizontal band: where the band starts
// and how tall it is, as fractions of the GIF's height (1080x1350 source).
const VIDEO_BAND = { y: 0.225, h: 0.48 };
const VIDEO_WIDTH = 1440; // upscaled from the 1080px GIF (lanczos) for retina headroom
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

const manifest = JSON.parse(readFileSync(path.join(projectRoot, 'scripts/product-media.json'), 'utf8'));
const slugs = Object.keys(manifest).filter((k) => !k.startsWith('_') && (only.length === 0 || only.includes(k)));

const fromSource = (p) => path.resolve(sourceRoot, p);
const isFresh = (src, out) => !force && existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;

// Crop a 4:5 window out of a photo. Phone portraits are cropped in tight
// around the centre; landscape shots keep their full height.
async function cropPhoto(srcPath) {
  const oriented = await sharp(srcPath).rotate().toBuffer(); // apply EXIF rotation first
  const { width: W, height: H } = await sharp(oriented).metadata();
  const portrait = H >= W;
  let cw;
  let ch;
  if (portrait) {
    cw = Math.round(W * PORTRAIT_KEEP_WIDTH);
    ch = Math.round(cw * 1.25);
  } else {
    ch = H;
    cw = Math.round(ch * 0.8);
  }
  cw = Math.min(cw, W);
  ch = Math.min(ch, H);
  const left = Math.round((W - cw) / 2);
  const top = Math.round((H - ch) / 2);
  return sharp(oriented).extract({ left, top, width: cw, height: ch });
}

const gallery = [];
for (const slug of slugs) {
  const spec = manifest[slug];
  const outDir = path.join(outRoot, slug);
  mkdirSync(outDir, { recursive: true });
  const web = `/images/products/${slug}`;
  const result = { slug, hero: null, gallery: [], video: null };

  // Hero: the transparent cutout, at full detail.
  if (spec.cutout) {
    const src = fromSource(spec.cutout);
    const out = path.join(outDir, 'hero.webp');
    if (!isFresh(src, out)) {
      const base = sharp(src).resize({ width: HERO.width, height: HERO.height, fit: 'inside' });
      await base.clone().webp({ quality: HERO.quality, alphaQuality: 90 }).toFile(out);
      await sharp(src)
        .resize({ width: HERO.thumbWidth, height: HERO.thumbHeight, fit: 'inside' })
        .webp({ quality: 80 })
        .toFile(path.join(outDir, 'hero-thumb.webp'));
    }
    result.hero = `${web}/hero.webp`;
  }

  // Photos, cropped 4:5.
  for (const [i, file] of (spec.photos ?? []).entries()) {
    const src = path.join(fromSource(spec.from), file);
    const n = i + 1;
    const out = path.join(outDir, `${n}.webp`);
    if (!isFresh(src, out)) {
      const crop = await cropPhoto(src);
      await crop.clone().resize(PHOTO.width, PHOTO.height).webp({ quality: PHOTO.quality }).toFile(out);
      await crop.clone().resize(PHOTO.thumbWidth, PHOTO.thumbHeight).webp({ quality: 78 }).toFile(path.join(outDir, `${n}-thumb.webp`));
    }
    result.gallery.push(`${web}/${n}.webp`);
  }

  // Walkthrough: GIF -> cropped, denoised, upscaled H.264 loop + poster frame.
  if (spec.video) {
    const src = path.join(fromSource(spec.from), spec.video);
    const out = path.join(outDir, 'walkthrough.mp4');
    if (!isFresh(src, out)) {
      const band = spec.videoBand ?? VIDEO_BAND;
      const even = (expr) => `trunc((${expr})/2)*2`; // h264 wants even dimensions
      const vf = [
        `crop=iw:${even(`ih*${band.h}`)}:0:${even(`ih*${band.y}`)}`,
        'hqdn3d=2:1.5:5:4', // takes the GIF's dither noise out
        `scale=${VIDEO_WIDTH}:-2:flags=lanczos`,
        'unsharp=5:5:0.5:3:3:0.0', // gives back a little edge crispness
      ].join(',');
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', vf, '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '100/3', '-an', out]);
      const frame = path.join(tmpdir(), `${slug}-poster.png`);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', out, '-vf', 'select=eq(n\\,20)', '-frames:v', '1', frame]);
      await sharp(frame).webp({ quality: 84 }).toFile(path.join(outDir, 'walkthrough-poster.webp'));
      rmSync(frame, { force: true });
    }
    result.video = `${web}/walkthrough.mp4`;
  }

  gallery.push(result);
}

// Print what to paste into each journal's frontmatter.
console.log('\nPaste into the matching file in src/content/grid/ (only the lines you want):\n');
for (const r of gallery) {
  console.log(`# ${r.slug}`);
  if (r.hero) console.log(`hero: "${r.hero}"`);
  if (r.gallery.length) {
    console.log('gallery:');
    for (const g of r.gallery) console.log(`  - "${g}"`);
  }
  if (r.video) console.log(`video: "${r.video}"`);
  console.log('');
}
