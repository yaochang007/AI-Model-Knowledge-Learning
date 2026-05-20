# QA Checklist

## Story
- [x] Each scene has one dominant idea.
- [x] Hook appears early in both English and Chinese videos.
- [x] Close points viewers to `research.vue.sg`.
- [x] Script still works without background music.

## Audio
- [x] Scene-split Qwen3-TTS manifests exist for English and Chinese.
- [x] English uses `Aiden`; Chinese uses `Serena`.
- [x] Audio duration drives scene duration through `src/audio-manifest.json`.
- [x] Subtitles match the spoken scene phrasing.

## Layout
- [x] Dedicated subtitle lane is reserved.
- [x] Representative 16:9 and 9:16 still frames keep text inside safe areas.
- [x] Main content does not overlap captions.
- [x] Cover images remain readable at a glance.

## Render
- [x] Five cover images rendered.
- [x] Five final videos rendered.
- [x] Output dimensions match requested aspect ratios.
- [x] Qwen voiceover replaces the previous local preview audio.
