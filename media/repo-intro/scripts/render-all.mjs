import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const remotion = join(root, 'node_modules/.bin/remotion');
const mode = process.argv.includes('--covers-only')
  ? 'covers'
  : process.argv.includes('--videos-only')
    ? 'videos'
    : 'all';

const covers = [
  ['CoverEN169', 'out/covers/vue-tech-ai-research-en-16x9.png'],
  ['CoverEN916', 'out/covers/vue-tech-ai-research-en-9x16.png'],
  ['CoverZH169', 'out/covers/vue-tech-ai-research-zh-16x9.png'],
  ['CoverZH43', 'out/covers/vue-tech-ai-research-zh-4x3.png'],
  ['CoverZH916', 'out/covers/vue-tech-ai-research-zh-9x16.png']
];

const videos = [
  ['IntroEN169', 'out/videos/vue-tech-ai-research-en-16x9.mp4'],
  ['IntroEN916', 'out/videos/vue-tech-ai-research-en-9x16.mp4'],
  ['IntroZH169', 'out/videos/vue-tech-ai-research-zh-16x9.mp4'],
  ['IntroZH43', 'out/videos/vue-tech-ai-research-zh-4x3.mp4'],
  ['IntroZH916', 'out/videos/vue-tech-ai-research-zh-9x16.mp4']
];

const run = (args) => {
  const result = spawnSync(remotion, args, {cwd: root, stdio: 'inherit'});
  if (result.status !== 0) process.exit(result.status ?? 1);
};

mkdirSync(join(root, 'out/covers'), {recursive: true});
mkdirSync(join(root, 'out/videos'), {recursive: true});

if (mode === 'all' || mode === 'covers') {
  for (const [composition, output] of covers) {
    run(['still', 'src/index.tsx', composition, output, '--config=remotion.config.ts']);
  }
}

if (mode === 'all' || mode === 'videos') {
  for (const [composition, output] of videos) {
    run([
      'render',
      'src/index.tsx',
      composition,
      output,
      '--config=remotion.config.ts',
      '--codec=h264',
      '--crf=28',
      '--concurrency=2'
    ]);
  }
}
