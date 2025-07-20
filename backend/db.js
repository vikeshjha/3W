const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/leaderboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB Connected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    points: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

const claimHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pointsClaimed: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);
const ClaimHistory = mongoose.model('ClaimHistory', claimHistorySchema);

module.exports = {
    User,
    ClaimHistory,
    connection: mongoose.connection
};
