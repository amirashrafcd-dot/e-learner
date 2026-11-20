(() => {
  const cfg = window.EL_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const whatsapp = (message) => `https://wa.me/${(cfg.whatsappNumber || "").replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  const email = cfg.contactEmail || "";

  if ($("year")) $("year").textContent = new Date().getFullYear();
  if ($("teacherContact")) {
    const subject = encodeURIComponent("المساهمة بمحتوى تعليمي في e-Learner");
    const body = encodeURIComponent((cfg.teacherMessage || "مرحباً، أرغب بالمساهمة في المنصة.") + "\n\nالاسم: \nالمادة والفرع: \nنوع المصدر ورابطه: ");
    $("teacherContact").href = cfg.whatsappNumber ? whatsapp(cfg.teacherMessage || "مرحباً، أرغب بالمساهمة في المنصة.") : `mailto:${email}?subject=${subject}&body=${body}`;
  }
  if ($("generalEmail")) {
    $("generalEmail").href = email && !email.includes("example.com") ? `mailto:${email}` : "#";
    if (!email || email.includes("example.com")) $("generalEmail").textContent = "أضف بريد التواصل في data.js لتفعيله";
  }
  if ($("menuToggle")) {
    $("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
  }
  if ($("statSubjects") && cfg.branches) {
    const subjects = Object.values(cfg.branches).reduce((n, b) => n + Object.keys(b.subjects || {}).length, 0);
    $("statSubjects").textContent = String(subjects).padStart(2, "0");
  }
  if ($("contributeLink")) {
    const msg = "مرحباً، أرغب باقتراح مصدر تعليمي لمنصة e-Learner.";
    $("contributeLink").href = cfg.whatsappNumber ? whatsapp(msg) : `mailto:${email}`;
  }
  // Shared appearance preference
  const themeButton = $("themeToggle");
  const savedTheme = localStorage.getItem("el-theme");
  if (savedTheme === "light") document.documentElement.dataset.theme = "light";
  if (themeButton) {
    const paint = () => themeButton.textContent = document.documentElement.dataset.theme === "light" ? "☾" : "☼";
    paint();
    themeButton.addEventListener("click", () => {
      const light = document.documentElement.dataset.theme !== "light";
      document.documentElement.dataset.theme = light ? "light" : "dark";
      localStorage.setItem("el-theme", light ? "light" : "dark"); paint();
    });
  }
  // Reveal sections smoothly as they enter the viewport
  const revealTargets = document.querySelectorAll(".section, .stats, .quick-find, .contact-section, .library-hero, .library-layout, .contribute-strip");
  if ("IntersectionObserver" in window) {
    revealTargets.forEach(el => el.classList.add("reveal"));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    revealTargets.forEach(el => observer.observe(el));
  }
  // Smart subject finder routes to the matching branch and subject
  const finder = $("quickFindForm"), finderInput = $("quickFindInput"), results = $("quickFindResults");
  if (finder && finderInput && cfg.branches) {
    const normalize = value => String(value).toLocaleLowerCase("ar").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").trim();
    const subjects = Object.entries(cfg.branches).flatMap(([key, branch]) => Object.keys(branch.subjects || {}).map(subject => ({key, subject, branch:branch.name})));
    const show = () => {
      const q = normalize(finderInput.value);
      const matches = q ? subjects.filter(x => normalize(x.subject).includes(q) || normalize(x.branch).includes(q)).slice(0,6) : [];
      results.innerHTML = matches.map(x => `<a href="branch.html?branch=${x.key}&subject=${encodeURIComponent(x.subject)}"><span>${x.subject}</span><small>الفرع ${x.branch}</small><b>←</b></a>`).join("");
      results.hidden = !matches.length;
    };
    finderInput.addEventListener("input", show);
    finder.addEventListener("submit", event => { event.preventDefault(); show(); const first=results.querySelector("a"); if(first) location.href=first.href; else finderInput.focus(); });
    document.addEventListener("click", event => { if(!finder.contains(event.target)) results.hidden=true; });
  }
})();