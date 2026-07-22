/**
 * auth.js — Authentication logic for MediHire
 * Login, Registration, Route Guards, Post-login Redirects
 */

const Auth = (() => {

  // ─── Login ─────────────────────────────────────────────────
  function login(email, password) {
    if (!email || !password) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const user = Store.getUserByEmail(email.trim());
    if (!user) {
      return { success: false, message: 'No account found with this email. Please register.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    Store.setCurrentUser(user);
    return { success: true, user };
  }

  // ─── Register ───────────────────────────────────────────────
  function register({ name, email, password, confirmPassword, role = 'candidate', specialty = '' }) {
    if (!name || !email || !password || !confirmPassword) {
      return { success: false, message: 'All fields are required.' };
    }

    if (name.trim().length < 2) {
      return { success: false, message: 'Name must be at least 2 characters.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match. Please re-enter.' };
    }

    const result = Store.addUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      specialty: specialty.trim()
    });

    if (!result.success) return result;

    // Auto-login after registration
    Store.setCurrentUser(result.user);
    return { success: true, user: result.user };
  }

  // ─── Route Guard: Login Required ────────────────────────────
  function requireLogin(redirectPage = 'login') {
    if (!Store.isLoggedIn()) {
      showToast('Please sign in to access this page.', 'warn');
      navigate(redirectPage);
      return false;
    }
    return true;
  }

  // ─── Route Guard: Admin Required ────────────────────────────
  function requireAdmin() {
    if (!Store.isLoggedIn()) {
      showToast('Please sign in as Admin to access this page.', 'warn');
      navigate('login');
      return false;
    }
    if (!Store.isAdmin()) {
      showToast('🚫 Access Denied. This area is restricted to Admins only.', 'error');
      navigate('home');
      return false;
    }
    return true;
  }

  // ─── Handle Post-login Redirect ─────────────────────────────
  function handlePostLoginRedirect() {
    const pendingJobId = Store.getPendingJob();
    if (pendingJobId) {
      Store.clearPendingJob();
      // Open the job modal or navigate to jobs and highlight it
      navigate('jobs');
      setTimeout(() => openJobModal(pendingJobId), 400);
      return true;
    }
    return false;
  }

  return { login, register, requireLogin, requireAdmin, handlePostLoginRedirect };
})();
