#!/usr/bin/env python3
"""Fetch actual NASA GIBS MODIS Terra daily imagery and store dated, attributed snapshots."""
import datetime as dt
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT=Path("public/earth-imagery")
ROOT.mkdir(parents=True,exist_ok=True)
NOW=dt.datetime.now(dt.timezone.utc)
LAYER="MODIS_Terra_CorrectedReflectance_TrueColor"
SERVICE="https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"
manifest={"source":"NASA Global Imagery Browse Services (GIBS)","product":LAYER,
 "provider":"MODIS Terra (corrected reflectance, true color)","fetchedAt":NOW.isoformat(),
 "serviceUrl":SERVICE,"projection":"EPSG:4326","snapshots":[]}
previous={}
if (ROOT/"manifest.json").exists():
 try:previous=json.loads((ROOT/"manifest.json").read_text())
 except (ValueError,OSError):pass

for days_back in (2,3,4):
 day=(NOW-dt.timedelta(days=days_back)).date().isoformat()
 filename=f"modis-terra-{day}.jpg"
 dest=ROOT/filename
 if not dest.exists():
  params={"service":"WMS","version":"1.1.1","request":"GetMap","layers":LAYER,"styles":"",
    "srs":"EPSG:4326","bbox":"-180,-90,180,90","width":"1024","height":"512",
    "format":"image/jpeg","transparent":"false","time":day}
  url=SERVICE+"?"+urlencode(params)
  try:
   with urlopen(Request(url,headers={"User-Agent":"AuroraPlanetTracker/3.3 (educational imagery visualization)"}),timeout=50) as resp:
    mime=resp.headers.get("Content-Type","")
    data=resp.read(3500000)
   if not mime.startswith("image/jpeg") or not data.startswith(b"\xff\xd8") or len(data)<14000:
    raise RuntimeError(f"invalid imagery mime={mime} bytes={len(data)}")
   dest.write_bytes(data)
  except Exception as exc:
   print("NASA date unavailable:",day,exc)
   continue
 manifest["snapshots"].append({"date":day,"file":filename,"width":1024,"height":512,
  "layer":LAYER,"label":"MODIS Terra true-color daily mosaic","acquisitionNote":"Daily browse mosaic requested for date; may contain missing swaths"})
if not manifest["snapshots"]:
 existing=previous.get("snapshots",[])
 if not existing:raise RuntimeError("NASA GIBS imagery unavailable with no valid previous snapshot")
 manifest["snapshots"]=existing
# Retain only 3 recent validated images.
keep={item["file"] for item in manifest["snapshots"]}
for file in ROOT.glob("modis-terra-*.jpg"):
 if file.name not in keep:file.unlink()
(ROOT/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
print("NASA GIBS snapshots:",[x["date"] for x in manifest["snapshots"]])
