const express = require('express');
const cors = require('cors');
const { User, ClaimHistory } = require('./db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', req.body);
    }
    next();
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString()
    });
});

app.get('/api/users', async (req, res) => {
    try {
        console.log('Fetching users...');
        const users = await User.find({}, 'name _id').sort({ name: 1 });
        console.log(`Found ${users.length} users`);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        console.log('Adding user:', req.body);
        const { name } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const newUser = new User({ name: name.trim() });
        const savedUser = await newUser.save();
        console.log('User created:', savedUser.name);
        
        res.status(201).json(savedUser);
    } catch (error) {
        console.error('Error adding user:', error);
        if (error.code === 11000) {
            res.status(400).json({ error: 'User with this name already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        console.log('Fetching leaderboard...');
        const users = await User.find({}).sort({ points: -1 });
        
        const leaderboard = users.map((user, index) => ({
            _id: user._id,
            rank: index + 1,
            name: user.name,
            points: user.points
        }));
        
        console.log(`Leaderboard with ${leaderboard.length} users`);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

app.post('/api/claim', async (req, res) => {
    try {
        console.log('Claim request:', req.body);
        const { userId } = req.body;

        if (!userId) {
            console.log('No userId provided');
            return res.status(400).json({ error: 'User ID is required' });
        }

        console.log('Looking for user:', userId);
        const user = await User.findById(userId);
        
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        const randomPoints = Math.floor(Math.random() * 10) + 1;
        console.log(`Awarding ${randomPoints} points to ${user.name}`);

        user.points += randomPoints;
        await user.save();

        const historyRecord = new ClaimHistory({
            userId: user._id,
            pointsClaimed: randomPoints,
        });
        await historyRecord.save();

        const response = {
            message: `Awarded ${randomPoints} points to ${user.name}!`,
            points: randomPoints,
            totalPoints: user.points
        };

        console.log('Claim successful:', response);
        res.json(response);
        
    } catch (error) {
        console.error('Claim error:', error);
        res.status(500).json({ error: 'Failed to claim points' });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        console.log('Fetching history...');
        const history = await ClaimHistory.find({})
            .populate('userId', 'name')
            .sort({ timestamp: -1 })
            .limit(50);
            
        console.log(`Found ${history.length} history records`);
        res.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
