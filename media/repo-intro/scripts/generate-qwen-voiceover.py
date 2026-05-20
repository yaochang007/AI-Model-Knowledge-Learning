#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel


ROOT = Path(__file__).resolve().parents[1]
MODEL_ID = "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice"


def load_video_data() -> dict:
    return json.loads((ROOT / "src" / "video-data.json").read_text(encoding="utf-8"))


def build_tts_manifest(language_key: str, config: dict) -> dict:
    return {
        "provider": "qwen3-tts",
        "model": MODEL_ID,
        "language": config["qwenLanguage"],
        "defaultVoice": config["voice"],
        "roles": [
            {
                "name": "narrator",
                "voice": config["voice"],
                "persona": config["qwenPersona"],
            }
        ],
        "scenes": [
            {
                "id": scene["id"],
                "speaker": "narrator",
                "text": scene["text"],
                "subtitle": scene["subtitle"],
                "durationTargetSeconds": 8.0,
                "file": f"public/voiceover/{language_key}/{scene['id']}.wav",
            }
            for scene in config["scenes"]
        ],
    }


def write_spec_manifests(data: dict) -> None:
    spec_dir = ROOT / "spec"
    spec_dir.mkdir(parents=True, exist_ok=True)
    for language_key, config in data["languages"].items():
        manifest = build_tts_manifest(language_key, config)
        path = spec_dir / f"tts-manifest-{language_key}.json"
        path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    data = load_video_data()
    write_spec_manifests(data)

    print(f"Loading {MODEL_ID} on CPU. This is slower than GPU, but avoids the current Apple MPS decoder limit.", flush=True)
    model = Qwen3TTSModel.from_pretrained(MODEL_ID, dtype=torch.float32)
    model.model.to("cpu")

    audio_manifest: dict[str, dict[str, dict[str, float | str]]] = {}

    for language_key, config in data["languages"].items():
        output_dir = ROOT / "public" / "voiceover" / language_key
        output_dir.mkdir(parents=True, exist_ok=True)
        audio_manifest[language_key] = {}

        for scene in config["scenes"]:
            output_file = output_dir / f"{scene['id']}.wav"
            print(f"Generating {language_key}/{scene['id']} with {config['voice']}...", flush=True)
            wavs, sample_rate = model.generate_custom_voice(
                text=scene["text"],
                speaker=config["voice"],
                language=config["qwenLanguage"],
                instruct=config["qwenPersona"],
                do_sample=True,
                top_p=0.8,
                temperature=0.7,
            )
            sf.write(output_file, wavs[0], sample_rate)
            audio_manifest[language_key][scene["id"]] = {
                "file": f"voiceover/{language_key}/{scene['id']}.wav",
                "duration": round(len(wavs[0]) / sample_rate, 6),
            }

    (ROOT / "src" / "audio-manifest.json").write_text(
        json.dumps(audio_manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print("Qwen voiceover manifest written to src/audio-manifest.json", flush=True)


if __name__ == "__main__":
    main()
