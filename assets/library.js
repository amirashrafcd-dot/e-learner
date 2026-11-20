(() => {
  const cfg = window.EL_CONFIG || {};
  const params = new URLSearchParams(location.search);
  const branchKey = params.get("branch") === "literary" ? "literary" : "scientific";
  const branch = cfg.branches?.[branchKey];
  if (!branch) return;
  const $ = (id) => document.getElementById(id);
  const typeLabels = { book: "كتاب", summary: "ملزمة", exam: "اختبار", worksheet: "ورقة عمل" };
  const typeIcons = { book: "▤", summary: "▥", exam: "✎", worksheet: "▧" };
  let currentSubject = Object.keys(branch.subjects)[0] || "";
  let currentType = "all";
  const requestedSubject = params.get("subject");
  if (requestedSubject && Object.prototype.hasOwnProperty.call(branch.subjects, requestedSubject)) currentSubject = requestedSubject;

  $("branchTitle").textContent = branch.title;
  $("branchBreadcrumb").textContent = branch.title;
  $("branchDescription").textContent = branch.description;
  $("branchSymbol").textContent = branch.symbol;
  $("subjectCount").textContent = Object.keys(branch.subjects).length;
  $("year").textContent = new Date().getFullYear();
  $("scientificNav").classList.toggle("active", branchKey === "scientific");
  $("literaryNav").classList.toggle("active", branchKey === "literary");

  const subjectList = $("subjectList");
  Object.keys(branch.subjects).forEach((subject, index) => {
    const btn = document.createElement("button");
    btn.className = "subject-button" + (subject === currentSubject ? " active" : "");
    btn.innerHTML = `<span class="subject-dot"></span><span>${escapeHTML(subject)}</span><b>←</b>`;
    btn.addEventListener("click", () => {
      currentSubject = subject;
      subjectList.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === btn));
      render();
    });
    subjectList.appendChild(btn);
  });

  $("filterRow").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-filter]");
    if (!btn) return;
    currentType = btn.dataset.filter;
    $("filterRow").querySelectorAll("button").forEach(x => x.classList.toggle("active", x === btn));
    render();
  });
  ["searchInput", "termFilter", "yearFilter", "sortFilter"].forEach(id => { $(id).addEventListener("input", render); $(id).addEventListener("change", render); });

  function resources() {
    const list = branch.subjects[currentSubject];
    return Array.isArray(list) ? list : [];
  }
  function render() {
    const all = resources();
    const years = [...new Set(all.map(x => String(x.year || "")).filter(Boolean))].sort().reverse();
    const yearSelect = $("yearFilter");
    const previous = yearSelect.value;
    yearSelect.innerHTML = '<option value="">كل السنوات</option>' + years.map(y => `<option value="${escapeHTML(y)}">${escapeHTML(y)}</option>`).join("");
    if (years.includes(previous)) yearSelect.value = previous;

    const term = $("termFilter").value;
    const year = yearSelect.value;
    const query = $("searchInput").value.trim().toLocaleLowerCase("ar");
    const counts = { all: all.length, book: 0, summary: 0, exam: 0, worksheet: 0 };
    all.forEach(item => { if (counts[item.type] !== undefined) counts[item.type]++; });
    $("countAll").textContent = counts.all;
    $("resourceCount").textContent = `${all.length} مصدر متاح في ${currentSubject}`;
    $("activeSubjectHint").textContent = currentSubject;

    let filtered = all.filter(item => {
      const matchesType = currentType === "all" || item.type === currentType;
      const matchesTerm = !term || item.term === term;
      const matchesYear = !year || String(item.year) === year;
      const searchable = [item.title, item.teacher, item.description, item.year, item.term].join(" ").toLocaleLowerCase("ar");
      return matchesType && matchesTerm && matchesYear && (!query || searchable.includes(query));
    });
    const sort = $("sortFilter")?.value || "newest";
    filtered.sort((a,b) => sort === "az" ? String(a.title||"").localeCompare(String(b.title||""), "ar") : sort === "oldest" ? String(a.year||"").localeCompare(String(b.year||"")) : String(b.year||"").localeCompare(String(a.year||"")));
    $("visibleCount").textContent = `عرض ${filtered.length} من ${all.length}`;
    $("resourceGrid").innerHTML = "";
    $("emptyState").hidden = filtered.length > 0;
    filtered.forEach(item => {
      const card = document.createElement("article");
      card.className = "resource-card";
      const type = typeLabels[item.type] || "مصدر";
      const url = safeURL(item.driveUrl);
      card.innerHTML = `<div class="resource-card-top"><span class="resource-icon icon-${item.type}">${typeIcons[item.type] || "▤"}</span><span class="resource-type">${type}</span></div>
        <h3>${escapeHTML(item.title || "مصدر بدون عنوان")}</h3>
        <p>${escapeHTML(item.description || "مصدر تعليمي لمساعدتك في الدراسة.")}</p>
        <div class="resource-meta"><span>◷ ${escapeHTML(item.term ? "الفصل " + item.term : "كل الفصول")}</span><span>▦ ${escapeHTML(item.year || "—")}</span></div>
        <div class="resource-author">${escapeHTML(item.teacher || "مصدر تعليمي")}</div>
        <a class="resource-open ${url ? "" : "disabled"}" ${url ? `href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer"` : 'aria-disabled="true"'}>${url ? "فتح المصدر" : "الرابط غير متوفر"} <span>↗</span></a>`;
      $("resourceGrid").appendChild(card);
    });
  }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  function safeURL(value) {
    try {
      const u = new URL(value);
      return ["https:", "http:"].includes(u.protocol) ? u.href : "";
    } catch { return ""; }
  }
  render();
})();