const USERS_KEY = 'juray_users';
const SESSION_KEY = 'juray_current_user';

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function ensureDefaultUser() {
  const users = getUsers();
  const exists = users.some(user => user.email === 'juray@gmail.com');
  if (!exists) {
    users.push({
      name: 'Juray User',
      email: 'juray@gmail.com',
      password: '1234'
    });
    saveUsers(users);
  }
}

function registerUser(name, email, password) {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some(user => user.email === normalizedEmail)) {
    return { ok: false, message: 'Questo account esiste già. Vai alla pagina Login.' };
  }

  users.push({
    name: name.trim(),
    email: normalizedEmail,
    password
  });
  saveUsers(users);
  return { ok: true, message: 'Registrazione completata. Ora puoi accedere.' };
}

function loginUser(email, password) {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email === normalizedEmail && u.password === password);

  if (!user) {
    return { ok: false, message: 'Email o password non corretti.' };
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { ok: true, user };
}

function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
  }
  return user;
}

ensureDefaultUser();
