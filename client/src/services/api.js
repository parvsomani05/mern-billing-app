import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // You can add request logging here if needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      // You might want to redirect to login or clear auth state
      console.error('Unauthorized access')
    }

    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data)
    }

    return Promise.reject(error)
  }
)

// API service functions
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    updateProfile: (userData) => api.put('/auth/updatedetails', userData),
    updatePassword: (passwordData) => api.put('/auth/updatepassword', passwordData),
    logout: () => api.get('/auth/logout'),
  },

  // Product endpoints
  products: {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (productData) => api.post('/products', productData),
    update: (id, productData) => api.put(`/products/${id}`, productData),
    delete: (id) => api.delete(`/products/${id}`),
    updateQuantity: (id, quantityData) => api.patch(`/products/${id}/quantity`, quantityData),
    getByCategory: (category) => api.get(`/products/category/${category}`),
    getLowStock: () => api.get('/products/admin/low-stock'),
    getCategories: () => api.get('/products/categories'),
  },

  // Bill endpoints
  bills: {
    getAll: (params) => api.get('/bills', { params }),
    getById: (id) => api.get(`/bills/${id}`),
    create: (billData) => api.post('/bills', billData),
    updatePayment: (id, paymentData) => api.patch(`/bills/${id}/payment`, paymentData),
    getByCustomer: (customerId) => api.get(`/bills/customer/${customerId}`),
    getOverdue: () => api.get('/bills/admin/overdue'),
    getStats: (params) => api.get('/bills/admin/stats', { params }),
    generatePDF: (id) => api.get(`/bills/${id}/pdf`),
    createRazorpayOrder: (id) => api.post(`/bills/${id}/create-order`),
    verifyPayment: (id, paymentData) => api.post(`/bills/${id}/verify-payment`, paymentData),
  },

  // Customer endpoints
  customers: {
    getAll: (params) => api.get('/customers', { params }),
    getById: (id) => api.get(`/customers/${id}`),
    create: (customerData) => api.post('/customers', customerData),
    update: (id, customerData) => api.put(`/customers/${id}`, customerData),
    delete: (id) => api.delete(`/customers/${id}`),
    toggleStatus: (id) => api.patch(`/customers/${id}/status`),
    getStats: (params) => api.get('/customers/admin/stats', { params }),
  },

  // Contact endpoints
  contact: {
    submit: (contactData) => api.post('/contact', contactData),
    getAll: (params) => api.get('/contact', { params }),
    getById: (id) => api.get(`/contact/${id}`),
    updateStatus: (id, statusData) => api.patch(`/contact/${id}/status`, statusData),
    assign: (id, assignData) => api.patch(`/contact/${id}/assign`, assignData),
    addNote: (id, noteData) => api.post(`/contact/${id}/notes`, noteData),
    getStats: (params) => api.get('/contact/admin/stats', { params }),
  },

  // File upload endpoints
  upload: {
    uploadImage: (file, type = 'general') => {
      const formData = new FormData()
      formData.append('image', file)

      return api.post(`/upload/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
  },

  // Health check
  health: {
    check: () => api.get('/health'),
  },
}

export { api }
export default apiService
