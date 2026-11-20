(() => {
  const cfg = window.EL_CONFIG;
  if (!cfg || !cfg.branches) { alert('تعذر تحميل data.js'); return; }
  const $ = id => document.getElementById(id);
  const labels = { book: 'كتاب', summary: 'ملزمة', exam: 'اختبار', worksheet: 'ورقة عمل' };
  let editing = null;
  $('year').textContent = new Date().getFullYear();

  const subjectsFor = branch => Object.keys(cfg.branches[branch].subjects || {});
  function fillSubjects(selected) {
    const branch = $('branchSelect').value;
    $('subjectSelect').innerHTML = subjectsFor(branch).map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    if (selected && subjectsFor(branch).includes(selected)) $('subjectSelect').value = selected;
  }
  function allItems() {
    const result = [];
    Object.entries(cfg.branches).forEach(([branchKey, branch]) => {
      Object.entries(branch.subjects).forEach(([subject, list]) => {
        (Array.isArray(list) ? list : []).forEach(item => result.push({ ...item, branchKey, branchName: branch.name, subject }));
      });
    });
    return result;
  }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function stats() {
    const items = allItems();
    const counts = { book: 0, summary: 0, exam: 0, worksheet: 0 };
    items.forEach(x => { if (counts[x.type] !== undefined) counts[x.type]++; });
    $('adminStats').innerHTML = `<div><b>${items.length}</b><span>إجمالي المصادر</span></div><div><b>${counts.book}</b><span>كتب</span></div><div><b>${counts.summary}</b><span>ملازم</span></div><div><b>${counts.exam + counts.worksheet}</b><span>اختبارات وأوراق عمل</span></div>`;
  }
  function renderList() {
    const query = $('adminSearch').value.trim().toLocaleLowerCase('ar');
    const branchFilter = $('adminBranchFilter').value;
    const items = allItems().filter(x => (branchFilter === 'all' || x.branchKey === branchFilter) && [x.title,x.teacher,x.subject,x.description].join(' ').toLocaleLowerCase('ar').includes(query));
    $('adminResourceList').innerHTML = items.length ? items.map(x => `<article class="admin-resource"><div><span class="resource-type">${labels[x.type] || 'مصدر'}</span><b>${esc(x.title)}</b><small>${esc(x.branchName)} · ${esc(x.subject)} · ${esc(x.teacher || 'بدون اسم')}</small></div><div class="admin-item-actions"><button type="button" data-edit="${esc(x.id)}" data-branch="${x.branchKey}" data-subject="${esc(x.subject)}">تعديل</button><button type="button" class="danger" data-delete="${esc(x.id)}" data-branch="${x.branchKey}" data-subject="${esc(x.subject)}">حذف</button></div></article>`).join('') : '<div class="admin-empty">لا توجد مصادر بعد. ابدأ بإضافة أول مصدر من النموذج.</div>';
    stats();
  }
  function resetForm() {
    editing = null; $('resourceForm').reset(); $('editId').value = '';
    $('branchSelect').disabled = false; $('subjectSelect').disabled = false;
    $('formTitle').textContent = 'إضافة مصدر جديد'; $('saveButton').textContent = 'إضافة المصدر'; $('cancelEdit').hidden = true; $('formMessage').textContent = '';
    fillSubjects();
  }
  $('branchSelect').addEventListener('change', () => fillSubjects());
  $('resourceForm').addEventListener('submit', event => {
    event.preventDefault();
    const branchKey = $('branchSelect').value, subject = $('subjectSelect').value;
    const url = $('urlInput').value.trim();
    let parsed; try { parsed = new URL(url); } catch { $('formMessage').textContent = 'يرجى إدخال رابط صحيح.'; return; }
    if (!['https:', 'http:'].includes(parsed.protocol)) { $('formMessage').textContent = 'الرابط يجب أن يبدأ بـ https أو http.'; return; }
    const list = cfg.branches[branchKey].subjects[subject];
    const item = { id: editing || `resource-${Date.now()}`, title: $('titleInput').value.trim(), type: $('typeInput').value, teacher: $('teacherInput').value.trim(), term: $('termInput').value, year: $('yearInput').value.trim(), description: $('descriptionInput').value.trim(), driveUrl: url };
    if (!item.title) return;
    if (editing) {
      const idx = list.findIndex(x => x.id === editing);
      if (idx >= 0) list[idx] = item; else list.push(item);
      $('formMessage').textContent = 'تم تحديث المصدر في بيانات الجلسة. صدّر data.js لحفظه بالمشروع.';
    } else {
      if (list.some(x => x.id === item.id)) item.id += '-new';
      list.push(item);
      $('formMessage').textContent = 'تمت إضافة المصدر في بيانات الجلسة. صدّر data.js لحفظه بالمشروع.';
    }
    resetForm(); renderList();
  });
  $('adminResourceList').addEventListener('click', event => {
    const editBtn = event.target.closest('[data-edit]'), deleteBtn = event.target.closest('[data-delete]');
    if (editBtn) {
      const branchKey = editBtn.dataset.branch, subject = editBtn.dataset.subject, id = editBtn.dataset.edit;
      const item = cfg.branches[branchKey].subjects[subject].find(x => x.id === id); if (!item) return;
      editing = id; $('branchSelect').value = branchKey; fillSubjects(subject);
      $('branchSelect').disabled = true; $('subjectSelect').disabled = true;
      $('titleInput').value = item.title || ''; $('typeInput').value = item.type || 'book'; $('teacherInput').value = item.teacher || '';
      $('yearInput').value = item.year || ''; $('termInput').value = item.term || ''; $('descriptionInput').value = item.description || ''; $('urlInput').value = item.driveUrl || '';
      $('formTitle').textContent = 'تعديل المصدر'; $('saveButton').textContent = 'حفظ التعديلات'; $('cancelEdit').hidden = false; $('formMessage').textContent = '';
      $('resourceForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (deleteBtn) {
      const { branch, subject, delete: id } = deleteBtn.dataset;
      if (!confirm('هل تريد حذف هذا المصدر من بيانات الجلسة؟')) return;
      const list = cfg.branches[branch].subjects[subject];
      cfg.branches[branch].subjects[subject] = list.filter(x => x.id !== id);
      if (editing === id) resetForm();
      renderList();
    }
  });
  $('cancelEdit').addEventListener('click', resetForm);
  $('adminSearch').addEventListener('input', renderList); $('adminBranchFilter').addEventListener('change', renderList);
  $('exportButton').addEventListener('click', () => {
    const output = '/* تم توليد هذا الملف من لوحة إدارة e-Learner. احتفظ بنسخة احتياطية قبل الاستبدال. */\nwindow.EL_CONFIG = ' + JSON.stringify(cfg, null, 2) + ';\n';
    const blob = new Blob([output], { type: 'text/javascript;charset=utf-8' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'data.js';
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(link.href);
  });
  fillSubjects(); renderList();
})();
