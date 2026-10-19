# Landing page art

3D illustrations from **Microsoft Fluent Emoji** (https://github.com/microsoft/fluentui-emoji),
used under the MIT License (see `LICENSE-fluentui-emoji.txt`).

They were recoloured to Lendly's brand palette (deep emerald → brand green → cyan) with
`scripts/landing-art.mjs`, which keeps each object's 3D shading. To regenerate, download the
3D PNGs from the repo's `assets/<Name>/3D/` folders into a folder and run:

```bash
npm run landing-art -- <that folder>
```
