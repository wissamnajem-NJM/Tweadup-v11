// ===== AUTH UTILITIES =====
const API_URL = window.location.origin + '/api';

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = input.parentElement.querySelector('.toggle-password i');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        if (icon) icon.className = 'fas fa-eye';
    }
}

function setToken(token) {
    localStorage.setItem('tweadup_token', token);
}

function getToken() {
    return localStorage.getItem('tweadup_token');
}

function removeToken() {
    localStorage.removeItem('tweadup_token');
    localStorage.removeItem('tweadup_user');
}

function setUser(user) {
    localStorage.setItem('tweadup_user', JSON.stringify(user));
}

function getUser() {
    const user = localStorage.getItem('tweadup_user');
    return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    removeToken();
    window.location.href = '/login';
}

// ===== REDIRECT IF LOGGED IN =====
if (window.location.pathname === '/login' || window.location.pathname === '/register') {
    if (isLoggedIn()) {
        window.location.href = '/dashboard';
    }
}

// ===== INITIALISATION APRES CHARGEMENT DU DOM =====
document.addEventListener('DOMContentLoaded', function() {

    // ===== LOGIN FORM =====
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            const btn = loginForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
            btn.disabled = true;

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showToast('Veuillez remplir tous les champs', 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            try {
                console.log('Tentative de connexion...', email);

                const response = await fetch(API_URL + '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log('Reponse serveur:', data);

                if (response.ok) {
                    setToken(data.token);
                    setUser(data.user);
                    showToast('Connexion reussie ! Redirection...', 'success');
                    setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
                } else {
                    showToast(data.message || 'Email ou mot de passe incorrect', 'error');
                }
            } catch (err) {
                console.error('Erreur:', err);
                showToast('Erreur serveur. Verifiez que le serveur est demarre.', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // ===== REGISTER FORM =====
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            const btn = registerForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creation...';
            btn.disabled = true;

            const first_name = document.getElementById('first_name').value.trim();
            const last_name = document.getElementById('last_name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirm_password = document.getElementById('confirm_password').value;

            if (!first_name || !last_name || !email || !password) {
                showToast('Veuillez remplir tous les champs', 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            if (password !== confirm_password) {
                showToast('Les mots de passe ne correspondent pas', 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            if (password.length < 6) {
                showToast('Le mot de passe doit faire au moins 6 caracteres', 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            try {
                console.log('Tentative d inscription...', email);

                const response = await fetch(API_URL + '/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ first_name, last_name, email, password })
                });

                const data = await response.json();
                console.log('Reponse serveur:', data);

                if (response.ok) {
                    setToken(data.token);
                    setUser(data.user);
                    showToast('Compte cree avec succes ! Redirection...', 'success');
                    setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
                } else {
                    showToast(data.message || 'Erreur lors de l inscription', 'error');
                }
            } catch (err) {
                console.error('Erreur:', err);
                showToast('Erreur serveur. Verifiez que le serveur est demarre.', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
});