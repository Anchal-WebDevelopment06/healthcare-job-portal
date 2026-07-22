/**
 * app.js — SPA Router & View Renderer for MediHire Healthcare Job Portal
 * Handles routing, all 7 views, job search/filter, auth forms, theme toggle
 */

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  Store.init();
  applyTheme(Store.getTheme());
  updateNavbar();

  // Hash-based routing
  const hash = window.location.hash.replace('#', '') || 'home';
  navigate(hash, true);
});

window.addEventListener('hashchange', () => {
  const page = window.location.hash.replace('#', '') || 'home';
  navigate(page, true);
});

let logoClicks = 0;
let logoTimer = null;

function handleLogoClick(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  logoClicks++;
  
  clearTimeout(logoTimer);
  
  if (logoClicks === 3) {
    logoClicks = 0;
    if (Store.isAdmin()) {
      navigate('admin');
      showToast('🔓 Admin Panel opened!', 'success');
    } else {
      navigate('home');
    }
  } else {
    logoTimer = setTimeout(() => {
      logoClicks = 0;
      navigate('home');
    }, 400);
  }
}

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════

const PAGES = ['home', 'jobs', 'dashboard', 'admin', 'contact', 'login', 'register'];

function navigate(page, fromHash = false) {
  if (!PAGES.includes(page)) page = 'home';

  // Route guards
  if (page === 'admin') {
    if (!Auth.requireAdmin()) return;
  }
  if (page === 'dashboard') {
    if (!Auth.requireLogin()) return;
    if (Store.isAdmin()) {
      navigate('admin');
      return;
    }
  }

  // Update URL hash
  if (!fromHash) {
    window.location.hash = '#' + page;
    return; // hashchange will call navigate again
  }

  // Show/hide views
  PAGES.forEach(p => {
    const el = document.getElementById('view-' + p);
    if (el) el.classList.add('hidden');
  });

  const target = document.getElementById('view-' + page);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('slide-in');
    setTimeout(() => target.classList.remove('slide-in'), 400);
  }

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Render the page
  renderPage(page);
  lucide.createIcons();
}

function renderPage(page) {
  switch (page) {
    case 'home':      renderHome();      break;
    case 'jobs':      renderJobs();      break;
    case 'dashboard': renderDashboard(); break;
    case 'admin':     Admin.render();    break;
    case 'contact':   renderContact();   break;
    case 'login':     renderLogin();     break;
    case 'register':  renderRegister();  break;
  }
}

// ═══════════════════════════════════════════════════════════
// NAVBAR UPDATER
// ═══════════════════════════════════════════════════════════

function updateNavbar() {
  const user = Store.getCurrentUser();
  const loggedout = document.getElementById('auth-loggedout');
  const loggedin  = document.getElementById('auth-loggedin');
  const adminLink = document.getElementById('nav-admin-link');
  const mobileAdminLink = document.getElementById('mobile-admin-link');

  if (user) {
    loggedout.classList.add('hidden');
    loggedin.classList.remove('hidden');
    loggedin.classList.add('flex');

    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('user-avatar').textContent = initials;
    document.getElementById('user-name-display').textContent = user.name.split(' ')[0];
    document.getElementById('user-role-badge').textContent = user.role === 'admin' ? 'Admin' : 'Candidate';

    // Admin link hidden from navbar, accessible via logo triple-click for logged-in admins
    adminLink.classList.add('hidden');
    if (mobileAdminLink) mobileAdminLink.classList.add('hidden');
  } else {
    loggedout.classList.remove('hidden');
    loggedin.classList.add('hidden');
    loggedin.classList.remove('flex');
    adminLink.classList.add('hidden');
    if (mobileAdminLink) mobileAdminLink.classList.add('hidden');
  }
}

function handleLogout() {
  Store.logout();
  updateNavbar();
  showToast('👋 Signed out successfully. See you soon!', 'info');
  navigate('home');
}

// ═══════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════

function applyTheme(theme) {
  const html = document.documentElement;
  const sunIcon  = document.getElementById('icon-sun');
  const moonIcon = document.getElementById('icon-moon');

  if (theme === 'dark') {
    html.classList.add('dark');
    if (sunIcon)  sunIcon.classList.remove('hidden');
    if (moonIcon) moonIcon.classList.add('hidden');
  } else {
    html.classList.remove('dark');
    if (sunIcon)  sunIcon.classList.add('hidden');
    if (moonIcon) moonIcon.classList.remove('hidden');
  }
}

function toggleTheme() {
  const current = Store.getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  Store.setTheme(next);
  applyTheme(next);
  showToast(next === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'info');
}

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const icons = { success: 'check-circle', error: 'alert-circle', info: 'info', warn: 'alert-triangle' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}" class="w-4 h-4 flex-shrink-0"></i><span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ═══════════════════════════════════════════════════════════
// MOBILE MENU
// ═══════════════════════════════════════════════════════════

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}

// ═══════════════════════════════════════════════════════════
// ── HOME PAGE ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

