const API_VERSION = "2026-03-10";
const FILE_PATH = "data.js";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN;
    const cors = {
      "Access-Control-Allow-Origin": allowed,
      "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    const respond = (data, status=200) => new Response(JSON.stringify(data), {status,headers:{...cors,"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
    if (origin && origin !== allowed) return new Response("Origin not allowed", {status:403});
    if (request.method === "OPTIONS") return new Response(null,{status:204,headers:cors});
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return respond({ok:true,service:"e-Learner content API"});
    if (!env.ADMIN_PASSWORD || !env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO || !env.ALLOWED_ORIGIN) return respond({error:"إعدادات الخدمة غير مكتملة."},503);
    if (!await secureEqual(request.headers.get("X-Admin-Password") || "", env.ADMIN_PASSWORD)) return respond({error:"كلمة المرور غير صحيحة."},401);
    if (url.pathname !== "/api/config") return respond({error:"المسار غير موجود."},404);
    if (request.method === "GET") {
      const current = await githubRequest(env, "GET", contentsUrl(env));
      if (!current.ok) return respond({error:githubError(current)},current.status);
      const payload = await current.json();
      if (payload.type !== "file" || !payload.content) return respond({error:"لم يتم العثور على ملف data.js في جذر المستودع."},404);
      return respond({source:decodeBase64(payload.content),sha:payload.sha,branch:env.GITHUB_BRANCH||"main"});
    }
    if (request.method === "PUT") {
      let body;
      try { body = await request.json(); } catch { return respond({error:"صيغة الطلب غير صالحة."},400); }
      if (typeof body.source !== "string" || body.source.length < 30 || body.source.length > 900000 || !body.source.includes("window.EL_CONFIG") || !body.source.includes("branches")) return respond({error:"محتوى data.js غير صالح أو حجمه كبير."},400);
      // Read the latest SHA immediately before writing. GitHub requires it for updates.
      const current = await githubRequest(env,"GET",contentsUrl(env));
      let sha = "";
      if (current.ok) sha = (await current.json()).sha || "";
      else if (current.status !== 404) return respond({error:githubError(current)},current.status);
      if (body.sha && sha && body.sha !== sha) return respond({error:"الملف تغيّر على GitHub منذ فتح لوحة الإدارة. حدّث الصفحة ثم أعد المحاولة لتجنب الكتابة فوق تعديل أحدث.",conflict:true},409);
      const write = await githubRequest(env,"PUT",contentsUrl(env),{
        message:"Update e-Learner library content",
        content:encodeBase64(body.source),
        ...(sha ? {sha} : {}),
        branch:env.GITHUB_BRANCH||"main"
      });
      if (!write.ok) return respond({error:githubError(write)},write.status);
      const result=await write.json();
      return respond({ok:true,sha:result.content?.sha||"",commit:result.commit?.html_url||""},200);
    }
    return respond({error:"الطريقة غير مدعومة."},405);
  }
};

function contentsUrl(env) {
  const owner=encodeURIComponent(env.GITHUB_OWNER), repo=encodeURIComponent(env.GITHUB_REPO);
  return `https://api.github.com/repos/${owner}/${repo}/contents/${FILE_PATH}`;
}
async function githubRequest(env, method, url, body) {
  return fetch(url,{method,headers:{
    "Accept":"application/vnd.github+json",
    "Authorization":`Bearer ${env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version":API_VERSION,
    "User-Agent":"e-Learner-Content-Manager",
    ...(body?{"Content-Type":"application/json"}:{})
  },...(body?{body:JSON.stringify(body)}:{})});
}
function decodeBase64(value) {
  const binary=atob(value.replace(/\s/g,""));
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function encodeBase64(value) {
  const bytes=new TextEncoder().encode(value); let binary="";
  for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(binary);
}
async function secureEqual(a,b) {
  const enc=new TextEncoder(), [x,y]=await Promise.all([crypto.subtle.digest("SHA-256",enc.encode(a)),crypto.subtle.digest("SHA-256",enc.encode(b))]);
  const left=new Uint8Array(x),right=new Uint8Array(y); let diff=0;
  for(let i=0;i<left.length;i++) diff|=left[i]^right[i];
  return diff===0;
}
function githubError(response) {
  if(response.status===401||response.status===403) return "GitHub رفض صلاحية الخدمة. تحقق من صلاحية Contents: Read and write للرمز.";
  if(response.status===404) return "لم يتم العثور على المستودع أو الملف data.js. تحقق من اسم المالك والمستودع والفرع.";
  if(response.status===409||response.status===422) return "حدث تعارض أثناء الحفظ. حدّث لوحة الإدارة وحاول مرة أخرى.";
  return `GitHub API أعاد الخطأ ${response.status}.`;
}
