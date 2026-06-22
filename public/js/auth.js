// js/auth.js - Authentication Functions
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    showNotification('Logging in...', 'warning');
    
    const response = await APIClient.login(email, password);
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('role', response.role);
      localStorage.setItem('userName', response.name);
      
      showNotification('Login successful!', 'success');
      setTimeout(() => {
        window.location.href = '../pages/search.html';
      }, 1500);
    }
  } catch (error) {
    showNotification('Login failed: ' + error.message, 'error');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  
  const userData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value
  };

  try {
    showNotification('Creating account...', 'warning');
    
    const response = await APIClient.register(userData);
    
    showNotification('Registration successful! Please login.', 'success');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  } catch (error) {
    showNotification('Registration failed: ' + error.message, 'error');
  }
}

// Check if user is logged in and redirect if needed
function checkAuthPage() {
  const currentPage = window.location.pathname;
  
  if ((currentPage.includes('login.html') || currentPage.includes('register.html')) && isLoggedIn()) {
    window.location.href = 'search.html';
  }
}

document.addEventListener('DOMContentLoaded', checkAuthPage);
