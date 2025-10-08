import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const BillForm = () => {
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    billNumber: '',
    items: [{ productId: '', productName: '', quantity: 1, price: 0, total: 0 }],
    taxRate: 0,
    discount: 0,
    notes: ''
  })
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    fetchProducts()
    fetchCustomers()

    if (id) {
      setIsEditMode(true)
      fetchBill(id)
    } else {
      // Generate bill number for new bills
      generateBillNumber()
    }
  }, [id])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Products fetched:', data.data) // Debug log
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCustomers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchBill = async (billId) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/bills/${billId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch bill')
      }

      const bill = await response.json()
      setFormData({
        customerName: bill.customerName || '',
        customerEmail: bill.customerEmail || '',
        customerPhone: bill.customerPhone || '',
        billNumber: bill.billNumber || '',
        items: bill.items || [{ productId: '', productName: '', quantity: 1, price: 0, total: 0 }],
        taxRate: bill.taxRate || 0,
        discount: bill.discount || 0,
        notes: bill.notes || ''
      })
    } catch (error) {
      toast.error('Failed to load bill')
      console.error('Error fetching bill:', error)
      navigate('/bills')
    } finally {
      setIsLoading(false)
    }
  }

  const generateBillNumber = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    setFormData(prev => ({
      ...prev,
      billNumber: `BILL-${timestamp}-${random}`
    }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value
    setFormData({
      ...formData,
      customerId: customerId
    })

    if (customerId) {
      const selectedCustomer = customers.find(customer => customer._id === customerId)
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customerId: customerId,
          customerName: selectedCustomer.name || '',
          customerEmail: selectedCustomer.email || '',
          customerPhone: selectedCustomer.phone || ''
        }))
      }
    } else {
      // Clear customer fields if "Select Customer" is chosen
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: ''
      }))
    }
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]

    if (field === 'productId') {
      const selectedProduct = products.find(p => p._id === value)
      if (selectedProduct) {
        newItems[index] = {
          ...newItems[index],
          productId: value,
          productName: selectedProduct.name,
          price: selectedProduct.price,
          total: selectedProduct.price * newItems[index].quantity
        }
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value
      }

      if (field === 'quantity' || field === 'price') {
        newItems[index].total = newItems[index].price * newItems[index].quantity
      }
    }

    setFormData({
      ...formData,
      items: newItems
    })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', productName: '', quantity: 1, price: 0, total: 0 }]
    })
  }

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData({
        ...formData,
        items: newItems
      })
    }
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.total || 0), 0)
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    return (subtotal * formData.taxRate) / 100
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    const discount = parseFloat(formData.discount) || 0
    return subtotal + tax - discount
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.customerName || !formData.billNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.items.some(item => !item.productId || item.quantity <= 0)) {
      toast.error('Please ensure all items have valid products and quantities')
      return
    }

    setIsLoading(true)

    try {
      // Transform data to match API expectations
      const billData = {
        products: formData.items.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        customerInfo: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone
        },
        notes: formData.notes,
        taxRate: formData.taxRate,
        discount: formData.discount,
        billNumber: formData.billNumber
      }

      if (formData.customerId) {
        billData.customer = formData.customerId
      }

      const url = isEditMode ? `/api/bills/${id}` : '/api/bills'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(billData)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} bill`)
      }

      toast.success(`Bill ${isEditMode ? 'updated' : 'created'} successfully`)
      navigate('/bills')
    } catch (error) {
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} bill`)
      console.error('Error saving bill:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/bills')
  }

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isEditMode ? 'Edit Bill' : 'Create New Bill'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label htmlFor="customerSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Existing Customer (Optional)
            </label>
            <select
              id="customerSelect"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.customerId}
              onChange={handleCustomerSelect}
            >
              <option value="">Select a customer or enter manually below</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} - {customer.email} - {customer.phone}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Selecting a customer will auto-fill the fields below. You can also enter customer information manually.
            </p>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label htmlFor="billNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Bill Number *
              </label>
              <input
                type="text"
                id="billNumber"
                name="billNumber"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.billNumber}
                onChange={handleInputChange}
                placeholder="Enter bill number"
              />
            </div>

            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Customer Email
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.customerEmail}
                onChange={handleInputChange}
                placeholder="Enter customer email"
              />
            </div>

            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Customer Phone
              </label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.customerPhone}
                onChange={handleInputChange}
                placeholder="Enter customer phone"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
              >
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                    <div className="md:col-span-2">
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} (₹{product.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Product Preview */}
                    {item.productId && (
                      <div className="md:col-span-2 flex items-center space-x-3 p-2 bg-gray-50 rounded-md">
                        {(() => {
                          const selectedProduct = products.find(p => p._id === item.productId)
                          console.log('Selected product for preview:', selectedProduct) // Debug log
                          return selectedProduct ? (
                            <>
                              {selectedProduct.image ? (
                                <img
                                  src={selectedProduct.image.startsWith('http') ? selectedProduct.image : `/api/products/image/${selectedProduct.image}`}
                                  alt={selectedProduct.name}
                                  className="w-12 h-12 object-cover rounded"
                                  onError={(e) => {
                                    console.log('Image failed to load:', e.target.src) // Debug log
                                    console.log('Original image value:', selectedProduct.image) // Debug log
                                    e.target.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                  <span className="text-xs text-gray-400">No Image</span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-sm">{selectedProduct.name}</p>
                                <p className="text-xs text-gray-500">₹{selectedProduct.price}</p>
                              </div>
                            </>
                          ) : (
                            <div className="w-12 h-12 bg-red-200 rounded flex items-center justify-center">
                              <span className="text-xs text-red-600">Not Found</span>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    <div>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                        placeholder="Total"
                        value={item.total.toFixed(2)}
                        readOnly
                      />
                    </div>

                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax and Discount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                id="taxRate"
                name="taxRate"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.taxRate}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
                Discount
              </label>
              <input
                type="number"
                id="discount"
                name="discount"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.discount}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-lg font-semibold">
                ₹{calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Enter any additional notes"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : (isEditMode ? 'Update Bill' : 'Create Bill')}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BillForm
