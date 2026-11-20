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
})();