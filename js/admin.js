/**
 * admin.js — Admin Panel Logic for MediHire
 * Renders admin stats, job management table, CRUD operations
 */

const Admin = (() => {

  // ─── Render Admin Panel ────────────────────────────────────
  function render() {
    const jobs = Store.getJobs();
    const apps = Store.getApplications();
    const totalApps = apps.length;
    const urgentJobs = jobs.filter(j => j.urgent).length;
    const categories = [...new Set(jobs.map(j => j.category))].length;

    const container = document.getElementById('view-admin');
    container.innerHTML = `
      <div class="min-h-screen px-4 py-8 max-w-7xl mx-auto">

        <!-- Header -->
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div class="section-tag mb-3">
              <i data-lucide="shield" class="w-3 h-3"></i>
              Admin Control Center
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-slate-100">
              Job <span class="gradient-text">Management</span>
            </h1>
            <p class="text-slate-400 mt-1 text-sm">Manage all healthcare job listings in real-time</p>
          </div>
          <button onclick="openAdminModal()" id="add-job-btn"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-shadow text-sm">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Add New Healthcare Job
          </button>
        </div>

        <!-- Stat Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          ${renderStatCard('briefcase', 'Total Jobs', jobs.length, 'from-cyan-500 to-blue-600', 'cyan')}
          ${renderStatCard('file-text', 'Total Applications', totalApps, 'from-emerald-500 to-teal-600', 'emerald')}
          ${renderStatCard('alert-triangle', 'Urgent Postings', urgentJobs, 'from-amber-500 to-orange-600', 'amber')}
          ${renderStatCard('grid-3x3', 'Categories', categories, 'from-violet-500 to-purple-600', 'violet')}
        </div>

        <!-- Grid layout for applications -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 text-left">
          <!-- Applications per Job -->
          <div class="lg:col-span-1 glass-card rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h3 class="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <i data-lucide="bar-chart-2" class="w-4 h-4 text-cyan-400"></i>
                Applications per Job
              </h3>
              <div class="space-y-3">
                ${jobs.slice(0, 5).map(job => {
                  const jobApps = apps.filter(a => a.jobId === job.id).length;
                  const maxApps = Math.max(...jobs.map(j => j.applicants || 0), 1);
                  const pct = Math.round((jobApps / Math.max(maxApps, 1)) * 100);
                  return `
                    <div class="flex items-center gap-3">
                      <span class="text-lg">${job.icon || '🏥'}</span>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs text-slate-300 truncate font-medium text-left block">${job.title}</span>
                          <span class="text-xs text-cyan-400 font-bold ml-2">${jobApps}</span>
                        </div>
                        <div class="progress-bar">
                          <div class="progress-fill" style="width: ${pct}%"></div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
          
          <!-- Manage Applications -->
          <div class="lg:col-span-2 glass-card rounded-2xl p-5">
            <h3 class="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <i data-lucide="file-text" class="w-4 h-4 text-cyan-400"></i>
              Manage Applications
            </h3>
            <div class="space-y-4 max-h-[320px] overflow-y-auto pr-2">
              ${renderAppsList(apps, jobs)}
            </div>
          </div>
        </div>

        <!-- Jobs Table -->
        <div class="glass-card rounded-2xl overflow-hidden">
          <div class="p-5 border-b border-slate-800/50 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-200 flex items-center gap-2">
              <i data-lucide="list" class="w-4 h-4 text-cyan-400"></i>
              All Job Listings (${jobs.length})
            </h3>
            <div class="flex items-center gap-2">
              <input type="text" id="admin-search" placeholder="Search jobs..." onkeyup="filterAdminJobs()"
                class="glass-input text-xs py-1.5 px-3" style="border-radius:0.625rem;" />
            </div>
          </div>

          <!-- Table (desktop) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-800/50">
                  <th class="text-left text-xs text-slate-500 font-medium px-5 py-3 uppercase tracking-wider">Job</th>
                  <th class="text-left text-xs text-slate-500 font-medium px-4 py-3 uppercase tracking-wider">Category</th>
                  <th class="text-left text-xs text-slate-500 font-medium px-4 py-3 uppercase tracking-wider">Type</th>
                  <th class="text-left text-xs text-slate-500 font-medium px-4 py-3 uppercase tracking-wider">Location</th>
                  <th class="text-left text-xs text-slate-500 font-medium px-4 py-3 uppercase tracking-wider">Apps</th>
                  <th class="text-left text-xs text-slate-500 font-medium px-4 py-3 uppercase tracking-wider">Urgent</th>
                  <th class="text-right text-xs text-slate-500 font-medium px-5 py-3 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody id="admin-jobs-tbody">
                ${jobs.map(job => renderJobRow(job, apps)).join('')}
              </tbody>
            </table>
          </div>

          <!-- Cards (mobile) -->
          <div class="md:hidden" id="admin-jobs-mobile">
            <div class="divide-y divide-slate-800/30">
              ${jobs.map(job => renderJobMobileCard(job, apps)).join('')}
            </div>
          </div>

          ${jobs.length === 0 ? `
            <div class="empty-state">
              <i data-lucide="briefcase" class="w-12 h-12 text-slate-600 mb-3"></i>
              <p class="text-slate-400 font-medium">No jobs yet</p>
              <p class="text-slate-500 text-sm mt-1">Click "Add New Healthcare Job" to get started.</p>
            </div>
          ` : ''}
        </div>

      </div>
    `;

    lucide.createIcons();
  }

  function renderStatCard(icon, label, value, gradient, color) {
    const colorMap = {
      cyan: 'text-cyan-400 bg-cyan-400/10',
      emerald: 'text-emerald-400 bg-emerald-400/10',
      amber: 'text-amber-400 bg-amber-400/10',
      violet: 'text-violet-400 bg-violet-400/10',
    };
    const cls = colorMap[color] || colorMap.cyan;
    return `
      <div class="admin-stat p-4">
        <div class="w-10 h-10 rounded-xl ${cls} flex items-center justify-center mb-3">
          <i data-lucide="${icon}" class="w-5 h-5"></i>
        </div>
        <div class="text-2xl font-bold text-slate-100 stat-counter">${value}</div>
        <div class="text-xs text-slate-400 mt-0.5">${label}</div>
      </div>
    `;
  }

  function renderJobRow(job, apps) {
    const jobApps = apps.filter(a => a.jobId === job.id).length;
    const typeBadge = getTypeBadgeClass(job.type);
    return `
      <tr data-job-id="${job.id}" class="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors" data-search-text="${(job.title + ' ' + job.category + ' ' + job.location).toLowerCase()}">
        <td class="px-5 py-3.5">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">${job.icon || '🏥'}</span>
            <div>
              <div class="font-medium text-slate-200 text-sm">${job.title}</div>
              <div class="text-xs text-slate-500">${job.hospital}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3.5">
          <span class="text-xs text-slate-400">${job.category}</span>
        </td>
        <td class="px-4 py-3.5">
          <span class="px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge}">${job.type}</span>
        </td>
        <td class="px-4 py-3.5">
          <span class="text-xs text-slate-400 flex items-center gap-1">
            <i data-lucide="map-pin" class="w-3 h-3"></i>${job.location}
          </span>
        </td>
        <td class="px-4 py-3.5">
          <span class="text-sm font-semibold text-cyan-400">${jobApps}</span>
        </td>
        <td class="px-4 py-3.5">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="glass-check" ${job.urgent ? 'checked' : ''} onchange="toggleUrgent('${job.id}', this.checked)" />
            <span class="text-xs text-slate-500">Urgent</span>
          </label>
        </td>
        <td class="px-5 py-3.5 text-right">
          <div class="flex items-center gap-2 justify-end">
            <button onclick="openAdminModal('${job.id}')"
              class="px-3 py-1.5 text-xs rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors font-medium">
              Edit
            </button>
            <button onclick="confirmDeleteJob('${job.id}')"
              class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderJobMobileCard(job, apps) {
    const jobApps = apps.filter(a => a.jobId === job.id).length;
    return `
      <div class="p-4" data-job-id="${job.id}" data-search-text="${(job.title + ' ' + job.category + ' ' + job.location).toLowerCase()}">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">${job.icon || '🏥'}</span>
            <div>
              <div class="font-medium text-slate-200 text-sm">${job.title}</div>
              <div class="text-xs text-slate-500">${job.hospital} • ${job.location}</div>
              <div class="text-xs text-cyan-400 mt-0.5">${jobApps} applications</div>
            </div>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button onclick="openAdminModal('${job.id}')"
              class="p-1.5 rounded-lg glass-btn text-cyan-400">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="confirmDeleteJob('${job.id}')"
              class="p-1.5 rounded-lg glass-btn text-red-400">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderAppsList(apps, jobs) {
    if (apps.length === 0) {
      return `<div class="text-center text-slate-500 py-8 text-sm">No applications submitted yet.</div>`;
    }
    const users = Store.getUsers();
    
    // Sort applications by date descending (newest first)
    const sortedApps = [...apps].sort((a, b) => new Date(b.appliedAt || b.appliedDate) - new Date(a.appliedAt || a.appliedDate));
    
    return sortedApps.map(app => {
      const job = jobs.find(j => j.id === app.jobId) || { title: 'Unknown Job', hospital: 'Unknown' };
      const applicant = users.find(u => u.id === app.userId) || { name: 'Unknown Candidate', email: 'unknown@email.com' };
      const statusColors = {
        'Under Review': 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
        'Shortlisted': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
        'Rejected': 'bg-red-500/15 text-red-400 border border-red-500/25'
      };
      const statusCls = statusColors[app.status] || statusColors['Under Review'];
      const dateStr = new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return `
        <div class="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/40 hover:border-slate-700/40 transition-colors">
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div class="text-left">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold text-slate-200 text-sm">${applicant.name}</span>
                <span class="text-xs text-slate-500">(${applicant.email})</span>
              </div>
              <div class="text-xs text-cyan-400 font-medium mt-1">
                Applied for <span class="text-slate-300 font-semibold">${job.title}</span> at <span class="text-slate-400">${job.hospital}</span>
              </div>
              ${app.experience ? `<div class="text-xs text-slate-400 mt-2"><strong>Experience:</strong> ${app.experience}</div>` : ''}
              ${app.coverLetter ? `<div class="text-xs text-slate-400 mt-1 italic bg-slate-950/40 p-2 rounded-lg mt-1">"${app.coverLetter}"</div>` : ''}
              <div class="text-[10px] text-slate-600 mt-2">Applied on ${dateStr}</div>
            </div>
            <div class="flex sm:flex-col items-center sm:items-end gap-2 justify-between flex-shrink-0">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCls}">${app.status}</span>
              <div class="flex gap-1.5 mt-1">
                ${app.status !== 'Shortlisted' ? `
                  <button onclick="handleUpdateAppStatus('${app.id}', 'Shortlisted')"
                    class="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors font-medium">
                    Shortlist
                  </button>
                ` : ''}
                ${app.status !== 'Rejected' ? `
                  <button onclick="handleUpdateAppStatus('${app.id}', 'Rejected')"
                    class="px-2.5 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium">
                    Reject
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function getTypeBadgeClass(type) {
    const map = {
      'Full-time': 'badge-fulltime',
      'Part-time':  'badge-parttime',
      'Contract':   'badge-contract',
      'Locum':      'badge-locum',
      'Internship': 'badge-intern'
    };
    return map[type] || 'badge-fulltime';
  }

  return { render, renderJobRow, renderJobMobileCard };
})();

// ─── Global Admin Actions ────────────────────────────────────

let _editingJobId = null;

function openAdminModal(jobId = null) {
  _editingJobId = jobId;
  const modal = document.getElementById('admin-modal');
  const title = document.getElementById('admin-modal-title');
  const form  = document.getElementById('admin-job-form');

  form.reset();
  document.getElementById('edit-job-id').value = '';

  if (jobId) {
    const job = Store.getJobById(jobId);
    if (!job) return;
    title.textContent = 'Edit Job Listing';
    document.getElementById('edit-job-id').value = job.id;
    document.getElementById('job-title-input').value    = job.title || '';
    document.getElementById('job-hospital-input').value = job.hospital || '';
    document.getElementById('job-location-input').value = job.location || '';
    document.getElementById('job-salary-input').value   = job.salary || '';
    document.getElementById('job-category-input').value = job.category || '';
    document.getElementById('job-type-input').value     = job.type || '';
    document.getElementById('job-experience-input').value = job.experience || '';
    document.getElementById('job-deadline-input').value = job.deadline || '';
    document.getElementById('job-desc-input').value     = job.description || '';
    document.getElementById('job-skills-input').value   = (job.skills || []).join(', ');
  } else {
    title.textContent = 'Add New Healthcare Job';
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  _editingJobId = null;
}

function handleAdminJobSubmit(e) {
  e.preventDefault();
  const editId    = document.getElementById('edit-job-id').value;
  const title     = document.getElementById('job-title-input').value.trim();
  const hospital  = document.getElementById('job-hospital-input').value.trim();
  const location  = document.getElementById('job-location-input').value.trim();
  const salary    = document.getElementById('job-salary-input').value.trim();
  const category  = document.getElementById('job-category-input').value;
  const type      = document.getElementById('job-type-input').value;
  const experience= document.getElementById('job-experience-input').value.trim();
  const deadline  = document.getElementById('job-deadline-input').value;
  const desc      = document.getElementById('job-desc-input').value.trim();
  const skillsRaw = document.getElementById('job-skills-input').value;
  const skills    = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);

  const iconMap = {
    'Doctors & Physicians':      '🫀',
    'Nursing & Midwifery':       '🏥',
    'Pharmacy':                  '💊',
    'Radiology & Imaging':       '🩻',
    'Laboratory & Diagnostics':  '🔬',
    'Medical Assistants':        '🩺',
    'Physiotherapy':             '🦴',
    'Mental Health':             '🧠',
    'Administration':            '📋'
  };

  const colorMap = {
    'Doctors & Physicians':      'from-red-500 to-rose-600',
    'Nursing & Midwifery':       'from-blue-500 to-cyan-600',
    'Pharmacy':                  'from-emerald-500 to-teal-600',
    'Radiology & Imaging':       'from-violet-500 to-purple-600',
    'Laboratory & Diagnostics':  'from-amber-500 to-orange-600',
    'Medical Assistants':        'from-pink-500 to-rose-500',
    'Physiotherapy':             'from-teal-500 to-cyan-600',
    'Mental Health':             'from-indigo-500 to-blue-600',
    'Administration':            'from-slate-500 to-slate-600'
  };

  const jobData = {
    title, hospital, location, salary, category, type, experience,
    deadline, description: desc, skills,
    icon:  iconMap[category]  || '🏥',
    color: colorMap[category] || 'from-cyan-500 to-blue-600',
    urgent: editId ? Store.getJobById(editId)?.urgent || false : false,
    postedDate: new Date().toISOString().split('T')[0]
  };

  if (editId) {
    jobData.id = editId;
    Store.updateJob(jobData);
    showToast('✅ Job updated successfully!', 'success');
  } else {
    Store.saveJob(jobData);
    showToast('✅ New job posted successfully!', 'success');
  }

  closeAdminModal();
  Admin.render();
  lucide.createIcons();
}

function confirmDeleteJob(jobId) {
  const job = Store.getJobById(jobId);
  if (!job) return;

  if (confirm(`Delete "${job.title}" at ${job.hospital}?\n\nThis action cannot be undone.`)) {
    Store.deleteJob(jobId);
    showToast(`🗑️ "${job.title}" has been removed.`, 'info');
    Admin.render();
    lucide.createIcons();
  }
}

function toggleUrgent(jobId, isUrgent) {
  const job = Store.getJobById(jobId);
  if (!job) return;
  job.urgent = isUrgent;
  Store.updateJob(job);
  showToast(isUrgent ? '⚡ Job marked as Urgent.' : 'Job urgency removed.', 'info');
}

function filterAdminJobs() {
  const q = document.getElementById('admin-search')?.value?.toLowerCase() || '';
  document.querySelectorAll('[data-search-text]').forEach(el => {
    const matches = el.getAttribute('data-search-text').includes(q);
    el.style.display = matches ? '' : 'none';
  });
}

function handleUpdateAppStatus(appId, newStatus) {
  const result = Store.updateApplicationStatus(appId, newStatus);
  if (result.success) {
    showToast(`✅ Application status updated to ${newStatus}!`, 'success');
    Admin.render();
  } else {
    showToast('⚠️ ' + result.message, 'warn');
  }
}
