export const access = "public";
export const methods = ["POST"];

function xmlDecode(s=''){
  return String(s).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}
function attrs(s=''){
  const out={};
  const re=/([:\w-]+)="([^"]*)"/g; let m;
  while((m=re.exec(s))) out[m[1]]=xmlDecode(m[2]);
  return out;
}
function tagsFromBody(body=''){
  const out={}; const re=/<tag\s+k="([^"]+)"\s+v="([^"]*)"\s*\/>/g; let m;
  while((m=re.exec(body))) out[xmlDecode(m[1])]=xmlDecode(m[2]);
  return out;
}
function parseOsm(xml){
  const nodes=new Map();
  const turning=[];
  let m;
  const nodeRe=/<node\b([^>]*?)(?:\/>|>([\s\S]*?)<\/node>)/g;
  while((m=nodeRe.exec(xml))){
    const a=attrs(m[1]); if(!a.id||!a.lat||!a.lon) continue;
    const node={id:a.id,lat:+a.lat,lon:+a.lon,tags:tagsFromBody(m[2]||'')};
    nodes.set(a.id,node);
    if(node.tags.highway==='turning_circle'||node.tags.highway==='turning_loop') turning.push(node);
  }
  const keep=new Set(['motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link','unclassified','residential','living_street','service']);
  const roads=[];
  const wayRe=/<way\b[^>]*>([\s\S]*?)<\/way>/g;
  while((m=wayRe.exec(xml))){
    const body=m[1]; const t=tagsFromBody(body); const highway=t.highway;
    if(!keep.has(highway)) continue;
    if(highway==='service' && (!t.name || ['driveway','parking_aisle','alley'].includes(t.service||''))) continue;
    const refs=[]; const ndRe=/<nd\s+ref="([^"]+)"\s*\/>/g; let n;
    while((n=ndRe.exec(body))) refs.push(n[1]);
    const pts=refs.map(id=>nodes.get(id)).filter(Boolean).map(p=>({lat:p.lat,lon:p.lon}));
    if(pts.length<2) continue;
    roads.push({name:t.name||'',highway,oneway:t.oneway||'',points:pts});
  }
  return {roads,turning:turning.map(n=>({lat:n.lat,lon:n.lon}))};
}
function pickGeocode(items){
  if(!items?.length) return null;
  return items.find(x=>/British Columbia/i.test(x.display_name||''))||items[0];
}
export default async function(req,res){
  try{
    const body=req.body||{};
    const raw=String(body.address||'').trim();
    if(!raw) return res.status(400).json({error:'address_required'});
    const radius=Math.max(50,Math.min(500,Number(body.radius)||260));
    const q=/Canada|BC|British Columbia/i.test(raw)?raw:`${raw}, British Columbia, Canada`;
    const geoUrl='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ca&q='+encodeURIComponent(q);
    const gr=await fetch(geoUrl,{headers:{'User-Agent':'LCT-TMM-Assistant/2.0'}});
    if(!gr.ok) throw new Error('Geocoding failed');
    const gj=await gr.json();
    const best=pickGeocode(gj);
    if(!best) return res.status(404).json({error:'address_not_found'});
    const lat=+best.lat, lon=+best.lon;
    const latD=radius/111320;
    const lonD=radius/(111320*Math.max(.2,Math.cos(lat*Math.PI/180)));
    const bbox=[lon-lonD,lat-latD,lon+lonD,lat+latD].join(',');
    const osmUrl='https://api.openstreetmap.org/api/0.6/map?bbox='+bbox;
    const or=await fetch(osmUrl,{headers:{'User-Agent':'LCT-TMM-Assistant/2.0'}});
    if(!or.ok) throw new Error('Road data failed');
    const xml=await or.text();
    const parsed=parseOsm(xml);
    return res.json({
      location:{lat,lon,display_name:best.display_name||raw,requested:raw},
      radius,
      roads:parsed.roads,
      turning:parsed.turning,
      source:'OpenStreetMap contributors'
    });
  }catch(e){
    console.error(e);
    return res.status(500).json({error:'road_plan_failed',message:String(e?.message||e)});
  }
}