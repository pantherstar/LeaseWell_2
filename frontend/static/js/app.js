/**
 * LeaseWell Frontend - Full Featured Property Management
 * Complete CRUD functionality for properties, leases, and maintenance
 */

// Use relative URL for production (Vercel), absolute for local dev
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api/v1'
    : '/api/v1';
let currentUser = null;
let authToken = null;
let dashboardData = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initRouter();
});

// Authentication
function initAuth() {
    authToken = localStorage.getItem('authToken');
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    updateNav();
}

function updateNav() {
    const loginLink = document.getElementById('loginLink');
    const dashboardLink = document.getElementById('dashboardLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (currentUser) {
        loginLink?.classList.add('hidden');
        dashboardLink?.classList.remove('hidden');
        logoutBtn?.classList.remove('hidden');
    } else {
        loginLink?.classList.remove('hidden');
        dashboardLink?.classList.add('hidden');
        logoutBtn?.classList.add('hidden');
    }

    logoutBtn?.addEventListener('click', handleLogout);
}

async function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    currentUser = null;
    authToken = null;
    dashboardData = null;
    updateNav();
    navigate('/');
    showToast('Logged out successfully');
}

// API Client
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            ...options.headers,
        },
        ...options,
    };

    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    if (response.status === 204) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || 'Request failed');
    }

    return data;
}

// Router
function initRouter() {
    window.addEventListener('popstate', handleRoute);
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-link]')) {
            e.preventDefault();
            navigate(e.target.getAttribute('href'));
        }
    });
    handleRoute();
}

function navigate(path) {
    window.history.pushState({}, '', path);
    handleRoute();
}

function handleRoute() {
    const path = window.location.pathname;
    showLoading();

    if (path === '/' || path === '/home') {
        renderHome();
    } else if (path === '/login') {
        renderLogin();
    } else if (path === '/register') {
        renderRegister();
    } else if (path === '/forgot-password') {
        renderForgotPassword();
    } else if (path.startsWith('/reset-password')) {
        renderResetPassword();
    } else if (path.startsWith('/accept-invitation')) {
        renderAcceptInvitation();
    } else if (path === '/dashboard') {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        renderDashboard();
    } else {
        render404();
    }
}

// ==================== PAGES ====================

