# MERN Billing Application

A comprehensive billing and inventory management system built with the MERN stack (MongoDB, Express.js, React, Node.js). This application provides a complete solution for managing customers, products, bills, and contacts with role-based access control.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin/Customer)
  - Secure password management
  - Profile management

- **Customer Management**
  - Customer registration and management
  - Customer profile viewing and editing
  - Customer billing history
  - Customer statistics and analytics

- **Product Management**
  - Product inventory management
  - Low stock alerts
  - Product categories
  - Stock quantity tracking

- **Billing System**
  - Bill creation and management
  - Payment status tracking
  - Bill PDF generation
  - Email invoice functionality

- **Contact Management**
  - Contact form submissions
  - Contact status tracking
  - Admin contact management

### Advanced Features
- **Dynamic Dashboard**
  - Role-based dashboard views
  - Real-time statistics
  - Recent activity tracking
  - System status monitoring

- **Email Integration**
  - Invoice email sending
  - Email templates
  - SMTP configuration

- **File Upload**
  - Product image uploads
  - Profile image uploads
  - File management

## 📁 Project Structure

```
mern-billing-app/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Node.js Backend
│   ├── controllers/       # Route controllers
│   ├── middlewares/       # Custom middlewares
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── templates/        # Email templates
├── uploads/              # File uploads directory
└── package.json
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **React Hot Toast** - Notification system
- **Lucide React** - Icon library
- **Zustand** - State management

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Multer** - File uploads

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mern-billing-app
```

### 2. Backend Setup
```bash
cd server
npm install
```

### 3. Environment Configuration
Create `.env` file in the server directory:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/billing-app
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourapp.com
FROM_NAME=Your App Name
```

### 4. Frontend Setup
```bash
cd client
npm install
```

### 5. Database Setup
```bash
# Start MongoDB service
mongod

# Seed the database (optional)
cd server
node seed-products.js
```

### 6. Start the Application
```bash
# Terminal 1 - Start Backend
cd server
npm run dev

# Terminal 2 - Start Frontend
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔐 Authentication

### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": "123 Main St, City, State"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/auth/updatedetails
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "phone": "+1234567890",
  "address": "456 Updated St, City, State"
}
```

### Change Password
```http
PUT /api/auth/updatepassword
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

## 📊 API Endpoints

### Products API

#### Get All Products
```http
GET /api/products?page=1&limit=10&search=phone&category=Electronics
Authorization: Bearer <token>
```

#### Get Product by ID
```http
GET /api/products/:id
Authorization: Bearer <token>
```

#### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 15",
  "description": "Latest iPhone model",
  "price": 999,
  "quantity": 50,
  "category": "Electronics",
  "threshold": 10
}
```

#### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "price": 1199,
  "quantity": 25
}
```

#### Delete Product
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

#### Update Product Quantity
```http
PATCH /api/products/:id/quantity
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 100,
  "operation": "add"
}
```

#### Get Low Stock Products
```http
GET /api/products/admin/low-stock
Authorization: Bearer <token>
```

### Bills API

#### Get All Bills
```http
GET /api/bills?page=1&limit=10&status=paid&customerId=123
Authorization: Bearer <token>
```

#### Get Bill by ID
```http
GET /api/bills/:id
Authorization: Bearer <token>
```

#### Create Bill
```http
POST /api/bills
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer_id",
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "price": 50
    }
  ],
  "discount": 10,
  "tax": 18
}
```

#### Update Payment Status
```http
PATCH /api/bills/:id/payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentStatus": "paid",
  "paymentMethod": "card"
}
```

#### Generate PDF Invoice
```http
GET /api/bills/:id/pdf
Authorization: Bearer <token>
```

#### Get Bill Statistics
```http
GET /api/bills/admin/stats?period=month
Authorization: Bearer <token>
```

### Customers API

#### Get All Customers
```http
GET /api/customers?page=1&limit=10&search=john
Authorization: Bearer <token>
```

#### Get Customer by ID
```http
GET /api/customers/:id
Authorization: Bearer <token>
```

#### Create Customer
```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "address": "789 Oak St, City, State",
  "company": "ABC Corp"
}
```

