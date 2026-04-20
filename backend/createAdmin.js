const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Member = require('./models/Member');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sls_main_db';
const ADMIN_EMAIL = 'serveandleadsociety@gmail.com';
const ADMIN_PASSWORD = 'password123'; // The user should change this immediately
const ADMIN_NAME = 'Super Admin';

async function seedAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('📡 Connected to MongoDB');

        const existingAdmin = await Member.findOne({ role: 'Superuser' });

        if (existingAdmin) {
            console.log(`⚠️ Found existing Superuser: ${existingAdmin.email}`);
            existingAdmin.email = ADMIN_EMAIL;
            // Only update password if needed, or leave it as is if they already changed it.
            // For now, we just update the email as requested.
            await existingAdmin.save();
            console.log(`✅ Superuser email updated to: ${ADMIN_EMAIL}`);
        } else {
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
            await Member.create({
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: 'Superuser',
                status: 'approved',
                joining_year: new Date().getFullYear(),
                member_id: 'MASTER-ADMIN'
            });
            console.log('✅ Master Superuser created successfully');
            console.log(`📧 Email: ${ADMIN_EMAIL}`);
            console.log(`🔑 Default Password: ${ADMIN_PASSWORD}`);
            console.log('⚠️ IMPORTANT: Change your password immediately after logging in!');
        }

    } catch (err) {
        console.error('❌ Seeding Error:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('📡 Database connection closed');
    }
}

seedAdmin();
