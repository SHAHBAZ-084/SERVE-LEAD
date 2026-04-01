const mongoose = require('mongoose');
const SystemSetting = require('./models/SystemSetting');

const initialTeam = [
  {
    id: 1,
    name: "Core Body",
    members: [
      { id: 101, name: "Muhammad Asim", role: "President", program: "Freelancer", desc: "My goal is to empower students by creating opportunities for leadership development.", img: "" },
      { id: 102, name: "M usman Ahmad", role: "Vice President", program: "Transportation Engineer", desc: "I am committed to strengthening our mission of student empowerment.", img: "" },
      { id: 103, name: "Ahsan Shahzad", role: "General Secretary", program: "Freelancer", desc: "My responsibility is to ensure the smooth organization of our programs.", img: "" }
    ]
  },
  {
    id: 2,
    name: "UET Lahore",
    members: [
      { id: 201, name: "Ali Hassan", role: "President", program: "Computer Science", desc: "I am committed to fostering an environment where students can develop leadership skills.", img: "" },
      { id: 202, name: "Ali Shehzad", role: "Vice President", program: "Software Engineering", desc: "My goal is to support students in achieving their full potential.", img: "" }
    ]
  },
  {
    id: 3,
    name: "COMSATS Vehari",
    members: [
      { id: 301, name: "Punjab Member 1", role: "President", program: "Civil Engineering", desc: "Representing Punjab University with a commitment to student welfare.", img: "" }
    ]
  }
];

const leadership = {
  name: "Farooq Baloch",
  role: "Chairman",
  program: "Automotive Engineer",
  desc: "I'm honored to introduce the Serve and Lead Society, an initiative I proudly founded with the vision of empowering students through growth, opportunity, and service.",
  img: "/uploads/team/farooq_default.jpg" // Placeholder for now
};

const initialChannels = [
  { id: 1, type: 'Wallet', walletType: 'EasyPaisa', number: '03000000000' },
  { id: 2, type: 'Bank', bankName: 'Meezan Bank', accountNumber: '123456789', iban: 'PK24MEZN0000123456789' }
];

async function seed() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/slsuet');
        
        await SystemSetting.findOneAndUpdate(
            { key: 'team_structure' },
            { value: JSON.stringify(initialTeam) },
            { upsert: true }
        );
        
        await SystemSetting.findOneAndUpdate(
            { key: 'team_leadership' },
            { value: JSON.stringify(leadership) },
            { upsert: true }
        );

        await SystemSetting.findOneAndUpdate(
            { key: 'donation_channels' },
            { value: JSON.stringify(initialChannels) },
            { upsert: true }
        );

        console.log('Seeded team_structure, team_leadership, and donation_channels');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
seed();
