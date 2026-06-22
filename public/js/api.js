// js/api.js - API Client
const API_BASE_URL = 'http://localhost:5000/api';

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
    const formattedDate = new Date(date).toISOString().split('T')[0];
    return this.request(`/schedules/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${formattedDate}`);
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
