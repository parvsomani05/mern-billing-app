const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              MERN Billing App
            </h3>
            <p className="text-gray-600 text-sm">
              Modern billing solution built with MERN stack.
              Manage your products, customers, and bills efficiently.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/products" className="text-gray-600 hover:text-gray-900">
                  Products
                </a>
              </li>
              <li>
                <a href="/bills" className="text-gray-600 hover:text-gray-900">
                  Bills
                </a>
              </li>
              <li>
                <a href="/customers" className="text-gray-600 hover:text-gray-900">
                  Customers
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-600 hover:text-gray-900">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Contact Info
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Email: support@billingapp.com</p>
              <p>Phone: +1 (555) 123-4567</p>
              <p>Address: 123 Business St, City, State 12345</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} MERN Billing App. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
