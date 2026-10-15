"""Import officially credited NASA/Hubble images. Run in GitHub Actions with Pillow installed."""
from pathlib import Path
from urllib.request import Request, urlopen
from io import BytesIO
import json
from PIL import Image, ImageOps

ASSETS = {
    "m51": {
        "url": "https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2005/04/STScI-01EVT85S0E93YAFY779MNYA9Y4.tif",
        "page": "https://science.nasa.gov/asset/hubble/out-of-this-whirl-the-whirlpool-galaxy-m51-and-companion-galaxy/",
        "credit": "NASA, ESA, S. Beckwith (STScI), Hubble Heritage Team (STScI/AURA)"
    },
    "m104": {
        "url": "https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2003/10/STScI-01EVT8YKVEYX7FZC7AM76BPYHZ.tif",
        "page": "https://science.nasa.gov/asset/hubble/the-majestic-sombrero-galaxy-m104/",
        "credit": "NASA and The Hubble Heritage Team (STScI/AURA)"
    }
}
target = Path("public/galaxy-images")
target.mkdir(parents=True, exist_ok=True)
sources = {}
for key, asset in ASSETS.items():
    try:
        print("Importing", key, asset["url"])
        request = Request(asset["url"], headers={"User-Agent": "AuroraPlanetTracker/2.1 (educational NASA image attribution)"})
        with urlopen(request, timeout=90) as response:
            payload = response.read(120_000_000)
        image = Image.open(BytesIO(payload))
        image = ImageOps.exif_transpose(image)
        image.thumbnail((1440, 1000), Image.Resampling.LANCZOS)
        if image.mode != "RGB":
            image = image.convert("RGB")
        image.save(target / (key + ".jpg"), quality=85, optimize=True)
        sources[key] = dict(asset, local=key+".jpg", dimensions=list(image.size))
        print("Saved",key,image.size)
    except Exception as exc:
        print("FAILED", key, repr(exc))
        raise
(target / "SOURCES.json").write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")
