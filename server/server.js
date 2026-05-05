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
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/transport', require('./routes/transportRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/salary', require('./routes/salaryRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/rent', require('./routes/rentRoutes'));
app.use('/api/investments', require('./routes/investmentRoutes'));
app.use('/api/other-expenses', require('./routes/otherExpensesRoutes'));
app.use('/api/profit', require('./routes/profitRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/banks', require('./routes/bankRoutes'));
app.use('/api/labours', require('./routes/labourRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));