function renderHome() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <section class="hero">
            <div class="hero-content">
                <span class="hero-badge">Property Management Made Simple</span>
                <h1 class="hero-title">
                    Manage Properties<br>
                    <span>Effortlessly</span>
                </h1>
                <p class="hero-subtitle">
                    The all-in-one platform for landlords and tenants. Track leases,
                    handle maintenance requests, and manage payments seamlessly.
                </p>
                <div class="hero-buttons">
                    <a href="/register" data-link class="btn btn-primary btn-lg">Get Started Free</a>
                    <a href="/login" data-link class="btn btn-secondary btn-lg">Sign In</a>
                </div>
            </div>
        </section>

        <section class="features">
            <h2 class="section-title">Everything You Need</h2>
            <p class="section-subtitle">Powerful features to streamline your property management</p>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🏠</div>
                    <h3 class="feature-title">Property Management</h3>
                    <p class="feature-description">Keep track of all your properties in one place. View details, manage units, and monitor occupancy.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📋</div>
                    <h3 class="feature-title">Lease Tracking</h3>
                    <p class="feature-description">Manage lease agreements with ease. Track dates, rent amounts, and tenant information.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔧</div>
                    <h3 class="feature-title">Maintenance Requests</h3>
                    <p class="feature-description">Handle repair requests efficiently. Submit issues and track resolution status.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💳</div>
                    <h3 class="feature-title">Payment Tracking</h3>
                    <p class="feature-description">Monitor rent payments and track payment history with ease.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3 class="feature-title">Dashboard Analytics</h3>
                    <p class="feature-description">Get insights into your portfolio with real-time analytics.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔔</div>
                    <h3 class="feature-title">Notifications</h3>
                    <p class="feature-description">Stay informed with instant notifications for important updates.</p>
                </div>
            </div>
        </section>

        <section class="stats-section">
            <div class="stats-row">
                <div class="stat-item"><div class="stat-number">100%</div><div class="stat-text">Free to Start</div></div>
                <div class="stat-item"><div class="stat-number">24/7</div><div class="stat-text">Access Anywhere</div></div>
                <div class="stat-item"><div class="stat-number">Fast</div><div class="stat-text">Setup in Minutes</div></div>
                <div class="stat-item"><div class="stat-number">Secure</div><div class="stat-text">Bank-Level Security</div></div>
            </div>
        </section>

        <section class="cta-section">
            <h2 class="cta-title">Ready to Get Started?</h2>
            <p class="cta-text">Join property managers who trust LeaseWell</p>
            <div class="hero-buttons">
                <a href="/register" data-link class="btn btn-primary btn-lg">Create Free Account</a>
            </div>
        </section>

        <footer class="footer">
            <p>&copy; 2026 <a href="https://www.northridge.tech" target="_blank" rel="noopener" style="color: var(--primary);">Northridge Technologies</a>. All rights reserved.</p>
        </footer>
    `;
    hideLoading();
}

function renderLogin() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">Welcome Back</h1>
                <p class="auth-subtitle">Sign in to your account</p>
                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" class="form-input" placeholder="you@example.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" name="password" class="form-input" placeholder="••••••••" required>
                    </div>
                    <div class="forgot-password">
                        <a href="/forgot-password" data-link>Forgot password?</a>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Sign In</button>
                </form>
                <p class="auth-footer">Don't have an account? <a href="/register" data-link>Create one</a></p>
            </div>
        </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            showLoading();
            const result = await apiRequest('/auth/login', { method: 'POST', body: data });
            authToken = result.access_token;
            currentUser = result.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateNav();
            navigate('/dashboard');
            showToast('Welcome back!');
        } catch (error) {
            showToast(error.message || 'Login failed', 'error');
        } finally {
            hideLoading();
        }
    });
    hideLoading();
}

function renderRegister() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">Create Account</h1>
                <p class="auth-subtitle">Start managing properties today</p>
                <form id="registerForm">
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" name="full_name" class="form-input" placeholder="John Doe">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" class="form-input" placeholder="you@example.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" name="password" id="password" class="form-input" placeholder="••••••••" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm Password</label>
                        <input type="password" name="confirm_password" id="confirm_password" class="form-input" placeholder="••••••••" required>
                        <p class="form-error hidden" id="passwordError">Passwords do not match</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">I am a...</label>
                        <select name="role" class="form-select" required>
                            <option value="landlord">Landlord / Property Manager</option>
                            <option value="tenant">Tenant</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
                </form>
                <p class="auth-footer">Already have an account? <a href="/login" data-link>Sign in</a></p>
            </div>
        </div>
    `;

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');
    const passwordError = document.getElementById('passwordError');

    confirmPassword.addEventListener('input', () => {
        if (confirmPassword.value && password.value !== confirmPassword.value) {
            passwordError.classList.remove('hidden');
            confirmPassword.style.borderColor = 'var(--error)';
        } else {
            passwordError.classList.add('hidden');
            confirmPassword.style.borderColor = '';
        }
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        if (data.password !== data.confirm_password) {
            showToast('Passwords do not match', 'error');
            return;
        }
        delete data.confirm_password;

        try {
            showLoading();
            const result = await apiRequest('/auth/register', { method: 'POST', body: data });
            authToken = result.access_token;
            currentUser = result.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateNav();
            navigate('/dashboard');
            showToast('Welcome to LeaseWell!');
        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
        } finally {
            hideLoading();
        }
    });
    hideLoading();
}

