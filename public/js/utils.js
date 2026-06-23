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
  window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
}

function navigateTo(url) {
  window.location.href = url;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
  if (!timeString) return 'N/A';
  const date = new Date(timeString);
  if (isNaN(date.getTime())) {
    // Fallback if it's just a time string like "09:00"
    const parts = timeString.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return timeString;
  }
  const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleString('en-US', options);
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

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function populateCitySelect(selectElement, cities, placeholder, selectedValue) {
  if (!selectElement || !Array.isArray(cities) || cities.length === 0) return;

  selectElement.innerHTML = '';

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.disabled = true;
  placeholderOption.selected = !selectedValue;
  placeholderOption.textContent = placeholder;
  selectElement.appendChild(placeholderOption);

  cities.forEach((city) => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    option.selected = city === selectedValue;
    selectElement.appendChild(option);
  });
}

async function initializeRouteSearchForm() {
  const fromSelect = document.getElementById('from');
  const toSelect = document.getElementById('to');
  const travelDateInput = document.getElementById('travelDate');

  if (!fromSelect || !toSelect || !travelDateInput) return;

  const today = getTodayInputValue();
  travelDateInput.min = today;
  if (!travelDateInput.value) {
    travelDateInput.value = today;
  }

  try {
    const cities = await APIClient.getRouteCities();
    populateCitySelect(fromSelect, cities, 'From City', fromSelect.value);
    populateCitySelect(toSelect, cities, 'To City', toSelect.value);
  } catch (error) {
    console.warn('Could not load route cities:', error);
  }
}

// Call this on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  const pendingToast = localStorage.getItem('pendingToast');
  if (pendingToast) {
    setTimeout(() => {
      showNotification(pendingToast, 'error');
    }, 100);
    localStorage.removeItem('pendingToast');
  }
});
