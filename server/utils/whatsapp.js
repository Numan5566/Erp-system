const axios = require('axios');

/**
 * Sends a WhatsApp message using a configured gateway (like UltraMsg, Green-API, Wassenger, etc.)
 * Fallbacks cleanly to logging if no API is configured so the system never crashes.
 */
async function sendWhatsAppMessage(to, body) {
  const apiUrl = process.env.WHATSAPP_API_URL; // e.g., https://api.ultramsg.com/instanceXXXX/messages/chat
  const token = process.env.WHATSAPP_TOKEN;

  if (!apiUrl) {
    console.log(`[WhatsApp Logger] Message to ${to}:\n${body}\n(Set WHATSAPP_API_URL & WHATSAPP_TOKEN in Render to send live)`);
    return;
  }

  // Sanitize phone number (remove spaces, plus, dashes)
  let cleanPhone = to.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    // Convert local Pakistan number to international (replace leading 0 with 92)
    cleanPhone = '92' + cleanPhone.substring(1);
  }

  try {
    // Support UltraMsg style POST parameters (most popular free-trial gateway)
    if (apiUrl.includes('ultramsg')) {
      await axios.post(apiUrl, {
        token: token,
        to: `${cleanPhone}@c.us`,
        body: body
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    } else {
      // Generic JSON POST (Wassenger / Whapi / Green-API)
      await axios.post(apiUrl, {
        to: cleanPhone,
        chatId: `${cleanPhone}@c.us`,
        message: body,
        body: body,
        token: token
      });
    }
    console.log(`✅ WhatsApp successfully sent to ${cleanPhone}`);
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp to ${cleanPhone}:`, err.message);
  }
}

/**
 * Formats and triggers billing receipts for both the Customer and Admin
 */
async function sendWhatsAppBill(sale, items) {
  const adminPhone = process.env.ADMIN_PHONE || '923004269347'; // Default fallback admin phone

  let itemsList = '';
  items.forEach((item, idx) => {
    itemsList += `${idx + 1}. *${item.product_name || item.name}* (Qty: ${item.qty} @ Rs.${item.rate || item.price})\n`;
  });

  const messageBody = `🌟 *DATA WALEY CEMENT ERP* 🌟\n` +
    `-----------------------------------------\n` +
    `🧾 *NEW BILL GENERATED*\n\n` +
    `*Bill No:* #00${sale.id}\n` +
    `*Customer:* ${sale.customer_name || 'Walk-in Customer'}\n` +
    `*Phone:* ${sale.customer_phone || 'N/A'}\n` +
    `*Payment Mode:* ${sale.payment_type || 'Cash'}\n` +
    `*Module:* ${sale.sale_type || 'Wholesale'}\n\n` +
    `*Items Ordered:*\n${itemsList}\n` +
    `*Total Amount:* Rs. ${parseFloat(sale.total_amount).toLocaleString()}\n` +
    `*Discount:* Rs. ${parseFloat(sale.discount || 0).toLocaleString()}\n` +
    `*Delivery Charges:* Rs. ${parseFloat(sale.delivery_charges || 0).toLocaleString()}\n` +
    `-----------------------------------------\n` +
    `🔥 *Net Payable:* Rs. ${parseFloat(sale.net_amount).toLocaleString()}\n` +
    `💵 *Paid Amount:* Rs. ${parseFloat(sale.paid_amount).toLocaleString()}\n` +
    `💰 *Remaining Balance:* Rs. ${parseFloat(sale.balance_amount).toLocaleString()}\n\n` +
    `Thank you for your business! 🙏`;

  // 1. Send to Customer if valid phone is provided
  if (sale.customer_phone && sale.customer_phone.trim() !== '') {
    await sendWhatsAppMessage(sale.customer_phone, messageBody);
  }

  // 2. Send copy to Admin
  if (adminPhone) {
    const adminMessage = `🚨 *ADMIN COPY: NEW BILL GENERATED*\n\n${messageBody}`;
    await sendWhatsAppMessage(adminPhone, adminMessage);
  }
}

module.exports = { sendWhatsAppBill, sendWhatsAppMessage };
