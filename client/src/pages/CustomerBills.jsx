import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import EmailInvoiceModal from '../components/EmailInvoiceModal'

const CustomerBills = () => {
  const [bills, setBills] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedBill, setSelectedBill] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailBill, setEmailBill] = useState(null)

  const { user } = useAuthStore()

  useEffect(() => {
    fetchBills()
  }, [statusFilter])

  const fetchBills = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (statusFilter) {
        queryParams.append('status', statusFilter)
      }

      const response = await fetch(`/api/bills?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch bills')
      }

      const data = await response.json()
      setBills(data.data || [])
    } catch (error) {
      toast.error('Failed to load bills')
      console.error('Error fetching bills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPDF = async (billId) => {
    try {
      const response = await fetch(`/api/bills/${billId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const data = await response.json()

      // Open PDF in new tab using the correct URL property
      if (data.data && data.data.downloadUrl) {
        window.open(data.data.downloadUrl, '_blank')
        toast.success('PDF opened successfully')
      } else if (data.data && data.data.url) {
        window.open(data.data.url, '_blank')
        toast.success('PDF opened successfully')
      } else {
        throw new Error('PDF URL not found in response')
      }
    } catch (error) {
      toast.error('Failed to download PDF')
      console.error('Error downloading PDF:', error)
    }
  }

  const downloadPDFDirect = async (billId) => {
    try {
      const response = await fetch(`/api/bills/${billId}/download-pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }

      // The response will be the PDF file directly
      // Create a blob from the response
      const blob = await response.blob()

      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Set filename
      const bill = bills.find(b => b._id === billId)
      const fileName = `Invoice_${bill?.billNumber || billId}_${Date.now()}.pdf`
      link.download = fileName

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('PDF downloaded successfully')
    } catch (error) {
      toast.error('Failed to download PDF')
      console.error('Error downloading PDF directly:', error)
    }
  }

  const viewBillDetails = async (billId) => {
    try {
      const response = await fetch(`/api/bills/${billId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch bill details')
      }

      const data = await response.json()
      setSelectedBill(data.data)
      setIsModalOpen(true)
    } catch (error) {
      toast.error('Failed to load bill details')
      console.error('Error fetching bill details:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBills = bills.filter(bill =>
    bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bills</h1>
        <a
          href="/customer/products"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Shopping
        </a>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search bills..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bills Grid */}
      {filteredBills.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No bills found</p>
          <a
            href="/customer/products"
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Shopping
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBills.map((bill) => (
            <div key={bill._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {bill.billNumber || `Bill #${bill._id?.slice(-8)}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(bill.createdAt)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bill.paymentStatus)}`}>
                  {bill.paymentStatus || 'pending'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{bill.products?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{bill.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">₹{bill.taxAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">₹{bill.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => viewBillDetails(bill._id)}
                  className="w-full bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  View Details
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => downloadPDF(bill._id)}
                    className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View PDF
                  </button>
                  <button
                    onClick={() => downloadPDFDirect(bill._id)}
                    className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Download PDF
                  </button>
                </div>
                <button
                  onClick={() => {
                    setEmailBill(bill)
                    setEmailModalOpen(true)
                  }}
                  className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  📧 Email Invoice
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bill Details Modal */}
      {isModalOpen && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Bill Details</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bill Header */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Bill Information</h3>
                  <p><span className="font-medium">Bill Number:</span> {selectedBill.billNumber}</p>
                  <p><span className="font-medium">Date:</span> {formatDate(selectedBill.createdAt)}</p>
                  <p><span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${getStatusColor(selectedBill.paymentStatus)}`}>
                      {selectedBill.paymentStatus}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                  <p><span className="font-medium">Name:</span> {selectedBill.customer?.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedBill.customer?.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedBill.customer?.phone}</p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedBill.products?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.product?.image && (
                              <img
                                src={item.product.image?.startsWith('http') ? item.product.image : `/api/products/image/${item.product.image?.replace('/uploads/products/', '') || item.product._id}`}
                                alt={item.productName}
                                className="w-10 h-10 object-cover rounded mr-3"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            )}
                            <span className="font-medium">{item.productName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{item.productDescription}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ₹{item.price?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          ₹{item.total?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="space-y-2 max-w-md ml-auto">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{selectedBill.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18%):</span>
                  <span>₹{selectedBill.taxAmount?.toFixed(2)}</span>
                </div>
                {selectedBill.notes && (
                  <div className="flex justify-between">
                    <span>Notes:</span>
                    <span className="text-sm text-gray-600">{selectedBill.notes}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">₹{selectedBill.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => downloadPDF(selectedBill._id)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View PDF
              </button>
              <button
                onClick={() => downloadPDFDirect(selectedBill._id)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Invoice Modal */}
      <EmailInvoiceModal
        isOpen={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false)
          setEmailBill(null)
        }}
        billId={emailBill?._id}
        billNumber={emailBill?.billNumber}
        customerEmail={emailBill?.customer?.email}
      />
    </div>
  )
}

export default CustomerBills
