require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Member = require('./models/Member');

async function seed() {
    try {
        console.log('Connecting to', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        
        // Remove existing items and clean slate
        await Member.deleteMany({});
        
        const adminEmail = 'admin@slsuet.com';
        const adminPassword = 'adminpassword123';
        const hashedPassword = await bcrypt.hash(adminPassword, 12); // Must be 12 rounds to match backend authentication!
        
        await Member.create({
            name: 'Super Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'Superuser',
            status: 'approved',
            joining_year: 2026,
            member_id: 'SLS-SUP001'
        });
        
        console.log('--- SEEDING COMPLETE! ---');
        console.log('A new database (sls_society_new) has been created.');
        console.log('Super Admin Details:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('-------------------------');
        
        process.exit(0);
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
}
seed();
