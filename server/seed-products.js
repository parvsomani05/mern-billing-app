const mongoose = require('mongoose');
const Product = require('./models/Product');

const sampleProducts = [
  {
    name: 'Laptop',
    description: 'High-performance laptop for work and gaming',
    price: 999.99,
    quantity: 50,
    image: '/uploads/products/laptop.jpg',
    category: 'Electronics',
    isActive: true,
    lowStockThreshold: 5,
    createdBy: '507f1f77bcf86cd799439011' // Sample ObjectId for admin user
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with long battery life',
    price: 29.99,
    quantity: 100,
    image: '/uploads/products/mouse.jpg',
    category: 'Electronics',
    isActive: true,
    lowStockThreshold: 10,
    createdBy: '507f1f77bcf86cd799439011' // Sample ObjectId for admin user
  },
  {
    name: 'Office Chair',
    description: 'Comfortable office chair with lumbar support',
    price: 199.99,
    quantity: 25,
    image: '/uploads/products/chair.jpg',
    category: 'Furniture',
    isActive: true,
    lowStockThreshold: 3,
    createdBy: '507f1f77bcf86cd799439011' // Sample ObjectId for admin user
  },
  {
    name: 'Coffee Mug',
    description: 'Ceramic coffee mug with company logo',
    price: 12.99,
    quantity: 200,
    image: '/uploads/products/mug.jpg',
    category: 'Accessories',
    isActive: true,
    lowStockThreshold: 20,
    createdBy: '507f1f77bcf86cd799439011' // Sample ObjectId for admin user
  },
  {
    name: 'Notebook',
    description: 'A4 size notebook with 100 pages',
    price: 4.99,
    quantity: 500,
    image: '/uploads/products/notebook.jpg',
    category: 'Stationery',
    isActive: true,
    lowStockThreshold: 50,
    createdBy: '507f1f77bcf86cd799439011' // Sample ObjectId for admin user
  }
];

async function seedProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/billing_app');
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`Created ${createdProducts.length} sample products`);

    createdProducts.forEach(product => {
      console.log(`  - ${product.name}: ${product._id} (₹${product.price})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
