/**
 * Movim Admin Panel - Güvenli Giriş ve Veri Yönetim Sistemi
 * Güvenlik: SHA-256 Hash + Rate Limiting + Session Token + Timeout
 */

// =====================================================
// GÜVENLİK KONFİGÜRASYONU
// Şifre değiştirmek için: admin.html sayfasında "Şifre Değiştir" bölümünü kullanın
// veya aşağıdaki hash değerlerini yeni SHA-256 hashlerinizle değiştirin.
// Hash üretmek: https://emn178.github.io/online-tools/sha256.html
// =====================================================
const AUTHORIZED_USERS = [
    {
        username: 'movim',
        // Şifre: Movimenes3637
        passwordHash: 'c056318046a4138131d877c9266937c6dae2cb1c08ac44fbb0448592b135fcc5',
        role: 'Süper Admin'
    }
];

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;
const SESSION_HOURS = 2;
const SESSION_KEY = 'mvm_session';
const ATTEMPTS_KEY = 'mvm_attempts';
const LOCKOUT_KEY = 'mvm_lockout';

// =====================================================
// SHA-256 (Web Crypto API - native, güvenli)
// =====================================================
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// =====================================================
// RATE LIMITING
// =====================================================
function getAttempts() {
    try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY)) || { count: 0, lastAttempt: null }; }
    catch { return { count: 0, lastAttempt: null }; }
}

function saveAttempts(data) { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(data)); }

function isLockedOut() {
    const lockoutTime = localStorage.getItem(LOCKOUT_KEY);
    if (!lockoutTime) return false;
    const remaining = new Date(lockoutTime) - new Date();
    return remaining > 0;
}

function getLockoutRemaining() {
    const lockoutTime = localStorage.getItem(LOCKOUT_KEY);
    if (!lockoutTime) return 0;
    const remaining = Math.ceil((new Date(lockoutTime) - new Date()) / 60000);
    return Math.max(0, remaining);
}

function recordFailedAttempt() {
    const attempts = getAttempts();
    attempts.count++;
    attempts.lastAttempt = new Date().toISOString();
    saveAttempts(attempts);
    if (attempts.count >= MAX_ATTEMPTS) {
        const lockoutEnd = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        localStorage.setItem(LOCKOUT_KEY, lockoutEnd.toISOString());
    }
    return attempts.count;
}

function clearAttempts() {
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
}

// =====================================================
// SESSION YÖNETİMİ
// =====================================================
function generateToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function createSession(username, role) {
    const token = generateToken();
    const session = {
        token,
        username,
        role,
        expires: new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString()
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}

function getSession() {
    try {
        const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
        if (!session || !session.token) return null;
        if (new Date(session.expires) < new Date()) {
            sessionStorage.removeItem(SESSION_KEY);
            return null;
        }
        return session;
    } catch { return null; }
}

function destroySession() {
    sessionStorage.removeItem(SESSION_KEY);
}

// =====================================================
// UYGULAMA DURUMU
// =====================================================
let appState = {
    series: [],
    faq: [],
    config: {},
    currentEditIndex: null,
    currentSection: 'dashboard',
    session: null
};

// =====================================================
// BAŞLATMA
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // Session kontrolü
    const session = getSession();
    if (session) {
        appState.session = session;
        showDashboard(session);
    } else {
        showLoginScreen();
    }

    setupLoginForm();
    setupNavigation();
    setupModals();
    setupMobileMenu();
});

// =====================================================
// GİRİŞ EKRANI
// =====================================================
function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
}

function setupLoginForm() {
    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');
    const attemptCounterEl = document.getElementById('attempt-counter');
    const submitBtn = document.getElementById('login-submit');

    // Kilit kontrolü
    updateLockUI();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isLockedOut()) return;

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Doğrulanıyor...';

        // Yapay gecikme (timing attack'ı zorlaştırmak için)
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

        const hash = await sha256(password);
        const user = AUTHORIZED_USERS.find(u => u.username === username && u.passwordHash === hash);

        if (user) {
            clearAttempts();
            const session = createSession(username, user.role);
            appState.session = session;
            showDashboard(session);
        } else {
            const count = recordFailedAttempt();
            errorEl.querySelector('span').textContent = 'Kullanıcı adı veya şifre hatalı.';
            errorEl.classList.add('show');
            const remaining = MAX_ATTEMPTS - count;

            if (isLockedOut()) {
                attemptCounterEl.textContent = `⛔ ${LOCKOUT_MINUTES} dakika boyunca kilitlendi.`;
                attemptCounterEl.style.display = 'block';
                submitBtn.disabled = true;
                updateLockUI();
            } else if (remaining <= 2) {
                attemptCounterEl.textContent = `⚠️ ${remaining} hakkın kaldı.`;
                attemptCounterEl.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-lock-open"></i> Giriş Yap';
            } else {
                attemptCounterEl.style.display = 'none';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-lock-open"></i> Giriş Yap';
            }
        }
    });
}

