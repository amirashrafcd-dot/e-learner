(() => {
  const API = String(window.EL_ADMIN_API || "").replace(/\/$/, "");
  const $ = id => document.getElementById(id);
  const labels = {book:"كتاب",summary:"ملزمة",exam:"اختبار",worksheet:"ورقة عمل"};
  let password = "", config = null, fileSha = "", editing = null;
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const setStatus = (message, online=false) => { const el=$("syncState"); el.textContent=message; el.classList.toggle("online",online); };
  async function api(path, options={}) {
    if (!API || API.includes("REPLACE-WITH")) throw new Error("لم يتم إعداد رابط خدمة الحفظ بعد.");
    const response = await fetch(API + path, { ...options, headers: {"Content-Type":"application/json","X-Admin-Password":password,...(options.headers||{})} });
    const data = await response.json().catch(()=>({error:"استجابة غير مفهومة من الخادم"}));
    if (!response.ok) throw new Error(data.error || `تعذر إكمال الطلب (${response.status})`);
    return data;
  }
  function parseConfig(source) {
    const sandbox = {};
    new Function("window", `${source}\n;return window.EL_CONFIG;`)(sandbox);
    if (!sandbox.EL_CONFIG?.branches) throw new Error("ملف data.js لا يحتوي على بنية المكتبة المتوقعة.");
    return sandbox.EL_CONFIG;
  }
  function serializeConfig() { return `/* e-Learner — مصدر بيانات المكتبة. يتم تحديثه تلقائياً من بوابة الإدارة. */\nwindow.EL_CONFIG = ${JSON.stringify(config,null,2)};\n`; }
  async function loadData() {
    setStatus("جارٍ الاتصال بـ GitHub...");
    const data = await api("/api/config");
    config = parseConfig(data.source); fileSha = data.sha || "";
    $("loginPanel").hidden=true; $("dashboard").hidden=false;
    setStatus("● متصل — آخر نسخة من GitHub",true); render(); fillSubjects();
  }
  function allItems() {
    const rows=[];
    Object.entries(config.branches).forEach(([branchKey, branch]) => Object.entries(branch.subjects||{}).forEach(([subject,list]) => (Array.isArray(list)?list:[]).forEach(item=>rows.push({...item,branchKey,branchName:branch.name,subject}))));
    return rows;
  }
  function fillSubjects(selected) {
    const branch=$("branchField").value, subjects=Object.keys(config.branches[branch].subjects||{});
    $("subjectField").innerHTML=subjects.map(s=>`<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("");
    if(selected && subjects.includes(selected)) $("subjectField").value=selected;
  }
  function render() {
    const items=allItems(), counts={book:0,summary:0,exam:0,worksheet:0}; items.forEach(x=>{if(counts[x.type]!==undefined)counts[x.type]++;});
    $("controlStats").innerHTML=`<div class="control-stat"><b>${items.length}</b><span>إجمالي المصادر</span></div><div class="control-stat"><b>${counts.book}</b><span>كتب منشورة</span></div><div class="control-stat"><b>${counts.summary}</b><span>ملازم</span></div><div class="control-stat"><b>${counts.exam+counts.worksheet}</b><span>اختبارات وأوراق عمل</span></div>`;
    const q=$("listSearch").value.trim().toLocaleLowerCase("ar"), branch=$("listBranch").value;
    const filtered=items.filter(x=>(branch==="all"||x.branchKey===branch)&&[x.title,x.teacher,x.subject,x.description].join(" ").toLocaleLowerCase("ar").includes(q));
    $("sourceList").innerHTML=filtered.length?filtered.map(x=>`<article class="source-row"><div class="source-info"><span class="source-badge">${labels[x.type]||"مصدر"} · ${escapeHTML(x.branchName)} / ${escapeHTML(x.subject)}</span><b>${escapeHTML(x.title)}</b><small>${escapeHTML(x.teacher||"بدون اسم")} · ${escapeHTML(x.year||"دون سنة")} · ${escapeHTML(x.term?"الفصل "+x.term:"كل الفصول")}</small></div><div class="source-buttons"><button data-edit="${escapeHTML(x.id)}" data-branch="${x.branchKey}" data-subject="${escapeHTML(x.subject)}">تعديل</button><button class="delete" data-delete="${escapeHTML(x.id)}" data-branch="${x.branchKey}" data-subject="${escapeHTML(x.subject)}">حذف</button></div></article>`).join(""):'<div class="list-empty">لا توجد مصادر مطابقة. أضف أول مصدر من النموذج.</div>';
  }
  function resetForm() { editing=null; $("sourceForm").reset(); $("sourceId").value=""; $("formHeading").textContent="إضافة مصدر جديد"; $("saveSource").textContent="حفظ ونشر التعديل ↗"; $("cancelEdit").hidden=true; fillSubjects(); }
  async function saveToGitHub() {
    setStatus("جارٍ حفظ التغييرات...");
    const result=await api("/api/config",{method:"PUT",body:JSON.stringify({source:serializeConfig(),sha:fileSha})});
    fileSha=result.sha||fileSha; setStatus("● تم الحفظ في GitHub",true);
    $("formMessage").textContent="تم الحفظ مباشرة في GitHub. ستظهر التغييرات على الموقع بعد انتهاء النشر.";
  }
  $("loginForm").addEventListener("submit",async e=>{e.preventDefault();password=$("passwordInput").value;$("loginMessage").textContent="جارٍ التحقق...";try{await loadData();sessionStorage.setItem("el-admin-session",password);}catch(err){password="";$("loginMessage").textContent=err.message;}});
  $("logoutButton").addEventListener("click",()=>{password="";sessionStorage.removeItem("el-admin-session");config=null;$("dashboard").hidden=true;$("loginPanel").hidden=false;$("passwordInput").value="";$("loginMessage").textContent="تم تسجيل الخروج.";});
  $("branchField").addEventListener("change",()=>fillSubjects());
  $("sourceForm").addEventListener("submit",async e=>{
    e.preventDefault(); const branch=$("branchField").value, subject=$("subjectField").value, url=$("urlField").value.trim();
    try{const parsed=new URL(url);if(!["https:","http:"].includes(parsed.protocol))throw new Error("الرابط يجب أن يكون HTTPS أو HTTP.");}catch(err){$("formMessage").textContent=err.message||"أدخل رابطاً صحيحاً.";return;}
    const item={id:editing||`resource-${Date.now()}`,title:$("titleField").value.trim(),type:$("typeField").value,teacher:$("teacherField").value.trim(),term:$("termField").value,year:$("yearField").value.trim(),description:$("descriptionField").value.trim(),driveUrl:url};
    if(!item.title)return;
    const list=config.branches[branch].subjects[subject];
    if(editing){const old=allItems().find(x=>x.id===editing);if(old){const oldList=config.branches[old.branchKey].subjects[old.subject];const index=oldList.findIndex(x=>x.id===editing);if(oldList===list)list[index]=item;else{oldList.splice(index,1);list.push(item);}}}
    else list.push(item);
    try{await saveToGitHub();resetForm();render();}catch(err){$("formMessage").textContent=`لم يتم الحفظ: ${err.message}`;setStatus("● تعذر الحفظ");}
  });
  $("sourceList").addEventListener("click",async e=>{
    const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]");
    if(edit){const branch=edit.dataset.branch,subject=edit.dataset.subject,id=edit.dataset.edit,item=config.branches[branch].subjects[subject].find(x=>x.id===id);if(!item)return;editing=id;$("branchField").value=branch;fillSubjects(subject);$("sourceId").value=id;$("titleField").value=item.title||"";$("typeField").value=item.type||"book";$("teacherField").value=item.teacher||"";$("yearField").value=item.year||"";$("termField").value=item.term||"";$("descriptionField").value=item.description||"";$("urlField").value=item.driveUrl||"";$("formHeading").textContent="تعديل المصدر";$("saveSource").textContent="حفظ التعديل ↗";$("cancelEdit").hidden=false;window.scrollTo({top:0,behavior:"smooth"});}
    if(del){if(!confirm("هل تريد حذف هذا المصدر من المكتبة؟"))return;const branch=del.dataset.branch,subject=del.dataset.subject,id=del.dataset.delete,list=config.branches[branch].subjects[subject],index=list.findIndex(x=>x.id===id);if(index<0)return;const removed=list.splice(index,1)[0];try{await saveToGitHub();render();$("formMessage").textContent="تم حذف المصدر وحفظ التغيير.";}catch(err){list.splice(index,0,removed);$("formMessage").textContent=`تعذر الحذف: ${err.message}`;}}
  });
  $("cancelEdit").addEventListener("click",resetForm); $("listSearch").addEventListener("input",render); $("listBranch").addEventListener("change",render);
  const remembered=sessionStorage.getItem("el-admin-session"); if(remembered){password=remembered;loadData().catch(()=>{password="";sessionStorage.removeItem("el-admin-session");});}
})();
