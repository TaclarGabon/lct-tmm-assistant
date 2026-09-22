import { ai } from "hatchable";

export const access = "public";
export const methods = ["POST"];

const ALLOWED_MIMES = new Set(["image/jpeg","image/png","image/webp"]);
const ALLOWED_ASPECTS = new Set(["1:1","4:3","3:4","16:9","9:16"]);

export default async function(req,res){
  try{
    const body=req.body||{};
    const dataUrl=String(body.imageDataUrl||"");
    const comma=dataUrl.indexOf(",");
    if(comma<0 || !dataUrl.startsWith("data:image/")) return res.status(400).json({error:"image_required",message:"Une image JPEG, PNG ou WebP est requise."});
    const header=dataUrl.slice(5,comma);
    const mimeType=header.split(";")[0];
    if(!header.endsWith(";base64") || !ALLOWED_MIMES.has(mimeType)) return res.status(415).json({error:"unsupported_image",message:"Format d’image non pris en charge."});
    const imageData=dataUrl.slice(comma+1);
    if(!imageData) return res.status(400).json({error:"image_required"});
    if(imageData.length>14000000) return res.status(413).json({error:"image_too_large",message:"L’image est trop volumineuse."});

    const correction=String(body.correction||"").trim().slice(0,600);
    const aspect=ALLOWED_ASPECTS.has(body.aspect)?body.aspect:"4:3";
    const lines=[
      "À partir du screenshot fourni, analyse uniquement la zone visible et produis un PLAN ROUTIER PROPRE ET SIMPLIFIÉ.",
      "",
      "RÈGLES OBLIGATOIRES :",
      "- produire une sortie en paysage, de préférence 4:3 ; si l’image source est verticale, étendre le canevas avec du blanc plutôt que couper une rue ;",
      "- conserver la géométrie réelle de toutes les rues visibles, y compris les courbes, intersections, impasses et connexions ;",
      "- ne jamais étirer, déformer ou recadrer la géométrie routière pour remplir le format paysage ;",
      "- conserver uniquement les noms de rues utiles qui sont réellement lisibles dans l’image ;",
      "- si un nom est incertain ou illisible, ne pas l’inventer ;",
      "- ne jamais ajouter une rue, une intersection ou une connexion qui n’est pas visible dans le screenshot ;",
      "- ne pas déplacer, redresser ou simplifier la position des rues au point de modifier leur géométrie réelle.",
      "",
      "SUPPRIMER COMPLÈTEMENT :",
      "- arbres, végétation et ombres ;",
      "- maisons, bâtiments et commerces ;",
      "- voitures et objets ;",
      "- parkings détaillés ;",
      "- icônes Google Maps, pins, marqueurs et éléments d’interface ;",
      "- numéros de maison, numéros de commerce, adresses civiques ;",
      "- noms de commerces et textes non essentiels ;",
      "- tout symbole parasite.",
      "",
      "NE GARDER QUE :",
      "- les rues visibles ;",
      "- les noms de rues lisibles et utiles ;",
      "- les formes utiles du plan routier ;",
      "- éventuellement un petit point neutre du chantier uniquement s’il est clairement nécessaire.",
      "",
      "STYLE FINAL :",
      "- fond blanc ;",
      "- chaussées blanches ou gris très clair, jamais remplies en gris foncé ou noir ;",
      "- contours de route noirs fins, nets et propres ;",
      "- marquages de voie simples en noir ou gris moyen, avec hachures très légères ;",
      "- noms de rues en texte noir très lisible ;",
      "- rendu 2D de dessin technique, optimisé pour une impression noir et blanc peu chargée en encre ;",
      "- aucune décoration, aucun arbre, aucune maison, aucune texture sombre.",
      "",
      "Le résultat doit ressembler à un schéma technique propre construit à partir du screenshot, pas à une nouvelle carte inventée."
    ];
    if(correction) lines.push("", "CORRECTION DEMANDÉE PAR L’UTILISATEUR : "+correction);
    const prompt=lines.join("\n");

    const r=await ai.fetch({
      provider:"google",
      path:"/v1beta/models/gemini-3.1-flash-image:generateContent",
      body:{
        contents:[{role:"user",parts:[
          {inlineData:{mimeType:mimeType,data:imageData}},
          {text:prompt}
        ]}],
        generationConfig:{responseModalities:["IMAGE"],imageConfig:{aspectRatio:aspect}}
      },
      purpose:"clean-road-screenshot",
      timeoutMs:50000
    });

    if(!r.ok){
      let detail="";
      try{detail=await r.text()}catch(_){}
      console.error("clean-plan AI failed",{status:r.status,detail:detail.slice(0,500)});
      if(r.status===412) return res.status(412).json({error:"ai_setup_required",message:"La fonction IA doit être activée dans Hatchable avant de générer le plan propre."});
      return res.status(502).json({error:"ai_generation_failed",message:"La génération IA du plan propre a échoué."});
    }

    const data=await r.json();
    const parts=(data&&data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts)||[];
    const imagePart=parts.find(function(p){return p&&p.inlineData&&p.inlineData.data});
    if(!imagePart||!imagePart.inlineData||!imagePart.inlineData.data){
      console.error("clean-plan returned no image",JSON.stringify(data).slice(0,1000));
      return res.status(502).json({error:"no_image",message:"L’IA n’a pas retourné d’image exploitable."});
    }
    const outMime=imagePart.inlineData.mimeType||"image/png";
    return res.json({dataUrl:"data:"+outMime+";base64,"+imagePart.inlineData.data});
  }catch(e){
    console.error("clean-plan error",e);
    const msg=String((e&&e.message)||e);
    if(msg.includes("internal/ai/fetch 412") || msg.includes("No google key configured")){
      return res.status(412).json({error:"setup_required",hint:"setup_required",message:"Google AI doit être configuré dans Hatchable > Setup avant d’utiliser Créer le plan propre."});
    }
    return res.status(500).json({error:"clean_plan_failed",message:msg});
  }
}