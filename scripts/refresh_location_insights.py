#!/usr/bin/env python3
"""Collect timestamped current and past-7-day Open-Meteo city observations/estimates."""
import json,datetime as dt
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen
CITIES=[
 ("Dhaka","Bangladesh",23.81,90.41),("Chattogram","Bangladesh",22.36,91.78),
 ("New Delhi","India",28.61,77.21),("Mumbai","India",19.08,72.88),
 ("Tokyo","Japan",35.68,139.69),("Seoul","South Korea",37.57,126.98),
 ("Singapore","Singapore",1.29,103.85),("Dubai","United Arab Emirates",25.20,55.27),
 ("Jeddah","Saudi Arabia",21.49,39.19),("London","United Kingdom",51.51,-.13),
 ("Paris","France",48.86,2.35),("New York","United States",40.71,-74.01),
 ("Los Angeles","United States",34.05,-118.24),("Toronto","Canada",43.65,-79.38),
 ("Sydney","Australia",-33.87,151.21),("São Paulo","Brazil",-23.55,-46.63),
 ("Cairo","Egypt",30.04,31.24),("Cape Town","South Africa",-33.92,18.42)]
NOW=dt.datetime.now(dt.timezone.utc)
OUT=Path("public/earth-data/locations.json")
params={"latitude":",".join(str(x[2]) for x in CITIES),"longitude":",".join(str(x[3]) for x in CITIES),
 "current":"temperature_2m,cloud_cover,precipitation,relative_humidity_2m,wind_speed_10m",
 "daily":"temperature_2m_max,temperature_2m_min,precipitation_sum","past_days":7,"forecast_days":1,"timezone":"UTC"}
url="https://api.open-meteo.com/v1/forecast?"+urlencode(params)
request=Request(url,headers={"User-Agent":"AuroraPlanetTracker/3.5 educational weather insights"})
with urlopen(request,timeout=60) as response:
 values=json.loads(response.read(1800000).decode("utf-8"))
if not isinstance(values,list) or len(values)!=len(CITIES):
 raise RuntimeError("Open-Meteo location results missing or mismatched")
rows=[]
for (name,country,lat,lon),value in zip(CITIES,values):
 current=value.get("current") or {};daily=value.get("daily") or {}
 keys=["time","temperature_2m_max","temperature_2m_min","precipitation_sum"]
 if any(not isinstance(daily.get(k),list) for k in keys):continue
 history=[]
 for d,maximum,minimum,precip in zip(*(daily[k] for k in keys)):
  if isinstance(d,str) and all(isinstance(n,(int,float)) for n in (maximum,minimum,precip)):
   history.append({"date":d,"maxC":maximum,"minC":minimum,"rainMm":precip})
 time=current.get("time")
 if not isinstance(time,str) or len(history)<5:continue
 rows.append({"name":name,"country":country,"lat":lat,"lon":lon,
  "observedAt":time+"Z" if not time.endswith("Z") else time,
  "temperatureC":current.get("temperature_2m"),"cloudPercent":current.get("cloud_cover"),
  "precipitationMm":current.get("precipitation"),"humidityPercent":current.get("relative_humidity_2m"),
  "windKmh":current.get("wind_speed_10m"),"history":history[-8:]})
if len(rows)<12:raise RuntimeError("Insufficient valid Open-Meteo location readings")
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps({"source":"Open-Meteo Forecast API","fetchedAt":NOW.isoformat(),
 "sourceUrl":"https://open-meteo.com/en/docs","historyNote":"Past days from Open-Meteo weather-model/analysis products, not station-confirmed historical observations",
 "locations":rows},ensure_ascii=False,indent=2)+"\n")
print("Updated Earth weather insight locations",len(rows))
