// js/api.js - API Client
// Detect environment and set API URL accordingly
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];
const LOCAL_API_PORT = window.location.port && !['3000', '5500', '8080'].includes(window.location.port)
  ? window.location.port
  : '5800';

const isLocalHost = LOCAL_HOSTS.includes(window.location.hostname) ||
                    window.location.hostname.startsWith('192.168.') ||
                    window.location.hostname.startsWith('10.') ||
                    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname) ||
                    window.location.hostname.endsWith('.local');

const API_BASE_URL = isLocalHost
  ? `${window.location.protocol}//${window.location.hostname}:${LOCAL_API_PORT}/api`
  : 'https://bus-reservation-system-production-0021.up.railway.app/api';

class APIClient {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  static async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  static async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  static async refreshToken(token) {
    return this.request('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  // Schedule endpoints
  static async searchSchedules(from, to, date) {
    const formattedDate = date;
    return this.request(`/schedules/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${formattedDate}`);
  }

  static async getRouteCities() {
    return this.request('/schedules/cities');
  }

  static async getScheduleDetails(scheduleId) {
    return this.request(`/schedules/${scheduleId}`);
  }

  static async getAvailableSeats(scheduleId) {
    return this.request(`/schedules/${scheduleId}/seats`);
  }

  // Reservation endpoints
  static async createReservation(reservationData) {
    return this.request('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });
  }

  static async initiateBooking(bookingData) {
    return this.request('/booking/initiate', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }

  static async confirmPayment(paymentData) {
    return this.request('/payment/confirm', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  static async getReservations() {
    return this.request('/reservations');
  }

  static async getReservationDetails(reservationId) {
    return this.request(`/reservations/${reservationId}`);
  }

  static async cancelReservation(reservationId) {
    return this.request(`/reservations/${reservationId}`, {
      method: 'DELETE'
    });
  }

  // Bus endpoints
  static async getBuses() {
    return this.request('/buses');
  }

  static async getBusDetails(busId) {
    return this.request(`/buses/${busId}`);
  }

  static async createBus(busData) {
    return this.request('/buses', {
      method: 'POST',
      body: JSON.stringify(busData)
    });
  }
}