function renderHome() {
  const jobs = Store.getJobs();
  const featuredJobs = jobs.filter(j => j.urgent).slice(0, 3);
  const displayJobs = featuredJobs.length >= 3 ? featuredJobs : jobs.slice(0, 3);

  const categories = [
    { name: 'Doctors & Physicians', icon: '🫀', count: jobs.filter(j => j.category === 'Doctors & Physicians').length, color: 'from-red-500/20 to-rose-600/20', border: 'border-red-500/20', glow: 'text-red-400' },
    { name: 'Nursing & Midwifery',  icon: '🏥', count: jobs.filter(j => j.category === 'Nursing & Midwifery').length, color: 'from-blue-500/20 to-cyan-600/20', border: 'border-blue-500/20', glow: 'text-blue-400' },
    { name: 'Pharmacy',             icon: '💊', count: jobs.filter(j => j.category === 'Pharmacy').length, color: 'from-emerald-500/20 to-teal-600/20', border: 'border-emerald-500/20', glow: 'text-emerald-400' },
    { name: 'Radiology & Imaging',  icon: '🩻', count: jobs.filter(j => j.category === 'Radiology & Imaging').length, color: 'from-violet-500/20 to-purple-600/20', border: 'border-violet-500/20', glow: 'text-violet-400' },
    { name: 'Laboratory & Diagnostics', icon: '🔬', count: jobs.filter(j => j.category === 'Laboratory & Diagnostics').length, color: 'from-amber-500/20 to-orange-600/20', border: 'border-amber-500/20', glow: 'text-amber-400' },
    { name: 'Medical Assistants',   icon: '🩺', count: jobs.filter(j => j.category === 'Medical Assistants').length, color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/20', glow: 'text-pink-400' },
    { name: 'Mental Health',        icon: '🧠', count: jobs.filter(j => j.category === 'Mental Health').length, color: 'from-indigo-500/20 to-blue-600/20', border: 'border-indigo-500/20', glow: 'text-indigo-400' },
    { name: 'Physiotherapy',        icon: '🦴', count: jobs.filter(j => j.category === 'Physiotherapy').length, color: 'from-teal-500/20 to-cyan-600/20', border: 'border-teal-500/20', glow: 'text-teal-400' },
  ];

  document.getElementById('view-home').innerHTML = `

    <!-- HERO -->
    <section class="hero-gradient grid-bg relative min-h-screen flex items-center">
      <div class="orb orb-cyan"></div>
      <div class="orb orb-blue"></div>
      <div class="orb orb-violet"></div>
      <div class="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
        <div class="section-tag mb-6 mx-auto w-fit">
          <span class="w-2 h-2 rounded-full bg-cyan-400 pulse-dot"></span>
          ${jobs.length}+ Healthcare Positions Available
        </div>
        <h1 class="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
          Your Healthcare<br/>
          Career Starts <span class="gradient-text">Here</span>
        </h1>
        <p class="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect with leading hospitals, clinics, and medical centers. Find roles that match your specialty — from ICU nurses to cardiologists.
        </p>

        <!-- Search Bar -->
        <div class="max-w-2xl mx-auto mb-10">
          <div class="flex flex-col sm:flex-row gap-3 p-2 glass-card rounded-2xl">
            <div class="flex-1 flex items-center gap-2 px-3">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 flex-shrink-0"></i>
              <input type="text" id="hero-search" placeholder="Search by specialty, hospital, or location..."
                class="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-sm"
                onkeydown="if(event.key==='Enter'){goHeroSearch()}" />
            </div>
            <button onclick="goHeroSearch()"
              class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-shadow flex items-center gap-2">
              <i data-lucide="search" class="w-4 h-4"></i> Search Jobs
            </button>
          </div>
        </div>

        <!-- Quick Filters -->
        <div class="flex flex-wrap justify-center gap-2 mb-12">
          ${['Cardiologist', 'ICU Nurse', 'Pharmacist', 'Radiologist', 'Lab Tech', 'Therapist'].map(q => `
            <button onclick="quickSearch('${q}')"
              class="px-4 py-1.5 rounded-full glass-card text-slate-300 text-xs font-medium hover:text-cyan-400 hover:border-cyan-500/30 transition-colors border border-slate-700/50">
              ${q}
            </button>
          `).join('')}
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          ${[
            { n: jobs.length + '+', label: 'Active Jobs' },
            { n: '500+', label: 'Hospitals' },
            { n: '12k+', label: 'Hired Pros' },
            { n: '98%', label: 'Satisfaction' }
          ].map(s => `
            <div class="glass-card rounded-xl p-4 text-center">
              <div class="text-2xl font-bold gradient-text stat-counter">${s.n}</div>
              <div class="text-xs text-slate-400 mt-0.5">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-50">
        <span class="text-xs text-slate-500">Scroll</span>
        <i data-lucide="chevron-down" class="w-4 h-4 text-slate-500"></i>
      </div>
    </section>

    <!-- CATEGORIES -->
    <section class="max-w-7xl mx-auto px-6 py-20">
      <div class="text-center mb-12">
        <div class="section-tag mx-auto w-fit mb-4">
          <i data-lucide="grid-3x3" class="w-3 h-3"></i>
          Browse by Specialty
        </div>
        <h2 class="text-3xl md:text-4xl font-bold text-slate-100">Explore <span class="gradient-text">Healthcare Specialties</span></h2>
        <p class="text-slate-400 mt-3 text-base max-w-xl mx-auto">Filter opportunities by your area of expertise and find the perfect match for your skills</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        ${categories.map(cat => `
          <button onclick="navigateToCategory('${cat.name}')"
            class="category-card glass-card rounded-2xl p-5 text-left border ${cat.border} group">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 text-2xl">
              ${cat.icon}
            </div>
            <h3 class="font-semibold text-slate-200 text-sm mb-1 group-hover:text-cyan-400 transition-colors">${cat.name}</h3>
            <p class="text-xs text-slate-500">${cat.count} position${cat.count !== 1 ? 's' : ''}</p>
          </button>
        `).join('')}
      </div>
    </section>

    <!-- FEATURED JOBS -->
    <section class="max-w-7xl mx-auto px-6 pb-20">
      <div class="flex items-center justify-between mb-10">
        <div>
          <div class="section-tag mb-3">
            <i data-lucide="star" class="w-3 h-3"></i>
            Featured Positions
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-slate-100">Top <span class="gradient-text">Opportunities</span></h2>
        </div>
        <button onclick="navigate('jobs')" class="hidden md:flex items-center gap-2 text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">
          View all ${jobs.length} jobs <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${displayJobs.map(job => renderJobCard(job)).join('')}
      </div>

      <div class="text-center mt-10">
        <button onclick="navigate('jobs')"
          class="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-shadow">
          Browse All ${jobs.length} Healthcare Jobs →
        </button>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="border-t border-slate-800/50 py-20">
      <div class="max-w-5xl mx-auto px-6">
        <div class="text-center mb-12">
          <div class="section-tag mx-auto w-fit mb-4">
            <i data-lucide="zap" class="w-3 h-3"></i>
            Simple Process
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-slate-100">How <span class="gradient-text">MediHire Works</span></h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${[
            { step: '01', icon: 'user-plus', title: 'Create Your Account', desc: 'Register in seconds as a Healthcare Professional. Your profile is private and secure.' },
            { step: '02', icon: 'search', title: 'Find Your Role', desc: 'Browse curated medical positions by specialty, location, job type, and salary range.' },
            { step: '03', icon: 'send', title: 'Apply Instantly', desc: 'Submit your application with one click. Track your status in your personal dashboard.' }
          ].map((s, i) => `
            <div class="glass-card rounded-2xl p-6 text-center relative overflow-hidden">
              <div class="absolute top-4 right-4 text-5xl font-black text-slate-800/30">${s.step}</div>
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <i data-lucide="${s.icon}" class="w-6 h-6 text-cyan-400"></i>
              </div>
              <h3 class="font-bold text-slate-100 text-base mb-2">${s.title}</h3>
              <p class="text-slate-400 text-sm leading-relaxed">${s.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- CTA Banner -->
    <section class="max-w-5xl mx-auto px-6 pb-20">
      <div class="glass-card rounded-3xl p-10 text-center relative overflow-hidden border border-cyan-500/10">
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-600/5 rounded-3xl"></div>
        <div class="relative z-10">
          <div class="text-4xl mb-4">⚕️</div>
          <h2 class="text-2xl md:text-3xl font-bold text-slate-100 mb-3">Ready to Advance Your Medical Career?</h2>
          <p class="text-slate-400 mb-7 max-w-md mx-auto">Join thousands of healthcare professionals who found their dream role through MediHire.</p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button onclick="navigate('register')"
              class="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-shadow">
              Register as Candidate
            </button>
            <button onclick="navigate('jobs')"
              class="px-8 py-3 rounded-xl glass-btn text-slate-300 font-medium">
              Browse Jobs First
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function goHeroSearch() {
  const q = document.getElementById('hero-search')?.value?.trim() || '';
  sessionStorage.setItem('medihire_search_q', q);
  navigate('jobs');
}

function quickSearch(term) {
  sessionStorage.setItem('medihire_search_q', term);
  navigate('jobs');
}

function navigateToCategory(cat) {
  sessionStorage.setItem('medihire_filter_cat', cat);
  navigate('jobs');
}

// ═══════════════════════════════════════════════════════════
// ── JOBS PAGE ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

let currentFilters = { q: '', category: '', type: '', sort: 'newest' };

function renderJobs() {
  // Pick up search/filter from sessionStorage
  const preSearch = sessionStorage.getItem('medihire_search_q') || '';
  const preCat    = sessionStorage.getItem('medihire_filter_cat') || '';
  sessionStorage.removeItem('medihire_search_q');
  sessionStorage.removeItem('medihire_filter_cat');
  currentFilters = { q: preSearch, category: preCat, type: '', sort: 'newest' };

  const categories = [
    'Doctors & Physicians', 'Nursing & Midwifery', 'Pharmacy',
    'Radiology & Imaging', 'Laboratory & Diagnostics', 'Medical Assistants',
    'Physiotherapy', 'Mental Health', 'Administration'
  ];

  document.getElementById('view-jobs').innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-10">

      <!-- Header -->
      <div class="mb-8">
        <div class="section-tag mb-3">
          <i data-lucide="briefcase" class="w-3 h-3"></i>
          Healthcare Opportunities
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-slate-100">
          Browse <span class="gradient-text">Medical Jobs</span>
        </h1>
        <p class="text-slate-400 mt-2 text-sm" id="jobs-count-label">Loading jobs...</p>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar p-4 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Search -->
          <div class="relative sm:col-span-2 lg:col-span-1">
            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
            <input type="text" id="filter-search" value="${preSearch}" placeholder="Search title, hospital..."
              class="glass-input pl-9" oninput="applyFilters()" />
          </div>
          <!-- Category -->
          <select id="filter-category" class="glass-input" onchange="applyFilters()">
            <option value="">All Categories</option>
            ${categories.map(c => `<option value="${c}" ${preCat === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
          <!-- Type -->
          <select id="filter-type" class="glass-input" onchange="applyFilters()">
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Locum">Locum</option>
            <option value="Internship">Internship</option>
          </select>
          <!-- Sort -->
          <select id="filter-sort" class="glass-input" onchange="applyFilters()">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="salary">Salary</option>
            <option value="applicants">Most Applied</option>
          </select>
        </div>
        <div class="flex items-center justify-between mt-3">
          <div class="flex flex-wrap gap-2" id="active-filters"></div>
          <button onclick="clearFilters()" class="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1">
            <i data-lucide="x" class="w-3 h-3"></i> Clear filters
          </button>
        </div>
      </div>

      <!-- Jobs Grid -->
      <div id="jobs-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <!-- Populated by applyFilters() -->
      </div>

      <!-- No results -->
      <div id="jobs-empty" class="hidden">
        <div class="empty-state glass-card rounded-2xl">
          <i data-lucide="search-x" class="w-14 h-14 text-slate-600 mb-4"></i>
          <h3 class="text-lg font-semibold text-slate-300 mb-2">No Jobs Found</h3>
          <p class="text-slate-500 text-sm">Try adjusting your search or clearing the filters.</p>
          <button onclick="clearFilters()" class="mt-4 px-5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors">
            Clear All Filters
          </button>
        </div>
      </div>

    </div>
  `;

  applyFilters();
}

function applyFilters() {
  const q        = document.getElementById('filter-search')?.value?.toLowerCase() || '';
  const category = document.getElementById('filter-category')?.value || '';
  const type     = document.getElementById('filter-type')?.value || '';
  const sort     = document.getElementById('filter-sort')?.value || 'newest';

  currentFilters = { q, category, type, sort };

  let jobs = Store.getJobs();

  if (q) jobs = jobs.filter(j =>
    j.title.toLowerCase().includes(q) ||
    j.hospital.toLowerCase().includes(q) ||
    j.location.toLowerCase().includes(q) ||
    (j.category || '').toLowerCase().includes(q) ||
    (j.skills || []).some(s => s.toLowerCase().includes(q))
  );

  if (category) jobs = jobs.filter(j => j.category === category);
  if (type)     jobs = jobs.filter(j => j.type === type);

  // Sort
  if (sort === 'newest')     jobs.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
  if (sort === 'oldest')     jobs.sort((a, b) => new Date(a.postedDate) - new Date(b.postedDate));
  if (sort === 'applicants') jobs.sort((a, b) => (b.applicants || 0) - (a.applicants || 0));

  // Count label
  const countLabel = document.getElementById('jobs-count-label');
  if (countLabel) countLabel.textContent = `Showing ${jobs.length} healthcare position${jobs.length !== 1 ? 's' : ''}`;

  // Active filter chips
  const activeFiltersEl = document.getElementById('active-filters');
  if (activeFiltersEl) {
    const chips = [];
    if (q)        chips.push(`<span class="px-2.5 py-1 rounded-full text-xs bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 flex items-center gap-1">"${q}" <button onclick="clearSearch()" class="ml-1 opacity-70 hover:opacity-100">×</button></span>`);
    if (category) chips.push(`<span class="px-2.5 py-1 rounded-full text-xs bg-violet-500/15 text-violet-400 border border-violet-500/25 flex items-center gap-1">${category} <button onclick="clearCategory()" class="ml-1 opacity-70 hover:opacity-100">×</button></span>`);
    if (type)     chips.push(`<span class="px-2.5 py-1 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center gap-1">${type} <button onclick="clearType()" class="ml-1 opacity-70 hover:opacity-100">×</button></span>`);
    activeFiltersEl.innerHTML = chips.join('');
  }

  // Render
  const grid  = document.getElementById('jobs-grid');
  const empty = document.getElementById('jobs-empty');

  if (jobs.length === 0) {
    if (grid)  grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
  } else {
    if (empty) empty.classList.add('hidden');
    if (grid)  grid.innerHTML = jobs.map(job => renderJobCard(job)).join('');
  }

  lucide.createIcons();
}

function clearFilters()  { renderJobs(); }
function clearSearch()   { document.getElementById('filter-search').value = ''; applyFilters(); }
function clearCategory() { document.getElementById('filter-category').value = ''; applyFilters(); }
function clearType()     { document.getElementById('filter-type').value = ''; applyFilters(); }

// ─── Job Card ───────────────────────────────────────────────

function renderJobCard(job) {
  const user      = Store.getCurrentUser();
  const applied   = user ? Store.hasApplied(job.id, user.id) : false;
  const typeBadge = getJobTypeBadge(job.type);
  const daysAgo   = getDaysAgo(job.postedDate);

  return `
    <div class="glass-card rounded-2xl p-5 relative overflow-hidden group cursor-pointer" onclick="openJobModal('${job.id}')">
      ${job.urgent ? '<span class="urgency-ribbon">Urgent</span>' : ''}

      <!-- Top row -->
      <div class="flex items-start justify-between mb-4">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${job.color || 'from-cyan-500 to-blue-600'} flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
          ${job.icon || '🏥'}
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs ${typeBadge} px-2.5 py-1 rounded-full font-medium">${job.type}</span>
        </div>
      </div>

      <!-- Job info -->
      <h3 class="font-bold text-slate-100 text-base mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">${job.title}</h3>
      <p class="text-slate-400 text-sm mb-1">${job.hospital}</p>

      <div class="flex items-center gap-1 text-slate-500 text-xs mb-3">
        <i data-lucide="map-pin" class="w-3 h-3"></i>
        <span>${job.location}</span>
      </div>

      <!-- Skills preview -->
      <div class="flex flex-wrap gap-1.5 mb-4">
        ${(job.skills || []).slice(0, 3).map(s => `<span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-700/50">${s}</span>`).join('')}
        ${(job.skills || []).length > 3 ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-500">+${job.skills.length - 3}</span>` : ''}
      </div>

      <!-- Bottom row -->
      <div class="flex items-center justify-between pt-3 border-t border-slate-800/50">
        <div>
          <div class="text-xs font-semibold text-cyan-400">${job.salary || 'Competitive'}</div>
          <div class="text-[10px] text-slate-600 mt-0.5">${daysAgo} • ${job.applicants || 0} applied</div>
        </div>
        <button onclick="event.stopPropagation(); handleApplyClick('${job.id}')"
          class="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${applied
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-default'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-md hover:shadow-cyan-500/30'}">
          ${applied ? '✓ Applied' : 'Apply Now'}
        </button>
      </div>
    </div>
  `;
}

function getJobTypeBadge(type) {
  const map = {
    'Full-time':  'badge-fulltime',
    'Part-time':  'badge-parttime',
    'Contract':   'badge-contract',
    'Locum':      'badge-locum',
    'Internship': 'badge-intern'
  };
  return map[type] || 'badge-fulltime';
}

function getDaysAgo(dateStr) {
  if (!dateStr) return 'Recently';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 30)  return `${diff}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Job Detail Modal ───────────────────────────────────────

function openJobModal(jobId) {
  const job  = Store.getJobById(jobId);
  if (!job) return;
  const user    = Store.getCurrentUser();
  const applied = user ? Store.hasApplied(job.id, user.id) : false;
  const typeBadge = getJobTypeBadge(job.type);

  document.getElementById('job-modal-content').innerHTML = `
    <div class="flex items-start justify-between mb-5">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${job.color || 'from-cyan-500 to-blue-600'} flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
          ${job.icon || '🏥'}
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-100">${job.title}</h2>
          <p class="text-slate-400 text-sm mt-0.5">${job.hospital}</p>
          <div class="flex items-center gap-2 mt-2 flex-wrap">
            <span class="${typeBadge} px-2.5 py-1 rounded-full text-xs font-medium">${job.type}</span>
            ${job.urgent ? '<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25">⚡ Urgent</span>' : ''}
          </div>
        </div>
      </div>
      <button onclick="closeJobModal()" class="w-8 h-8 rounded-lg glass-btn flex items-center justify-center text-slate-400 hover:text-slate-200 flex-shrink-0">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>

    <!-- Info grid -->
    <div class="grid grid-cols-2 gap-3 mb-5">
      <div class="glass-card rounded-xl p-3">
        <div class="flex items-center gap-2 text-slate-400 text-xs mb-1"><i data-lucide="map-pin" class="w-3 h-3"></i> Location</div>
        <div class="text-sm font-medium text-slate-200">${job.location}</div>
      </div>
      <div class="glass-card rounded-xl p-3">
        <div class="flex items-center gap-2 text-slate-400 text-xs mb-1"><i data-lucide="dollar-sign" class="w-3 h-3"></i> Salary</div>
        <div class="text-sm font-medium text-cyan-400">${job.salary || 'Competitive'}</div>
      </div>
      <div class="glass-card rounded-xl p-3">
        <div class="flex items-center gap-2 text-slate-400 text-xs mb-1"><i data-lucide="award" class="w-3 h-3"></i> Experience</div>
        <div class="text-sm font-medium text-slate-200">${job.experience || 'Not specified'}</div>
      </div>
      <div class="glass-card rounded-xl p-3">
        <div class="flex items-center gap-2 text-slate-400 text-xs mb-1"><i data-lucide="calendar" class="w-3 h-3"></i> Deadline</div>
        <div class="text-sm font-medium text-slate-200">${job.deadline ? new Date(job.deadline).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : 'Open'}</div>
      </div>
    </div>

    <!-- Description -->
    <div class="mb-5">
      <h3 class="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">About this Role</h3>
      <p class="text-slate-400 text-sm leading-relaxed">${job.description || 'No description provided.'}</p>
    </div>

    <!-- Skills -->
    ${job.skills && job.skills.length ? `
      <div class="mb-5">
        <h3 class="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Required Skills</h3>
        <div class="flex flex-wrap gap-2">
          ${job.skills.map(s => `<span class="px-3 py-1 rounded-full text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">${s}</span>`).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Benefits -->
    ${job.benefits && job.benefits.length ? `
      <div class="mb-6">
        <h3 class="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Benefits & Perks</h3>
        <ul class="space-y-1.5">
          ${job.benefits.map(b => `<li class="flex items-start gap-2 text-sm text-slate-400"><span class="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>${b}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="flex items-center justify-between pt-4 border-t border-slate-800/50">
      <div class="text-xs text-slate-500">
        <span class="flex items-center gap-1"><i data-lucide="users" class="w-3 h-3"></i> ${job.applicants || 0} applicants</span>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="closeJobModal()" class="px-4 py-2 rounded-xl glass-btn text-slate-400 text-sm font-medium">Close</button>
        <button onclick="closeJobModal(); handleApplyClick('${job.id}')"
          class="px-5 py-2 rounded-xl text-sm font-semibold transition-all ${applied
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-default'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30'}">
          ${applied ? '✓ Already Applied' : 'Apply for this Job'}
        </button>
      </div>
    </div>
  `;

  document.getElementById('job-modal').classList.remove('hidden');
  document.getElementById('job-modal').classList.add('flex');
  lucide.createIcons();
}

function closeJobModal() {
  document.getElementById('job-modal').classList.add('hidden');
  document.getElementById('job-modal').classList.remove('flex');
}

// ─── Apply Flow ─────────────────────────────────────────────

function handleApplyClick(jobId) {
  if (!Store.isLoggedIn()) {
    Store.setPendingJob(jobId);
    showToast('🔐 Please sign in to apply for this job.', 'warn');
    navigate('login');
    return;
  }
  const user = Store.getCurrentUser();
  if (Store.hasApplied(jobId, user.id)) {
    showToast('ℹ️ You have already applied for this position.', 'info');
    return;
  }
  openApplyModal(jobId);
}

function openApplyModal(jobId) {
  const job = Store.getJobById(jobId);
  if (!job) return;
  document.getElementById('apply-job-id').value = jobId;
  document.getElementById('apply-job-preview').innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${job.color || 'from-cyan-500 to-blue-600'} flex items-center justify-center text-xl">${job.icon || '🏥'}</div>
      <div>
        <div class="font-semibold text-slate-200 text-sm">${job.title}</div>
        <div class="text-xs text-slate-400">${job.hospital} • ${job.location}</div>
      </div>
    </div>
  `;
  document.getElementById('apply-cover-letter').value = '';
  document.getElementById('apply-experience').value = '';
  document.getElementById('apply-modal').classList.remove('hidden');
  document.getElementById('apply-modal').classList.add('flex');
  lucide.createIcons();
}

function closeApplyModal() {
  document.getElementById('apply-modal').classList.add('hidden');
  document.getElementById('apply-modal').classList.remove('flex');
}

function submitApplication(e) {
  e.preventDefault();
  const jobId       = document.getElementById('apply-job-id').value;
  const coverLetter = document.getElementById('apply-cover-letter').value;
  const experience  = document.getElementById('apply-experience').value;
  const user        = Store.getCurrentUser();

  if (!user) { navigate('login'); return; }

  const result = Store.applyForJob(jobId, user.id, { coverLetter, experience });
  closeApplyModal();

  if (result.success) {
    showToast('🎉 Application submitted successfully! Track it in your dashboard.', 'success', 4500);
    // Refresh current view
    const hash = window.location.hash.replace('#', '') || 'home';
    if (hash === 'jobs') applyFilters();
  } else {
    showToast('⚠️ ' + result.message, 'warn');
  }
}

// ═══════════════════════════════════════════════════════════
// ── DASHBOARD ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

function renderDashboard() {
  const user = Store.getCurrentUser();
  if (!user) return;

  const applications = Store.getUserApplications(user.id);
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  document.getElementById('view-dashboard').innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-10">

      <!-- Header -->
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div class="section-tag mb-3">
            <i data-lucide="layout-dashboard" class="w-3 h-3"></i>
            My Dashboard
          </div>
          <h1 class="text-3xl md:text-4xl font-bold text-slate-100">
            Welcome back, <span class="gradient-text">${user.name.split(' ')[0]}</span> 👋
          </h1>
          <p class="text-slate-400 mt-1 text-sm">Here's your healthcare career overview</p>
        </div>
        <button onclick="navigate('jobs')"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-shadow">
          <i data-lucide="search" class="w-4 h-4"></i>
          Browse More Jobs
        </button>
      </div>

      <!-- Profile + Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <!-- Profile Card -->
        <div class="glass-card rounded-2xl p-6 flex flex-col items-center text-center md:col-span-1">
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-cyan-500/30">
            ${initials}
          </div>
          <h2 class="font-bold text-slate-100 text-lg">${user.name}</h2>
          <p class="text-slate-400 text-sm mt-1">${user.email}</p>
          <div class="flex items-center gap-2 mt-3">
            <span class="px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25' : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'}">
              ${user.role === 'admin' ? '⚙️ Admin' : '👤 Candidate'}
            </span>
          </div>
          ${user.specialty ? `<p class="text-xs text-slate-500 mt-2">🏥 ${user.specialty}</p>` : ''}
          <p class="text-xs text-slate-600 mt-2">Member since ${new Date(user.registeredDate || Date.now()).toLocaleDateString('en-US', {month:'long',year:'numeric'})}</p>
        </div>

        <!-- Stats -->
        <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          ${[
            { icon: 'send', label: 'Applied', value: applications.length, color: 'text-cyan-400 bg-cyan-400/10' },
            { icon: 'clock', label: 'Under Review', value: applications.filter(a => a.status === 'Under Review').length, color: 'text-amber-400 bg-amber-400/10' },
            { icon: 'check-circle', label: 'Shortlisted', value: applications.filter(a => a.status === 'Shortlisted').length, color: 'text-emerald-400 bg-emerald-400/10' },
          ].map(s => `
            <div class="glass-card rounded-2xl p-5 flex flex-col">
              <div class="w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3">
                <i data-lucide="${s.icon}" class="w-5 h-5"></i>
              </div>
              <div class="text-3xl font-bold text-slate-100 stat-counter">${s.value}</div>
              <div class="text-xs text-slate-400 mt-1">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Applications -->
      <div class="glass-card rounded-2xl overflow-hidden">
        <div class="p-5 border-b border-slate-800/50 flex items-center justify-between">
          <h3 class="font-semibold text-slate-200 flex items-center gap-2">
            <i data-lucide="file-text" class="w-4 h-4 text-cyan-400"></i>
            My Applications (${applications.length})
          </h3>
          ${applications.length > 0 ? `
            <button onclick="navigate('jobs')" class="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              + Apply to more jobs
            </button>
          ` : ''}
        </div>

        ${applications.length === 0 ? `
          <div class="empty-state py-16">
            <div class="text-5xl mb-4">📋</div>
            <h3 class="text-lg font-semibold text-slate-300 mb-2">No Applications Yet</h3>
            <p class="text-slate-500 text-sm mb-5">Start exploring healthcare opportunities and apply to positions that match your expertise.</p>
            <button onclick="navigate('jobs')"
              class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-shadow">
              Browse Healthcare Jobs
            </button>
          </div>
        ` : `
          <div class="divide-y divide-slate-800/30">
            ${applications.map(app => renderApplicationCard(app)).join('')}
          </div>
        `}
      </div>

    </div>
  `;
}

function renderApplicationCard(app) {
  const job = app.job;
  if (!job) return '';
  const statusMap = {
    'Under Review': 'badge-review',
    'Shortlisted':  'badge-active',
    'Rejected':     'badge-rejected'
  };
  const statusCls = statusMap[app.status] || 'badge-review';
  const appliedDate = new Date(app.appliedDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

  return `
    <div class="p-4 md:p-5 hover:bg-slate-800/10 transition-colors group">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br ${job.color || 'from-cyan-500 to-blue-600'} flex items-center justify-center text-xl flex-shrink-0">
            ${job.icon || '🏥'}
          </div>
          <div>
            <h4 class="font-semibold text-slate-200 text-sm group-hover:text-cyan-400 transition-colors cursor-pointer" onclick="openJobModal('${job.id}')">${job.title}</h4>
            <p class="text-slate-400 text-xs mt-0.5">${job.hospital} • ${job.location}</p>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <span class="${statusCls} px-2.5 py-0.5 rounded-full text-xs font-medium">${app.status}</span>
              <span class="text-slate-500 text-xs flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> Applied ${appliedDate}</span>
            </div>
          </div>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="text-xs font-semibold text-cyan-400 mb-1">${job.salary || 'Competitive'}</div>
          <button onclick="openJobModal('${job.id}')" class="text-xs text-slate-500 hover:text-slate-300 transition-colors">View Job →</button>
        </div>
      </div>
      ${app.coverLetter ? `<div class="mt-3 pl-14"><p class="text-xs text-slate-500 italic line-clamp-2">"${app.coverLetter}"</p></div>` : ''}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// ── CONTACT PAGE ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

function renderContact() {
  const faqs = [
    { q: 'How do I apply for a job?', a: 'Create a free account, browse jobs, and click "Apply Now" on any listing. Fill in your cover letter and submit. Track all applications in your dashboard.' },
    { q: 'Is MediHire free for job seekers?', a: 'Yes! Creating an account and applying to healthcare jobs on MediHire is completely free for all candidates.' },
    { q: 'How do I post a job as a hospital admin?', a: 'Admin accounts have full access to the Admin Panel where you can create, edit, and delete job listings that instantly appear on the live site.' },
    { q: 'What happens after I apply?', a: 'Your application status changes from "Under Review" → "Shortlisted" or "Rejected". You can track all updates in your personal dashboard.' },
    { q: 'Can I apply from my mobile?', a: 'Absolutely! MediHire is fully responsive and works seamlessly on all smartphones, tablets, and desktops.' }
  ];

  document.getElementById('view-contact').innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-10">

      <!-- Header -->
      <div class="text-center mb-12">
        <div class="section-tag mx-auto w-fit mb-4">
          <i data-lucide="mail" class="w-3 h-3"></i>
          Get in Touch
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-slate-100">
          Contact <span class="gradient-text">MediHire</span>
        </h1>
        <p class="text-slate-400 mt-3 text-base max-w-md mx-auto">Have a question or want to partner with us? We'd love to hear from you.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">

        <!-- Contact Info -->
        <div class="lg:col-span-2 space-y-4">
          ${[
            { icon: 'phone', title: 'Emergency Clinic Hotline', info: '+1 (800) MEDIHIRE', sub: 'Available 24/7 for urgent medical staffing', color: 'text-red-400 bg-red-400/10' },
            { icon: 'mail', title: 'Email Support', info: 'hello@medihire.com', sub: 'We respond within 2 business hours', color: 'text-cyan-400 bg-cyan-400/10' },
            { icon: 'building-2', title: 'Headquarters', info: '250 Medical Plaza, Suite 400', sub: 'New York, NY 10001, USA', color: 'text-violet-400 bg-violet-400/10' },
            { icon: 'clock', title: 'Business Hours', info: 'Mon-Fri: 8 AM – 6 PM EST', sub: 'Weekend: 10 AM – 2 PM (emergency only)', color: 'text-emerald-400 bg-emerald-400/10' }
          ].map(c => `
            <div class="glass-card rounded-2xl p-4 flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl ${c.color} flex items-center justify-center flex-shrink-0">
                <i data-lucide="${c.icon}" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="text-xs text-slate-500 mb-0.5">${c.title}</div>
                <div class="font-semibold text-slate-200 text-sm">${c.info}</div>
                <div class="text-xs text-slate-500 mt-0.5">${c.sub}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Contact Form -->
        <div class="lg:col-span-3">
          <div class="glass-card rounded-2xl p-6">
            <h2 class="text-lg font-bold text-slate-100 mb-5 flex items-center gap-2">
              <i data-lucide="send" class="w-4 h-4 text-cyan-400"></i>
              Send us a Message
            </h2>
            <form id="contact-form" onsubmit="submitContact(event)" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Your Name *</label>
                  <input type="text" id="c-name" required placeholder="Dr. Jane Smith" class="glass-input w-full" />
                </div>
                <div>
                  <label class="block text-xs text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Email *</label>
                  <input type="email" id="c-email" required placeholder="jane@hospital.com" class="glass-input w-full" />
                </div>
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Subject *</label>
                <select id="c-subject" required class="glass-input w-full">
                  <option value="">Select a subject</option>
                  <option>Job Application Query</option>
                  <option>Hospital Partnership</option>
                  <option>Technical Support</option>
                  <option>Admin Access Request</option>
                  <option>General Inquiry</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Message *</label>
                <textarea id="c-message" required rows="5" placeholder="Tell us how we can help..." class="glass-input w-full resize-none"></textarea>
              </div>
              <button type="submit"
                class="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-shadow flex items-center justify-center gap-2">
                <i data-lucide="send" class="w-4 h-4"></i> Send Message
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- FAQ -->
      <div class="mt-16">
        <div class="text-center mb-8">
          <div class="section-tag mx-auto w-fit mb-3">
            <i data-lucide="help-circle" class="w-3 h-3"></i>
            FAQ
          </div>
          <h2 class="text-2xl md:text-3xl font-bold text-slate-100">Frequently Asked <span class="gradient-text">Questions</span></h2>
        </div>
        <div class="max-w-3xl mx-auto space-y-3">
          ${faqs.map((faq, i) => `
            <div class="glass-card rounded-xl overflow-hidden">
              <button onclick="toggleFaq(${i})"
                class="w-full flex items-center justify-between p-4 text-left">
                <span class="font-medium text-slate-200 text-sm">${faq.q}</span>
                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 flex-shrink-0 faq-chevron" id="chevron-${i}"></i>
              </button>
              <div class="faq-answer px-4" id="faq-${i}">
                <p class="text-slate-400 text-sm pb-4 leading-relaxed">${faq.a}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

function submitContact(e) {
  e.preventDefault();
  const name    = document.getElementById('c-name')?.value;
  const email   = document.getElementById('c-email')?.value;
  const subject = document.getElementById('c-subject')?.value;
  if (!name || !email || !subject) return;
  document.getElementById('contact-form').reset();
  showToast('✅ Message sent! We\'ll get back to you within 2 hours.', 'success', 4500);
}

function toggleFaq(index) {
  const answer  = document.getElementById('faq-' + index);
  const chevron = document.getElementById('chevron-' + index);
  if (!answer) return;
  const isOpen = answer.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-answer').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.faq-chevron').forEach(el => el.style.transform = '');
  if (!isOpen) {
    answer.classList.add('open');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  }
}

// ═══════════════════════════════════════════════════════════
// ── LOGIN PAGE ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

function renderLogin() {
  if (Store.isLoggedIn()) { navigate('dashboard'); return; }

  document.getElementById('view-login').innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-cyan-500/30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 class="text-2xl font-bold gradient-text">Welcome back to MediHire</h1>
          <p class="text-slate-400 text-sm mt-1">Sign in to your healthcare career portal</p>
        </div>

        <!-- Card -->
        <div class="glass-card rounded-2xl p-7">

          <!-- Quick Fill Buttons -->
          <div class="mb-5">
            <p class="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">Quick Demo Login</p>
            <div class="grid grid-cols-1">
              <button onclick="quickFill('doctor@medihire.com','doctor123')"
                class="px-3 py-2 text-xs rounded-xl glass-btn text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 transition-colors font-medium w-full text-center">
                👤 Candidate Demo
              </button>
            </div>
          </div>

          <div class="relative mb-5">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800"></div></div>
            <div class="relative flex justify-center"><span class="px-3 bg-transparent text-xs text-slate-600">or sign in manually</span></div>
          </div>

          <form id="login-form" onsubmit="handleLogin(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</label>
              <div class="relative">
                <i data-lucide="mail" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                <input type="email" id="login-email" required placeholder="your@email.com" class="glass-input pl-9 w-full" autocomplete="email" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
              <div class="relative">
                <i data-lucide="lock" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                <input type="password" id="login-password" required placeholder="Enter password" class="glass-input pl-9 w-full" autocomplete="current-password" />
              </div>
            </div>

            <!-- Error Message -->
            <div id="login-error" class="hidden px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"></div>

            <button type="submit"
              class="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-shadow flex items-center justify-center gap-2">
              <i data-lucide="log-in" class="w-4 h-4"></i> Sign In
            </button>
          </form>

          <p class="text-center text-sm text-slate-500 mt-5">
            New to MediHire?
            <button onclick="navigate('register')" class="text-cyan-400 font-medium hover:text-cyan-300 transition-colors ml-1">Create account →</button>
          </p>
        </div>

      </div>
    </div>
  `;
}

function quickFill(email, password) {
  document.getElementById('login-email').value    = email;
  document.getElementById('login-password').value = password;
}

function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');

  const result = Auth.login(email, password);

  if (!result.success) {
    errEl.textContent = result.message;
    errEl.classList.remove('hidden');
    return;
  }

  errEl.classList.add('hidden');
  updateNavbar();
  showToast(`✅ Welcome back, ${result.user.name.split(' ')[0]}!`, 'success');

  // Handle post-login redirect for pending job application
  if (!Auth.handlePostLoginRedirect()) {
    navigate(result.user.role === 'admin' ? 'home' : 'dashboard');
  }
}

// ═══════════════════════════════════════════════════════════
// ── REGISTER PAGE ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

function renderRegister() {
  if (Store.isLoggedIn()) { navigate('dashboard'); return; }

  document.getElementById('view-register').innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-cyan-500/30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 class="text-2xl font-bold gradient-text">Join MediHire Today</h1>
          <p class="text-slate-400 text-sm mt-1">Create your healthcare career profile</p>
        </div>

        <!-- Card -->
        <div class="glass-card rounded-2xl p-7">
          <form id="register-form" onsubmit="handleRegister(event)" class="space-y-4">

            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Full Name *</label>
                <div class="relative">
                  <i data-lucide="user" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                  <input type="text" id="reg-name" required placeholder="Dr. Jane Smith" class="glass-input pl-9 w-full" />
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Email Address *</label>
              <div class="relative">
                <i data-lucide="mail" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                <input type="email" id="reg-email" required placeholder="your@email.com" class="glass-input pl-9 w-full" autocomplete="email" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Healthcare Specialty</label>
              <div class="relative">
                <i data-lucide="stethoscope" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                <input type="text" id="reg-specialty" placeholder="e.g. Cardiology, ICU Nursing, Pharmacy..." class="glass-input pl-9 w-full" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Account Role *</label>
              <select id="reg-role" class="glass-input w-full">
                <option value="candidate">👤 Candidate (Job Seeker)</option>
                <option value="admin">⚙️ Admin (Hospital / Recruiter)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Password * (min 6 chars)</label>
              <div class="relative">
                <i data-lucide="lock" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                <input type="password" id="reg-password" required placeholder="Create a strong password" class="glass-input pl-9 w-full" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Confirm Password *</label>
              <div class="relative">
                <i data-lucide="lock" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                <input type="password" id="reg-confirm" required placeholder="Repeat your password" class="glass-input pl-9 w-full" />
              </div>
            </div>

            <!-- Error / Success -->
            <div id="reg-error" class="hidden px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"></div>

            <button type="submit"
              class="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-shadow flex items-center justify-center gap-2">
              <i data-lucide="user-plus" class="w-4 h-4"></i> Create Account
            </button>
          </form>

          <p class="text-center text-sm text-slate-500 mt-5">
            Already have an account?
            <button onclick="navigate('login')" class="text-cyan-400 font-medium hover:text-cyan-300 transition-colors ml-1">Sign in →</button>
          </p>
        </div>

      </div>
    </div>
  `;
}

function handleRegister(e) {
  e.preventDefault();
  const errEl = document.getElementById('reg-error');
  const data = {
    name:            document.getElementById('reg-name').value,
    email:           document.getElementById('reg-email').value,
    specialty:       document.getElementById('reg-specialty').value,
    role:            document.getElementById('reg-role').value,
    password:        document.getElementById('reg-password').value,
    confirmPassword: document.getElementById('reg-confirm').value
  };

  const result = Auth.register(data);

  if (!result.success) {
    errEl.textContent = result.message;
    errEl.classList.remove('hidden');
    return;
  }

  errEl.classList.add('hidden');
  updateNavbar();
  showToast(`🎉 Welcome to MediHire, ${result.user.name.split(' ')[0]}!`, 'success', 4000);

  if (!Auth.handlePostLoginRedirect()) {
    navigate(result.user.role === 'admin' ? 'home' : 'dashboard');
  }
}
