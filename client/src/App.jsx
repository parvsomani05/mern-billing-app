import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import toast from 'react-hot-toast'

// Layout Components
import Navbar from './components/Layout/Navbar'
import Footer from './components/Layout/Footer'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Bills from './pages/Bills'
import BillForm from './pages/BillForm'
import BillDetails from './pages/BillDetails'
import Customers from './pages/Customers'
import CustomerForm from './pages/CustomerForm'
import Profile from './pages/Profile'
import Contact from './pages/Contact'
import ContactList from './pages/ContactList'
import CustomerProducts from './pages/CustomerProducts'
import CustomerBills from './pages/CustomerBills'

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="spinner"></div>
  </div>
)

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    toast.error('Please login to access this page')
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role !== 'admin') {
    toast.error('Access denied. Admin privileges required.')
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-6">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route path="/contact" element={<Contact />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Product Routes */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/new"
            element={
              <ProtectedRoute adminOnly>
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id/edit"
            element={
              <ProtectedRoute adminOnly>
                <ProductForm />
              </ProtectedRoute>
            }
          />

          {/* Bill Routes */}
          <Route
            path="/bills"
            element={
              <ProtectedRoute>
                <Bills />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bills/new"
            element={
              <ProtectedRoute adminOnly>
                <BillForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bills/:id"
            element={
              <ProtectedRoute>
                <BillDetails />
              </ProtectedRoute>
            }
          />

          {/* Customer Routes */}
          <Route
            path="/customers"
            element={
              <ProtectedRoute adminOnly>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/new"
            element={
              <ProtectedRoute adminOnly>
                <CustomerForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id/edit"
            element={
              <ProtectedRoute adminOnly>
                <CustomerForm />
              </ProtectedRoute>
            }
          />

          {/* Contact Management Routes (Admin Only) */}
          <Route
            path="/contacts"
            element={
              <ProtectedRoute adminOnly>
                <ContactList />
              </ProtectedRoute>
            }
          />

          {/* Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Customer Routes */}
          <Route
            path="/customer/products"
            element={
              <ProtectedRoute>
                <CustomerProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bills"
            element={
              <ProtectedRoute>
                <CustomerBills />
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
