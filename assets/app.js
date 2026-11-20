(() => {
"use strict";
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
window.escapeHTML=escapeHTML;
window.safeURL=value=>{try{const u=new URL(String(value||""));return ["http:","https:"].includes(u.protocol)?u.href:"";}catch{return "";}};
const TYPES={book:"كتاب",summary:"ملزمة",exam:"اختبار",worksheet:"ورقة عمل",solution:"حلول",pastExam:"امتحان وزارة سابق",video:"شرح فيديو"};
const ICONS={book:"▤",summary:"▥",exam:"✎",worksheet:"▧",solution:"✓",pastExam:"▣",video:"▶"};
const normalize=value=>String(value||"").toLocaleLowerCase("ar").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[\u064B-\u065F\u0670]/g,"").trim();
const readStore=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v??fallback;}catch{return fallback;}};
const writeStore=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
const keyOf=(branch,subject,item)=>[branch,subject,item.id||item.title||item.url||item.driveUrl].join("::");
const collect=branches=>Object.entries(branches||{}).flatMap(([branchKey,b])=>Object.entries(b.subjects||{}).flatMap(([subject,items])=>(Array.isArray(items)?items:[]).map(item=>({...item,branchKey,branchName:b.name||branchKey,subject,key:keyOf(branchKey,subject,item)}))));
function initGeneral(){
 if($("year"))$("year").textContent=new Date().getFullYear();
 const menu=$("menuToggle"),nav=$("mainNav");menu?.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));});
 let saved="";try{saved=localStorage.getItem("el-theme")||"";}catch{}
 document.documentElement.dataset.theme=saved==="light"||saved==="dark"?saved:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
 const theme=$("themeToggle"),paint=()=>{if(theme)theme.textContent=document.documentElement.dataset.theme==="dark"?"☀":"☾";};paint();
 theme?.addEventListener("click",()=>{const next=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;try{localStorage.setItem("el-theme",next);}catch{}paint();});
}
function sourceCard(item,{compact=false}={}){
 const url=window.safeURL(item.url||item.driveUrl),mirror=window.safeURL(item.mirrorUrl);
 const added=Date.parse(item.added||"");const isNew=Number.isFinite(added)&&added>0&&(Date.now()-added)<=14*86400000;
 const card=document.createElement("article");card.className="resource-card"+(compact?" compact-card":"");
 const meta=[item.grade?("الصف "+(item.grade==="11"?"الحادي عشر":"الثاني عشر")):"",item.term?("الفصل "+item.term):"",item.year||""].filter(Boolean);
 card.innerHTML='<div class="resource-card-top"><span class="resource-icon icon-'+escapeHTML(item.type)+'">'+(ICONS[item.type]||"▤")+'</span><span class="resource-type">'+escapeHTML(TYPES[item.type]||"مصدر")+'</span>'+(isNew?'<span class="new-badge">جديد</span>':'')+'</div><h3>'+escapeHTML(item.title||"مصدر بدون عنوان")+'</h3><p>'+escapeHTML(item.description||"")+'</p><div class="resource-meta">'+meta.map(x=>'<span>'+escapeHTML(x)+'</span>').join("")+'</div>'+(item.teacher?'<div class="resource-author">'+escapeHTML(item.teacher)+'</div>':'')+'<div class="resource-actions">'+(url?'<a class="resource-open" data-open-source href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">فتح المصدر ↗</a>':'<span class="resource-open disabled">الرابط غير متوفر</span>')+(mirror?'<a class="secondary-action" href="'+escapeHTML(mirror)+'" target="_blank" rel="noopener noreferrer">رابط بديل</a>':'')+'<button type="button" class="secondary-action favorite-toggle" aria-pressed="false">♡ المفضّلة</button><a class="secondary-action report-link" href="#">الرابط لا يعمل؟</a></div>';
 const favs=readStore("el-favorites",[]);const isFav=favs.includes(item.key);const fav=card.querySelector(".favorite-toggle");fav.textContent=isFav?"♥ محفوظ":"♡ المفضّلة";fav.setAttribute("aria-pressed",String(isFav));
 fav.addEventListener("click",()=>{let list=readStore("el-favorites",[]);const has=list.includes(item.key);list=has?list.filter(k=>k!==item.key):[...list,item.key];writeStore("el-favorites",list);fav.textContent=has?"♡ المفضّلة":"♥ محفوظ";fav.setAttribute("aria-pressed",String(!has));document.dispatchEvent(new Event("el:saved-changed"));});
 const report=card.querySelector(".report-link");const message="مرحباً، أبلغ عن مشكلة في رابط مصدر على e-Learner.\nالعنوان: "+(item.title||"") +"\nالمعرّف: "+(item.id||"غير متوفر")+"\nالمادة: "+item.subject+"\nالفرع: "+item.branchName;
 const config=window.EL_CONFIG||{},site=config.site||{},phone=String(site.whatsappNumber||"").replace(/\D/g,""),email=site.contactEmail||"";
 report.href=phone?"https://wa.me/"+phone+"?text="+encodeURIComponent(message):(email?"mailto:"+email+"?subject="+encodeURIComponent("الإبلاغ عن رابط لا يعمل")+"&body="+encodeURIComponent(message):"index.html#contact");
 card.querySelector("[data-open-source]")?.addEventListener("click",()=>{let recent=readStore("el-recent",[]).filter(x=>x.key!==item.key);recent.unshift({key:item.key,title:item.title,branchName:item.branchName,subject:item.subject,url});writeStore("el-recent",recent.slice(0,8));document.dispatchEvent(new Event("el:saved-changed"));});
 return card;
}
function renderSaved(all){
 const favKeys=readStore("el-favorites",[]),recent=readStore("el-recent",[]);
 const fill=(id,emptyId,items,emptyText)=>{const host=$(id),empty=$(emptyId);if(!host)return;host.innerHTML="";items.forEach(x=>host.appendChild(sourceCard(x,{compact:true})));if(empty)empty.hidden=items.length>0;};
 fill("favoritesGrid","favoritesEmpty",all.filter(x=>favKeys.includes(x.key)).slice(0,8));
 const recentItems=recent.map(r=>all.find(x=>x.key===r.key)||r).filter(x=>x.url);
 fill("recentGrid","recentEmpty",recentItems.slice(0,8));
}
function globalSearch(input,results,all){
 if(!input||!results)return;const q=normalize(input.value);results.innerHTML="";
 if(!q){results.hidden=true;return;}
 const matches=all.filter(x=>[x.title,x.description,x.teacher,x.subject,x.branchName,TYPES[x.type],x.unit,x.year].some(v=>normalize(v).includes(q))).slice(0,30);
 results.hidden=false;
 if(!matches.length){results.innerHTML='<p class="empty-search">لا توجد نتائج مطابقة. جرّب كلمة أخرى.</p>';return;}
 matches.forEach(item=>{const a=document.createElement("a");a.className="global-result";a.href="branch.html?branch="+encodeURIComponent(item.branchKey)+"&subject="+encodeURIComponent(item.subject)+"&type="+encodeURIComponent(item.type||"all")+(item.grade?"&grade="+encodeURIComponent(item.grade):"");a.innerHTML='<b>'+escapeHTML(item.title||"مصدر")+'</b><span>'+escapeHTML(item.subject)+" · "+escapeHTML(item.branchName)+" · "+escapeHTML(TYPES[item.type]||"مصدر")+'</span>';results.appendChild(a);});
}
function toPalestineDate(value){
 const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);if(!m)return null;
 const n=m.slice(1).map(Number),target=Date.UTC(n[0],n[1]-1,n[2],n[3],n[4]);let guess=target;
 try{const fmt=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Gaza",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});for(let i=0;i<3;i++){const p=Object.fromEntries(fmt.formatToParts(new Date(guess)).map(x=>[x.type,x.value]));guess+=target-Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);}return new Date(guess);}catch{return null;}
}
function initHomepage(config,all){
 const branches=config.branches||{},keys=Object.keys(branches),subjects=Object.values(branches).reduce((n,b)=>n+Object.keys(b.subjects||{}).length,0);
 const sources=all.length;if($("statBranches"))$("statBranches").textContent=keys.length;if($("statSubjects"))$("statSubjects").textContent=subjects;if($("statResources"))$("statResources").textContent=sources;
 const quick=$("quickSubjects");if(quick){quick.innerHTML="";all.filter((x,i,a)=>a.findIndex(y=>y.subject===x.subject)===i).slice(0,8).forEach(x=>{const a=document.createElement("a");a.href="branch.html?branch="+encodeURIComponent(x.branchKey)+"&subject="+encodeURIComponent(x.subject);a.textContent=x.subject;quick.appendChild(a);});}
 const form=$("quickFindForm"),input=$("quickFindInput"),results=$("quickFindResults");form?.addEventListener("submit",e=>{e.preventDefault();globalSearch(input,results,all);results?.scrollIntoView({behavior:"smooth",block:"nearest"});});input?.addEventListener("input",()=>globalSearch(input,results,all));
 const latest=[...all].sort((a,b)=>(Date.parse(b.added||"")||0)-(Date.parse(a.added||"")||0)).slice(0,6),grid=$("latestGrid");if(grid){grid.innerHTML="";latest.forEach(x=>grid.appendChild(sourceCard(x,{compact:true})));if($("latestEmpty"))$("latestEmpty").hidden=latest.length>0;}
 const date=config.site?.examDate||"";if(date&&$("countdownPanel")){const target=toPalestineDate(date);if(target&&!Number.isNaN(target.getTime())){const panel=$("countdownPanel");panel.hidden=false;const update=()=>{const diff=target.getTime()-Date.now();if(diff<=0){$("countdownValue").textContent="بدأ الموعد أو انتهى";$("countdownLabel").textContent="موعد الامتحان المحدد";return;}const d=Math.floor(diff/86400000),h=Math.floor(diff%86400000/3600000),m=Math.floor(diff%3600000/60000);$("countdownValue").textContent=d+" يوم · "+h+" ساعة · "+m+" دقيقة";};update();setInterval(update,60000);}}
 initCalculator();
 const tg=window.safeURL(config.site?.telegramChannelUrl);if(tg){if($("telegramCallout"))$("telegramCallout").hidden=false;if($("telegramMain"))$("telegramMain").href=tg;if($("telegramLink")){$("telegramLink").hidden=false;$("telegramLink").href=tg;}}
 renderSaved(all);document.addEventListener("el:saved-changed",()=>renderSaved(all));
}
function initCalculator(){
 const host=$("gradeRows");if(!host)return;
 const add=()=>{const row=document.createElement("div");row.className="grade-row";row.innerHTML='<label>العلامة<input type="number" min="0" max="100" step="0.01" class="grade-mark" placeholder="مثلاً 90"></label><label>الوزن<input type="number" min="0" step="0.01" class="grade-weight" placeholder="مثلاً 2"></label><button type="button" class="remove-grade" aria-label="حذف المادة">×</button>';row.querySelector("button").addEventListener("click",()=>row.remove());host.appendChild(row);};
 add();add();$("addGradeRow")?.addEventListener("click",add);$("calculateAverage")?.addEventListener("click",()=>{let weighted=0,total=0,valid=true;host.querySelectorAll(".grade-row").forEach(row=>{const mark=Number(row.querySelector(".grade-mark").value),weight=Number(row.querySelector(".grade-weight").value);if(row.querySelector(".grade-mark").value!==""||row.querySelector(".grade-weight").value!==""){if(!Number.isFinite(mark)||mark<0||mark>100||!Number.isFinite(weight)||weight<=0)valid=false;else{weighted+=mark*weight;total+=weight;}}});$("averageResult").textContent=!valid?"تحقق من العلامات والأوزان المدخلة.":total?(weighted/total).toFixed(2)+"%":"أدخل علامة ووزناً لمادة واحدة على الأقل.";});
}
function configureContacts(site){
 const email=site.contactEmail||"",phone=String(site.whatsappNumber||"").replace(/\D/g,""),message=site.teacherMessage||"مرحباً، أرغب بالمساهمة بمصدر تعليمي في e-Learner.";
 const mail=(subject,body)=>email?"mailto:"+email+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body):"index.html#contact";
 if($("teacherContact"))$("teacherContact").href=phone?"https://wa.me/"+phone+"?text="+encodeURIComponent(message):mail("المساهمة في e-Learner",message+"\n\nالاسم: \nالمادة والفرع: \nرابط المصدر:");
 if($("generalEmail"))$("generalEmail").href=email?"mailto:"+email:"#contact";
 if($("contributeLink"))$("contributeLink").href=phone?"https://wa.me/"+phone+"?text="+encodeURIComponent("أرغب باقتراح مصدر للمادة "+(new URLSearchParams(location.search).get("subject")||"")+"."):mail("اقتراح مصدر","أرغب باقتراح مصدر تعليمي.");
 const tg=window.safeURL(site.telegramChannelUrl);if($("telegramLink")){$("telegramLink").hidden=!tg;if(tg)$("telegramLink").href=tg;}
}
function init(){
 initGeneral();
 fetch("data.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw new Error("تعذر تحميل البيانات.");return r.json();}).then(config=>{if(!config?.branches)throw new Error("ملف البيانات غير مكتمل.");window.EL_CONFIG=config;const all=collect(config.branches);configureContacts(config.site||{});initHomepage(config,all);document.dispatchEvent(new CustomEvent("el:data-ready",{detail:config}));}).catch(error=>{document.dispatchEvent(new CustomEvent("el:data-error",{detail:{message:error.message}}));const results=$("quickFindResults");if(results){results.hidden=false;results.textContent="تعذّر تحميل المكتبة. تحقق من الاتصال ثم أعد تحميل الصفحة.";}const latest=$("latestEmpty");if(latest){latest.hidden=false;latest.textContent="تعذّر تحميل المصادر حالياً.";} });
}
document.addEventListener("DOMContentLoaded",init);
})();