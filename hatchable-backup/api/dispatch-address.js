import { ai } from "hatchable";

export const access = "public";
export const methods = ["POST"];

const ALLOWED = new Set(["image/jpeg","image/png","image/webp","application/pdf"]);

export default async function(req,res){
  try{
    const dataUrl=String((req.body||{}).fileDataUrl||"");
    const comma=dataUrl.indexOf(",");
    if(comma<0 || !dataUrl.startsWith("data:")) return res.status(400).json({error:"dispatch_required",message:"Importe une image ou un PDF du dispatch."});
    const header=dataUrl.slice(5,comma);
    const mimeType=header.split(";")[0];
    if(!header.endsWith(";base64") || !ALLOWED.has(mimeType)) return res.status(415).json({error:"unsupported_file",message:"Format accepté : PDF, JPG, PNG ou WebP."});
    const fileData=dataUrl.slice(comma+1);
    if(!fileData) return res.status(400).json({error:"dispatch_required"});
    if(fileData.length>16000000) return res.status(413).json({error:"file_too_large",message:"Le dispatch est trop volumineux."});

    const prompt=[
      "Analyse ce dispatch de chantier de contrôle de circulation.",
      "Trouve uniquement l’adresse exacte du lieu de travail ou du chantier (job site / job at / location).",
      "N’utilise pas l’adresse de l’entreprise, du bureau, du client ou de facturation.",
      "Conserve le numéro civique, la rue, la ville, la province et le code postal lorsqu’ils sont visibles.",
      "Ne devine rien. Si l’adresse du chantier est absente ou illisible, retourne une chaîne vide.",
      "Réponds uniquement avec un objet JSON valide sous cette forme : {\"address\":\"adresse exacte\"}."
    ].join("\n");

    const r=await ai.fetch({
      provider:"google",
      path:"/v1beta/models/gemini-2.5-flash:generateContent",
      body:{
        contents:[{role:"user",parts:[
          {inlineData:{mimeType,data:fileData}},
          {text:prompt}
        ]}],
        generationConfig:{responseMimeType:"application/json",temperature:0}
      },
      purpose:"extract-dispatch-job-address",
      timeoutMs:40000
    });
    if(!r.ok){
      let detail="";try{detail=await r.text()}catch(_){}
      console.error("dispatch-address AI failed",{status:r.status,detail:detail.slice(0,500)});
      if(r.status===412) return res.status(412).json({error:"ai_setup_required",message:"Google AI doit être configuré pour lire le dispatch."});
      return res.status(502).json({error:"extraction_failed",message:"L’adresse n’a pas pu être extraite du dispatch."});
    }
    const data=await r.json();
    const parts=data?.candidates?.[0]?.content?.parts||[];
    const text=parts.map(p=>p?.text||"").join("").trim();
    let parsed={};try{parsed=JSON.parse(text.replace(/^```json\s*/i,"").replace(/\s*```$/,""))}catch(_){}
    const address=String(parsed.address||"").trim().slice(0,180);
    return res.json({address,found:Boolean(address)});
  }catch(e){
    console.error("dispatch-address error",e);
    return res.status(500).json({error:"dispatch_address_failed",message:String(e?.message||e)});
  }
}