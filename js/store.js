/**
 * store.js — LocalStorage Data Engine for MediHire
 * Handles Jobs, Users, Applications, Auth Session, Theme
 */

const Store = (() => {
  const KEYS = {
    JOBS:        'medihire_jobs',
    USERS:       'medihire_users',
    APPS:        'medihire_applications',
    CURRENT:     'medihire_current_user',
    THEME:       'medihire_theme',
    PENDING_JOB: 'medihire_pending_job'
  };

  // ─── Init / Seed ───────────────────────────────────────────
  function init() {
    if (!localStorage.getItem(KEYS.JOBS)) {
      localStorage.setItem(KEYS.JOBS, JSON.stringify(MOCK_JOBS));
    }
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(MOCK_USERS));
    }
    if (!localStorage.getItem(KEYS.APPS)) {
      localStorage.setItem(KEYS.APPS, JSON.stringify([]));
    }
  }

  // ─── Jobs ──────────────────────────────────────────────────
  function getJobs() {
    return JSON.parse(localStorage.getItem(KEYS.JOBS) || '[]');
  }

  function saveJob(job) {
    const jobs = getJobs();
    job.id = job.id || 'job-' + Date.now();
    job.postedDate = job.postedDate || new Date().toISOString().split('T')[0];
    job.applicants = job.applicants || 0;
    jobs.push(job);
    localStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
    return job;
  }

  function updateJob(updatedJob) {
    const jobs = getJobs();
    const idx = jobs.findIndex(j => j.id === updatedJob.id);
    if (idx !== -1) {
      jobs[idx] = { ...jobs[idx], ...updatedJob };
      localStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
      return jobs[idx];
    }
    return null;
  }

  function deleteJob(jobId) {
    const jobs = getJobs().filter(j => j.id !== jobId);
    localStorage.setItem(KEYS.JOBS, JSON.stringify(jobs));
  }

  function getJobById(jobId) {
    return getJobs().find(j => j.id === jobId) || null;
  }

  // ─── Users ─────────────────────────────────────────────────
  function getUsers() {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  }

  function addUser(user) {
    const users = getUsers();
    const exists = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (exists) return { success: false, message: 'An account with this email already exists.' };
    user.id = 'user-' + Date.now();
    user.registeredDate = new Date().toISOString().split('T')[0];
    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return { success: true, user };
  }

  function getUserByEmail(email) {
    return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  function getUserById(userId) {
    return getUsers().find(u => u.id === userId) || null;
  }

  // ─── Current Session ────────────────────────────────────────
  function getCurrentUser() {
    const raw = localStorage.getItem(KEYS.CURRENT);
    return raw ? JSON.parse(raw) : null;
  }

  function setCurrentUser(user) {
    const { password: _, ...safe } = user; // never store plaintext pw in session
    localStorage.setItem(KEYS.CURRENT, JSON.stringify(safe));
  }

  function logout() {
    localStorage.removeItem(KEYS.CURRENT);
  }

  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  function isAdmin() {
    const u = getCurrentUser();
    return u && u.role === 'admin';
  }

  // ─── Applications ──────────────────────────────────────────
  function getApplications() {
    return JSON.parse(localStorage.getItem(KEYS.APPS) || '[]');
  }

  function applyForJob(jobId, userId, { coverLetter = '', experience = '' } = {}) {
    const apps = getApplications();
    const existing = apps.find(a => a.jobId === jobId && a.userId === userId);
    if (existing) return { success: false, message: 'You have already applied for this position.' };

    const app = {
      id: 'app-' + Date.now(),
      jobId,
      userId,
      coverLetter,
      experience,
      status: 'Under Review',
      appliedDate: new Date().toISOString().split('T')[0],
      appliedAt: new Date().toISOString()
    };
    apps.push(app);
    localStorage.setItem(KEYS.APPS, JSON.stringify(apps));

    // Increment applicant count on job
    const job = getJobById(jobId);
    if (job) {
      job.applicants = (job.applicants || 0) + 1;
      updateJob(job);
    }

    return { success: true, app };
  }

  function getUserApplications(userId) {
    const apps = getApplications().filter(a => a.userId === userId);
    return apps.map(app => ({
      ...app,
      job: getJobById(app.jobId)
    })).filter(a => a.job !== null);
  }

  function hasApplied(jobId, userId) {
    return getApplications().some(a => a.jobId === jobId && a.userId === userId);
  }

  function getTotalApplications() {
    return getApplications().length;
  }

  function updateApplicationStatus(appId, newStatus) {
    const apps = getApplications();
    const idx = apps.findIndex(a => a.id === appId);
    if (idx !== -1) {
      apps[idx].status = newStatus;
      localStorage.setItem(KEYS.APPS, JSON.stringify(apps));
      return { success: true, app: apps[idx] };
    }
    return { success: false, message: 'Application not found.' };
  }

  // ─── Theme ─────────────────────────────────────────────────
  function getTheme() {
    return localStorage.getItem(KEYS.THEME) || 'dark';
  }

  function setTheme(theme) {
    localStorage.setItem(KEYS.THEME, theme);
  }

  // ─── Pending Job (for redirect after login) ─────────────────
  function setPendingJob(jobId) {
    sessionStorage.setItem(KEYS.PENDING_JOB, jobId);
  }

  function getPendingJob() {
    return sessionStorage.getItem(KEYS.PENDING_JOB);
  }

  function clearPendingJob() {
    sessionStorage.removeItem(KEYS.PENDING_JOB);
  }

  return {
    init,
    getJobs, saveJob, updateJob, deleteJob, getJobById,
    getUsers, addUser, getUserByEmail, getUserById,
    getCurrentUser, setCurrentUser, logout, isLoggedIn, isAdmin,
    getApplications, applyForJob, getUserApplications, hasApplied, getTotalApplications, updateApplicationStatus,
    getTheme, setTheme,
    setPendingJob, getPendingJob, clearPendingJob
  };
})();
