const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { calculateFees } = require('../utils/fees');

async function createPaymentIntent(totalValue, dealRoomId) {
  const { buyerFee } = calculateFees(totalValue);
  return stripe.paymentIntents.create({
    amount: Math.round(buyerFee * 100),
    currency: 'nok',
    metadata: { dealRoomId, type: 'platform_fee_buyer' }
  });
}

async function handleWebhook(payload, sig) {
  return stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
}

module.exports = { createPaymentIntent, handleWebhook };
