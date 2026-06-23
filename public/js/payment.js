// js/payment.js - Standalone Payment Page Logic

let bookingData = null;
let currentMethod = 'upi';

/* ─── Initialization ─────────────────────────────────────── */
async function initializePaymentPage() {
  if (!requireLogin()) return;

  try {
    bookingData = JSON.parse(sessionStorage.getItem('currentBooking'));
  } catch (e) {
    bookingData = null;
  }

  // Error boundary: if sessionStorage is empty redirect back
  if (!bookingData || !bookingData.booking_id) {
    localStorage.setItem('pendingToast', 'Session expired. Please restart booking.');
    window.location.href = 'booking.html';
    return;
  }

  populateBookingSummary();
  selectTab('upi'); // default tab
}

/* ─── Tab / Panel Switching ──────────────────────────────── */
function selectTab(method) {
  currentMethod = method;

  // Update radio selection
  const radio = document.querySelector(`input[name="paymentMethod"][value="${method}"]`);
  if (radio) radio.checked = true;

  // Update tab highlight
  ['upi', 'card', 'netbanking'].forEach(m => {
    const tab = document.getElementById(`tab-${m}`);
    if (tab) tab.classList.toggle('active-tab', m === method);
  });

  // Show only the matching panel
  ['upi', 'card', 'netbanking'].forEach(m => {
    const panel = document.getElementById(`panel-${m}`);
    if (!panel) return;
    if (m === method) {
      panel.classList.remove('is-hidden');
      panel.querySelectorAll('input, select').forEach(el => {
        el.required = (el.id !== 'cardCvv'); // CVV optional visually but validated manually
      });
    } else {
      panel.classList.add('is-hidden');
      panel.querySelectorAll('input, select').forEach(el => el.required = false);
    }
  });
}

/* ─── Booking Summary Sidebar ────────────────────────────── */
function populateBookingSummary() {
  const summaryDiv = document.getElementById('summary');
  if (!summaryDiv || !bookingData) return;

  summaryDiv.innerHTML = `
    <div><span>Booking ID</span><span style="color:var(--primary);font-weight:700;">#${bookingData.booking_id}</span></div>
    <div><span>Route</span><span>${bookingData.busDetails.route}</span></div>
    <div><span>Bus</span><span>${bookingData.busDetails.busNumber}</span></div>
    <div><span>Departure</span><span>${formatTime(bookingData.busDetails.departure)}</span></div>
    <div><span>Seat</span><span>#${bookingData.seat}</span></div>
    <div><span>Passenger</span><span>${bookingData.passenger.name}</span></div>
    <div style="border-bottom:none;padding-bottom:0;">
      <span style="font-weight:700;font-size:1rem;">Total</span>
      <span style="font-weight:800;font-size:1.1rem;color:var(--secondary);">${formatCurrency(bookingData.fare)}</span>
    </div>
  `;
}

