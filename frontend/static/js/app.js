/**
 * LeaseWell Frontend - Efficient, Minimal JavaScript
 * Optimized for performance and simplicity
 */

// Update this to match your backend URL
const API_BASE = 'http://localhost:8000/api/v1';
let currentUser = null;
let authToken = null;

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
        loginLink.classList.add('hidden');
        dashboardLink.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        loginLink.classList.remove('hidden');
        dashboardLink.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
    
    logoutBtn?.addEventListener('click', handleLogout);
}

async function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    currentUser = null;
    authToken = null;
    updateNav();
    navigate('/login');
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
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
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
    const mainContent = document.getElementById('mainContent');
    
    showLoading();
    
    if (path === '/' || path === '/home') {
        renderHome();
    } else if (path === '/login') {
        renderLogin();
    } else if (path === '/register') {
        renderRegister();
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

// Pages
function renderHome() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">LeaseWell</h1>
                <p class="auth-subtitle">Efficient Property Management</p>
                <div class="flex flex-between gap-2">
                    <a href="/login" data-link class="btn btn-primary" style="flex: 1;">Login</a>
                    <a href="/register" data-link class="btn btn-secondary" style="flex: 1;">Register</a>
                </div>
            </div>
        </div>
    `;
    hideLoading();
}

function renderLogin() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">Login</h1>
                <p class="auth-subtitle">Welcome back</p>
                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" name="password" class="form-input" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
                </form>
                <p class="text-center mt-2">
                    Don't have an account? <a href="/register" data-link style="color: var(--primary);">Register</a>
                </p>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            showLoading();
            const result = await apiRequest('/auth/login', {
                method: 'POST',
                body: data,
            });
            
            authToken = result.access_token;
            currentUser = result.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateNav();
            navigate('/dashboard');
            showToast('Logged in successfully');
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
                <h1 class="auth-title">Register</h1>
                <p class="auth-subtitle">Create your account</p>
                <form id="registerForm">
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" name="full_name" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" name="password" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Role</label>
                        <select name="role" class="form-select" required>
                            <option value="landlord">Landlord</option>
                            <option value="tenant">Tenant</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Register</button>
                </form>
                <p class="text-center mt-2">
                    Already have an account? <a href="/login" data-link style="color: var(--primary);">Login</a>
                </p>
            </div>
        </div>
    `;
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            showLoading();
            const result = await apiRequest('/auth/register', {
                method: 'POST',
                body: data,
            });
            
            authToken = result.access_token;
            currentUser = result.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateNav();
            navigate('/dashboard');
            showToast('Account created successfully');
        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
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
            <p class="dashboard-subtitle">Welcome, ${currentUser?.full_name || currentUser?.email}</p>
        </div>
        <div class="tabs" id="tabs">
            <button class="tab active" data-tab="overview">Overview</button>
            <button class="tab" data-tab="properties">Properties</button>
            <button class="tab" data-tab="leases">Leases</button>
            <button class="tab" data-tab="maintenance">Maintenance</button>
            <button class="tab" data-tab="payments">Payments</button>
        </div>
        <div id="dashboardContent"></div>
    `;
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            renderDashboardTab(tabName);
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
            const data = await apiRequest('/dashboard');
            renderOverview(data);
        } else if (tab === 'properties') {
            const data = await apiRequest('/properties');
            renderProperties(data);
        } else if (tab === 'leases') {
            const data = await apiRequest('/leases');
            renderLeases(data);
        } else if (tab === 'maintenance') {
            const data = await apiRequest('/maintenance');
            renderMaintenance(data);
        } else if (tab === 'payments') {
            const data = await apiRequest('/payments');
            renderPayments(data);
        }
    } catch (error) {
        content.innerHTML = `<div class="card"><p>Error loading ${tab}: ${error.message}</p></div>`;
    } finally {
        hideLoading();
    }
}

function renderOverview(data) {
    const content = document.getElementById('dashboardContent');
    const stats = data.stats || {};
    
    content.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.total_properties || 0}</div>
                <div class="stat-label">Properties</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.active_leases || 0}</div>
                <div class="stat-label">Active Leases</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.pending_payments || 0}</div>
                <div class="stat-label">Pending Payments</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.pending_maintenance || 0}</div>
                <div class="stat-label">Pending Maintenance</div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Recent Leases</h2>
            </div>
            ${renderLeasesTable(data.leases?.slice(0, 5) || [])}
        </div>
        
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Recent Payments</h2>
            </div>
            ${renderPaymentsTable(data.payments?.slice(0, 5) || [])}
        </div>
    `;
}

function renderProperties(data) {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Properties</h2>
                ${currentUser?.role === 'landlord' ? '<button class="btn btn-primary" id="addPropertyBtn">Add Property</button>' : ''}
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Address</th>
                        <th>City</th>
                        <th>Type</th>
                        <th>Bedrooms</th>
                        <th>Bathrooms</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(p => `
                        <tr>
                            <td>${p.address} ${p.unit_number || ''}</td>
                            <td>${p.city}, ${p.state}</td>
                            <td>${p.property_type || 'N/A'}</td>
                            <td>${p.bedrooms || 'N/A'}</td>
                            <td>${p.bathrooms || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderLeases(data) {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Leases</h2>
            </div>
            ${renderLeasesTable(data)}
        </div>
    `;
}

function renderLeasesTable(leases) {
    if (leases.length === 0) {
        return '<p class="text-center">No leases found</p>';
    }
    
    return `
        <table class="table">
            <thead>
                <tr>
                    <th>Property</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Monthly Rent</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${leases.map(l => `
                    <tr>
                        <td>${l.property_id}</td>
                        <td>${new Date(l.start_date).toLocaleDateString()}</td>
                        <td>${new Date(l.end_date).toLocaleDateString()}</td>
                        <td>$${l.monthly_rent}</td>
                        <td><span class="badge badge-${l.status === 'active' ? 'success' : 'warning'}">${l.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderMaintenance(data) {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Maintenance Requests</h2>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(m => `
                        <tr>
                            <td>${m.title}</td>
                            <td><span class="badge badge-${m.priority === 'high' ? 'danger' : 'warning'}">${m.priority}</span></td>
                            <td><span class="badge badge-${m.status === 'completed' ? 'success' : 'info'}">${m.status}</span></td>
                            <td>${new Date(m.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderPayments(data) {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Payments</h2>
            </div>
            ${renderPaymentsTable(data)}
        </div>
    `;
}

function renderPaymentsTable(payments) {
    if (payments.length === 0) {
        return '<p class="text-center">No payments found</p>';
    }
    
    return `
        <table class="table">
            <thead>
                <tr>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Payment Date</th>
                    <th>Status</th>
                    <th>Method</th>
                </tr>
            </thead>
            <tbody>
                ${payments.map(p => `
                    <tr>
                        <td>$${p.amount}</td>
                        <td>${new Date(p.due_date).toLocaleDateString()}</td>
                        <td>${p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A'}</td>
                        <td><span class="badge badge-${p.status === 'paid' ? 'success' : p.status === 'late' ? 'danger' : 'warning'}">${p.status}</span></td>
                        <td>${p.payment_method || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function render404() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="text-center">
            <h1 style="font-size: 4rem; margin-bottom: 1rem;">404</h1>
            <p style="color: var(--text-muted);">Page not found</p>
            <a href="/" data-link class="btn btn-primary mt-3">Go Home</a>
        </div>
    `;
    hideLoading();
}

// UI Helpers
function showLoading() {
    document.getElementById('loadingOverlay')?.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay')?.classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

