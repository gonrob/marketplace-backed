const getToken = async () => {
  const res = await fetch('https://apx.didit.me/auth/v2/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.DIDIT_CLIENT_ID,
      client_secret: process.env.DIDIT_CLIENT_SECRET
    })
  });
  const data = await res.json();
  return data.access_token;
};

exports.createVerificationSession = async (userId, email) => {
  const token = await getToken();
  const res = await fetch('https://apx.didit.me/v2/session/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      callback: `${process.env.CLIENT_URL}/dashboard?verified=true`,
      vendor_data: userId,
      features: 'OCR + FACE'
    })
  });
  const data = await res.json();
  return data;
};