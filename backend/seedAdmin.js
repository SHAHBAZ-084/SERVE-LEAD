const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Member = require('./models/Member');
require('dotenv').config({ path: './.env' });

async function seedAdmin() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const email = 'admin@slsuet.com';
        const rawPassword = 'adminpassword123';
        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        const existingAdmin = await Member.findOne({ email });
        if (existingAdmin) {
            console.log('Admin already exists. Updating password...');
            existingAdmin.password = hashedPassword;
            existingAdmin.role = 'Superuser';
            existingAdmin.status = 'approved';
            await existingAdmin.save();
        } else {
            console.log('Creating new admin user...');
            const newAdmin = new Member({
                name: 'System Admin',
                email: email,
                password: hashedPassword,
                role: 'Superuser',
                status: 'approved',
                member_id: '1',
                joining_year: 2026
            });
            await newAdmin.save();
        }
        
        console.log('Seeding successful. You can now login with admin@slsuet.com / adminpassword123');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
