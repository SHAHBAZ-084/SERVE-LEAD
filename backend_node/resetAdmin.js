require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Member = require('./models/Member');

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected.');

    const email = 'admin@slsuet.com';
    const password = 'adminpassword123';

    let admin = await Member.findOne({ email });
    if (admin) {
      console.log('Admin found! Resetting password...');
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
      await admin.save();
      console.log('Password reset successfully to:', password);
    } else {
      console.log('Admin not found in DB!');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

resetAdmin();