/* ─── Receipt Generation ─────────────────────────────────── */
function showReceipt(method, methodDetails) {
  const now = new Date();
  const txnId = 'TXN' + Date.now().toString().slice(-10).toUpperCase();

  // Build method string
  let methodStr = '';
  if (method === 'upi') methodStr = `UPI · ${methodDetails.upiId}`;
  else if (method === 'card') methodStr = `Card ···· ${(methodDetails.cardNumber || '').replace(/\s/g,'').slice(-4)}`;
  else if (method === 'netbanking') methodStr = `Net Banking · ${methodDetails.bankName}`;

  const receiptBody = document.getElementById('receiptBody');
  receiptBody.innerHTML = `
    <div class="receipt-row"><span>Booking ID</span><span style="color:var(--primary);">#${bookingData.booking_id}</span></div>
    <div class="receipt-row"><span>Transaction ID</span><span>${txnId}</span></div>
    <div class="receipt-row"><span>Route</span><span>${bookingData.busDetails.route}</span></div>
    <div class="receipt-row"><span>Bus Number</span><span>${bookingData.busDetails.busNumber}</span></div>
    <div class="receipt-row"><span>Departure</span><span>${formatTime(bookingData.busDetails.departure)}</span></div>
    <div class="receipt-row"><span>Seat Number</span><span>#${bookingData.seat}</span></div>
    <div class="receipt-row"><span>Passenger</span><span>${bookingData.passenger.name}</span></div>
    <div class="receipt-row"><span>Email</span><span>${bookingData.passenger.email}</span></div>
    <div class="receipt-row"><span>Payment Method</span><span>${methodStr}</span></div>
    <div class="receipt-row"><span>Date &amp; Time</span><span>${now.toLocaleString('en-IN')}</span></div>
    <div class="receipt-total-row">
      <span>Amount Paid</span>
      <span>${formatCurrency(bookingData.fare)}</span>
    </div>
    <div class="receipt-actions">
      <div style="text-align:center; padding:1.5rem 0 0; width:100%;">
        <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
          📧 A copy of this receipt has been sent to <strong>${bookingData.passenger.email}</strong>
        </p>
      </div>
    </div>
  `;

  // Switch views
  document.getElementById('paymentView').classList.add('is-hidden');
  document.getElementById('receiptView').classList.remove('is-hidden');
}

/* ─── Print Receipt ──────────────────────────────────────── */
function printReceipt() {
  window.print();
}

/* ─── Back Navigation ─────────────────────────────────────── */
function goBackToBooking() {
  window.location.href = 'booking.html';
}

/* ─── Complete Booking ───────────────────────────────────── */
async function completeBooking(event) {
  event.preventDefault();

  if (!bookingData || !bookingData.booking_id) {
    showNotification('No active booking session found.', 'error');
    return;
  }

  // Gather method details
  let details = {};
  let validationError = null;

  if (currentMethod === 'upi') {
    const upiId = document.getElementById('upiId').value.trim();
    const upiName = document.getElementById('upiName').value.trim();
    if (!upiId || !upiId.includes('@')) {
      validationError = 'Please enter a valid UPI ID (e.g. name@bank)';
    } else if (!upiName) {
      validationError = 'Please enter the UPI account holder name.';
    }
    details = { upiId, upiName };

  } else if (currentMethod === 'card') {
    const cardName = document.getElementById('cardName').value.trim();
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value.trim();
    const cardCvv = document.getElementById('cardCvv').value.trim();
    if (!cardName) validationError = 'Please enter the name on your card.';
    else if (cardNumber.length < 12) validationError = 'Please enter a valid card number.';
    else if (!cardExpiry || cardExpiry.length < 5) validationError = 'Please enter a valid expiry (MM/YY).';
    else if (cardCvv.length < 3) validationError = 'Please enter a valid CVV.';
    details = { cardName, cardNumber, cardExpiry };

  } else if (currentMethod === 'netbanking') {
    const bankName = document.getElementById('bankName').value;
    const bankUserId = document.getElementById('bankUserId').value.trim();
    if (!bankName) validationError = 'Please select your bank.';
    else if (!bankUserId) validationError = 'Please enter your net banking user ID.';
    details = { bankName, bankUserId };
  }

  if (validationError) {
    showNotification(validationError, 'warning');
    return;
  }

  const submitButton = document.getElementById('payButton');

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('loading');
    }

    showNotification('Processing payment…', 'warning');

    await APIClient.confirmPayment({
      booking_id: bookingData.booking_id,
      method: currentMethod,
      details
    });

    // Clean up session
    sessionStorage.removeItem('currentBooking');
    localStorage.removeItem('bookingData');

    // Show on-page receipt
    showReceipt(currentMethod, details);
    showNotification('🎉 Booking confirmed! Check your email for the receipt.', 'success');

  } catch (error) {
    showNotification('Payment failed: ' + error.message, 'error');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
    }
  }
}

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initializePaymentPage);
