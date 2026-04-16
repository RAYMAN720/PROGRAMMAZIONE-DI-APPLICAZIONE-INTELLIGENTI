const session = {
  save(payload) { localStorage.setItem('juray_session', JSON.stringify(payload)); },
  get() { try { return JSON.parse(localStorage.getItem('juray_session')); } catch { return null; } },
  clear() { localStorage.removeItem('juray_session'); },
  token() { return this.get()?.token || ''; }
};

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  const token = session.token();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.reply || 'Request failed');
  return data;
}

function bindPasswordToggle(buttonId, inputId) {
  const button = document.getElementById(buttonId);
  const input = document.getElementById(inputId);
  if (!button || !input) return;
  button.addEventListener('click', () => {
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    button.textContent = hidden ? 'Hide' : 'Show';
  });
}

function setStatus(id, message = '', type = '') {
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = message;
  box.className = type ? `status ${type}` : 'status';
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function setUser(user) {
  document.querySelectorAll('[data-user-name]').forEach((node) => node.textContent = user.name);
  document.querySelectorAll('[data-user-email]').forEach((node) => node.textContent = user.email);
}

async function requireCurrentUser() {
  const current = session.get();
  if (!current?.token) {
    window.location.href = 'login.html';
    return null;
  }
  try {
    const data = await apiFetch('/api/me');
    session.save({ token: current.token, user: data.user });
    return data;
  } catch {
    session.clear();
    window.location.href = 'login.html';
    return null;
  }
}

async function logout() {
  try { await apiFetch('/api/logout', { method: 'POST' }); } catch {}
  session.clear();
  window.location.href = 'login.html';
}

window.addEventListener('DOMContentLoaded', async () => {
  bindPasswordToggle('togglePassword', 'password');
  bindPasswordToggle('toggleConfirmPassword', 'confirmPassword');

  const logoutButton = document.getElementById('logoutBtn');
  if (logoutButton) logoutButton.addEventListener('click', logout);

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      setStatus('loginStatus');
      try {
        const data = await apiFetch('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        session.save({ token: data.token, user: data.user });
        window.location.href = 'welcome.html';
      } catch (error) {
        setStatus('loginStatus', error.message, 'error');
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirmPassword').value;
      setStatus('signupStatus');
      if (password !== confirm) {
        setStatus('signupStatus', 'Passwords do not match.', 'error');
        return;
      }
      try {
        const data = await apiFetch('/api/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
        session.save({ token: data.token, user: data.user });
        window.location.href = 'welcome.html';
      } catch (error) {
        setStatus('signupStatus', error.message, 'error');
      }
    });
  }

  const welcomePage = document.querySelector('[data-page="welcome"]');
  if (welcomePage) {
    const data = await requireCurrentUser();
    if (!data) return;
    setUser(data.user);
    const count = document.getElementById('messageCount');
    if (count) count.textContent = String(data.messages.length);
  }

  const chatPage = document.querySelector('[data-page="chat"]');
  if (chatPage) {
    const data = await requireCurrentUser();
    if (!data) return;
    setUser(data.user);

    const list = document.getElementById('messages');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('userInput');
    const button = form.querySelector('button');
    const badge = document.getElementById('providerBadge');

    const renderMessage = (text, role) => {
      const item = document.createElement('article');
      item.className = `msg ${role}`;
      item.innerHTML = `<div class="msg-bubble"><p>${escapeHtml(text)}</p></div>`;
      list.appendChild(item);
      list.scrollTop = list.scrollHeight;
    };

    if (data.messages.length) {
      data.messages.forEach((message) => renderMessage(message.content, message.role));
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = input.value.trim();
      if (!message) return;
      renderMessage(message, 'user');
      input.value = '';
      input.disabled = true;
      button.disabled = true;
      badge.textContent = 'Working';
      try {
        const data = await apiFetch('/api/chat', { method: 'POST', body: JSON.stringify({ message }) });
        renderMessage(data.reply, 'assistant');
        badge.textContent = data.provider === 'mistral' ? 'Mistral' : 'Ready';
      } catch (error) {
        renderMessage(error.message, 'assistant');
        badge.textContent = 'Error';
      } finally {
        input.disabled = false;
        button.disabled = false;
        input.focus();
      }
    });
  }
});
