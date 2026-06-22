// js/utils.js - Utility Functions
function showNotification(message, type = 'success', duration = 3000) {
  const notification = document.getElementById('notification');
  if (!notification) return;

  notification.textContent = message;
  notification.className = `notification show ${type}`;

  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
}

function isLoggedIn() {
  return localStorage.getItem('token') !== null;
}

function getUserInfo() {
  return {
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId'),
    role: localStorage.getItem('role'),
    name: localStorage.getItem('userName')
  };
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('role');
  localStorage.removeItem('userName');
  localStorage.removeItem('bookingData');
  window.location.href = 'index.html';
}

function navigateTo(url) {
  window.location.href = url;
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
  if (!timeString) return 'N/A';
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

function updateAuthUI() {
  const isLogged = isLoggedIn();
  const loginLink = document.getElementById('loginLink') || document.getElementById('navLoginLink');
  const logoutLink = document.getElementById('logoutLink') || document.getElementById('navLogoutLink');
  const registerLink = document.getElementById('registerLink');

  if (loginLink) {
    loginLink.style.display = isLogged ? 'none' : 'block';
  }

  if (logoutLink) {
    logoutLink.style.display = isLogged ? 'block' : 'none';
  }

  if (registerLink) {
    registerLink.style.display = isLogged ? 'none' : 'block';
  }
}

function requireLogin() {
  if (!isLoggedIn()) {
    showNotification('Please login first', 'warning');
    setTimeout(() => {
      window.location.href = '../pages/login.html';
    }, 1500);
    return false;
  }
  return true;
}

function storeBookingData(data) {
  localStorage.setItem('bookingData', JSON.stringify(data));
}

function getBookingData() {
  const data = localStorage.getItem('bookingData');
  return data ? JSON.parse(data) : null;
}

function clearBookingData() {
  localStorage.removeItem('bookingData');
}

// Call this on page load
document.addEventListener('DOMContentLoaded', updateAuthUI);
