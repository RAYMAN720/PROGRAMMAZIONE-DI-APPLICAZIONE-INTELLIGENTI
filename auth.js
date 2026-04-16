const STORAGE_KEY = 'currentUser';

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveCurrentUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEY);
}

function showMessage(element, text, type = 'error') {
  if (!element) return;
  element.textContent = text;
  element.className = `alert show ${type}`;
}

function clearMessage(element) {
  if (!element) return;
  element.textContent = '';
  element.className = 'alert';
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

function logoutUser() {
  clearCurrentUser();
  window.location.href = 'login.html';
}

async function apiRequest(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || 'Si è verificato un errore durante la richiesta.');
  }

  return data;
}

function setupSignupForm() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  const messageBox = document.getElementById('messageBox');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(messageBox);

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
      showMessage(messageBox, 'Compila tutti i campi richiesti.');
      return;
    }

    if (password.length < 4) {
      showMessage(messageBox, 'La password deve contenere almeno 4 caratteri.');
      return;
    }

    if (password !== confirmPassword) {
      showMessage(messageBox, 'Le password non coincidono.');
      return;
    }

    try {
      const data = await apiRequest('/api/signup', { name, email, password });
      showMessage(messageBox, data.message || 'Registrazione completata con successo.', 'success');
      form.reset();
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1100);
    } catch (error) {
      showMessage(messageBox, error.message || 'Impossibile registrare l’utente.');
    }
  });
}

function setupLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const messageBox = document.getElementById('messageBox');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(messageBox);

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showMessage(messageBox, 'Inserisci email e password.');
      return;
    }

    try {
      const data = await apiRequest('/api/login', { email, password });
      saveCurrentUser(data.user);
      showMessage(messageBox, data.message || 'Accesso effettuato.', 'success');
      setTimeout(() => {
        window.location.href = 'welcome.html';
      }, 700);
    } catch (error) {
      showMessage(messageBox, error.message || 'Credenziali non valide.');
    }
  });
}

function setupWelcomePage() {
  const userName = document.getElementById('userName');
  if (!userName) return;

  const user = requireAuth();
  if (!user) return;

  userName.textContent = user.name;

  const welcomeText = document.getElementById('welcomeText');
  const userInfoText = document.getElementById('userInfoText');
  if (welcomeText) {
    welcomeText.textContent = `Ciao ${user.name}, il tuo account è pronto e puoi continuare con la chat.`;
  }
  if (userInfoText) {
    userInfoText.textContent = `Utente collegato: ${user.name} • ${user.email}`;
  }

  const logoutButton = document.getElementById('logoutBtn');
  if (logoutButton) {
    logoutButton.addEventListener('click', logoutUser);
  }
}

function botReply(text) {
  const input = text.toLowerCase();

  if (input.includes('ciao') || input.includes('salve')) {
    return 'Ciao! Sono Juray IA. Posso darti informazioni su login, registrazione e funzionamento della demo.';
  }
  if (input.includes('login')) {
    return 'Il login controlla email e password nel database locale e, se corretti, salva la sessione nel browser.';
  }
  if (input.includes('registr')) {
    return 'La registrazione crea un nuovo utente nel database SQLite tramite una chiamata al server Express.';
  }
  if (input.includes('aiuto') || input.includes('help')) {
    return 'Puoi chiedermi come funziona l’app, come registrarti oppure come viene gestita la sessione utente.';
  }
  return 'Messaggio ricevuto. Questa chat è una demo UI pensata per mostrare il flusso di un assistente digitale.';
}

function addMessage(container, text, sender) {
  const bubble = document.createElement('div');
  bubble.className = `msg ${sender}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function setupChatPage() {
  const chatForm = document.getElementById('chatForm');
  if (!chatForm) return;

  const user = requireAuth();
  if (!user) return;

  const chatUser = document.getElementById('chatUser');
  const messages = document.getElementById('messages');
  const userInput = document.getElementById('userInput');
  const logoutButton = document.getElementById('logoutBtn');

  if (chatUser) {
    chatUser.textContent = `Connesso come ${user.name} (${user.email})`;
  }

  addMessage(messages, `Benvenuto ${user.name}! Scrivimi pure un messaggio per iniziare la demo.`, 'bot');

  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(messages, text, 'user');
    userInput.value = '';

    window.setTimeout(() => {
      addMessage(messages, botReply(text), 'bot');
    }, 350);
  });

  if (logoutButton) {
    logoutButton.addEventListener('click', logoutUser);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupSignupForm();
  setupLoginForm();
  setupWelcomePage();
  setupChatPage();
});
