// js/booking.js - Booking Functions
let selectedSchedule = null;
let selectedSeat = null;

async function performSearch(event) {
  event.preventDefault();

  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const travelDate = document.getElementById('travelDate').value;

  if (!from || !to || !travelDate) {
    showNotification('Please fill all search fields', 'warning');
    return;
  }

  try {
    showNotification('Searching buses...', 'warning');
    const results = await APIClient.searchSchedules(from, to, travelDate);

    displaySearchResults(results);
    showNotification('Found ' + results.length + ' buses', 'success');
  } catch (error) {
    showNotification('Search failed: ' + error.message, 'error');
  }
}

function displaySearchResults(schedules) {
  const container = document.getElementById('resultsContainer');

  if (!schedules || schedules.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999;">No buses found. Try different search criteria.</p>';
    return;
  }

  container.innerHTML = schedules.map(schedule => `
    <div class="bus-card">
      <div class="bus-header">
        <div class="bus-route">
          <strong>${schedule.StartCity}</strong> → <strong>${schedule.EndCity}</strong>
        </div>
        <div class="bus-fare">${formatCurrency(schedule.Fare)}</div>
      </div>
      
      <div class="bus-details">
        <div class="bus-detail-item">
          <div class="bus-detail-label">Bus Type</div>
          <div>${schedule.BusType || 'Standard'}</div>
        </div>
        <div class="bus-detail-item">
          <div class="bus-detail-label">Departure</div>
          <div>${formatTime(schedule.DepartureTime)}</div>
        </div>
        <div class="bus-detail-item">
          <div class="bus-detail-label">Arrival</div>
          <div>${formatTime(schedule.ArrivalTime)}</div>
        </div>
        <div class="bus-detail-item">
          <div class="bus-detail-label">Duration</div>
          <div>${schedule.Distance ? Math.ceil(schedule.Distance / 60) + ' hrs' : 'N/A'}</div>
        </div>
      </div>
      
      <div>
        <span class="available-seats">${schedule.AvailableSeats} seats available</span>
        <button class="btn-secondary" style="float: right; margin-top: 1rem;" onclick="selectBusForBooking(${schedule.ScheduleID}, this)">
          Select
        </button>
      </div>
    </div>
  `).join('');
}

async function selectBusForBooking(scheduleId, button) {
  if (!requireLogin()) return;

  try {
    showNotification('Loading booking page...', 'warning');
    const schedule = await APIClient.getScheduleDetails(scheduleId);
    const seats = await APIClient.getAvailableSeats(scheduleId);

    selectedSchedule = { ...schedule, seats };
    storeBookingData(selectedSchedule);

    // Redirect to booking page
    window.location.href = 'booking.html';
  } catch (error) {
    showNotification('Failed to load booking: ' + error.message, 'error');
  }
}

function displayBookingPage() {
  const bookingData = getBookingData();

  if (!bookingData) {
    document.body.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>No schedule selected. <a href="search.html">Go back to search</a></p></div>';
    return;
  }

  // Display bus details
  const busDetailsDiv = document.getElementById('busDetails');
  if (busDetailsDiv) {
    busDetailsDiv.innerHTML = `
      <div class="bus-details-box">
        <div><strong>Route:</strong> <span>${bookingData.StartCity} → ${bookingData.EndCity}</span></div>
        <div><strong>Bus:</strong> <span>${bookingData.BusNumber}</span></div>
        <div><strong>Departure:</strong> <span>${formatTime(bookingData.DepartureTime)}</span></div>
        <div><strong>Arrival:</strong> <span>${formatTime(bookingData.ArrivalTime)}</span></div>
        <div><strong>Fare:</strong> <span>${formatCurrency(bookingData.Fare)}</span></div>
      </div>
    `;
  }

  // Display seat map
  displaySeatMap(bookingData);

  // Display summary
  const summaryDiv = document.getElementById('summary');
  if (summaryDiv) {
    updateSummary();
  }
}

function displaySeatMap(bookingData) {
  const seatMapDiv = document.getElementById('seatMap');
  if (!seatMapDiv) return;

  const seats = bookingData.seats || [];
  const html = [];

  for (let i = 1; i <= bookingData.Capacity; i++) {
    const seatInfo = seats.find(s => s.SeatNumber === i);
    const isBooked = seatInfo && seatInfo.IsBooked;

    html.push(`
      <div class="seat ${isBooked ? 'seat-booked' : 'seat-available'} ${selectedSeat === i ? 'seat-selected' : ''}"
           onclick="${isBooked ? '' : `selectSeat(${i})`}"
           title="Seat ${i}">
        ${i}
      </div>
    `);
  }

  seatMapDiv.innerHTML = html.join('');
}

function selectSeat(seatNumber) {
  const bookingData = getBookingData();
  const seats = bookingData.seats || [];
  const seatInfo = seats.find(s => s.SeatNumber === seatNumber);

  if (seatInfo && seatInfo.IsBooked) {
    showNotification('This seat is already booked', 'warning');
    return;
  }

  selectedSeat = seatNumber;
  displaySeatMap(bookingData);
  updateSummary();
}

function updateSummary() {
  const bookingData = getBookingData();
  const summaryDiv = document.getElementById('summary');

  if (!summaryDiv) return;

  if (!selectedSeat) {
    summaryDiv.innerHTML = '<p style="color: #999;">Select a seat to see booking summary</p>';
    return;
  }

  summaryDiv.innerHTML = `
    <div class="summary-box">
      <div><strong>Route:</strong> <span>${bookingData.StartCity} → ${bookingData.EndCity}</span></div>
      <div><strong>Date:</strong> <span>${formatDate(bookingData.TravelDate)}</span></div>
      <div><strong>Seat Number:</strong> <span>${selectedSeat}</span></div>
      <div><strong>Fare per Seat:</strong> <span>${formatCurrency(bookingData.Fare)}</span></div>
      <hr>
      <div><strong style="font-size: 1.1rem;">Total Fare:</strong> <span style="font-size: 1.1rem; color: var(--secondary-color);">${formatCurrency(bookingData.Fare)}</span></div>
    </div>
  `;
}

async function completeBooking(event) {
  event.preventDefault();

  if (!selectedSeat) {
    showNotification('Please select a seat first', 'warning');
    return;
  }

  const bookingData = getBookingData();
  const passengerName = document.getElementById('passengerName').value;
  const passengerEmail = document.getElementById('passengerEmail').value;
  const passengerPhone = document.getElementById('passengerPhone').value;

  const reservationData = {
    scheduleId: bookingData.ScheduleID,
    seatNumber: selectedSeat,
    passengerName,
    passengerEmail,
    passengerPhone
  };

  try {
    showNotification('Processing your booking...', 'warning');
    const response = await APIClient.createReservation(reservationData);

    showNotification('Booking confirmed! Your reservation ID: ' + response.reservationId, 'success');
    clearBookingData();
    selectedSeat = null;

    setTimeout(() => {
      window.location.href = 'search.html';
    }, 2000);
  } catch (error) {
    showNotification('Booking failed: ' + error.message, 'error');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname;
  
  if (currentPage.includes('booking.html')) {
    requireLogin();
    displayBookingPage();
  } else if (currentPage.includes('search.html')) {
    requireLogin();
  }
});
