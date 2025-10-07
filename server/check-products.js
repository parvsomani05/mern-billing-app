const mongoose = require('mongoose');
const Product = require('./models/Product');

async function checkProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/billing_app');
    console.log('Connected to MongoDB');

    const count = await Product.countDocuments();
    console.log('Total products in database:', count);

    if (count > 0) {
      const products = await Product.find({}).limit(5);
      console.log('Sample products:');
      products.forEach(p => {
        console.log(`  ID: ${p._id}, Name: ${p.name}, Price: ${p.price}, Active: ${p.isActive}`);
      });
    } else {
      console.log('No products found in database');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProducts();
