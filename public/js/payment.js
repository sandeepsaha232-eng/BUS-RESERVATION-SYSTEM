// js/payment.js - Standalone Payment Page Functions

let bookingData = null;

// Initialize payment page
async function initializePaymentPage() {
  if (!requireLogin()) return;

  try {
    bookingData = JSON.parse(sessionStorage.getItem('currentBooking'));
  } catch (e) {
    bookingData = null;
  }

  // Error boundary: if sessionStorage is empty, redirect back to booking page with toast
  if (!bookingData || !bookingData.booking_id) {
    localStorage.setItem('pendingToast', 'Session expired. Please restart booking.');
    window.location.href = 'booking.html';
    return;
  }

  // If sessionStorage is missing any key booking details, fetch them
  if (!bookingData.seat || !bookingData.fare || !bookingData.passenger || !bookingData.busDetails) {
    try {
      showNotification('Fetching missing booking details...', 'warning');
      const details = await APIClient.getReservationDetails(bookingData.booking_id);
      
      bookingData = {
        booking_id: details.ReservationID,
        seat: details.SeatNumber,
        fare: details.TotalFare || details.Fare,
        passenger: {
          name: details.PassengerName,
          email: details.PassengerEmail,
          phone: details.PassengerPhone
        },
        busDetails: {
          route: `${details.StartCity} → ${details.EndCity}`,
          busNumber: details.BusNumber,
          departure: details.DepartureTime,
          arrival: details.ArrivalTime,
          date: details.DepartureTime
        }
      };
      sessionStorage.setItem('currentBooking', JSON.stringify(bookingData));
    } catch (err) {
      console.error('Fetch error:', err);
      localStorage.setItem('pendingToast', 'Session expired. Please restart booking.');
      window.location.href = 'booking.html';
      return;
    }
  }

  // Populate UI
  populateBookingSummary();
  changePaymentMethod();
}

function populateBookingSummary() {
  const summaryDiv = document.getElementById('summary');
  if (!summaryDiv || !bookingData) return;

  summaryDiv.innerHTML = `
    <div style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-light);">
      <strong>Booking ID:</strong> <span style="color: var(--primary); font-weight: 600;">#${bookingData.booking_id}</span>
    </div>
    <div><strong>Route:</strong> <span>${bookingData.busDetails.route}</span></div>
    <div><strong>Bus Number:</strong> <span>${bookingData.busDetails.busNumber}</span></div>
    <div><strong>Departure:</strong> <span>${formatTime(bookingData.busDetails.departure)}</span></div>
    <div><strong>Seat Number:</strong> <span>${bookingData.seat}</span></div>
    <div><strong>Passenger:</strong> <span>${bookingData.passenger.name}</span></div>
    <div><strong>Fare:</strong> <span>${formatCurrency(bookingData.fare)}</span></div>
    <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-light);">
    <div><strong style="font-size: 1.1rem;">Total Amount:</strong> <span style="font-size: 1.1rem; color: var(--secondary); font-weight: 700;">${formatCurrency(bookingData.fare)}</span></div>
  `;
}

function changePaymentMethod() {
  const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const panels = document.querySelectorAll('.payment-panel');

  panels.forEach(panel => {
    if (panel.getAttribute('data-payment-panel') === selectedMethod) {
      panel.classList.remove('is-hidden');
      // Mark fields required
      const inputs = panel.querySelectorAll('input, select');
      inputs.forEach(input => input.setAttribute('required', 'true'));
    } else {
      panel.classList.add('is-hidden');
      // Remove required
      const inputs = panel.querySelectorAll('input, select');
      inputs.forEach(input => input.removeAttribute('required'));
    }
  });
}

function goBackToBooking() {
  window.location.href = 'booking.html';
}

async function completeBooking(event) {
  event.preventDefault();

  if (!bookingData || !bookingData.booking_id) {
    showNotification('No active booking session found.', 'error');
    return;
  }

  const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  let details = {};

  if (selectedMethod === 'upi') {
    details.upiId = document.getElementById('upiId').value;
  } else if (selectedMethod === 'card') {
    details.cardNumber = document.getElementById('cardNumber').value;
    details.cardExpiry = document.getElementById('cardExpiry').value;
  } else if (selectedMethod === 'netbanking') {
    details.bankName = document.getElementById('bankName').value;
  }

  const submitButton = document.getElementById('payButton');

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('loading');
    }

    showNotification('Processing payment...', 'warning');

    await APIClient.confirmPayment({
      booking_id: bookingData.booking_id,
      method: selectedMethod,
      details: details
    });

    showNotification('Payment successful! Booking confirmed.', 'success');

    // Clean up
    sessionStorage.removeItem('currentBooking');
    localStorage.removeItem('bookingData');

    setTimeout(() => {
      window.location.href = 'search.html';
    }, 2000);

  } catch (error) {
    showNotification('Payment failed: ' + error.message, 'error');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializePaymentPage);
