import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const data = JSON.parse(readFileSync(join(root, 'src/video-data.json'), 'utf8'));
const manifest = {};

const durationOf = (file) => {
  const info = execFileSync('afinfo', [file], {encoding: 'utf8'});
  const match = info.match(/estimated duration:\s*([0-9.]+) sec/);
  return match ? Number(match[1]) : 6;
};

for (const [language, config] of Object.entries(data.languages)) {
  const outputDir = join(root, 'public/voiceover', language);
  mkdirSync(outputDir, {recursive: true});
  manifest[language] = {};

  for (const scene of config.scenes) {
    const aiff = join(outputDir, `${scene.id}.aiff`);
    const m4a = join(outputDir, `${scene.id}.m4a`);

    rmSync(aiff, {force: true});
    rmSync(m4a, {force: true});

    execFileSync('say', ['-v', config.localVoice ?? config.voice, '-r', String(config.rate), '-o', aiff, scene.text], {stdio: 'inherit'});
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', aiff, m4a], {stdio: 'inherit'});
    rmSync(aiff, {force: true});

    manifest[language][scene.id] = {
      file: `voiceover/${language}/${scene.id}.m4a`,
      duration: durationOf(m4a)
    };
  }
}

writeFileSync(join(root, 'src/audio-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Voiceover manifest written to src/audio-manifest.json');
