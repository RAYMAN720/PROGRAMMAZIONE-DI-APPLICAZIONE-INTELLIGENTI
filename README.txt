JURAY IA - FULL FRONT-END PROJECT

PAGES
- index.html      -> home page
- login.html      -> login page
- signup.html     -> registration page for users not registered
- welcome.html    -> page after login
- chat.html       -> simple chatbot page
- styles.css      -> all design
- auth.js         -> registration, login, session logic using localStorage

HOW AUTH WORKS
- Users are saved in browser localStorage under key: juray_users
- Current session is saved under key: juray_current_user
- A default demo user is created automatically:
  juray@gmail.com / 1234
- New users can register from signup.html
- welcome.html and chat.html are protected pages

IMPORTANT
This is only front-end auth.
It is good for learning and demos, but not secure for production.
For a real app you need a backend and a database.

HOW TO RUN
1. Open index.html in your browser
2. Click Login or Sign up
3. If you do not have an account, register on signup.html
4. Login and continue to welcome.html and chat.html