#### Update Customer
```http
PUT /api/customers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "phone": "+0987654321"
}
```

#### Delete Customer
```http
DELETE /api/customers/:id
Authorization: Bearer <token>
```

### Contact API

#### Submit Contact Form
```http
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "Inquiry",
  "message": "I have a question about your services"
}
```

#### Get All Contacts
```http
GET /api/contact?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### Update Contact Status
```http
PATCH /api/contact/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "resolved"
}
```

## 🎯 User Roles & Permissions

### Admin Role
- Full access to all features
- Manage customers, products, bills
- View all reports and analytics
- Access to contact management
- System configuration

### Customer Role
- View own profile and bills
- Update personal information
- View order history
- Access to product catalog
- Submit contact forms

## 🔧 Important Files

### Frontend Files
- `client/src/App.jsx` - Main application component with routing
- `client/src/pages/Dashboard.jsx` - Dynamic dashboard component
- `client/src/pages/Customers.jsx` - Dynamic customer management
- `client/src/pages/Profile.jsx` - User profile management
- `client/src/store/authStore.js` - Authentication state management
- `client/src/services/api.js` - API service functions

### Backend Files
- `server/server.js` - Main server configuration
- `server/models/Customer.js` - Customer database model
- `server/models/Product.js` - Product database model
- `server/models/Bill.js` - Bill database model
- `server/controllers/authController.js` - Authentication logic
- `server/controllers/productController.js` - Product management
- `server/controllers/billController.js` - Billing system
- `server/middlewares/auth.js` - Authentication middleware

### Configuration Files
- `server/.env` - Environment variables
- `client/vite.config.js` - Vite configuration
- `client/tailwind.config.js` - Tailwind CSS configuration

## 🧪 Testing with Postman

### Authentication Collection
1. **Register**: POST `http://localhost:5000/api/auth/register`
2. **Login**: POST `http://localhost:5000/api/auth/login`
3. **Get Profile**: GET `http://localhost:5000/api/auth/me`
4. **Update Profile**: PUT `http://localhost:5000/api/auth/updatedetails`
5. **Change Password**: PUT `http://localhost:5000/api/auth/updatepassword`

### Products Collection
1. **Get Products**: GET `http://localhost:5000/api/products`
2. **Create Product**: POST `http://localhost:5000/api/products`
3. **Update Product**: PUT `http://localhost:5000/api/products/:id`
4. **Delete Product**: DELETE `http://localhost:5000/api/products/:id`

### Bills Collection
1. **Get Bills**: GET `http://localhost:5000/api/bills`
2. **Create Bill**: POST `http://localhost:5000/api/bills`
3. **Update Payment**: PATCH `http://localhost:5000/api/bills/:id/payment`
4. **Generate PDF**: GET `http://localhost:5000/api/bills/:id/pdf`

### Customers Collection
1. **Get Customers**: GET `http://localhost:5000/api/customers`
2. **Create Customer**: POST `http://localhost:5000/api/customers`
3. **Update Customer**: PUT `http://localhost:5000/api/customers/:id`
4. **Delete Customer**: DELETE `http://localhost:5000/api/customers/:id`

## 🚀 Deployment

### Build for Production
```bash
# Build frontend
cd client
npm run build

# Start backend in production mode
cd ../server
NODE_ENV=production npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/billing-app
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRE=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your App Name
```

## 🔒 Security Features

- JWT-based authentication with secure token management
- Password hashing using bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting (can be implemented)
- File upload security
- SQL injection prevention through Mongoose ODM

## 📧 Email Configuration

The application supports email functionality for sending invoices. Configure the following in your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourapp.com
FROM_NAME=Your App Name
```

## 🛠️ Development Scripts

### Backend Scripts
```bash
npm run dev      # Start development server
npm start        # Start production server
npm run seed     # Seed database with sample data
```

### Frontend Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@yourapp.com or create an issue in the repository.

## 🔄 Version History

- **v1.0.0** - Initial release with core billing functionality
- **v1.1.0** - Added email integration and PDF generation
- **v1.2.0** - Enhanced UI with role-based dynamic components
- **v2.0.0** - Complete rewrite with modern React patterns

---

**Made with ❤️ using MERN Stack**
