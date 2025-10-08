import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import EmailInvoiceModal from "../components/EmailInvoiceModal";

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const { user } = useAuthStore();

  useEffect(() => {
    fetchBills();
  }, [currentPage, statusFilter]);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter && { paymentStatus: statusFilter }),
      });

      const response = await fetch(`/api/bills?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bills");
      }

      const data = await response.json();
      console.log("Bills data received:", data); // Debug log
      setBills(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error("Failed to load bills");
      console.error("Error fetching bills:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (billId) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) {
      return;
    }

    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete response:", response.status, errorText);
        if (response.status === 403) {
          throw new Error("Admin access required to delete bills");
        }
        throw new Error(`Failed to delete bill: ${response.status}`);
      }

      toast.success("Bill deleted successfully");
      fetchBills();
    } catch (error) {
      toast.error("Failed to delete bill");
      console.error("Error deleting bill:", error);
    }
  };

  const downloadPDF = async (billId) => {
    try {
      const response = await fetch(`/api/bills/${billId}/pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const data = await response.json();

      // Open PDF in new tab using the correct URL property
      if (data.data && data.data.downloadUrl) {
        window.open(data.data.downloadUrl, "_blank");
        toast.success("PDF opened successfully");
      } else if (data.data && data.data.url) {
        window.open(data.data.url, "_blank");
        toast.success("PDF opened successfully");
      } else {
        throw new Error("PDF URL not found in response");
      }
    } catch (error) {
      toast.error("Failed to download PDF");
      console.error("Error downloading PDF:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
        {user?.role === "admin" && (
          <Link
            to="/bills/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Bill
          </Link>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="flex items-center">
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setCurrentPage(1);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      {filteredBills.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No bills found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {user?.role === "admin" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {bill.billNumber || `Bill #${bill._id?.slice(-8)}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bill.products?.length || 0} items
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {bill.customer?.name || "N/A"}
                      </div>
                      {bill.customer?.email && (
                        <div className="text-sm text-gray-500">
                          {bill.customer.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{bill.totalAmount?.toFixed(2) || "0.00"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          bill.paymentStatus
                        )}`}
                      >
                        {bill.paymentStatus || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(bill.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => downloadPDF(bill._id)}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setEmailModalOpen(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 text-sm"
                        >
                          📧 Email
                        </button>
                       
                        {user?.role === "admin" && (
                          <button
                            onClick={() => handleDelete(bill._id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Email Invoice Modal */}
      <EmailInvoiceModal
        isOpen={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false);
          setSelectedBill(null);
        }}
        billId={selectedBill?._id}
        billNumber={selectedBill?.billNumber}
        customerEmail={selectedBill?.customer?.email}
      />
    </div>
  );
};

export default Bills;
