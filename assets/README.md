# Rhythm Dodge image assets

The image generation tool was unavailable in this session, so no generated images are claimed or included. The game is wired to load the local files below when they are added. Missing or invalid files fall back to the existing canvas artwork; image loading does not block starting or playing.

| Path | Purpose | Suggested source |
| --- | --- | --- |
| `background-neon-16x9.png` | 16:9 playfield background | 3840×2160, opaque |
| `note-cyan.png` | Top-lane regular note | transparent, 512×192 |
| `note-emerald.png` | Bottom-lane regular note | transparent, 512×192; same shape as cyan |
| `long-head-cyan.png` | Top-lane long-note head | transparent, 512×192 |
| `long-body-cyan-tile.png` | Top-lane seamless repeat tile | transparent, 256×96 |
| `long-tail-cyan.png` | Top-lane long-note tail | transparent, 256×192 |
| `long-head-emerald.png` | Bottom-lane long-note head | transparent, 512×192; same shape as cyan |
| `long-body-emerald-tile.png` | Bottom-lane seamless repeat tile | transparent, 256×96; same shape as cyan |
| `long-tail-emerald.png` | Bottom-lane long-note tail | transparent, 256×192; same shape as cyan |
| `boss-core.png` | Boss core sprite | transparent, 512×512 |

All paths are relative to `index.html`. Keep the background center dark so the two lanes, notes, simultaneous guide, judgement line, and UI remain legible. The long-note artwork is drawn from a shared head coordinate; the body tiles repeat and the tail stays at the end coordinate.

Ready-to-use prompts for these files are in [ASSET_PROMPTS.md](ASSET_PROMPTS.md).
