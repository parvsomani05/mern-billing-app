import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import toast from "react-hot-toast";
import {
  Package,
  Receipt,
  Users,
  Phone,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  Edit,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Activity,
  IndianRupee,
  User,
  FileText,
  AlertTriangle
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuthStore();

  // State for dynamic data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBills: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    overdueBills: 0,
    pendingContacts: 0,
    totalSpent: 0,
    recentBills: [],
    lowStockProducts: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (user?.role === 'admin') {
        // Fetch admin dashboard data
        await Promise.all([
          fetchAdminStats(),
          fetchRecentBills(),
          fetchLowStockProducts()
        ]);
      } else {
        // Fetch customer dashboard data
        await Promise.all([
          fetchCustomerStats(),
          fetchCustomerBills()
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      // Fetch products count
      const productsResponse = await fetch('/api/products?limit=1', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const productsData = await productsResponse.json();
      const totalProducts = productsData.totalProducts || 0;

      // Fetch bills stats
      const billsResponse = await fetch('/api/bills/stats?period=month', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const billsData = await billsResponse.json();

      // Fetch customers count
      const customersResponse = await fetch('/api/customers?limit=1', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const customersData = await customersResponse.json();
      const totalCustomers = customersData.totalCustomers || 0;

      // Fetch contacts count
      const contactsResponse = await fetch('/api/contact?limit=1&status=pending', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const contactsData = await contactsResponse.json();
      const pendingContacts = contactsData.totalContacts || 0;

      setStats(prev => ({
        ...prev,
        totalProducts,
        totalBills: billsData.totalBills || 0,
        totalCustomers,
        monthlyRevenue: billsData.totalAmount || 0,
        pendingContacts
      }));
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchCustomerStats = async () => {
    try {
      // Fetch customer's bills
      const billsResponse = await fetch('/api/bills', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const billsData = await billsResponse.json();

      const customerBills = billsData.data || [];
      const totalSpent = customerBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

      setStats(prev => ({
        ...prev,
        totalBills: customerBills.length,
        totalSpent,
        recentBills: customerBills.slice(0, 5) // Last 5 bills
      }));
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    }
  };

  const fetchRecentBills = async () => {
    try {
      const response = await fetch('/api/bills?limit=5&sort=-createdAt', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();

      setStats(prev => ({
        ...prev,
        recentBills: data.data || []
      }));
    } catch (error) {
      console.error('Error fetching recent bills:', error);
    }
  };

  const fetchCustomerBills = async () => {
    try {
      const response = await fetch('/api/bills', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();

      setStats(prev => ({
        ...prev,
        recentBills: data.data || []
      }));
    } catch (error) {
      console.error('Error fetching customer bills:', error);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const response = await fetch('/api/products/admin/low-stock', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();

      setStats(prev => ({
        ...prev,
        lowStockProducts: data.data || []
      }));
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Cards - Dynamic based on user role */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {user?.role === 'admin' ? (
          // Admin Stats
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalProducts}</div>
                <p className="text-xs text-gray-600">Active products in inventory</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
                <Receipt className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalBills}</div>
                <p className="text-xs text-gray-600">Bills this month</p>
              </CardContent>
            </Card>



            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Contacts</CardTitle>
                <Phone className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingContacts}</div>
                <p className="text-xs text-gray-600">Awaiting response</p>
              </CardContent>
            </Card>
          </>
        ) : (
          // Customer Stats
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Bills</CardTitle>
                <Receipt className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalBills}</div>
                <p className="text-xs text-gray-600">Total orders placed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <IndianRupee className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.totalSpent)}
                </div>
                <p className="text-xs text-gray-600">Total amount spent</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Account Type</CardTitle>
                <User className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">Customer</div>
                <p className="text-xs text-gray-600">Verified account</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Order</CardTitle>
                <ShoppingCart className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-orange-600">
                  {stats.recentBills.length > 0 ? formatDate(stats.recentBills[0].createdAt) : 'No orders'}
                </div>
                <p className="text-xs text-gray-600">Most recent purchase</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              <span>{user?.role === 'admin' ? 'Recent Bills' : 'My Recent Orders'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentBills.length > 0 ? (
                stats.recentBills.map((bill) => (
                  <div
                    key={bill._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(bill.paymentStatus)}
                      <div>
                        <p className="font-medium">
                          {bill.customer?.name || 'Customer'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {bill.billNumber || `Bill #${bill._id?.slice(-8)}`} • {formatDate(bill.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(bill.totalAmount)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          bill.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : bill.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {bill.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No bills found</p>
                  {user?.role === 'admin' ? (
                    <Link to="/bills/new" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                      Create your first bill
                    </Link>
                  ) : (
                    <Link to="/customer/products" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                      Start shopping
                    </Link>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert (Admin Only) or Customer Info */}
        {user?.role === 'admin' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span>Low Stock Alert</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.lowStockProducts.length > 0 ? (
                  stats.lowStockProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          Current: {product.quantity} | Threshold: {product.threshold} | Category: {product.category}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Low Stock
                        </span>
                        <Link
                          to="/products/new"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Restock
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
                    <p>All products are well stocked!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-purple-600" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Account Status</p>
                    <p className="text-sm text-gray-600">Active and verified</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Member Since</p>
                    <p className="text-sm text-gray-600">Your join date</p>
                  </div>
                  <span className="text-sm text-gray-900">
                    {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Quick Actions</p>
                    <p className="text-sm text-gray-600">Manage your account</p>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to="/customer/products"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Shop
                    </Link>
                    <Link
                      to="/profile"
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions (Admin Only) */}
      {user?.role === "admin" && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/products/new"
                className="btn-primary flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Link>
              <Link
                to="/bills/new"
                className="btn-primary flex items-center justify-center"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Create Bill
              </Link>
              <Link
                to="/customers/new"
                className="btn-primary flex items-center justify-center"
              >
                <Users className="w-4 h-4 mr-2" />
                Add Customer
              </Link>
              <Link
                to="/contacts"
                className="btn-secondary flex items-center justify-center"
              >
                <Phone className="w-4 h-4 mr-2" />
                View Contacts
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">New bill created</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">
                    Product added to inventory
                  </p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Customer registered</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Wireless Headphones</p>
                  <p className="text-xs text-gray-500">45 units sold</p>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  ₹12,500
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Laptop Stand</p>
                  <p className="text-xs text-gray-500">32 units sold</p>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  ₹8,000
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">USB Cable</p>
                  <p className="text-xs text-gray-500">28 units sold</p>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  ₹2,800
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Server Status</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Backup</span>
                <span className="text-sm text-gray-900">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm text-gray-900">v2.1.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
