(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const branchKey = params.get("branch") === "literary" ? "literary" : "scientific";
  const typeLabels = {book:"كتاب",summary:"ملزمة",exam:"اختبار",worksheet:"ورقة عمل",solution:"حلول",pastExam:"امتحان وزارة سابق",video:"شرح فيديو"};
  const typeIcons = {book:"▤",summary:"▥",exam:"✎",worksheet:"▧",solution:"✓",pastExam:"▣",video:"▶"};
  let config=null, branch=null, currentSubject=params.get("subject")||"", currentType=params.get("type")||"all", currentGrade=params.get("grade")||"";
  const escapeHTML = window.escapeHTML || (v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])));
  const safeURL = window.safeURL || (v=>{try{const u=new URL(String(v||""));return ["http:","https:"].includes(u.protocol)?u.href:"";}catch{return "";}});
  function updateURL() {
    const next = new URLSearchParams();
    next.set("branch",branchKey);
    if (currentSubject) next.set("subject",currentSubject);
    if (currentType !== "all") next.set("type",currentType);
    if (currentGrade) next.set("grade",currentGrade);
    history.replaceState(null,"",location.pathname+"?"+next.toString());
  }
  function resources(){const list=branch?.subjects?.[currentSubject];return Array.isArray(list)?list:[];}
  function updateSelectOptions(all) {
    const gradeSelect=$("gradeFilter"), years=[...new Set(all.map(x=>String(x.year||"")).filter(Boolean))].sort().reverse();
    const validGrades=[...new Set(all.map(x=>String(x.grade||"")).filter(Boolean))];
    gradeSelect.innerHTML='<option value="">كل الصفوف</option>'+validGrades.sort().map(g=>'<option value="'+escapeHTML(g)+'">'+(g==="11"?"الحادي عشر":g==="12"?"الثاني عشر":escapeHTML(g))+'</option>').join("");
    gradeSelect.value=currentGrade;
    const yearSelect=$("yearFilter"), previous=yearSelect.value;
    yearSelect.innerHTML='<option value="">كل السنوات</option>'+years.map(y=>'<option value="'+escapeHTML(y)+'">'+escapeHTML(y)+'</option>').join("");
    if(years.includes(previous)) yearSelect.value=previous;
  }
  function paintTypeButtons(all) {
    const counts={all:all.length};
    all.forEach(item=>counts[item.type]=(counts[item.type]||0)+1);
    if(currentType!=="all" && !counts[currentType]) currentType="all";
    document.querySelectorAll("#filterRow [data-filter]").forEach(button=>{
      const type=button.dataset.filter, count=counts[type]||0;
      button.hidden=type!=="all" && count===0;
      button.classList.toggle("active",type===currentType);
      const badge=button.querySelector("[data-count]");
      if(badge) badge.textContent=String(count);
      button.setAttribute("aria-pressed",String(type===currentType));
    });
  }
  function render() {
    if(!branch)return;
    const all=resources();
    paintTypeButtons(all);
    updateSelectOptions(all);
    const term=$("termFilter").value, year=$("yearFilter").value, query=$("searchInput").value.trim().toLocaleLowerCase("ar");
    const filtered=all.filter(item=>{
      const matchesType=currentType==="all"||item.type===currentType;
      const matchesGrade=!currentGrade||String(item.grade||"")===currentGrade;
      const matchesTerm=!term||item.term===term, matchesYear=!year||String(item.year||"")===year;
      const searchable=[item.title,item.teacher,item.description,item.year,item.term,item.unit].join(" ").toLocaleLowerCase("ar");
      return matchesType&&matchesGrade&&matchesTerm&&matchesYear&&(!query||searchable.includes(query));
    });
    const sort=$("sortFilter").value;
    filtered.sort((a,b)=>{
      if(sort==="az")return String(a.title||"").localeCompare(String(b.title||""),"ar");
      const da=Date.parse(a.added||"")||0, db=Date.parse(b.added||"")||0;
      const ya=Number(a.year)||0, yb=Number(b.year)||0;
      return sort==="oldest" ? (da-db)||(ya-yb) : (db-da)||(yb-ya);
    });
    $("branchTitle").textContent=branch.title; $("branchBreadcrumb").textContent=branch.title;
    $("branchDescription").textContent=branch.description; $("branchSymbol").textContent=branch.symbol;
    $("subjectTitle").textContent=currentSubject; $("subjectCount").textContent=Object.keys(branch.subjects||{}).length;
    $("resourceCount").textContent=all.length+" مصدر في "+currentSubject;
    $("activeSubjectHint").textContent=currentSubject;
    $("countAll").textContent=all.length;
    $("visibleCount").textContent="عرض "+filtered.length+" من "+all.length;
    const grid=$("resourceGrid"); grid.innerHTML="";
    $("emptyState").hidden=filtered.length>0;
    $("emptyState").querySelector("h3").textContent=all.length?"لا توجد نتائج مطابقة":"لم نضف مصادر لهذه المادة بعد";
    $("emptyState").querySelector("p").textContent=all.length?"جرّب تغيير كلمات البحث أو الفلاتر.":"يمكنك اقتراح مصدر تعليمي لإضافته إلى المكتبة.";
    const subjectList=$("subjectList"); subjectList.innerHTML="";
    Object.keys(branch.subjects||{}).forEach(subject=>{
      const btn=document.createElement("button");btn.type="button";btn.className="subject-button"+(subject===currentSubject?" active":"");
      btn.innerHTML='<span class="subject-dot"></span><span>'+escapeHTML(subject)+'</span><b>←</b>';
      btn.addEventListener("click",()=>{currentSubject=subject;updateURL();render();});subjectList.appendChild(btn);
    });
    filtered.forEach(item=>{
      const card=document.createElement("article");card.className="resource-card";
      const url=safeURL(item.url||item.driveUrl), mirror=safeURL(item.mirrorUrl);
      card.innerHTML='<div class="resource-card-top"><span class="resource-icon icon-'+escapeHTML(item.type)+'">'+(typeIcons[item.type]||"▤")+'</span><span class="resource-type">'+(typeLabels[item.type]||"مصدر")+'</span></div>'+
        '<h3>'+escapeHTML(item.title||"مصدر بدون عنوان")+'</h3><p>'+escapeHTML(item.description||"")+'</p>'+
        '<div class="resource-meta"><span>'+escapeHTML(item.grade?("الصف "+(item.grade==="11"?"الحادي عشر":"الثاني عشر")):"")+'</span><span>'+escapeHTML(item.term?("الفصل "+item.term):"")+'</span><span>'+escapeHTML(item.year||"")+'</span></div>'+
        '<div class="resource-author">'+escapeHTML(item.teacher||"")+'</div>'+
        (url?'<a class="resource-open" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">فتح المصدر ↗</a>':'<span class="resource-open disabled">الرابط غير متوفر</span>')+
        (mirror?'<a class="resource-open" href="'+escapeHTML(mirror)+'" target="_blank" rel="noopener noreferrer">رابط بديل ↗</a>':'');
      grid.appendChild(card);
    });
    updateURL();
  }
  function showLoadError(message) {
    const grid=$("resourceGrid");grid.innerHTML='<div class="empty-state"><h3>تعذّر تحميل مكتبة e-Learner</h3><p>'+escapeHTML(message||"تحقق من اتصال الإنترنت ثم أعد المحاولة.")+'</p><button class="btn btn-primary" id="retryData">إعادة المحاولة</button></div>';
    $("retryData").addEventListener("click",()=>location.reload());
  }
  document.addEventListener("el:data-error",e=>showLoadError(e.detail?.message));
  document.addEventListener("el:data-ready",e=>{
    config=e.detail;branch=config.branches[branchKey];
    if(!branch){showLoadError("الفرع المطلوب غير موجود في ملف البيانات.");return;}
    if(!Object.prototype.hasOwnProperty.call(branch.subjects||{},currentSubject))currentSubject=Object.keys(branch.subjects||{})[0]||"";
    $("scientificNav").classList.toggle("active",branchKey==="scientific");$("literaryNav").classList.toggle("active",branchKey==="literary");
    $("filterRow").addEventListener("click",event=>{const btn=event.target.closest("[data-filter]");if(!btn)return;currentType=btn.dataset.filter;render();});
    $("searchInput").addEventListener("input",render);
    ["termFilter","yearFilter","sortFilter"].forEach(id=>$(id).addEventListener("change",render));
    $("gradeFilter").addEventListener("change",()=>{currentGrade=$("gradeFilter").value;render();});
    const site=config.site||{},email=site.contactEmail||"",phone=String(site.whatsappNumber||"").replace(/\D/g,"");
    const message="أقترح إضافة مصدر لمادة "+currentSubject+" في e-Learner.";
    $("contributeLink").href=phone?"https://wa.me/"+phone+"?text="+encodeURIComponent(message):(email?"mailto:"+email+"?subject="+encodeURIComponent("اقتراح مصدر"): "#");
    render();
  });
})();