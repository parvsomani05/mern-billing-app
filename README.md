# MERN Billing Application

A modern, full-stack billing and inventory management system built with the MERN stack (MongoDB, Express.js, React, Node.js). This application provides comprehensive billing solutions with PDF generation, email integration, and role-based access control.

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with secure token management
- Role-based access control (Admin/Customer)
- Password hashing with bcrypt
- Profile management and updates

### 👥 Customer Management
- Customer registration and management
- Customer profile viewing and editing
- Customer billing history tracking
- Customer statistics and analytics

### 📦 Product Management
- Complete inventory management system
- Low stock alerts and notifications
- Product categorization
- Stock quantity tracking and updates

### 🧾 Billing System
- Advanced bill creation and management
- Payment status tracking
- PDF invoice generation
- Email invoice functionality
- Bill statistics and reporting

### 📧 Communication
- Contact form submissions
- Contact status tracking
- Admin contact management
- Email notifications

### 🎛️ Dashboard & Analytics
- Dynamic role-based dashboard
- Real-time statistics and metrics
- Recent activity tracking
- System status monitoring

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Powerful data fetching and caching
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **React Hook Form** - Performant form handling
- **React Hot Toast** - Beautiful notifications
- **Lucide React** - Modern icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **PDFKit** - PDF generation
- **Multer** - File upload handling
- **Razorpay** - Payment gateway integration

### Development Tools
- **ESLint** - Code linting
- **Nodemon** - Development auto-reload
- **Concurrently** - Run multiple scripts

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mern-billing-app
```

### 2. Install Dependencies
```bash
# Install all dependencies (client and server)
npm run install-all

# Or install separately
npm run install-server
npm run install-client
```

### 3. Environment Configuration

Create `.env` file in the `server` directory:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/billing-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourapp.com
FROM_NAME=Your App Name

# Razorpay Configuration (Optional)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Linux/Mac
sudo systemctl start mongod
# or
mongod

# On Windows
net start MongoDB
```

### 5. Start the Application
```bash
# Development mode (runs both client and server)
npm run dev

# Or run separately in different terminals:
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
mern-billing-app/
├── client/                 # React Frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── Layout/    # Layout components
│   │   │   └── ui/        # UI components
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   └── utils/         # Utility functions
│   ├── index.html         # Entry HTML file
│   └── package.json       # Frontend dependencies
├── server/                # Node.js Backend
│   ├── controllers/       # Route controllers
│   ├── middlewares/       # Custom middlewares
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── templates/        # Email templates
│   ├── uploads/          # File uploads directory
│   └── server.js         # Main server file
└── package.json          # Root package configuration
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/updatedetails` - Update user profile
- `PUT /api/auth/updatepassword` - Change password

### Products
- `GET /api/products` - Get all products (with pagination, search, filter)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/quantity` - Update product quantity
- `GET /api/products/admin/low-stock` - Get low stock products

### Bills
- `GET /api/bills` - Get all bills (with pagination, filter)
- `GET /api/bills/:id` - Get bill by ID
- `POST /api/bills` - Create new bill
- `PUT /api/bills/:id` - Update bill
- `PATCH /api/bills/:id/payment` - Update payment status
- `GET /api/bills/:id/pdf` - Generate PDF invoice
- `GET /api/bills/admin/stats` - Get bill statistics

### Customers
- `GET /api/customers` - Get all customers (with pagination, search)
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contacts (admin only)
- `PATCH /api/contact/:id/status` - Update contact status

## 🎯 User Roles

### Admin
- Full system access
- Manage customers, products, bills
- View all reports and analytics
- Access contact management
- System configuration

### Customer
- View own profile and bills
- Update personal information
- View order history
- Access product catalog
- Submit contact forms

## 🔧 Development Scripts

```bash
# Install dependencies
npm run install-all          # Install both client and server dependencies
npm run install-server       # Install server dependencies only
npm run install-client       # Install client dependencies only

# Development
npm run dev                  # Start both client and server in development mode
npm run server              # Start server only
npm run client              # Start client only

# Production
npm run build               # Build client for production
npm run start               # Start server in production mode
```

## 📧 Email Integration

Configure email settings in `server/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourapp.com
FROM_NAME=Your App Name
```

## 💳 Payment Integration

The application supports Razorpay payment gateway:
```env
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## 🔒 Security Features

- JWT-based authentication with secure token management
- Password hashing using bcryptjs
- Input validation and sanitization
- CORS configuration for cross-origin requests
- Rate limiting with express-rate-limit
- Helmet.js for security headers
- File upload security with Multer

## 📱 Responsive Design

The application features a fully responsive design built with Tailwind CSS, ensuring optimal user experience across:
- Desktop computers
- Tablets
- Mobile devices

## 🚀 Deployment

### Build for Production
```bash
# Build frontend
npm run build

# Start backend in production mode
NODE_ENV=production npm run start
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

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## 🤝 Contributing

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

- **v1.0.0** - Initial release with complete MERN stack implementation
  - Modern React frontend with Vite
  - Node.js backend with Express
  - MongoDB database integration
  - JWT authentication
  - PDF generation and email integration
  - Role-based access control
  - Responsive design with Tailwind CSS

---

**Built with ❤️ using the MERN Stack**
