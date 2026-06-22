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

  // Store search data and redirect
  localStorage.setItem('searchData', JSON.stringify({ from, to, travelDate }));
  window.location.href = 'pages/search.html';
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();

  // If coming from search form, load the search on search page
  const searchData = localStorage.getItem('searchData');
  if (searchData && window.location.pathname.includes('search.html')) {
    const { from, to, travelDate } = JSON.parse(searchData);
    document.getElementById('from').value = from;
    document.getElementById('to').value = to;
    document.getElementById('travelDate').value = travelDate;
    performSearch(new Event('submit'));
    localStorage.removeItem('searchData');
  }
});

// Handle page visibility for token refresh
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isLoggedIn()) {
    // Could implement token refresh here if needed
  }
});
