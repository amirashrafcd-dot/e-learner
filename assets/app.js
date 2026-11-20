(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  window.escapeHTML = escapeHTML;
  window.safeURL = value => {
    try {
      const url = new URL(String(value || ""));
      return ["http:","https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };

  // تهيئة الثيم والقائمة والسنة فوراً، قبل طلب ملف البيانات.
  function initGeneral() {
    if ($("year")) $("year").textContent = new Date().getFullYear();
    if ($("menuToggle") && $("mainNav")) $("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
    let saved = "";
    try { saved = localStorage.getItem("el-theme") || ""; } catch {}
    if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
    else document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const button = $("themeToggle");
    const paint = () => { if (button) button.textContent = document.documentElement.dataset.theme === "light" ? "☾" : "☼"; };
    paint();
    button?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("el-theme", next); } catch {}
      paint();
    });
  }

  function initQuickFind(branches) {
    const form = $("quickFindForm"), input = $("quickFindInput"), results = $("quickFindResults");
    if (!form || !input || !results) return;
    const normalize = value => String(value || "").toLocaleLowerCase("ar")
      .replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
      .replace(/[\u064B-\u065F\u0670]/g, "").trim();
    const subjects = Object.entries(branches).flatMap(([key, branch]) =>
      Object.keys(branch.subjects || {}).map(subject => ({key, subject, branch:branch.name || key}))
    );
    const show = () => {
      const query = normalize(input.value);
      const matches = query ? subjects.filter(item =>
        normalize(item.subject).includes(query) || normalize(item.branch).includes(query)
      ).slice(0, 8) : [];
      results.innerHTML = matches.map(item =>
        '<a href="branch.html?branch=' + encodeURIComponent(item.key) + '&subject=' + encodeURIComponent(item.subject) + '">' +
        '<span>' + escapeHTML(item.subject) + '</span><small>الفرع ' + escapeHTML(item.branch) + '</small><b>←</b></a>'
      ).join("");
      results.hidden = !matches.length;
    };
    input.addEventListener("input", show);
    form.addEventListener("submit", event => {
      event.preventDefault(); show();
      const first = results.querySelector("a");
      if (first) location.href = first.href; else input.focus();
    });
    document.addEventListener("click", event => { if (!form.contains(event.target)) results.hidden = true; });
  }

  function configureSite(site, branches) {
    const email = site.contactEmail || "";
    const phone = String(site.whatsappNumber || "").replace(/\D/g, "");
    const teacherText = site.teacherMessage || "مرحباً، أرغب بالمساهمة بمحتوى تعليمي في منصة e-Learner.";
    const mail = (subject, body) => "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    const wa = message => "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
    if ($("teacherContact")) $("teacherContact").href = phone ? wa(teacherText) : mail("المساهمة بمحتوى تعليمي في e-Learner", teacherText + "\n\nالاسم: \nالمادة والفرع: \nنوع المصدر ورابطه:");
    if ($("generalEmail")) $("generalEmail").href = email ? "mailto:" + email : "#";
    if ($("contributeLink")) $("contributeLink").href = phone ? wa("مرحباً، أرغب باقتراح مصدر تعليمي لمنصة e-Learner.") : (email ? mail("اقتراح مصدر تعليمي", "أقترح إضافة المصدر التالي:") : "#");
    if ($("telegramLink")) {
      const telegram = window.safeURL(site.telegramChannelUrl);
      $("telegramLink").hidden = !telegram;
      if (telegram) $("telegramLink").href = telegram;
    }
    const subjects = Object.values(branches).reduce((n, branch) => n + Object.keys(branch.subjects || {}).length, 0);
    const sources = Object.values(branches).reduce((n, branch) => n + Object.values(branch.subjects || {}).reduce((m, list) => m + (Array.isArray(list) ? list.length : 0), 0), 0);
    if ($("statBranches")) $("statBranches").textContent = String(Object.keys(branches).length);
    if ($("statSubjects")) $("statSubjects").textContent = String(subjects);
    if ($("statResources")) $("statResources").textContent = String(sources);
  }

  initGeneral();
  async function loadData() {
    try {
      const response = await fetch("data.json", {cache:"no-cache"});
      if (!response.ok) throw new Error("تعذر تحميل ملف البيانات (" + response.status + ").");
      const config = await response.json();
      if (!config || !config.site || !config.branches) throw new Error("بنية ملف البيانات غير مكتملة.");
      window.EL_CONFIG = config;
      configureSite(config.site, config.branches);
      initQuickFind(config.branches);
      document.dispatchEvent(new CustomEvent("el:data-ready", {detail:config}));
    } catch (error) {
      document.dispatchEvent(new CustomEvent("el:data-error", {detail:{message:error.message}}));
      const results = $("quickFindResults");
      if (results) { results.hidden = false; results.textContent = "تعذر تحميل بيانات المنصة. أعد تحميل الصفحة بعد قليل."; }
    }
  }
  loadData();
})();