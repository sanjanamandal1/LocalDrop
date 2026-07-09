'use strict';
require('dotenv').config();
const { query } = require('./pool');

async function main() {
  try {
    const users = await query('SELECT id, email, role FROM users');
    console.log('--- USERS ---');
    console.table(users.rows);

    const creators = await query('SELECT id, user_id, name, niche FROM creator_profiles');
    console.log('--- CREATORS ---');
    console.table(creators.rows);

    const businesses = await query('SELECT id, user_id, business_name, business_type FROM business_profiles');
    console.log('--- BUSINESSES ---');
    console.table(businesses.rows);

    const campaigns = await query('SELECT id, name, business_id, status FROM campaigns');
    console.log('--- CAMPAIGNS ---');
    console.table(campaigns.rows);

    const campaignCreators = await query('SELECT id, campaign_id, creator_id FROM campaign_creators');
    console.log('--- CAMPAIGN CREATORS ---');
    console.table(campaignCreators.rows);

    const qrCodes = await query('SELECT id, campaign_id, creator_id, qr_token FROM qr_codes');
    console.log('--- QR CODES ---');
    console.table(qrCodes.rows);

  } catch (err) {
    console.error('Error running check-db:', err);
  } finally {
    process.exit(0);
  }
}

main();
