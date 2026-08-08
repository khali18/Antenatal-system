const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/antenatal_pnc_db';
        const conn = await mongoose.connect(uri);
        console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    } catch (error) {
        console.error(`[MongoDB Connection Error]: ${error.message}`);
    }
};

module.exports = connectDB;
