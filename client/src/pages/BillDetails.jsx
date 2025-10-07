import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'
import {
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

const BillDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Fetch bill details
  const { data: billData, isLoading, error } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => apiService.bills.getById(id),
    enabled: !!id
  })

  // PDF Generation Mutation
  const generatePDFMutation = useMutation({
    mutationFn: () => apiService.bills.generatePDF(id),
    onSuccess: (data) => {
      toast.success('PDF generated successfully!')
      // Open PDF in new tab
      window.open(`${import.meta.env.VITE_API_URL || ''}${data.data.downloadUrl}`, '_blank')
    },
    onError: (error) => {
      toast.error('Failed to generate PDF')
      console.error('PDF generation error:', error)
    }
  })

  // Razorpay Order Creation Mutation
  const createOrderMutation = useMutation({
    mutationFn: () => apiService.bills.createRazorpayOrder(id),
    onSuccess: (data) => {
      initiateRazorpayPayment(data.data)
    },
    onError: (error) => {
      toast.error('Failed to create payment order')
      console.error('Order creation error:', error)
    }
  })

  // Payment Verification Mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: (paymentData) => apiService.bills.verifyPayment(id, paymentData),
    onSuccess: (data) => {
      toast.success('Payment successful!')
      queryClient.invalidateQueries(['bill', id])
      // Open PDF after successful payment
      if (data.data.pdfUrl) {
        window.open(`${import.meta.env.VITE_API_URL || ''}${data.data.pdfUrl}`, '_blank')
      }
    },
    onError: (error) => {
      toast.error('Payment verification failed')
      console.error('Payment verification error:', error)
    }
  })

  const initiateRazorpayPayment = (orderData) => {
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'MERN Billing App',
      description: orderData.description,
      order_id: orderData.orderId,
      handler: function (response) {
        // Verify payment
        verifyPaymentMutation.mutate({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        })
      },
      prefill: {
        name: orderData.customerName,
        email: user?.email
      },
      theme: {
        color: '#3b82f6'
      },
      modal: {
        ondismiss: function() {
          toast.error('Payment cancelled')
        }
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const handleGeneratePDF = () => {
    generatePDFMutation.mutate()
  }

  const handlePayment = () => {
    if (billData?.data?.paymentStatus === 'paid') {
      toast.error('Bill is already paid')
      return
    }
    createOrderMutation.mutate()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return 'badge-paid'
      case 'pending':
        return 'badge-pending'
      default:
        return 'badge-failed'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading bill</h3>
          <p className="text-gray-600 mb-4">Failed to load bill details</p>
          <button
            onClick={() => navigate('/bills')}
            className="btn-primary"
          >
            Back to Bills
          </button>
        </div>
      </div>
    )
  }

  const bill = billData?.data

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/bills')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bills
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Invoice {bill?.billNumber}
            </h1>
            <p className="mt-1 text-gray-600">
              View bill details and manage payment
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleGeneratePDF}
              disabled={generatePDFMutation.isPending}
              className="btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              {generatePDFMutation.isPending ? 'Generating...' : 'Download PDF'}
            </button>

            {user?.role === 'admin' && bill?.paymentStatus !== 'paid' && (
              <button
                onClick={handlePayment}
                disabled={isProcessingPayment || createOrderMutation.isPending}
                className="btn-primary"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {createOrderMutation.isPending ? 'Processing...' : 'Process Payment'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bill Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Payment Status</h3>
            </div>
            <div className="card-body">
              <div className="flex items-center space-x-3">
                {getStatusIcon(bill?.paymentStatus)}
                <div>
                  <p className="font-medium capitalize">{bill?.paymentStatus}</p>
                  <p className="text-sm text-gray-600">
                    {bill?.paymentStatus === 'paid'
                      ? `Paid on ${new Date(bill?.paidAt).toLocaleDateString()}`
                      : 'Payment pending'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Customer Information</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{bill?.customer?.name}</p>
                    <p className="text-sm text-gray-600">Customer Name</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{bill?.customer?.email}</p>
                    <p className="text-sm text-gray-600">Email Address</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{bill?.customer?.phone}</p>
                    <p className="text-sm text-gray-600">Phone Number</p>
                  </div>
                </div>

                {bill?.customer?.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{bill?.customer?.address}</p>
                      <p className="text-sm text-gray-600">Address</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Products</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {bill?.products?.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.productName}</h4>
                      <p className="text-sm text-gray-600">{product.productDescription}</p>
                      <p className="text-sm text-gray-500">
                        Quantity: {product.quantity} × ₹{product.price}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{product.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bill Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Bill Summary</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{bill?.subtotal?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18%):</span>
                  <span className="font-medium">₹{bill?.taxAmount?.toFixed(2)}</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-lg font-bold text-primary-600">
                      ₹{bill?.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Bill Information</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Bill Number</p>
                    <p className="text-gray-600">{bill?.billNumber}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Created Date</p>
                    <p className="text-gray-600">
                      {new Date(bill?.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Due Date</p>
                    <p className="text-gray-600">
                      {new Date(bill?.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Alert */}
          {bill?.paymentStatus === 'pending' && (
            <div className="card border-yellow-200 bg-yellow-50">
              <div className="card-body">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Payment Pending</p>
                    <p className="text-sm text-yellow-700">
                      This bill is awaiting payment
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {bill?.paymentStatus === 'paid' && (
            <div className="card border-green-200 bg-green-50">
              <div className="card-body">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Payment Completed</p>
                    <p className="text-sm text-green-700">
                      Paid on {new Date(bill?.paidAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BillDetails