function renderForgotPassword() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">Forgot Password</h1>
                <p class="auth-subtitle">Enter your email to reset your password</p>
                <form id="forgotPasswordForm">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" class="form-input" placeholder="you@example.com" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Send Reset Link</button>
                </form>
                <p class="auth-footer"><a href="/login" data-link>Back to Sign In</a></p>
                <div id="resetTokenResult" class="hidden" style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-card); border-radius: 0.5rem;"></div>
            </div>
        </div>
    `;

    document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');

        try {
            showLoading();
            const result = await apiRequest('/auth/forgot-password', {
                method: 'POST',
                body: { email }
            });

            const resultDiv = document.getElementById('resetTokenResult');
            if (result.email_sent && !result.reset_token) {
                // Email was sent successfully
                resultDiv.innerHTML = `
                    <p style="color: var(--success); margin-bottom: 0.5rem;"><strong>Email Sent!</strong></p>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">${result.message}</p>
                `;
                showToast('Check your email for reset instructions');
            } else if (result.reset_token) {
                // Fallback mode - email not configured
                resultDiv.innerHTML = `
                    <p style="color: var(--warning); margin-bottom: 0.5rem;"><strong>Email Not Configured</strong></p>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${result.message}</p>
                    <a href="/reset-password?token=${result.reset_token}" data-link class="btn btn-primary btn-sm">Reset Password</a>
                `;
                showToast('Use the link below to reset your password');
            } else {
                resultDiv.innerHTML = `<p style="color: var(--text-muted);">${result.message}</p>`;
                showToast('Check your email for reset instructions');
            }
            resultDiv.classList.remove('hidden');
        } catch (error) {
            showToast(error.message || 'Failed to send reset email', 'error');
        } finally {
            hideLoading();
        }
    });

    hideLoading();
}

function renderResetPassword() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">Reset Password</h1>
                <p class="auth-subtitle">Enter your new password</p>
                <form id="resetPasswordForm">
                    <input type="hidden" name="token" value="${token || ''}">
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <input type="password" name="new_password" id="new_password" class="form-input" placeholder="••••••••" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm New Password</label>
                        <input type="password" name="confirm_password" id="confirm_new_password" class="form-input" placeholder="••••••••" required>
                        <p class="form-error hidden" id="resetPasswordError">Passwords do not match</p>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Reset Password</button>
                </form>
                <p class="auth-footer"><a href="/login" data-link>Back to Sign In</a></p>
            </div>
        </div>
    `;

    const newPassword = document.getElementById('new_password');
    const confirmPassword = document.getElementById('confirm_new_password');
    const passwordError = document.getElementById('resetPasswordError');

    confirmPassword.addEventListener('input', () => {
        if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
            passwordError.classList.remove('hidden');
            confirmPassword.style.borderColor = 'var(--error)';
        } else {
            passwordError.classList.add('hidden');
            confirmPassword.style.borderColor = '';
        }
    });

    document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const tokenValue = formData.get('token');
        const newPasswordValue = formData.get('new_password');
        const confirmPasswordValue = formData.get('confirm_password');

        if (newPasswordValue !== confirmPasswordValue) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (!tokenValue) {
            showToast('Invalid reset link', 'error');
            return;
        }

        try {
            showLoading();
            await apiRequest('/auth/reset-password', {
                method: 'POST',
                body: { token: tokenValue, new_password: newPasswordValue }
            });
            showToast('Password reset successfully!');
            navigate('/login');
        } catch (error) {
            showToast(error.message || 'Failed to reset password', 'error');
        } finally {
            hideLoading();
        }
    });

    hideLoading();
}

async function renderDashboard() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="dashboard-header">
            <h1 class="dashboard-title">Dashboard</h1>
            <p class="dashboard-subtitle">Welcome back, ${currentUser?.full_name || currentUser?.email}</p>
        </div>
        <div class="tabs" id="tabs">
            <button class="tab active" data-tab="overview">Overview</button>
            <button class="tab" data-tab="properties">Properties & Leases</button>
            <button class="tab" data-tab="maintenance">Maintenance</button>
            <button class="tab" data-tab="payments">Payments</button>
        </div>
        <div id="dashboardContent"></div>
        <div id="modal" class="modal hidden"></div>
    `;

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderDashboardTab(tab.dataset.tab);
        });
    });

    await renderDashboardTab('overview');
    hideLoading();
}

async function renderDashboardTab(tab) {
    const content = document.getElementById('dashboardContent');
    showLoading();

    try {
        if (tab === 'overview') {
            dashboardData = await apiRequest('/dashboard');
            renderOverview(dashboardData);
        } else if (tab === 'properties') {
            dashboardData = await apiRequest('/dashboard');
            renderPropertiesWithLeases(dashboardData);
        } else if (tab === 'maintenance') {
            const data = await apiRequest('/maintenance');
            renderMaintenance(data);
        } else if (tab === 'payments') {
            const data = await apiRequest('/payments');
            renderPayments(data);
        }
    } catch (error) {
        content.innerHTML = `<div class="card"><p class="text-center">Error: ${error.message}</p></div>`;
    } finally {
        hideLoading();
    }
}

// ==================== OVERVIEW ====================

function renderOverview(data) {
    const content = document.getElementById('dashboardContent');
    const stats = data.stats || {};

    content.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${stats.total_properties || 0}</div><div class="stat-label">Properties</div></div>
            <div class="stat-card"><div class="stat-value">${stats.active_leases || 0}</div><div class="stat-label">Active Leases</div></div>
            <div class="stat-card"><div class="stat-value">${stats.pending_payments || 0}</div><div class="stat-label">Pending Payments</div></div>
            <div class="stat-card"><div class="stat-value">${stats.pending_maintenance || 0}</div><div class="stat-label">Maintenance</div></div>
        </div>
        <div class="card">
            <div class="card-header"><h2 class="card-title">Recent Properties</h2></div>
            ${renderPropertiesPreview(data.properties?.slice(0, 3) || [], data.leases || [])}
        </div>
        <div class="card">
            <div class="card-header"><h2 class="card-title">Recent Payments</h2></div>
            ${renderPaymentsTable(data.payments?.slice(0, 5) || [])}
        </div>
    `;
}

