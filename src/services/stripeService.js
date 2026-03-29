const getStripe = () => require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createAccount = async (email) => {
  return await getStripe().accounts.create({
    type: 'express',
    country: 'ES',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    }
  });
};

exports.createAccountLink = async (accountId, clientUrl) => {
  return await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${clientUrl}/onboarding/retry`,
    return_url: `${clientUrl}/dashboard`,
    type: 'account_onboarding'
  });
};

exports.createPaymentIntent = async (amount, destinationAccountId) => {
  const fee = Math.floor(amount * 0.15);
  return await getStripe().paymentIntents.create({
    amount,
    currency: 'usd',
    application_fee_amount: fee,
    transfer_data: {
      destination: destinationAccountId
    }
  });
};

exports.getAccountStatus = async (accountId) => {
  return await getStripe().accounts.retrieve(accountId);
};