const http = require('http');

async function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    // 1. Log in
    const loginData = JSON.stringify({ email: 'meera@localdrop.com', password: 'password123' });
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    }, loginData);

    console.log('Login Status:', loginRes.status);
    const token = loginRes.body.data.accessToken;
    console.log('Login Token retrieved.');

    // 2. Call Referral invite
    const inviteData = JSON.stringify({
      businessName: 'Shivam Cafe',
      email: 'sanjanamandal1@gmail.com', // User's email to test
      senderName: 'Meera Sharma'
    });

    const inviteRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/referrals/invite',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': inviteData.length,
        'Authorization': `Bearer ${token}`
      }
    }, inviteData);

    console.log('Invite Response Status:', inviteRes.status);
    console.log('Invite Response Body:', inviteRes.body);
  } catch (err) {
    console.error('Error running test invite:', err.message);
  }
}

run();
