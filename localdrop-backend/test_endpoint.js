const http = require('http');

const testCases = [
  { text: 'heatmap', path: '/creator/analytics' },
  { text: 'join campaign', path: '/creator/match' },
  { text: 'how do i create a campaign?', path: '/business/campaigns' },
  { text: 'kyc verification', path: '/creator/settings' },
  { text: 'how and when do i get paid?', path: '/creator/payouts' },
  { text: 'how to redeem customer scan', path: '/business/redeem' },
  { text: 'refer a friend', path: '/' }
];

async function runTest(testCase) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      messages: [
        { id: '1', sender: 'user', text: testCase.text }
      ],
      pathname: testCase.path
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const reply = JSON.parse(body).reply;
        console.log(`\nQuery: "${testCase.text}"`);
        console.log(`Response: ${reply}`);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Error: ${e.message}`);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  for (const tc of testCases) {
    await runTest(tc);
  }
}

main();
