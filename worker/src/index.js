const API_VERSION = "2022-11-28";
const FILE_PATH = "data.json";
const MAX_BYTES = 900 * 1024;

export default {
  async fetch(request, env) {
    const origin=request.headers.get("Origin")||"", allowed=env.ALLOWED_ORIGIN||"";
    const cors={"Access-Control-Allow-Origin":allowed,"Access-Control-Allow-Methods":"GET, PUT, OPTIONS","Access-Control-Allow-Headers":"Content-Type, X-Admin-Password","Access-Control-Max-Age":"86400","Vary":"Origin"};
    const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
    if(origin && origin!==allowed)return new Response("Origin not allowed",{status:403});
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
    const url=new URL(request.url);
    if(!url.pathname.startsWith("/api/"))return respond({ok:true,service:"e-Learner content API"});
    if(url.pathname!=="/api/config")return respond({error:"المسار غير موجود."},404);
    if(!env.ADMIN_PASSWORD||!env.GITHUB_TOKEN||!env.GITHUB_OWNER||!env.GITHUB_REPO||!allowed)return respond({error:"إعدادات الخدمة غير مكتملة."},503);
    if(!await secureEqual(request.headers.get("X-Admin-Password")||"",env.ADMIN_PASSWORD))return respond({error:"كلمة المرور غير صحيحة."},401);
    if(request.method==="GET"){
      const current=await githubRequest(env,"GET",contentsUrl(env));
      if(!current.ok)return respond({error:githubError(current)},current.status);
      const payload=await current.json();
      if(payload.type!=="file"||!payload.content)return respond({error:"لم يتم العثور على data.json في جذر المستودع."},404);
      return respond({source:decodeBase64(payload.content),sha:payload.sha,branch:env.GITHUB_BRANCH||"main"});
    }
    if(request.method==="PUT"){
      let body;try{body=await request.json();}catch{return respond({error:"صيغة الطلب غير صالحة."},400);}
      if(typeof body.source!=="string"||new TextEncoder().encode(body.source).byteLength>MAX_BYTES)return respond({error:"حجم ملف البيانات يجب أن يكون أقل من 900KB."},413);
      let parsed;try{parsed=JSON.parse(body.source);}catch{return respond({error:"ملف البيانات ليس JSON صالحاً."},400);}
      const validation=validateConfig(parsed);if(validation)return respond({error:validation},400);
      const current=await githubRequest(env,"GET",contentsUrl(env));let sha="";
      if(current.ok)sha=(await current.json()).sha||"";else if(current.status!==404)return respond({error:githubError(current)},current.status);
      if(body.sha&&sha&&body.sha!==sha)return respond({error:"تغيّر الملف على GitHub منذ فتح اللوحة. حدّث البيانات ثم أعد المحاولة.",conflict:true},409);
      const write=await githubRequest(env,"PUT",contentsUrl(env),{message:"Update e-Learner data.json",content:encodeBase64(body.source),...(sha?{sha}:{}),branch:env.GITHUB_BRANCH||"main"});
      if(!write.ok)return respond({error:githubError(write)},write.status);
      const result=await write.json();return respond({ok:true,sha:result.content?.sha||"",commit:result.commit?.html_url||""});
    }
    return respond({error:"الطريقة غير مدعومة."},405);
  }
};
function validateConfig(data){
  if(!data||typeof data!=="object"||!data.branches||typeof data.branches!=="object")return "يجب أن يحتوي JSON على كائن branches.";
  for(const [branchKey,branch] of Object.entries(data.branches)){
    if(!branch||!branch.subjects||typeof branch.subjects!=="object")return "كل فرع يجب أن يحتوي على subjects.";
    for(const list of Object.values(branch.subjects)){
      if(!Array.isArray(list))return "مصادر كل مادة يجب أن تكون مصفوفة.";
      for(const item of list){
        if(!item||typeof item!=="object")return "يوجد مصدر غير صالح.";
        const link=item.url||item.driveUrl||"";
        if(link){try{const parsed=new URL(link);if(!["https:","http:"].includes(parsed.protocol))return "كل رابط مصدر يجب أن يبدأ بـ https:// أو http://.";}catch{return "يوجد رابط مصدر غير صالح.";}}
        if(item.mirrorUrl){try{const parsed=new URL(item.mirrorUrl);if(!["https:","http:"].includes(parsed.protocol))return "الرابط البديل يجب أن يبدأ بـ https:// أو http://.";}catch{return "يوجد رابط بديل غير صالح.";}}
      }
    }
  }
  return "";
}
function contentsUrl(env){return "https://api.github.com/repos/"+encodeURIComponent(env.GITHUB_OWNER)+"/"+encodeURIComponent(env.GITHUB_REPO)+"/contents/"+FILE_PATH;}
async function githubRequest(env,method,url,body){return fetch(url,{method,headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+env.GITHUB_TOKEN,"X-GitHub-Api-Version":API_VERSION,"User-Agent":"e-Learner-Content-Manager",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});}
function decodeBase64(value){const binary=atob(value.replace(/\s/g,""));return new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));}
function encodeBase64(value){const bytes=new TextEncoder().encode(value);let binary="";for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}
async function secureEqual(a,b){const enc=new TextEncoder(),[x,y]=await Promise.all([crypto.subtle.digest("SHA-256",enc.encode(a)),crypto.subtle.digest("SHA-256",enc.encode(b))]);const left=new Uint8Array(x),right=new Uint8Array(y);let diff=0;for(let i=0;i<left.length;i++)diff|=left[i]^right[i];return diff===0;}
function githubError(r){if(r.status===401||r.status===403)return "GitHub رفض صلاحية الخدمة. تحقق من Contents: Read and write.";if(r.status===404)return "لم يتم العثور على المستودع أو ملف data.json.";if(r.status===409||r.status===422)return "حدث تعارض أثناء الحفظ. حدّث لوحة الإدارة وحاول مرة أخرى.";return "GitHub API أعاد الخطأ "+r.status+".";}