// ==================== PROPERTIES & LEASES ====================

function renderPropertiesPreview(properties, leases) {
    if (properties.length === 0) {
        return '<div class="empty-state"><p class="empty-state-text">No properties yet</p></div>';
    }

    return `<div class="property-grid">${properties.map(p => renderPropertyCard(p, leases)).join('')}</div>`;
}

function renderPropertyCard(p, leases) {
    const propertyLeases = leases.filter(l => l.property_id === p.id);
    const activeLease = propertyLeases.find(l => l.status === 'active');

    return `
        <div class="property-card">
            <div class="property-header">
                <div class="property-info">
                    <h3>${p.address}${p.unit_number ? ` #${p.unit_number}` : ''}</h3>
                    <p>${p.city}, ${p.state} ${p.zip_code}</p>
                </div>
                <span class="badge ${activeLease ? 'badge-success' : 'badge-warning'}">${activeLease ? 'Occupied' : 'Vacant'}</span>
            </div>
            <div class="property-meta">
                <span class="property-meta-item"><span>🏠</span> ${p.property_type || 'Property'}</span>
                ${p.bedrooms ? `<span class="property-meta-item"><span>🛏️</span> ${p.bedrooms} bed</span>` : ''}
                ${p.bathrooms ? `<span class="property-meta-item"><span>🚿</span> ${p.bathrooms} bath</span>` : ''}
            </div>
            ${activeLease ? `
                <div class="property-lease">
                    <div class="lease-info">
                        <div class="lease-item"><div class="lease-item-label">Monthly Rent</div><div class="lease-item-value text-primary">$${activeLease.monthly_rent}</div></div>
                        <div class="lease-item"><div class="lease-item-label">Ends</div><div class="lease-item-value">${new Date(activeLease.end_date).toLocaleDateString()}</div></div>
                    </div>
                </div>
            ` : `<div class="property-lease"><p class="no-lease">No active lease</p></div>`}
            ${currentUser?.role === 'landlord' ? `
                <div class="property-actions">
                    <button class="btn btn-secondary btn-sm" onclick="openEditPropertyModal('${p.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProperty('${p.id}')">Delete</button>
                    ${!activeLease ? `<button class="btn btn-primary btn-sm" onclick="openInviteTenantModal('${p.id}', '${p.address}, ${p.city}')">Invite Tenant</button>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

function renderPropertiesWithLeases(data) {
    const content = document.getElementById('dashboardContent');
    const properties = data.properties || [];
    const leases = data.leases || [];

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Properties & Leases</h2>
                ${currentUser?.role === 'landlord' ? '<button class="btn btn-primary" onclick="openAddPropertyModal()">+ Add Property</button>' : ''}
            </div>
            ${properties.length === 0
                ? '<div class="empty-state"><p class="empty-state-text">No properties yet. Add your first property!</p></div>'
                : `<div class="property-grid">${properties.map(p => renderPropertyCard(p, leases)).join('')}</div>`
            }
        </div>
    `;
}

// ==================== MAINTENANCE ====================

function renderMaintenance(data) {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Maintenance Requests</h2>
                ${currentUser?.role === 'tenant' ? '<button class="btn btn-primary" onclick="openAddMaintenanceModal()">+ New Request</button>' : ''}
            </div>
            ${data.length === 0
                ? '<div class="empty-state"><p class="empty-state-text">No maintenance requests</p></div>'
                : `<table class="table">
                    <thead><tr><th>Title</th><th>Property</th><th>Priority</th><th>Status</th><th>Created</th>${currentUser?.role === 'landlord' ? '<th>Actions</th>' : ''}</tr></thead>
                    <tbody>
                        ${data.map(m => `
                            <tr>
                                <td><strong>${m.title}</strong><br><small style="color: var(--text-muted);">${m.description?.substring(0, 50)}...</small></td>
                                <td>${m.property_id?.substring(0, 8)}...</td>
                                <td><span class="badge badge-${m.priority === 'high' || m.priority === 'emergency' ? 'danger' : m.priority === 'medium' ? 'warning' : 'info'}">${m.priority}</span></td>
                                <td><span class="badge badge-${m.status === 'completed' ? 'success' : m.status === 'in_progress' ? 'info' : 'warning'}">${m.status}</span></td>
                                <td>${new Date(m.created_at).toLocaleDateString()}</td>
                                ${currentUser?.role === 'landlord' ? `<td><button class="btn btn-sm btn-secondary" onclick="openUpdateMaintenanceModal('${m.id}', '${m.status}')">Update</button></td>` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`
            }
        </div>
    `;
}

// ==================== PAYMENTS ====================

function renderPayments(data) {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header"><h2 class="card-title">Payments</h2></div>
            ${renderPaymentsTable(data)}
        </div>
    `;
}

function renderPaymentsTable(payments) {
    if (payments.length === 0) {
        return '<div class="empty-state"><p class="empty-state-text">No payments found</p></div>';
    }

    return `
        <table class="table">
            <thead><tr><th>Amount</th><th>Due Date</th><th>Payment Date</th><th>Status</th><th>Method</th></tr></thead>
            <tbody>
                ${payments.map(p => `
                    <tr>
                        <td><strong>$${p.amount}</strong></td>
                        <td>${new Date(p.due_date).toLocaleDateString()}</td>
                        <td>${p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}</td>
                        <td><span class="badge badge-${p.status === 'paid' ? 'success' : p.status === 'late' ? 'danger' : 'warning'}">${p.status}</span></td>
                        <td>${p.payment_method || '—'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ==================== MODALS ====================

function openModal(content) {
    const modal = document.getElementById('modal');
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">&times;</button>
            ${content}
        </div>
    `;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal')?.classList.add('hidden');
}
window.closeModal = closeModal;

// Add Property Modal
window.openAddPropertyModal = function() {
    openModal(`
        <h2 class="modal-title">Add New Property</h2>
        <form id="addPropertyForm">
            <div class="form-group">
                <label class="form-label">Address *</label>
                <input type="text" name="address" class="form-input" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">City *</label>
                    <input type="text" name="city" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">State *</label>
                    <input type="text" name="state" class="form-input" maxlength="2" required>
                </div>
                <div class="form-group">
                    <label class="form-label">ZIP Code *</label>
                    <input type="text" name="zip_code" class="form-input" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Unit Number</label>
                    <input type="text" name="unit_number" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Property Type</label>
                    <select name="property_type" class="form-select">
                        <option value="">Select type</option>
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="condo">Condo</option>
                        <option value="townhouse">Townhouse</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Bedrooms</label>
                    <input type="number" name="bedrooms" class="form-input" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Bathrooms</label>
                    <input type="number" name="bathrooms" class="form-input" min="0" step="0.5">
                </div>
                <div class="form-group">
                    <label class="form-label">Square Feet</label>
                    <input type="number" name="square_feet" class="form-input" min="0">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-input" rows="3"></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Property</button>
            </div>
        </form>
    `);

    document.getElementById('addPropertyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {};
        formData.forEach((value, key) => {
            if (value) data[key] = value;
        });
        if (data.bedrooms) data.bedrooms = parseInt(data.bedrooms);
        if (data.bathrooms) data.bathrooms = parseFloat(data.bathrooms);
        if (data.square_feet) data.square_feet = parseInt(data.square_feet);

        try {
            showLoading();
            await apiRequest('/properties', { method: 'POST', body: data });
            closeModal();
            showToast('Property added successfully!');
            dashboardData = null;
            renderDashboardTab('properties');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    });
};

// Edit Property Modal
window.openEditPropertyModal = async function(propertyId) {
    try {
        showLoading();
        const property = await apiRequest(`/properties/${propertyId}`);
        hideLoading();

        openModal(`
            <h2 class="modal-title">Edit Property</h2>
            <form id="editPropertyForm">
                <input type="hidden" name="id" value="${property.id}">
                <div class="form-group">
                    <label class="form-label">Address *</label>
                    <input type="text" name="address" class="form-input" value="${property.address || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">City *</label>
                        <input type="text" name="city" class="form-input" value="${property.city || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">State *</label>
                        <input type="text" name="state" class="form-input" value="${property.state || ''}" maxlength="2" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">ZIP Code *</label>
                        <input type="text" name="zip_code" class="form-input" value="${property.zip_code || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Bedrooms</label>
                        <input type="number" name="bedrooms" class="form-input" value="${property.bedrooms || ''}" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Bathrooms</label>
                        <input type="number" name="bathrooms" class="form-input" value="${property.bathrooms || ''}" min="0" step="0.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Square Feet</label>
                        <input type="number" name="square_feet" class="form-input" value="${property.square_feet || ''}" min="0">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        `);

        document.getElementById('editPropertyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {};
            formData.forEach((value, key) => {
                if (key !== 'id' && value) data[key] = value;
            });
            if (data.bedrooms) data.bedrooms = parseInt(data.bedrooms);
            if (data.bathrooms) data.bathrooms = parseFloat(data.bathrooms);
            if (data.square_feet) data.square_feet = parseInt(data.square_feet);

            try {
                showLoading();
                await apiRequest(`/properties/${propertyId}`, { method: 'PUT', body: data });
                closeModal();
                showToast('Property updated!');
                dashboardData = null;
                renderDashboardTab('properties');
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                hideLoading();
            }
        });
    } catch (error) {
        hideLoading();
        showToast(error.message, 'error');
    }
};

// Delete Property
window.deleteProperty = async function(propertyId) {
    if (!confirm('Are you sure you want to delete this property? This cannot be undone.')) return;

    try {
        showLoading();
        await apiRequest(`/properties/${propertyId}`, { method: 'DELETE' });
        showToast('Property deleted');
        dashboardData = null;
        renderDashboardTab('properties');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
};

// Add Lease Modal
window.openAddLeaseModal = function(propertyId) {
    openModal(`
        <h2 class="modal-title">Add New Lease</h2>
        <form id="addLeaseForm">
            <input type="hidden" name="property_id" value="${propertyId}">
            <div class="form-group">
                <label class="form-label">Tenant Email *</label>
                <input type="email" name="tenant_email" class="form-input" placeholder="tenant@example.com" required>
                <small style="color: var(--text-muted);">Tenant must have a registered account</small>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Start Date *</label>
                    <input type="date" name="start_date" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">End Date *</label>
                    <input type="date" name="end_date" class="form-input" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Monthly Rent ($) *</label>
                    <input type="number" name="monthly_rent" class="form-input" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Security Deposit ($)</label>
                    <input type="number" name="security_deposit" class="form-input" min="0" step="0.01">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <select name="status" class="form-select">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Lease</button>
            </div>
        </form>
    `);

    document.getElementById('addLeaseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const tenantEmail = formData.get('tenant_email');

        try {
            showLoading();
            // First, we need to find tenant by email - for now use a placeholder
            // In a real app, you'd have an endpoint to search users by email
            showToast('Note: Tenant lookup by email requires backend endpoint. Using demo mode.', 'error');
            hideLoading();
            return;

            // If we had tenant lookup:
            // const tenant = await apiRequest(`/users/by-email/${tenantEmail}`);
            // const data = {
            //     property_id: formData.get('property_id'),
            //     tenant_id: tenant.id,
            //     start_date: formData.get('start_date'),
            //     end_date: formData.get('end_date'),
            //     monthly_rent: parseFloat(formData.get('monthly_rent')),
            //     security_deposit: formData.get('security_deposit') ? parseFloat(formData.get('security_deposit')) : null,
            //     status: formData.get('status')
            // };
            // await apiRequest('/leases', { method: 'POST', body: data });
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    });
};

// Add Maintenance Modal (for tenants)
window.openAddMaintenanceModal = async function() {
    try {
        showLoading();
        const properties = await apiRequest('/properties');
        hideLoading();

        if (properties.length === 0) {
            showToast('No properties found. You need an active lease first.', 'error');
            return;
        }

        openModal(`
            <h2 class="modal-title">New Maintenance Request</h2>
            <form id="addMaintenanceForm">
                <div class="form-group">
                    <label class="form-label">Property *</label>
                    <select name="property_id" class="form-select" required>
                        ${properties.map(p => `<option value="${p.id}">${p.address}, ${p.city}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" name="title" class="form-input" placeholder="Brief description of the issue" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <textarea name="description" class="form-input" rows="4" placeholder="Please describe the issue in detail..." required></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Priority</label>
                        <select name="priority" class="form-select">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="emergency">Emergency</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select name="category" class="form-select">
                            <option value="">Select category</option>
                            <option value="plumbing">Plumbing</option>
                            <option value="electrical">Electrical</option>
                            <option value="hvac">HVAC</option>
                            <option value="appliance">Appliance</option>
                            <option value="structural">Structural</option>
                            <option value="pest">Pest Control</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit Request</button>
                </div>
            </form>
        `);

        document.getElementById('addMaintenanceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                property_id: formData.get('property_id'),
                title: formData.get('title'),
                description: formData.get('description'),
                priority: formData.get('priority'),
                category: formData.get('category') || null
            };

            try {
                showLoading();
                await apiRequest('/maintenance', { method: 'POST', body: data });
                closeModal();
                showToast('Maintenance request submitted!');
                renderDashboardTab('maintenance');
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                hideLoading();
            }
        });
    } catch (error) {
        hideLoading();
        showToast(error.message, 'error');
    }
};

// Update Maintenance Status Modal (for landlords)
window.openUpdateMaintenanceModal = function(requestId, currentStatus) {
    openModal(`
        <h2 class="modal-title">Update Maintenance Request</h2>
        <form id="updateMaintenanceForm">
            <div class="form-group">
                <label class="form-label">Status</label>
                <select name="status" class="form-select">
                    <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="in_progress" ${currentStatus === 'in_progress' ? 'selected' : ''}>In Progress</option>
                    <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Assigned To</label>
                <input type="text" name="assigned_to" class="form-input" placeholder="Contractor name">
            </div>
            <div class="form-group">
                <label class="form-label">Estimated Cost ($)</label>
                <input type="number" name="estimated_cost" class="form-input" min="0" step="0.01">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update</button>
            </div>
        </form>
    `);

    document.getElementById('updateMaintenanceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = { status: formData.get('status') };
        if (formData.get('assigned_to')) data.assigned_to = formData.get('assigned_to');
        if (formData.get('estimated_cost')) data.estimated_cost = parseFloat(formData.get('estimated_cost'));

        try {
            showLoading();
            await apiRequest(`/maintenance/${requestId}`, { method: 'PUT', body: data });
            closeModal();
            showToast('Request updated!');
            renderDashboardTab('maintenance');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    });
};

// ==================== TENANT INVITATIONS ====================

// Invite Tenant Modal
window.openInviteTenantModal = function(propertyId, propertyAddress) {
    openModal(`
        <h2 class="modal-title">Invite Tenant</h2>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Send an invitation to a tenant for <strong>${propertyAddress}</strong></p>
        <form id="inviteTenantForm">
            <input type="hidden" name="property_id" value="${propertyId}">
            <div class="form-group">
                <label class="form-label">Tenant Email *</label>
                <input type="email" name="email" class="form-input" placeholder="tenant@example.com" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Monthly Rent ($)</label>
                    <input type="number" name="monthly_rent" class="form-input" min="0" step="0.01" placeholder="1500">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Lease Start Date</label>
                    <input type="date" name="start_date" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Lease End Date</label>
                    <input type="date" name="end_date" class="form-input">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Send Invitation</button>
            </div>
        </form>
    `);

    document.getElementById('inviteTenantForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            email: formData.get('email'),
            property_id: formData.get('property_id')
        };
        if (formData.get('monthly_rent')) data.monthly_rent = formData.get('monthly_rent');
        if (formData.get('start_date')) data.start_date = formData.get('start_date');
        if (formData.get('end_date')) data.end_date = formData.get('end_date');

        try {
            showLoading();
            const result = await apiRequest('/tenants/invite', { method: 'POST', body: data });
            closeModal();
            if (result.email_sent) {
                showToast('Invitation sent successfully!');
            } else {
                showToast('Invitation created (email not configured)', 'error');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    });
};

// Accept Invitation Page
async function renderAcceptInvitation() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const mainContent = document.getElementById('mainContent');

    if (!token) {
        mainContent.innerHTML = `
            <div class="auth-container">
                <div class="auth-card text-center">
                    <h1 style="color: var(--error);">Invalid Link</h1>
                    <p class="auth-subtitle">This invitation link is invalid or missing the token.</p>
                    <a href="/" data-link class="btn btn-primary">Go Home</a>
                </div>
            </div>
        `;
        hideLoading();
        return;
    }

    // Fetch invitation details
    try {
        const invitation = await apiRequest(`/tenants/invitation/${token}`);

        mainContent.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <h1 class="auth-title">You're Invited!</h1>
                    <p class="auth-subtitle">You've been invited to join LeaseWell as a tenant</p>

                    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; margin: 1.5rem 0;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">Property</div>
                        <div style="font-size: 1.1rem; color: var(--primary); font-weight: 600;">
                            ${invitation.property?.address}, ${invitation.property?.city}, ${invitation.property?.state}
                        </div>
                        ${invitation.landlord_name ? `<div style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">Invited by ${invitation.landlord_name}</div>` : ''}
                        ${invitation.monthly_rent ? `<div style="margin-top: 0.5rem; font-size: 0.9rem;">Monthly Rent: <strong>$${invitation.monthly_rent}</strong></div>` : ''}
                    </div>

                    <form id="acceptInvitationForm">
                        <input type="hidden" name="token" value="${token}">
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-input" value="${invitation.email}" disabled style="background: var(--bg-card);">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Full Name *</label>
                            <input type="text" name="full_name" class="form-input" placeholder="John Doe" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password *</label>
                            <input type="password" name="password" id="invite_password" class="form-input" placeholder="••••••••" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Confirm Password *</label>
                            <input type="password" name="confirm_password" id="invite_confirm_password" class="form-input" placeholder="••••••••" required>
                            <p class="form-error hidden" id="invitePasswordError">Passwords do not match</p>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Accept & Create Account</button>
                    </form>
                    <p class="auth-footer">Already have an account? <a href="/login" data-link>Sign in</a></p>
                </div>
            </div>
        `;

        // Password validation
        const password = document.getElementById('invite_password');
        const confirmPassword = document.getElementById('invite_confirm_password');
        const passwordError = document.getElementById('invitePasswordError');

        confirmPassword.addEventListener('input', () => {
            if (confirmPassword.value && password.value !== confirmPassword.value) {
                passwordError.classList.remove('hidden');
                confirmPassword.style.borderColor = 'var(--error)';
            } else {
                passwordError.classList.add('hidden');
                confirmPassword.style.borderColor = '';
            }
        });

        // Form submission
        document.getElementById('acceptInvitationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            if (formData.get('password') !== formData.get('confirm_password')) {
                showToast('Passwords do not match', 'error');
                return;
            }

            try {
                showLoading();
                const result = await apiRequest('/tenants/accept-invitation', {
                    method: 'POST',
                    body: {
                        token: formData.get('token'),
                        full_name: formData.get('full_name'),
                        password: formData.get('password')
                    }
                });

                // Log user in
                authToken = result.access_token;
                currentUser = result.user;
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateNav();
                navigate('/dashboard');
                showToast('Welcome to LeaseWell!');
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                hideLoading();
            }
        });

    } catch (error) {
        mainContent.innerHTML = `
            <div class="auth-container">
                <div class="auth-card text-center">
                    <h1 style="color: var(--error);">Invitation Error</h1>
                    <p class="auth-subtitle">${error.message || 'This invitation is invalid, expired, or has already been used.'}</p>
                    <a href="/" data-link class="btn btn-primary">Go Home</a>
                </div>
            </div>
        `;
    }

    hideLoading();
}

// ==================== 404 ====================

function render404() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-card text-center">
                <h1 style="font-size: 4rem; color: var(--primary);">404</h1>
                <p class="auth-subtitle">Page not found</p>
                <a href="/" data-link class="btn btn-primary">Go Home</a>
            </div>
        </div>
    `;
    hideLoading();
}

// ==================== UI HELPERS ====================

function showLoading() {
    document.getElementById('loadingOverlay')?.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay')?.classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.style.borderColor = type === 'error' ? 'var(--error)' : 'var(--primary)';
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}
