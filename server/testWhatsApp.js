const dotenv = require('dotenv');
dotenv.config();
const { sendWhatsAppBill } = require('./utils/whatsapp');

const testSale = {
  id: 124,
  customer_name: 'Numan',
  customer_phone: '03259773687',
  payment_type: 'Cash',
  sale_type: 'Wholesale',
  total_amount: 50000,
  discount: 1000,
  delivery_charges: 500,
  net_amount: 49500,
  paid_amount: 49500,
  balance_amount: 0
};

const testItems = [
  { product_name: 'Lucky Cement', qty: 50, rate: 1000, subtotal: 50000 }
];

console.log('--- STARTING WHATSAPP TEST DISPATCH ---');
sendWhatsAppBill(testSale, testItems);
