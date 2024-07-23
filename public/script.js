async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username && password) {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({username, password}),
            credentials: 'include' // This tells the browser to include cookies in the request
        });
        if (response.ok) {
            await validateToken();
        } else {
            alert(await response.text());
        }
    } else {
        alert('Username and password are required');
    }
};

async function signup() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username && email && password) {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        if (response.ok) {
            window.location.href = '/';
        } else {
            alert(await response.text());
        }
    } else {
        alert('All fields are required');
    }
};

async function validateToken() {
    try {
        const response = await fetch('/validate-token', { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            window.location.href = `/chat.html?username=${data.username}`;
        } else {
            alert(await response.text());
        }
    } catch (error) {
        console.error('Error validating token:', error);
    }
};