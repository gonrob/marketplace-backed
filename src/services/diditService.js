const getToken = async () => {
  const credentials = Buffer.from(
    `${process.env.DIDIT_CLIENT_ID}:${process.env.DIDIT_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://apx.didit.me/auth/v2/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' })
  });
  const data = await res.json();
  console.log('Didit token response:', JSON.stringify(data));
  return data.access_token;
};

exports.createVerificationSession = async (userId, email) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('No se pudo obtener token de Didit');

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
    console.log('Didit session response:', JSON.stringify(data));
    return data;
  } catch (err) {
    console.error('Didit error:', err);
    throw err;
  }
};