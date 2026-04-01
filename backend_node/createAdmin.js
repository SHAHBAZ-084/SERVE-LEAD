require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Member = require('./models/Member');

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/slsuet';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected.');

    const email = 'admin@slsuet.com';
    const password = 'adminpassword123';

    // Check if admin exists
    let admin = await Member.findOne({ email });
    if (admin) {
      console.log('Admin already exists!');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    admin = new Member({
      name: 'Super Admin',
      email: email,
      password: hashedPassword,
      joining_year: 2020,
      role: 'Superuser',
      status: 'approved',
      member_id: '1',
      serial_number: 1
    });

    await admin.save();
    console.log('Admin created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
