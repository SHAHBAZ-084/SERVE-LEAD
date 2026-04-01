const mongoose = require('mongoose');
const SystemSetting = require('./models/SystemSetting');

async function check() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/slsuet');
        const settings = await SystemSetting.find();
        console.log('SETTINGS_START');
        console.log(JSON.stringify(settings, null, 2));
        console.log('SETTINGS_END');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
