# Juray IA

Juray IA is a small multi-page web application built as a student project.
It includes user registration, login, a protected welcome page and a simple chatbot interface.

The application uses:

- HTML, CSS and Vanilla JavaScript for the frontend
- Node.js and Express for the local server
- SQLite for storing registered users

## Main Features

- Landing page with a modern interface
- User registration connected to a local database
- Login with validation through the server
- Welcome page available only after login
- Demo chatbot page for simple interaction
- Demo account already available for testing

## Project Structure

```text
PROGRAMMAZIONE-DI-APPLICAZIONE-INTELLIGENTI/
│
├── index.html
├── login.html
├── signup.html
├── welcome.html
├── chat.html
├── styles.css
├── auth.js
├── package.json
├── package-lock.json
├── README.md
├── image/
│   └── imag1.png
└── root/
    ├── server.js
    └── data/
        └── app.db   # created automatically on first run
```

## How to Run

1. Open a terminal in the project folder.
2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

4. Open the browser at:

```text
http://localhost:3000
```

## Demo User

You can test the application with the default account:

- Email: `juray@gmail.com`
- Password: `1234`

## Notes

- This project is designed for learning and presentation purposes.
- Passwords are stored in plain text, so it is not suitable for production use.
- The current session is stored in the browser through `localStorage` after a successful login.

## Possible Improvements

- Add password hashing
- Add real server-side sessions
- Save chat history in the database
- Add admin/user roles
- Improve chatbot logic with an external API
