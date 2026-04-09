// ============================================================
// AUTH
// ============================================================
async function handleLogin(e) {
    e.preventDefault();
    const email = $('login-email').value.trim();
    const password = $('login-password').value;
    const errEl = $('login-error');
    const btn = $('login-btn');

    if (!db) {
        errEl.textContent = 'App not configured. Contact admin.';
        errEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    errEl.style.display = 'none';

    const { data, error } = await db.auth.signInWithPassword({ email, password });

    btn.disabled = false;
    btn.textContent = 'Sign In';

    if (error) {
        errEl.textContent = 'Invalid email or password';
        errEl.style.display = 'block';
        return;
    }

    state.user = data.user;
    state.userRole = data.user.user_metadata?.role || 'staff';
    enterApp();
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = $('forgot-email').value.trim();
    const msgEl = $('forgot-msg');
    const btn = $('forgot-btn');

    if (!db) {
        msgEl.textContent = 'App not configured. Contact admin.';
        msgEl.style.color = 'var(--danger)';
        msgEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    msgEl.style.display = 'none';

    const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href
    });

    btn.disabled = false;
    btn.textContent = 'Send Reset Link';

    if (error) {
        msgEl.textContent = 'Failed to send reset email. Try again.';
        msgEl.style.color = 'var(--danger)';
    } else {
        msgEl.textContent = 'Reset link sent! Check your email.';
        msgEl.style.color = 'var(--success)';
    }
    msgEl.style.display = 'block';
}

async function handleLogout() {
    if (db) await db.auth.signOut();
    state.user = null;
    stopScanner();
    $('auth-screen').style.display = '';
    $('main-app').style.display = 'none';
}

async function checkSession() {
    if (!db) return;
    const { data: { session } } = await db.auth.getSession();
    if (session) {
        state.user = session.user;
        state.userRole = session.user.user_metadata?.role || 'staff';
        enterApp();
    }
}
