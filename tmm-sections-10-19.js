(function(){
  "use strict";

  const extraFigures = {
    "10":[
      ["10.2","Continuously Slow-Moving Work","Two-Lane, Two-Way Roadway"],
      ["10.3","Intermittently-Moving Work","Two-Lane, Two-Way Roadway"],
      ["10.4","Continuously Slow-Moving Work","Multilane Undivided or Divided Roadway"],
      ["10.5","Intermittently-Moving Work","Multilane Undivided or Divided Roadway"],
      ["10.6","Rolling Slowdown","Mobile Work"]
    ],
    "11":[
      ["11.2","Intersection Lane Closure — Two-Lane, Two-Way Roadway","with TCPs (Near Side)"],
      ["11.3","Intersection Lane Closure — Two-Lane, Two-Way Roadway","with Detour (Near Side)"],
      ["11.4","Intersection Lane Closure — Two-Lane, Two-Way Roadway","with TCPs (Far Side)"],
      ["11.5","Intersection Lane Closure — Two-Lane, Two-Way Roadway","with Detour (Far Side)"],
      ["11.6","Right Lane Closure (Near Side)","Multilane Intersection · Short and Long Duration"],
      ["11.7","Left Lane Closure (Far Side)","Multilane Intersection · Short and Long Duration"],
      ["11.8","Right Lane Closure (Far Side)","Multilane Intersection · Short and Long Duration"],
      ["11.9","Left/Right Lane Closure within Intersection","Multilane Intersection"],
      ["11.10","Right Lane Closure with Right-Turn Lane (Near Side)","Channelized Right Turn Open · Multilane Intersection"],
      ["11.11","Two Lanes Closed (Near Side)","Multilane Intersection · Short and Long Duration"],
      ["11.12","Two-Lane Closure","Multilane Intersection · Short and Long Duration"],
      ["11.13","Multiple Lane Closure (Far Side) with Dedicated Left-Turn Lane","Multilane Intersection"],
      ["11.14","Midblock Sidewalk Detour","Multilane Roadway · Short and Long Duration"],
      ["11.15","Midblock Sidewalk Closure","Short and Long Duration"],
      ["11.16","Sidewalk Detour","Multilane Intersection · Short and Long Duration"],
      ["11.17","Intersection Sidewalk and Crosswalk Closure","Short and Long Duration"]
    ],
    "12":[
      ["12.1","Generic Two-Lane Roundabout","Reference figure"],
      ["12.2","Lane Closure in Roundabout","Single Lane · Short and Long Duration"],
      ["12.3","Work Outside Roundabout","Short and Long Duration"],
      ["12.4","Inner Lane Closure","Multilane Roundabout · Short and Long Duration"],
      ["12.5","Outer Lane Closure","Multilane Roundabout · Short and Long Duration"]
    ],
    "13":[
      ["13.3","Advance Warning for Paving Work","Milling, Paving, Seal Coating"],
      ["13.4","Paving — Work in Progress",""],
      ["13.5","Paving — Work Not in Progress",""],
      ["13.6","Seal Coating in Progress",""],
      ["13.7","Installing and Removing Reflectors",""]
    ],
    "14":[
      ["14.2","Quick-Dry Long-Line Marking","Two-Lane, Two-Way Roadway"],
      ["14.3","Quick-Dry Long-Line Marking — Right Lane","Multilane Roadway"],
      ["14.4","Quick-Dry Long-Line Marking — Left Lane","Multilane Roadway · Median ≥ 1 m"],
      ["14.5","Quick-Dry Long-Line Marking — Left Lane","Multilane Roadway · Median < 1 m · Right Shoulder ≥ 2 m"],
      ["14.6","Quick-Dry Long-Line Marking — Left Lane","Multilane Roadway · Median < 1 m · Right Shoulder < 2 m"],
      ["14.7","Conventional Long-Line Centreline and White Line Marking","Two-Lane, Two-Way Roadway"],
      ["14.8","Conventional Long-Line Marking","Multilane Roadway"],
      ["14.9","Left-Turn Arrow Marking","Short and Long Duration"],
      ["14.10","Stop Line and Crosswalk Marking — Left Lanes","Multilane Roadway · Short and Long Duration"],
      ["14.11","Stop Line and Crosswalk Marking — Right Lanes","Multilane Roadway · Short and Long Duration"]
    ],
    "15":[
      ["15.2","Surveying on Shoulder",""],
      ["15.3","Surveying on Centreline",""],
      ["15.4","Surveying in Intersections",""]
    ],
    "16":[
      ["16.2","Road Closure for Avalanche Control","Gates without TCPs"],
      ["16.3","Road Closure for Avalanche Control","Gates with TCPs"],
      ["16.4","Road Closure for Avalanche Control","Barricades and TCPs"]
    ],
    "17":[
      ["17.2","Utility Work on Centreline","Urban Area · Short and Long Duration"],
      ["17.3","Traffic Signal Relamping/Cleaning","Short Duration"]
    ],
    "18":[
      ["18.2","Bicycle Lane Shift",""],
      ["18.3","Bicycle Lane Closed — Take the Lane","≤ 50 km/h"],
      ["18.4","Bicycle Lane Closed — Share the Road",""],
      ["18.5","Bicycle Lane Closed — Bicycle Detour",""],
      ["18.6","Bicycle Lane Closed — Dismount and Walk",""]
    ],
    "19":[
      ["19.2","Road Closure — No Through Road","Local Road"],
      ["19.3","Roadway Closure","Two-Lane, Two-Way Roadway"],
      ["19.4","Roadway Closure","Multilane Roadway"],
      ["19.5","Road Closure — Intersection","Signalized or Unsignalized"],
      ["19.6","Roadway Closure with Detour","≤ 60 km/h"],
      ["19.7","Roadway Closure with Detour","≥ 70 km/h"],
      ["19.8","Emergency Response",""]
    ]
  };

  const extraPages = {
    "10":[363,365,367,369,373],
    "11":[381,383,385,387,389,391,393,397,399,401,403,405,407,409,413,415],
    "12":[420,423,425,427,429],
    "13":[439,441,443,445,449],
    "14":[459,461,463,465,467,469,471,473,475,477],
    "15":[485,487,489],
    "16":[497,499,501],
    "17":[509,511],
    "18":[521,523,525,527,529],
    "19":[539,543,547,551,555,559,563]
  };

  Object.keys(extraFigures).forEach(section => {
    tmmFigures[section] = extraFigures[section];
    tmmPageNumbers[section] = extraPages[section];
  });

  const sectionNames = {
    "7":"Two-Lane","8":"Undivided","9":"Divided","10":"Mobile",
    "11":"Intersections","12":"Roundabouts","13":"Paving","14":"Marking",
    "15":"Surveying","16":"Avalanche","17":"Utility","18":"Bike Lanes","19":"Other"
  };

  function rebuildSectionButtons(container,imageMode){
    if(!container)return;
    container.replaceChildren();
    Object.keys(sectionNames).forEach(section=>{
      const b=document.createElement("button");
      b.className="tmmSection"+(imageMode?" imageSection":"")+(section==="7"?" active":"");
      b.dataset.section=section;
      b.textContent=section+" · "+sectionNames[section];
      b.onclick=()=>imageMode?selectImageSection(section,b):selectTmmSection(section,b);
      container.appendChild(b);
    });
  }

  const style=document.createElement("style");
  style.textContent=[
    ".tmmSections{display:flex!important;grid-template-columns:none!important;gap:7px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin;padding:2px 0 5px;-webkit-overflow-scrolling:touch}",
    ".tmmSection{flex:0 0 auto;min-width:104px;padding:10px 8px;white-space:nowrap}",
    ".officialPdfFallback{width:100%;min-height:260px;display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:10px;padding:14px;background:#fff;color:#111}",
    ".officialPdfFallback .pdfActions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}",
    ".officialPdfFallback button,.officialPdfFallback a{border:0;border-radius:10px;padding:11px 13px;font-weight:900;text-decoration:none;text-align:center;cursor:pointer}",
    ".officialPdfFallback .showPdf{background:#f3bd3d;color:#111}",
    ".officialPdfFallback .openPdf{background:#27323a;color:#fff}",
    ".officialPdfFallback iframe{width:100%;height:68vh;min-height:520px;border:1px solid #ccd2d6;border-radius:8px;background:#fff}",
    ".officialPdfFallback .pdfNote{font-size:11px;line-height:1.4;color:#45525a;text-align:center}"
  ].join("\n");
  document.head.appendChild(style);

  rebuildSectionButtons(document.querySelector("#tmmModule .tmmSections"),false);
  rebuildSectionButtons(document.querySelector("#imageModule .tmmSections"),true);

  const originalRenderOfficialFigure=renderOfficialFigure;
  renderOfficialFigure=async function(code,canvas,status){
    const viewer=canvas&&canvas.parentElement;
    if(viewer)viewer.querySelectorAll(".officialPdfFallback").forEach(el=>el.remove());
    const localSrc=window.TMM_IMAGE_DATA&&window.TMM_IMAGE_DATA[code];
    if(localSrc)return originalRenderOfficialFigure(code,canvas,status);

    const page=figurePage(code);
    canvas.hidden=true;
    status.hidden=true;
    if(!viewer||!page){
      status.hidden=false;
      status.textContent=lang==="fr"?"Figure officielle non disponible.":"Official figure unavailable.";
      return;
    }

    const wrap=document.createElement("div");
    wrap.className="officialPdfFallback";

    const note=document.createElement("div");
    note.className="pdfNote";
    note.textContent=lang==="fr"
      ?"Figure officielle TMM 2020 · page PDF "+page+". Appuie sur « Afficher ici » ou ouvre-la en plein écran."
      :"Official TMM 2020 figure · PDF page "+page+". Tap “Show here” or open it full screen.";

    const actions=document.createElement("div");
    actions.className="pdfActions";

    const show=document.createElement("button");
    show.className="showPdf";
    show.type="button";
    show.textContent=lang==="fr"?"Afficher ici":"Show here";

    const full=document.createElement("a");
    full.className="openPdf";
    full.target="_blank";
    full.rel="noopener";
    full.href=officialPdfUrl+"#page="+page+"&zoom=page-width";
    full.textContent=lang==="fr"?"Ouvrir plein écran":"Open full screen";

    show.onclick=()=>{
      show.disabled=true;
      show.textContent=lang==="fr"?"Chargement…":"Loading…";
      const frame=document.createElement("iframe");
      frame.title="TMM "+code;
      frame.src=officialPdfUrl+"#page="+page+"&zoom=page-width";
      frame.loading="lazy";
      frame.onload=()=>{show.remove()};
      wrap.appendChild(frame);
    };

    actions.append(show,full);
    wrap.append(note,actions);
    viewer.appendChild(wrap);
  };

  const baseSetModeLabels=setModeLabels;
  setModeLabels=function(){
    baseSetModeLabels();
    const fr=lang==="fr";
    const mode=document.getElementById("modeTmmText");
    if(mode)mode.textContent=fr
      ?"Sections 7 à 19 avec recherche par figure et accès à l’image officielle."
      :"Sections 7 to 19 with figure search and access to the official image.";
    const intro=document.getElementById("tmmIntro");
    if(intro)intro.textContent=fr
      ?"Choisis une section, puis une figure. Les sections 10 à 19 ouvrent la page officielle correspondante du TMM."
      :"Choose a section, then a figure. Sections 10 to 19 open the matching official TMM page.";
    const imgIntro=document.getElementById("imageIntro");
    if(imgIntro)imgIntro.textContent=fr
      ?"Sections 7 à 19 · images locales 7–9, PDF officiel pour 10–19."
      :"Sections 7 to 19 · local images for 7–9, official PDF for 10–19.";
  };

  const version=document.querySelector(".miniNote");
  if(version)version.textContent="V66 · Sections TMM 7–19 · Intersections incluses · Bearclaw";

  setModeLabels();
  tmmSection="7";
  imageSection="7";
})();