function updateLockUI() {
    if (!isLockedOut()) return;
    const submitBtn = document.getElementById('login-submit');
    const attemptCounterEl = document.getElementById('attempt-counter');
    const remaining = getLockoutRemaining();
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-ban"></i> Kilitli (${remaining} dk)`;
    attemptCounterEl.textContent = `⛔ Çok fazla başarısız deneme. ${remaining} dakika sonra tekrar deneyin.`;
    attemptCounterEl.style.display = 'block';

    // Her dakika güncelle
    setTimeout(() => {
        if (isLockedOut()) updateLockUI();
        else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-lock-open"></i> Giriş Yap';
            attemptCounterEl.style.display = 'none';
        }
    }, 60000);
}

// =====================================================
// DASHBOARD
// =====================================================
async function showDashboard(session) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';

    // Session bilgisi
    document.getElementById('session-user').textContent = `${session.username} (${session.role})`;
    const expiry = new Date(session.expires);
    document.getElementById('session-expiry').textContent =
        `${expiry.getHours().toString().padStart(2,'0')}:${expiry.getMinutes().toString().padStart(2,'0')}'ye kadar aktif`;

    // Çıkış düğmesi
    document.getElementById('logout-btn').addEventListener('click', () => {
        destroySession();
        location.reload();
    });

    // Veri yükle
    await loadAllData();
    renderDashboardStats();
    navigateTo('dashboard');
}

async function loadAllData() {
    try {
        const [seriesRes, faqRes, configRes] = await Promise.allSettled([
            fetch('series.json?_=' + Date.now()).then(r => r.json()),
            fetch('faq.json?_=' + Date.now()).then(r => r.json()),
            fetch('config.json?_=' + Date.now()).then(r => r.json())
        ]);

        appState.series = seriesRes.status === 'fulfilled' ? seriesRes.value : [];
        appState.faq = faqRes.status === 'fulfilled' ? faqRes.value : [];
        appState.config = configRes.status === 'fulfilled' ? configRes.value : getDefaultConfig();
    } catch {
        appState.series = [];
        appState.faq = [];
        appState.config = getDefaultConfig();
    }
}

function getDefaultConfig() {
    return {
        download: { latestVersion: '#', googleDrive: '#' },
        contact: { whatsapp: { number: '', iosMessage: '' }, telegram: '#' }
    };
}

// =====================================================
// NAVİGASYON
// =====================================================
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            navigateTo(section);
            // Mobile'da sidebar'ı kapat
            document.querySelector('.sidebar').classList.remove('open');
        });
    });
}

