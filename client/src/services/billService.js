import api from './api';

// Get all bills
export const getBills = async (params = {}) => {
  try {
    const response = await api.get('/bills', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get single bill
export const getBill = async (id) => {
  try {
    const response = await api.get(`/bills/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create new bill
export const createBill = async (billData) => {
  try {
    const response = await api.post('/bills', billData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update payment status
export const updatePaymentStatus = async (id, paymentData) => {
  try {
    const response = await api.patch(`/bills/${id}/payment`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Generate PDF
export const generateBillPDF = async (id) => {
  try {
    const response = await api.get(`/bills/${id}/pdf`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Download PDF
export const downloadBillPDF = async (id) => {
  try {
    const response = await api.get(`/bills/${id}/download-pdf`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Send invoice via email
export const sendInvoiceEmail = async (billId, emailData) => {
  try {
    const response = await api.post(`/bills/${billId}/send-email`, emailData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create Razorpay order
export const createRazorpayOrder = async (id) => {
  try {
    const response = await api.post(`/bills/${id}/create-order`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Verify payment
export const verifyPayment = async (id, paymentData) => {
  try {
    const response = await api.post(`/bills/${id}/verify-payment`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get bills by customer
export const getBillsByCustomer = async (customerId) => {
  try {
    const response = await api.get(`/bills/customer/${customerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get overdue bills
export const getOverdueBills = async () => {
  try {
    const response = await api.get('/bills/admin/overdue');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get bill statistics
export const getBillStats = async (period = 'month') => {
  try {
    const response = await api.get('/bills/admin/stats', {
      params: { period }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete bill
export const deleteBill = async (id) => {
  try {
    const response = await api.delete(`/bills/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
