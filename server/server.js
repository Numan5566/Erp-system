const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rent', require('./routes/rentRoutes'));
app.use('/api/investments', require('./routes/investmentRoutes'));
app.use('/api/other-expenses', require('./routes/otherExpensesRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));