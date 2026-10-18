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
import { existsSync, mkdirSync, readFileSync, statSync, rmSync, writeFileSync } from 'node:fs';
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

// Phone-held portraits have the journal small in the middle of a lot of
// excess linen/background, so those get cropped in tight around the
// centre. Landscape flat-lay shots are a different kind of photo — already
// composed with the product filling most of the frame — so forcing them
// through the same crop cut into the product itself (an interior shot's
// edges got sliced off; see git history for the real example that caught
// this). Those are left uncropped, just resized to fit — `fit: 'inside'`
// everywhere downstream means nothing ever gets cropped at the resize
// step either, so a landscape photo's full-frame content always survives,
// just displayed smaller/letterboxed by the gallery (which already
// handles non-4:5 photos fine, same as it does the video's poster frame).
async function cropPhoto(srcPath) {
  const oriented = await sharp(srcPath).rotate().toBuffer(); // apply EXIF rotation first
  const { width: W, height: H } = await sharp(oriented).metadata();
  const portrait = H >= W;
  if (!portrait) return sharp(oriented);

  const cw = Math.min(Math.round(W * PORTRAIT_KEEP_WIDTH), W);
  const ch = Math.min(Math.round(cw * 1.25), H);
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

  // Photos: cropped 4:5 for portraits, resized-to-fit (no crop) for
  // landscape shots — see cropPhoto above. `fit: 'inside'` here means
  // resizing never crops either, however the source is shaped.
  //
  // A plain string goes through that orientation-based crop; an entry
  // shaped { file, noCrop: true } skips it outright. That escape hatch
  // exists because orientation alone isn't always a reliable signal — a
  // flat-lay shot taken in portrait camera orientation (journal laid
  // wide across the frame, lots of empty linen above/below) looks
  // "portrait" by raw pixel dimensions but is composed like a landscape
  // shot, so the portrait crop slices into the sides of the actual
  // subject instead of just trimming excess linen.
  for (const [i, entry] of (spec.photos ?? []).entries()) {
    const file = typeof entry === 'string' ? entry : entry.file;
    const noCrop = typeof entry === 'object' && entry.noCrop;
    const src = path.join(fromSource(spec.from), file);
    const n = i + 1;
    const out = path.join(outDir, `${n}.webp`);
    if (!isFresh(src, out)) {
      const crop = noCrop ? sharp(await sharp(src).rotate().toBuffer()) : await cropPhoto(src);
      await crop
        .clone()
        .resize({ width: PHOTO.width, height: PHOTO.height, fit: 'inside' })
        .webp({ quality: PHOTO.quality })
        .toFile(out);
      await crop
        .clone()
        .resize({ width: PHOTO.thumbWidth, height: PHOTO.thumbHeight, fit: 'inside' })
        .webp({ quality: 78 })
        .toFile(path.join(outDir, `${n}-thumb.webp`));
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

  // Walkthrough, take two: no GIF for this journal, just a burst of stills
  // (iPhone burst shot while flipping through the insert/pages) — stitch
  // those into the same kind of looping clip instead, one still held per
  // frame rather than a continuous recording.
  if (spec.videoFrames?.length) {
    const out = path.join(outDir, 'walkthrough.mp4');
    const frameSrcs = spec.videoFrames.map((f) => path.join(fromSource(spec.from), f));
    const newestFrame = Math.max(...frameSrcs.map((f) => statSync(f).mtimeMs));
    if (force || !existsSync(out) || statSync(out).mtimeMs < newestFrame) {
      const tmp = path.join(tmpdir(), `${slug}-frames`);
      mkdirSync(tmp, { recursive: true });
      // Match the GIF-based walkthroughs exactly: crop the same wide
      // horizontal band (VIDEO_BAND — full width, a slice of the height)
      // out of every frame, instead of forcing each still into a portrait
      // photo canvas (which, combined with a vertical-only crop, was
      // cropping some frames down to a thin sliver when a frame's own
      // aspect ratio didn't land near 4:5). Every frame in one journal's
      // burst shares the same source dimensions, so the crop rect is
      // identical across frames — the concat demuxer just plays one
      // identically-shaped image after another.
      const cropFrame = async (f) => {
        const oriented = await sharp(f).rotate().toBuffer();
        const { width: W, height: H } = await sharp(oriented).metadata();
        const top = Math.round(H * VIDEO_BAND.y);
        const height = Math.min(Math.round(H * VIDEO_BAND.h), H - top);
        return sharp(oriented).extract({ left: 0, top, width: W, height });
      };
      for (const [i, f] of frameSrcs.entries()) {
        await (await cropFrame(f)).resize({ width: VIDEO_WIDTH }).toFile(path.join(tmp, `${String(i).padStart(3, '0')}.png`));
      }
      const FRAME_SECONDS = 0.45;
      const listFile = path.join(tmp, 'list.txt');
      const lines = frameSrcs.map((_, i) => `file '${path.join(tmp, `${String(i).padStart(3, '0')}.png`)}'\nduration ${FRAME_SECONDS}`);
      // concat demuxer quirk: the last entry's duration is ignored unless
      // the file is listed again after it with no duration following.
      lines.push(`file '${path.join(tmp, `${String(frameSrcs.length - 1).padStart(3, '0')}.png`)}'`);
      writeFileSync(listFile, lines.join('\n'));
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-vf', `scale=${VIDEO_WIDTH}:-2:flags=lanczos`, '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '24', out]);
      await (await cropFrame(frameSrcs[0]))
        .resize({ width: VIDEO_WIDTH })
        .webp({ quality: 84 })
        .toFile(path.join(outDir, 'walkthrough-poster.webp'));
      rmSync(tmp, { recursive: true, force: true });
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
