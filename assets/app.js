(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  window.escapeHTML = escapeHTML;
  window.safeURL = value => {
    try { const url = new URL(String(value || "")); return ["http:","https:"].includes(url.protocol) ? url.href : ""; }
    catch { return ""; }
  };

  // تهيئة عامة مستقلة عن تحميل بيانات المكتبة حتى لا تتأخر القائمة والثيم والسنة.
  function initGeneral() {
    if ($("year")) $("year").textContent = new Date().getFullYear();
    if ($("menuToggle") && $("mainNav")) $("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
    const button = $("themeToggle");
    let saved = "";
    try { saved = localStorage.getItem("el-theme") || ""; } catch {}
    if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
    else document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const paint = () => { if (button) button.textContent = document.documentElement.dataset.theme === "light" ? "☾" : "☼"; };
    paint();
    button?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("el-theme", next); } catch {}
      paint();
    });
  }
  initGeneral();

  function configureSite(site, branches) {
    const email = site.contactEmail || "";
    const whatsapp = String(site.whatsappNumber || "").replace(/\D/g, "");
    const teacherText = site.teacherMessage || "مرحباً، أرغب بالمساهمة بمحتوى تعليمي في منصة e-Learner.";
    const mail = (subject, body) => "mailto:" + encodeURIComponent(email) + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    const wa = message => "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(message);
    const contact = $("teacherContact");
    if (contact) contact.href = whatsapp ? wa(teacherText) : mail("المساهمة بمحتوى تعليمي في e-Learner", teacherText + "\n\nالاسم: \nالمادة والفرع: \nنوع المصدر ورابطه:");
    const general = $("generalEmail");
    if (general) { general.href = email ? "mailto:" + email : "#"; if (!email) general.textContent = "لم يحدد بريد التواصل بعد"; }
    const contribute = $("contributeLink");
    if (contribute) contribute.href = whatsapp ? wa("مرحباً، أرغب باقتراح مصدر تعليمي لمنصة e-Learner.") : (email ? mail("اقتراح مصدر تعليمي", "أقترح إضافة المصدر التالي:") : "#");
    const telegram = $("telegramLink");
    if (telegram) { const url = window.safeURL(site.telegramChannelUrl); telegram.hidden = !url; if (url) telegram.href = url; }
    const subjectCount = Object.values(branches).reduce((n,b)=>n+Object.keys(b.subjects||{}).length,0);
    const sourceCount = Object.values(branches).reduce((n,b)=>n+Object.values(b.subjects||{}).reduce((m,list)=>m+(Array.isArray(list)?list.length:0),0),0);
    if ($("statBranches")) $("statBranches").textContent = String(Object.keys(branches).length);
    if ($("statSubjects")) $("statSubjects").textContent = String(subjectCount);
    if ($("statResources")) $("statResources").textContent = String(sourceCount);
    if ($("statSourcesLabel")) $("statSourcesLabel").textContent = "مصدر متاح";
  }

  async function loadData() {
    try {
      const response = await fetch("data.json", {cache:"no-cache"});
      if (!response.ok) throw new Error("تعذر تحميل ملف البيانات (" + response.status + ").");
      const config = await response.json();
      if (!config || !config.branches || !config.site) throw new Error("بنية ملف البيانات غير مكتملة.");
      window.EL_CONFIG = config;
      configureSite(config.site, config.branches);
      document.dispatchEvent(new CustomEvent("el:data-ready", {detail:config}));
    } catch (error) {
      document.dispatchEvent(new CustomEvent("el:data-error", {detail:{message:error.message}}));
      const quick = $("quickFindResults");
      if (quick) { quick.hidden=false; quick.textContent="تعذر تحميل بيانات المنصة. أعد تحميل الصفحة بعد قليل."; }
    }
  }
  loadData();
})();