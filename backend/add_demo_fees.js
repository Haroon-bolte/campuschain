const mongoose = require('mongoose');
const User = require('./src/models/User');
const Fee = require('./src/models/Fee');
require('dotenv').config();

const addFees = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campuschain");
        console.log("✅ Database Connected");

        const user = await User.findOne({ name: "Kunal Bankar" });
        if (!user) {
            console.error("❌ User 'Kunal Bankar' not found. Please log in first.");
            process.exit(1);
        }

        const userId = user._id.toString();

        const demoFees = [
            {
                sid: userId,
                sname: user.name,
                cat: "Semester 6 Tuition Fee",
                amount: 85000,
                due: new Date("2026-05-15"),
                status: "Pending"
            },
            {
                sid: userId,
                sname: user.name,
                cat: "Hostel & Mess Charges",
                amount: 32000,
                due: new Date("2026-04-30"),
                status: "Pending"
            },
            {
                sid: userId,
                sname: user.name,
                cat: "Exam Registration Fee",
                amount: 2500,
                due: new Date("2026-04-10"),
                status: "Pending"
            }
        ];

        // Clear any existing fees for this user first
        await Fee.deleteMany({ sid: userId });
        await Fee.insertMany(demoFees);

        console.log(`✅ Success! Added ${demoFees.length} demo fees for ${user.name}`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
};

addFees();