function navigateTo(section) {
    appState.currentSection = section;

    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (activeNav) activeNav.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${section}`);
    if (activeTab) activeTab.classList.add('active');

    if (section === 'series') renderSeriesTable();
    if (section === 'faq') renderFaqList();
    if (section === 'config') renderConfigForm();
    if (section === 'security') renderSecurityTab();
    if (section === 'dashboard') renderDashboardStats();
}

// =====================================================
// DASHBOARD İSTATİSTİKLER
// =====================================================
function renderDashboardStats() {
    const el = id => document.getElementById(id);
    if (el('stat-series')) el('stat-series').textContent = appState.series.length;
    if (el('stat-faq')) el('stat-faq').textContent = appState.faq.length;
    if (el('stat-dublaj')) el('stat-dublaj').textContent = appState.series.filter(s => s.genre === 'Dublaj').length;
    if (el('stat-altyazi')) el('stat-altyazi').textContent = appState.series.filter(s => s.genre === 'Altyazı').length;
}

// =====================================================
// DİZİ YÖNETİMİ
// =====================================================
function renderSeriesTable(filter = '', genreFilter = 'all') {
    const tbody = document.getElementById('series-tbody');
    const countEl = document.getElementById('series-count');

    let filtered = appState.series.filter(s =>
        (filter === '' || s.title.toLowerCase().includes(filter.toLowerCase()) || s.id.toLowerCase().includes(filter.toLowerCase())) &&
        (genreFilter === 'all' || s.genre === genreFilter)
    );

    if (countEl) countEl.textContent = `${filtered.length} / ${appState.series.length} dizi gösteriliyor`;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fas fa-film"></i><p>Dizi bulunamadı</p></div></td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((s, i) => {
        const realIndex = appState.series.indexOf(s);
        const badgeClass = s.genre === 'Dublaj' ? 'dublaj' : s.genre === 'Altyazı' ? 'altyazi' : 'other';
        return `
        <tr>
            <td><img src="${escHtml(s.posterUrl)}" alt="poster" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2236%22 height=%2254%22 viewBox=%220 0 36 54%22><rect fill=%22%23111827%22 width=%2236%22 height=%2254%22/></svg>'"></td>
            <td class="series-title-cell">
                <strong>${escHtml(s.title)}</strong>
                <span>${escHtml(s.id)}</span>
            </td>
            <td><span class="genre-badge ${badgeClass}">${escHtml(s.genre)}</span></td>
            <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;color:var(--text-muted)">${escHtml(s.posterUrl)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-ghost" onclick="editSeries(${realIndex})" title="Düzenle"><i class="fas fa-pen"></i></button>
                    <button class="btn btn-danger" onclick="confirmDeleteSeries(${realIndex})" title="Sil"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function setupSeriesSearch() {
    const searchEl = document.getElementById('series-search');
    const genreEl = document.getElementById('genre-filter');
    if (searchEl) searchEl.addEventListener('input', () => renderSeriesTable(searchEl.value, genreEl?.value));
    if (genreEl) genreEl.addEventListener('change', () => renderSeriesTable(searchEl?.value, genreEl.value));
}

function showAddSeriesModal() {
    appState.currentEditIndex = null;
    document.getElementById('series-modal-title').textContent = 'Yeni Dizi Ekle';
    document.getElementById('series-form').reset();
    document.getElementById('series-modal').classList.add('show');
}

function editSeries(index) {
    appState.currentEditIndex = index;
    const s = appState.series[index];
    document.getElementById('series-modal-title').textContent = 'Dizi Düzenle';
    document.getElementById('s-id').value = s.id;
    document.getElementById('s-title').value = s.title;
    document.getElementById('s-genre').value = s.genre;
    document.getElementById('s-summary').value = s.summary || '';
    document.getElementById('s-poster').value = s.posterUrl;
    document.getElementById('series-modal').classList.add('show');
}

function saveSeriesModal() {
    const entry = {
        id: document.getElementById('s-id').value.trim(),
        title: document.getElementById('s-title').value.trim(),
        genre: document.getElementById('s-genre').value,
        summary: document.getElementById('s-summary').value.trim() || 'dizi bilgisi henüz eklenmedi',
        posterUrl: document.getElementById('s-poster').value.trim()
    };

    if (!entry.id || !entry.title || !entry.posterUrl) {
        showToast('ID, başlık ve poster URL zorunludur!', 'error');
        return;
    }

    if (appState.currentEditIndex === null) {
        // Yeni ekle
        if (appState.series.some(s => s.id === entry.id)) {
            showToast('Bu ID zaten kullanılıyor!', 'error');
            return;
        }
        appState.series.unshift(entry);
        showToast('Dizi eklendi ✓', 'success');
    } else {
        appState.series[appState.currentEditIndex] = entry;
        showToast('Dizi güncellendi ✓', 'success');
    }

    closeModal('series-modal');
    renderSeriesTable(document.getElementById('series-search')?.value, document.getElementById('genre-filter')?.value);
    renderDashboardStats();
}

function confirmDeleteSeries(index) {
    const s = appState.series[index];
    document.getElementById('confirm-text').textContent = `"${s.title}" dizisini silmek istediğinize emin misiniz?`;
    document.getElementById('confirm-ok').onclick = () => {
        appState.series.splice(index, 1);
        closeConfirm();
        renderSeriesTable(document.getElementById('series-search')?.value, document.getElementById('genre-filter')?.value);
        renderDashboardStats();
        showToast('Dizi silindi', 'info');
    };
    document.getElementById('confirm-overlay').classList.add('show');
}

// =====================================================
// SSS YÖNETİMİ
// =====================================================
function renderFaqList() {
    const container = document.getElementById('faq-list');
    if (appState.faq.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-question-circle"></i><p>Henüz soru yok</p></div>`;
        return;
    }
    container.innerHTML = appState.faq.map((item, i) => `
        <div class="faq-item">
            <div class="faq-item-header">
                <div>
                    <div class="faq-question">${escHtml(item.question)}</div>
                    <div class="faq-answer">${escHtml(item.answer)}</div>
                </div>
                <div class="action-btns" style="flex-shrink:0">
                    <button class="btn btn-ghost" onclick="editFaq(${i})" title="Düzenle"><i class="fas fa-pen"></i></button>
                    <button class="btn btn-danger" onclick="deleteFaq(${i})" title="Sil"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddFaqModal() {
    appState.currentEditIndex = null;
    document.getElementById('faq-modal-title').textContent = 'Yeni Soru Ekle';
    document.getElementById('f-question').value = '';
    document.getElementById('f-answer').value = '';
    document.getElementById('faq-modal').classList.add('show');
}

function editFaq(index) {
    appState.currentEditIndex = index;
    const item = appState.faq[index];
    document.getElementById('faq-modal-title').textContent = 'Soruyu Düzenle';
    document.getElementById('f-question').value = item.question;
    document.getElementById('f-answer').value = item.answer;
    document.getElementById('faq-modal').classList.add('show');
}

function saveFaqModal() {
    const question = document.getElementById('f-question').value.trim();
    const answer = document.getElementById('f-answer').value.trim();

    if (!question || !answer) {
        showToast('Soru ve cevap boş olamaz!', 'error');
        return;
    }

    if (appState.currentEditIndex === null) {
        appState.faq.push({ question, answer });
        showToast('Soru eklendi ✓', 'success');
    } else {
        appState.faq[appState.currentEditIndex] = { question, answer };
        showToast('Soru güncellendi ✓', 'success');
    }

    closeModal('faq-modal');
    renderFaqList();
}

function deleteFaq(index) {
    document.getElementById('confirm-text').textContent = `Bu soruyu silmek istediğinize emin misiniz?`;
    document.getElementById('confirm-ok').onclick = () => {
        appState.faq.splice(index, 1);
        closeConfirm();
        renderFaqList();
        showToast('Soru silindi', 'info');
    };
    document.getElementById('confirm-overlay').classList.add('show');
}

// =====================================================
// KONFİGÜRASYON YÖNETİMİ
// =====================================================
function renderConfigForm() {
    const c = appState.config;
    document.getElementById('c-latest').value = c.download?.latestVersion || '';
    document.getElementById('c-drive').value = c.download?.googleDrive || '';
    document.getElementById('c-wa-number').value = c.contact?.whatsapp?.number || '';
    document.getElementById('c-wa-msg').value = c.contact?.whatsapp?.iosMessage || '';
    document.getElementById('c-telegram').value = c.contact?.telegram || '';
}

function saveConfig() {
    appState.config = {
        download: {
            latestVersion: document.getElementById('c-latest').value.trim(),
            googleDrive: document.getElementById('c-drive').value.trim()
        },
        contact: {
            whatsapp: {
                number: document.getElementById('c-wa-number').value.trim(),
                iosMessage: document.getElementById('c-wa-msg').value.trim()
            },
            telegram: document.getElementById('c-telegram').value.trim()
        }
    };
    showToast('Config kaydedildi ✓', 'success');
}

// =====================================================
// GÜVENLİK SEKMESİ
// =====================================================
function renderSecurityTab() {
    const session = appState.session;
    document.getElementById('sec-username').textContent = session.username;
    document.getElementById('sec-role').textContent = session.role;
    document.getElementById('sec-expires').textContent = new Date(session.expires).toLocaleString('tr-TR');
}

async function changePassword() {
    const current = document.getElementById('pw-current').value;
    const newPw = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;

    if (!current || !newPw || !confirm) { showToast('Tüm alanları doldurun!', 'error'); return; }
    if (newPw !== confirm) { showToast('Yeni şifreler eşleşmiyor!', 'error'); return; }
    if (newPw.length < 8) { showToast('Şifre en az 8 karakter olmalı!', 'error'); return; }

    const currentHash = await sha256(current);
    const user = AUTHORIZED_USERS.find(u => u.username === appState.session.username);
    if (!user || user.passwordHash !== currentHash) {
        showToast('Mevcut şifre hatalı!', 'error');
        return;
    }

    const newHash = await sha256(newPw);
    document.getElementById('pw-hash-result').value = newHash;
    document.getElementById('hash-result-card').style.display = 'block';
    showToast('Yeni hash üretildi! admin.js\'e yapıştırın.', 'info');
}

// =====================================================
// JSON İNDİR
// =====================================================
function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${filename} indirildi ✓`, 'success');
}

// =====================================================
// MODALLER
// =====================================================
function setupModals() {
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) modal.classList.remove('show');
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('show');
        });
    });
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}

function closeConfirm() {
    document.getElementById('confirm-overlay').classList.remove('show');
}

// =====================================================
// MOBİL MENÜ
// =====================================================
function setupMobileMenu() {
    const toggle = document.getElementById('mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
}

// =====================================================
// TOAST BİLDİRİMLER
// =====================================================
function showToast(message, type = 'info') {
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const colors = { success: '#4ade80', error: '#f87171', info: '#2dd4bf' };
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type]}" style="color:${colors[type]}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// =====================================================
// YARDIMCI
// =====================================================
function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
