// ===== MAIN UTILITIES =====
const API_URL = window.location.origin + '/api';

function getToken() {
    return localStorage.getItem('tweadup_token');
}

function getUser() {
    const user = localStorage.getItem('tweadup_user');
    return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    localStorage.removeItem('tweadup_token');
    localStorage.removeItem('tweadup_user');
    window.location.href = '/login';
}

function showToast(message, type) {
    type = type || 'info';
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userDropdown');
    if (userMenu && dropdown && !userMenu.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// ===== AUTH CHECK =====
const protectedPages = ['/dashboard', '/catalogue', '/formation', '/profile', '/exam', '/certificate'];
const currentPath = window.location.pathname;

const isProtected = protectedPages.some(function(page) {
    return currentPath.startsWith(page);
});

if (isProtected && !isLoggedIn()) {
    window.location.href = '/login';
}

// ===== UPDATE USER INFO IN NAV =====
function updateUserNav() {
    const user = getUser();
    if (!user) return;

    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const welcomeNameEl = document.getElementById('welcomeName');
    const profileNameEl = document.getElementById('profileName');
    const profileEmailEl = document.getElementById('profileEmail');

    if (userNameEl) userNameEl.textContent = user.first_name + ' ' + user.last_name;
    if (userAvatarEl) userAvatarEl.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.first_name + ' ' + user.last_name) + '&background=6366f1&color=fff';
    if (welcomeNameEl) welcomeNameEl.textContent = user.first_name;
    if (profileNameEl) profileNameEl.textContent = user.first_name + ' ' + user.last_name;
    if (profileEmailEl) profileEmailEl.textContent = user.email;
}

updateUserNav();

// ===== API HELPER =====
async function apiFetch(url, options) {
    options = options || {};
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    try {
        const response = await fetch(API_URL + url, {
            method: options.method || 'GET',
            headers: headers,
            body: options.body || null
        });

        if (response.status === 401) {
            logout();
            return null;
        }

        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        showToast('Erreur de connexion au serveur', 'error');
        return null;
    }
}
