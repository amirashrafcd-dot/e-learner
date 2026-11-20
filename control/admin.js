(() => {
"use strict";
const API=String(window.EL_ADMIN_API||"").replace(/\/$/,""),$=id=>document.getElementById(id);
const labels={book:"كتاب",summary:"ملزمة",exam:"اختبار",worksheet:"ورقة عمل",solution:"حلول",pastExam:"امتحان وزارة سابق",video:"شرح فيديو"};
let password="",config=null,fileSha="",editing=null,inactivity=null;
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone=value=>JSON.parse(JSON.stringify(value));
const status=(message,online=false)=>{ $("syncState").textContent=message;$("syncState").classList.toggle("online",online); };
async function api(path,options={}){if(!API)throw new Error("لم يتم ضبط رابط Worker في control/config.js");const response=await fetch(API+path,{...options,headers:{"Content-Type":"application/json","X-Admin-Password":password,...(options.headers||{})}});const data=await response.json().catch(()=>({error:"استجابة غير مفهومة"}));if(!response.ok)throw new Error(data.error||"تعذر إكمال الطلب");return data;}
function serialize(){return JSON.stringify(config,null,2)+"\n";}
async function load(){status("جارٍ الاتصال...");const result=await api("/api/config");config=JSON.parse(result.source);if(!config.site)config.site={};if(!config.branches)throw new Error("ملف البيانات لا يحتوي على branches");fileSha=result.sha||"";$("loginPanel").hidden=true;$("dashboard").hidden=false;render();fillSettings();status("● متصل — GitHub",true);startInactivity();}
function branchOptions(select,selected){const branches=Object.entries(config.branches);select.innerHTML=branches.map(([key,b])=>'<option value="'+escapeHTML(key)+'">'+escapeHTML(b.name||b.title||key)+'</option>').join("");if(selected&&config.branches[selected])select.value=selected;}
function subjectOptions(branchSelect,subjectSelect,selected){const key=branchSelect.value,subjects=Object.keys(config.branches[key]?.subjects||{});subjectSelect.innerHTML=subjects.map(s=>'<option value="'+escapeHTML(s)+'">'+escapeHTML(s)+'</option>').join("");if(selected&&subjects.includes(selected))subjectSelect.value=selected;}
function fillSubjects(selected){subjectOptions($("branchField"),$("subjectField"),selected);}
function allItems(){const out=[];Object.entries(config.branches).forEach(([branchKey,b])=>Object.entries(b.subjects||{}).forEach(([subject,list])=>(Array.isArray(list)?list:[]).forEach(item=>out.push({...item,branchKey,branchName:b.name||b.title||branchKey,subject}))));return out;}
function render(){
 const saved={branchField:$("branchField").value,subjectField:$("subjectField").value,subjectBranch:$("subjectBranch").value,managedSubject:$("managedSubject").value,listBranch:$("listBranch").value};
 const branches=Object.keys(config.branches);
 branchOptions($("branchField"),saved.branchField);branchOptions($("subjectBranch"),saved.subjectBranch);
 $("listBranch").innerHTML='<option value="all">كل الفروع</option>'+Object.entries(config.branches).map(([k,b])=>'<option value="'+escapeHTML(k)+'">'+escapeHTML(b.name||k)+'</option>').join("");
 if(saved.listBranch&&[...branches,"all"].includes(saved.listBranch))$("listBranch").value=saved.listBranch;
 subjectOptions($("branchField"),$("subjectField"),saved.subjectField);
 subjectOptions($("subjectBranch"),$("managedSubject"),saved.managedSubject);
 const items=allItems(),q=$("listSearch").value.trim().toLocaleLowerCase("ar"),branch=$("listBranch").value;
 const counts=Object.keys(labels).map(type=>items.filter(x=>x.type===type).length);
 $("controlStats").innerHTML='<div class="control-stat"><b>'+items.length+'</b><span>إجمالي المصادر</span></div><div class="control-stat"><b>'+Object.keys(config.branches).length+'</b><span>فروع</span></div><div class="control-stat"><b>'+Object.values(config.branches).reduce((n,b)=>n+Object.keys(b.subjects||{}).length,0)+'</b><span>مواد</span></div><div class="control-stat"><b>'+counts.reduce((a,b)=>a+b,0)+'</b><span>مصادر مصنفة</span></div>';
 const filtered=items.filter(x=>(branch==="all"||x.branchKey===branch)&&[x.title,x.teacher,x.subject,x.description].join(" ").toLocaleLowerCase("ar").includes(q));
 $("sourceList").innerHTML=filtered.length?filtered.map(x=>'<article class="source-row"><div class="source-info"><span class="source-badge">'+(labels[x.type]||"مصدر")+' · '+escapeHTML(x.branchName)+' / '+escapeHTML(x.subject)+'</span><b>'+escapeHTML(x.title)+'</b><small>'+escapeHTML(x.teacher||"")+' · '+escapeHTML(x.year||"")+' · '+escapeHTML(x.grade||"")+'</small></div><div class="source-buttons"><button data-edit="'+escapeHTML(x.id)+'" data-branch="'+escapeHTML(x.branchKey)+'" data-subject="'+escapeHTML(x.subject)+'">تعديل</button><button class="delete" data-delete="'+escapeHTML(x.id)+'" data-branch="'+escapeHTML(x.branchKey)+'" data-subject="'+escapeHTML(x.subject)+'">حذف</button></div></article>').join(""):'<div class="list-empty">لا توجد مصادر مضافة بعد.</div>';
 $("subjectBranch").value=saved.subjectBranch&&config.branches[saved.subjectBranch]?saved.subjectBranch:branches[0];
 subjectOptions($("subjectBranch"),$("managedSubject"),saved.managedSubject);
 if(saved.branchField&&config.branches[saved.branchField])$("branchField").value=saved.branchField;
 if(saved.subjectField&&config.branches[$("branchField").value]?.subjects?.[saved.subjectField])$("subjectField").value=saved.subjectField;
 if(saved.listBranch&&[...branches,"all"].includes(saved.listBranch))$("listBranch").value=saved.listBranch;
}
function fillSettings(){const s=config.site||{};$("siteEmail").value=s.contactEmail||"";$("siteWhatsapp").value=s.whatsappNumber||"";$("siteTelegram").value=s.telegramChannelUrl||"";$("siteExamDate").value=s.examDate||"";$("siteTeacherMessage").value=s.teacherMessage||"";}
function resetForm(keepBranch=$("branchField").value,keepSubject=$("subjectField").value){editing=null;$("sourceForm").reset();$("branchField").value=keepBranch;fillSubjects(keepSubject);$("formHeading").textContent="إضافة مصدر جديد";$("saveSource").textContent="حفظ ونشر ↗";$("cancelEdit").hidden=true;$("sourceId").value="";}
async function saveSnapshot(snapshot,selection,successMessage){try{await saveToGitHub();render();restoreSelection(selection);$("formMessage").textContent=successMessage;}catch(error){config=snapshot;render();restoreSelection(selection);$("formMessage").textContent="لم يتم الحفظ: "+error.message;status("● تعذر الحفظ");throw error;}}
function selection(){return {branchField:$("branchField").value,subjectField:$("subjectField").value,subjectBranch:$("subjectBranch").value,managedSubject:$("managedSubject").value,listBranch:$("listBranch").value};}
function restoreSelection(s){$("branchField").value=s.branchField;fillSubjects(s.subjectField);$("subjectBranch").value=s.subjectBranch;subjectOptions($("subjectBranch"),$("managedSubject"),s.managedSubject);$("listBranch").value=s.listBranch;}
async function saveToGitHub(){status("جارٍ الحفظ...");const result=await api("/api/config",{method:"PUT",body:JSON.stringify({source:serialize(),sha:fileSha})});fileSha=result.sha||fileSha;status("● تم الحفظ في GitHub",true);}
function startInactivity(){clearTimeout(inactivity);const reset=()=>{clearTimeout(inactivity);inactivity=setTimeout(logout,30*60*1000);};["pointerdown","keydown","scroll","touchstart"].forEach(event=>document.addEventListener(event,reset,{passive:true}));reset();}
function logout(){clearTimeout(inactivity);password="";config=null;fileSha="";$("dashboard").hidden=true;$("loginPanel").hidden=false;$("passwordInput").value="";$("loginMessage").textContent="انتهت الجلسة أو تم تسجيل الخروج.";}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();password=$("passwordInput").value;$("loginMessage").textContent="جارٍ التحقق...";try{await load();}catch(error){password="";$("loginMessage").textContent=error.message;}});
$("logoutButton").addEventListener("click",logout);
$("branchField").addEventListener("change",()=>fillSubjects());
$("subjectBranch").addEventListener("change",()=>subjectOptions($("subjectBranch"),$("managedSubject")));
$("sourceForm").addEventListener("submit",async e=>{
 e.preventDefault();const branchKey=$("branchField").value,subject=$("subjectField").value,url=$("urlField").value.trim(),mirror=$("mirrorUrlField").value.trim();
 const valid=value=>{if(!value)return true;try{return ["https:","http:"].includes(new URL(value).protocol);}catch{return false;}};
 if(!valid(url)||!valid(mirror)){$("formMessage").textContent="تأكد من أن الروابط تبدأ بـ https:// أو http://";return;}
 const duplicate=allItems().find(x=>x.url===url&&x.id!==editing);if(duplicate&&!confirm("هذا الرابط مستخدم في مصدر «"+duplicate.title+"». هل تريد المتابعة؟"))return;
 const snapshot=clone(config),selected=selection(),old=editing?allItems().find(x=>x.id===editing):null;
 const item={id:editing||"resource-"+Date.now(),title:$("titleField").value.trim(),type:$("typeField").value,grade:$("gradeField").value,unit:$("unitField").value.trim(),teacher:$("teacherField").value.trim(),term:$("termField").value,year:$("yearField").value.trim(),description:$("descriptionField").value.trim(),url,mirrorUrl:mirror,added:old?.added||new Date().toISOString(),...(editing?{updated:new Date().toISOString()}:{})};
 if(!item.title)return;
 if(old){const oldList=config.branches[old.branchKey].subjects[old.subject];const index=oldList.findIndex(x=>x.id===editing);oldList.splice(index,1);}
 config.branches[branchKey].subjects[subject].push(item);
 try{await saveSnapshot(snapshot,selected,editing?"تم تحديث المصدر وحفظه.":"تمت إضافة المصدر وحفظه.");resetForm(selected.branchField,selected.subjectField);render();restoreSelection(selected);}
 catch{}
});
$("sourceList").addEventListener("click",async e=>{
 const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
 if(edit){const branch=edit.dataset.branch,subject=edit.dataset.subject,id=edit.dataset.edit,item=config.branches[branch].subjects[subject].find(x=>x.id===id);if(!item)return;editing=id;$("branchField").value=branch;fillSubjects(subject);$("sourceId").value=id;$("titleField").value=item.title||"";$("typeField").value=item.type||"book";$("gradeField").value=item.grade||"";$("unitField").value=item.unit||"";$("teacherField").value=item.teacher||"";$("yearField").value=item.year||"";$("termField").value=item.term||"";$("descriptionField").value=item.description||"";$("urlField").value=item.url||item.driveUrl||"";$("mirrorUrlField").value=item.mirrorUrl||"";$("formHeading").textContent="تعديل المصدر";$("saveSource").textContent="حفظ التعديل ↗";$("cancelEdit").hidden=false;window.scrollTo({top:0,behavior:"smooth"});}
 if(del){if(!confirm("هل تريد حذف هذا المصدر؟"))return;const branch=del.dataset.branch,subject=del.dataset.subject,id=del.dataset.delete,list=config.branches[branch].subjects[subject],index=list.findIndex(x=>x.id===id);if(index<0)return;const snapshot=clone(config),selected=selection();list.splice(index,1);try{await saveSnapshot(snapshot,selected,"تم حذف المصدر وحفظ التغيير.");}catch{}}
});
$("cancelEdit").addEventListener("click",()=>resetForm());$("listSearch").addEventListener("input",render);$("listBranch").addEventListener("change",render);
$("addSubject").addEventListener("click",async()=>{const name=$("newSubjectName").value.trim(),branch=$("subjectBranch").value;if(!name)return;if(config.branches[branch].subjects[name]){alert("المادة موجودة بالفعل.");return;}const snapshot=clone(config),selected=selection();config.branches[branch].subjects[name]=[];try{await saveSnapshot(snapshot,selected,"تمت إضافة المادة.");$("newSubjectName").value="";}catch{}});
$("renameSubject").addEventListener("click",async()=>{const branch=$("subjectBranch").value,old=$("managedSubject").value,name=$("newSubjectName").value.trim();if(!old||!name)return;if(config.branches[branch].subjects[name]){alert("يوجد اسم مادة مطابق.");return;}const snapshot=clone(config),selected=selection();config.branches[branch].subjects[name]=config.branches[branch].subjects[old];delete config.branches[branch].subjects[old];try{await saveSnapshot(snapshot,selected,"تمت إعادة تسمية المادة.");$("newSubjectName").value="";}catch{}});
$("deleteSubject").addEventListener("click",async()=>{const branch=$("subjectBranch").value,subject=$("managedSubject").value;if(!subject)return;if(config.branches[branch].subjects[subject].length&&!confirm("المادة تحتوي مصادر. حذفها سيحذف جميع مصادرها. متابعة؟"))return;if(!confirm("تأكيد حذف المادة «"+subject+"»؟"))return;const snapshot=clone(config),selected=selection();delete config.branches[branch].subjects[subject];try{await saveSnapshot(snapshot,selected,"تم حذف المادة.");}catch{}});
$("settingsForm").addEventListener("submit",async e=>{e.preventDefault();const snapshot=clone(config),selected=selection();config.site={...(config.site||{}),contactEmail:$("siteEmail").value.trim(),whatsappNumber:$("siteWhatsapp").value.trim(),telegramChannelUrl:$("siteTelegram").value.trim(),examDate:$("siteExamDate").value,teacherMessage:$("siteTeacherMessage").value.trim()};try{await saveSnapshot(snapshot,selected,"تم حفظ إعدادات الموقع.");}catch{}});
})();