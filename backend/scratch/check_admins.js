const mongoose = require('mongoose');
const Member = require('../models/Member');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const admins = await Member.find({ role: { $in: ['Admin', 'Superuser'] } });
    console.log(JSON.stringify(admins.map(a => ({ email: a.email, role: a.role, status: a.status })), null, 2));
    await mongoose.connection.close();
}
check();
