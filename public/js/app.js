// js/app.js - Main Application Logic
function handleSearch(event) {
  event.preventDefault();

  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const travelDate = document.getElementById('travelDate').value;

  if (!from || !to || !travelDate) {
    showNotification('Please fill all search fields', 'warning');
    return;
  }

  if (from === to) {
    showNotification('Please choose different start and end cities', 'warning');
    return;
  }

  // Store search data and redirect
  localStorage.setItem('searchData', JSON.stringify({ from, to, travelDate }));
  window.location.href = 'pages/search.html';
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  initializeRouteSearchForm();
});

// Handle page visibility for token refresh
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isLoggedIn()) {
    // Could implement token refresh here if needed
  }
});
