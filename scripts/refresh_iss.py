#!/usr/bin/env python3
"""Refresh the publicly served ISS TLE; refuse stale or incomplete orbital elements."""
import datetime
import json
from pathlib import Path
from urllib.request import Request, urlopen

URL = "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE"
target = Path("public/orbital-data/iss.json")
req = Request(URL,headers={"User-Agent":"AuroraPlanetTracker/2.5 (+educational orbit dashboard)"})
with urlopen(req,timeout=30) as response:
    if response.status != 200: raise RuntimeError(f"CelesTrak returned HTTP {response.status}")
    lines=[line.strip() for line in response.read(10000).decode("utf-8").splitlines() if line.strip()]
idx=next((i for i in range(len(lines)-1) if lines[i].startswith("1 25544") and lines[i+1].startswith("2 25544")),None)
if idx is None: raise RuntimeError("ISS 25544 two-line elements absent")
line1,line2=lines[idx:idx+2]
year=int(line1[18:20]);year+=1900 if year>=57 else 2000
day=float(line1[20:32])
epoch=datetime.datetime(year,1,1,tzinfo=datetime.timezone.utc)+datetime.timedelta(days=day-1)
now=datetime.datetime.now(datetime.timezone.utc)
if (now-epoch).total_seconds()>5*86400 or (epoch-now).total_seconds()>43200: raise RuntimeError(f"ISS TLE epoch not recent: {epoch.isoformat()}")
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps({"source":URL,"fetchedAt":now.isoformat(),"epoch":epoch.isoformat(),"line1":line1,"line2":line2},indent=2)+"\n",encoding="utf-8")
print("ISS TLE updated:", epoch.isoformat())
