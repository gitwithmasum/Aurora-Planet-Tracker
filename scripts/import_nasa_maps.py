#!/usr/bin/env python3
"""Download NASA/JPL Solar System Simulator equirectangular maps.
Each source is credited in public/planet-textures/SOURCES.json.
Never imply representative or reconstructed colors are literal observations.
"""
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlparse
from pathlib import Path
import json, io
from PIL import Image, ImageOps

BASE="https://maps.jpl.nasa.gov/tmaps/"
BODIES={
 "mercury":("mercury.html","mission-derived; partial Mariner 10 imagery"),
 "venus":("venus.html","Magellan radar-derived false-color surface map, not visible-light appearance"),
 "earth":("earth.html","JPL/USGS topographic visualization, not a photographic true-color globe"),
 "mars":("mars.html","Viking mission-derived processed mosaic"),
 "jupiter":("jupiter.html","Voyager representative atmosphere composite; dated appearance"),
 "saturn":("saturn.html","artist reconstruction, NOT an actual Saturn photograph"),
 "uranus":("uranus.html","fictional plain-color stand-in, NOT an actual photograph"),
 "neptune":("neptune.html","artist-representative cloud texture, NOT an actual photograph")
}
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.href=None;self.text=""
 def handle_starttag(self,tag,attrs):
  if tag=="a":self.href=dict(attrs).get("href");self.text=""
 def handle_data(self,data):
  if self.href is not None:self.text+=data
 def handle_endtag(self,tag):
  if tag=="a" and self.href:
   self.links.append((self.href,self.text.strip()));self.href=None
def get(url):
 req=Request(url,headers={"User-Agent":"AuroraPlanetTracker/1.9 NASA educational visualization (+https://github.com/gitwithmasum/Aurora-Planet-Tracker)"})
 with urlopen(req,timeout=35) as resp:
  content=resp.read(8_000_000)
  return content
def main():
 out=Path("public/planet-textures");out.mkdir(parents=True,exist_ok=True)
 credits={}
 for body,(page,note) in BODIES.items():
  page_url=urljoin(BASE,page)
  links=Links();links.feed(get(page_url).decode("utf-8",errors="replace"))
  candidates=[urljoin(page_url,href) for href,text in links.links if "jpg" in text.lower() and urlparse(urljoin(page_url,href)).hostname in ("maps.jpl.nasa.gov","space.jpl.nasa.gov")]
  if not candidates:
   raise RuntimeError(f"No NASA/JPL JPEG texture link available: {body} on {page_url}")
  url=candidates[0]
  image=Image.open(io.BytesIO(get(url))).convert("RGB")
  if image.width<128 or image.height<64:raise ValueError(f"Unexpected map dimensions: {body}")
  if image.width>2048:image.thumbnail((2048,1024),Image.Resampling.LANCZOS)
  destination=out/(body+".jpg")
  image.save(destination,format="JPEG",quality=87,optimize=True,progressive=True)
  credits[body]={"texture":str(destination),"source":url,"sourcePage":page_url,"credit":"NASA/JPL/Caltech — Solar System Simulator map","classification":note,"width":image.width,"height":image.height}
  print(f"{body}: {image.size} from {url} ({destination.stat().st_size} bytes)")
 (out/"SOURCES.json").write_text(json.dumps(credits,indent=2)+"\n",encoding="utf-8")
if __name__=="__main__":main()
