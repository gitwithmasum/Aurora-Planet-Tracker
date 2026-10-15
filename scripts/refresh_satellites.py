#!/usr/bin/env python3
"""Build a compact multi-satellite catalog from CelesTrak public GP TLEs."""
import datetime as dt
import json
from pathlib import Path
from urllib.request import Request,urlopen

BASE="https://celestrak.org/NORAD/elements/gp.php?"
UTC=dt.timezone.utc
NOW=dt.datetime.now(UTC)
TARGET=Path("public/orbital-data/satellites.json")
STATIONS=[
 ("iss",25544,"International Space Station","ISS","Space station"),
 ("tiangong",48274,"Tiangong — Tianhe","Tiangong","Space station"),
 ("hubble",20580,"Hubble Space Telescope","Hubble","Space telescope"),
 ("noaa19",33591,"NOAA 19","NOAA","Weather satellite"),
 ("noaa20",43013,"NOAA 20 / JPSS-1","NOAA","Weather satellite"),
]
def fetch(url,limit=14000000):
 req=Request(url,headers={"User-Agent":"AuroraPlanetTracker/2.6 educational orbital atlas"})
 with urlopen(req,timeout=50) as response:
  if response.status!=200:raise RuntimeError("HTTP "+str(response.status))
  b=response.read(limit+1)
 if len(b)>limit:raise RuntimeError("TLE data exceeds safe size limit")
 return b.decode("utf-8")
def tle_epoch(line):
 yy=int(line[18:20]); year=(1900 if yy>=57 else 2000)+yy
 day=float(line[20:32])
 return dt.datetime(year,1,1,tzinfo=UTC)+dt.timedelta(days=day-1)
def parsed(text):
 lines=[x.strip() for x in text.splitlines() if x.strip()]
 for i in range(len(lines)-1):
  a,b=lines[i:i+2]
  if a.startswith("1 ") and b.startswith("2 ") and a[2:7]==b[2:7] and a[2:7].isdigit():
   yield a,b
def valid(a,b):
 try:
  epoch=tle_epoch(a)
  return -0.5<=(NOW-epoch).total_seconds()/86400<=5
 except(ValueError,IndexError):return False
def entry(a,b,key,name,category,kind):
 epoch=tle_epoch(a)
 return dict(id=key,noradId=int(a[2:7]),name=name,category=category,kind=kind,epoch=epoch.isoformat(),line1=a,line2=b)
items=[]
for key,norad,name,category,kind in STATIONS:
 try:
  data=fetch(BASE+f"CATNR={norad}&FORMAT=TLE",10000)
  obj=next(((a,b) for a,b in parsed(data) if int(a[2:7])==norad and valid(a,b)),None)
  if not obj:
   print("SKIP missing/stale:",norad)
   continue
  items.append(entry(*obj,key,name,category,kind))
 except Exception as exc:print("SKIP",norad,str(exc))
try:
 data=fetch(BASE+"GROUP=starlink&FORMAT=TLE")
 candidates=[(a,b) for a,b in parsed(data) if valid(a,b)]
 for a,b in candidates[:4]:
  no=int(a[2:7])
  items.append(entry(a,b,f"starlink-{no}",f"Starlink NORAD {no}","Starlink","Communications satellite"))
except Exception as exc:print("Starlink catalog unavailable:",exc)
# Without a valid ISS dataset, leave the previously published ISS TLE unaffected.
if not items:raise RuntimeError("No valid orbital records; refusing to publish an empty catalog")
TARGET.parent.mkdir(parents=True,exist_ok=True)
TARGET.write_text(json.dumps({"source":"CelesTrak public GP orbital elements","fetchedAt":NOW.isoformat(),"satellites":items},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Published",len(items),"satellites from",sorted({x["category"] for x in items}))
