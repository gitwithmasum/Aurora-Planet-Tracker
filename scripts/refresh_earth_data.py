#!/usr/bin/env python3
"""Build source-attributed, time-stamped sparse Earth weather samples and NASA EONET events."""
import datetime as dt
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen

NOW=dt.datetime.now(dt.timezone.utc)
POINTS=[
 ("North America",40,-100),("South America",-15,-60),("Europe",50,12),("West Africa",8,-3),
 ("East Africa",-5,36),("South Asia",23,80),("East Asia",35,120),("Southeast Asia",2,114),
 ("Australia",-25,135),("Arctic",75,0),("Antarctic",-72,35),("North Pacific",25,-155),
 ("South Pacific",-25,-135),("Atlantic",12,-35),("Indian Ocean",-20,80),("North Asia",60,90),
 ("Central America",15,-90),("Middle East",29,48),("Southern Africa",-27,25),("North Atlantic",55,-36),
]
OUT=Path("public/earth-data/summary.json")
def load(url,limit=1500000):
 request=Request(url,headers={"User-Agent":"AuroraPlanetTracker/3.1 educational Earth science atlas"})
 with urlopen(request,timeout=35) as response:
  if response.status!=200:raise RuntimeError(f"HTTP {response.status}")
  raw=response.read(limit+1)
  if len(raw)>limit:raise RuntimeError("Response unexpectedly large")
 return json.loads(raw.decode("utf-8"))
def finite(value,minimum,maximum):
 return isinstance(value,(float,int)) and not isinstance(value,bool) and minimum<=value<=maximum
def weather():
 params={"latitude":",".join(str(p[1]) for p in POINTS),"longitude":",".join(str(p[2]) for p in POINTS),
         "current":"temperature_2m,cloud_cover,precipitation","timezone":"UTC"}
 url="https://api.open-meteo.com/v1/forecast?"+urlencode(params)
 raw=load(url)
 if not isinstance(raw,list) or len(raw)!=len(POINTS):raise RuntimeError("Weather response count mismatch")
 items=[]
 for (name,lat,lon),point in zip(POINTS,raw):
  row=point.get("current") or {}
  temp,cloud,rain=row.get("temperature_2m"),row.get("cloud_cover"),row.get("precipitation")
  timestamp=row.get("time")
  if all((finite(temp,-100,65),finite(cloud,0,100),finite(rain,0,500))) and isinstance(timestamp,str):
   items.append({"name":name,"lat":lat,"lon":lon,"observedAt":timestamp+"Z" if not timestamp.endswith("Z") else timestamp,
     "temperatureC":temp,"cloudPercent":cloud,"precipitationMm":rain})
 if len(items)<10:raise RuntimeError("Too few validated weather samples")
 return items
def events():
 url="https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=40&days=30"
 raw=load(url)
 records=[]
 for event in raw.get("events",[]):
  geometries=event.get("geometry") or []
  if not geometries:continue
  geo=geometries[-1]
  shape=geo.get("coordinates")
  if geo.get("type")=="Point": point=shape
  elif geo.get("type")=="Polygon" and shape and shape[0]:point=shape[0][0]
  else:continue
  if not isinstance(point,list) or len(point)<2 or not finite(point[0],-180,180) or not finite(point[1],-90,90):continue
  title=event.get("title")
  if not isinstance(title,str):continue
  records.append({"id":str(event.get("id",""))[:50],"title":title[:140],"category":", ".join(x.get("title","") for x in event.get("categories",[]))[:100],
                  "lat":point[1],"lon":point[0],"date":geo.get("date"),"sourceUrl":f"https://eonet.gsfc.nasa.gov/api/v3/events/{event.get('id','')}"})
 return records[:24]
existing={}
if OUT.exists():
 try:existing=json.loads(OUT.read_text())
 except (ValueError,OSError):pass
result={"fetchedAt":NOW.isoformat(),"weatherSource":"Open-Meteo Forecast API (model-based point samples)",
 "weatherUrl":"https://open-meteo.com/en/docs","eventSource":"NASA EONET v3",
 "eventUrl":"https://eonet.gsfc.nasa.gov/","weatherSamples":[],"events":[]}
failures=[]
for name,fn,key in [("weather",weather,"weatherSamples"),("EONET",events,"events")]:
 try:result[key]=fn()
 except Exception as e:
  failures.append(f"{name}: {e}")
  result[key]=existing.get(key,[])
  print("Source unavailable, retaining prior data:",name,e)
if not result["weatherSamples"] and not result["events"]:raise RuntimeError("Both providers unavailable with no fallback")
# timestamps belong to the source, never relabel retained values as newly observed.
result["errors"]=failures
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Earth data:",len(result["weatherSamples"]),"weather samples and",len(result["events"]),"events")
