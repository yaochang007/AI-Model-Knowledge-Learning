# Vue Tech SG AI Research Intro Videos

This folder contains a self-contained Remotion project for bilingual introduction videos and feature images for the Vue Tech SG AI Research repository.

## Titles

- English: **Decode AI Papers Faster**
- Chinese: **AI论文，一站读懂**

## Outputs

Generated outputs are written to `out/`:

- `covers/vue-tech-ai-research-en-16x9.png`
- `covers/vue-tech-ai-research-en-9x16.png`
- `covers/vue-tech-ai-research-zh-16x9.png`
- `covers/vue-tech-ai-research-zh-4x3.png`
- `covers/vue-tech-ai-research-zh-9x16.png`
- `videos/vue-tech-ai-research-en-16x9.mp4`
- `videos/vue-tech-ai-research-en-9x16.mp4`
- `videos/vue-tech-ai-research-zh-16x9.mp4`
- `videos/vue-tech-ai-research-zh-4x3.mp4`
- `videos/vue-tech-ai-research-zh-9x16.mp4`

## Commands

```bash
npm install
npm run typecheck
npm run compositions
npm run voiceover
npm run render
```

The voiceover script uses the local system speech engine and writes scene-split audio files plus `src/audio-manifest.json`.
