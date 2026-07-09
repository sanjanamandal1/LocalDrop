'use strict';
require('dotenv').config();
const { query, getClient } = require('./pool');

async function testCreate(creatorEmail, businessName) {
  console.log(`\nTesting campaign creation for creator: ${creatorEmail} and business: ${businessName}`);
  
  // Get creator
  const creatorUserRes = await query('SELECT id FROM users WHERE email = $1', [creatorEmail]);
  if (creatorUserRes.rows.length === 0) {
    console.log(`Creator ${creatorEmail} not found in users.`);
    return;
  }
  const creatorId = creatorUserRes.rows[0].id;
  
  // Get business
  const businessProfRes = await query('SELECT user_id FROM business_profiles WHERE business_name = $1', [businessName]);
  if (businessProfRes.rows.length === 0) {
    console.log(`Business ${businessName} not found in business_profiles.`);
    return;
  }
  const businessId = businessProfRes.rows[0].user_id;

  // Simulate createAndJoinMatchCampaign
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Fetch creator details
    const creatorRes = await client.query('SELECT name, niche FROM creator_profiles WHERE user_id = $1', [creatorId]);
    const creator = creatorRes.rows[0];
    if (!creator) {
      throw new Error(`Creator profile not found for user_id ${creatorId}`);
    }
    console.log('Creator profile:', creator);

    // Fetch business details
    const businessRes = await client.query('SELECT business_name, lat, lng FROM business_profiles WHERE user_id = $1', [businessId]);
    const business = businessRes.rows[0];
    if (!business) {
      throw new Error(`Business profile not found for user_id ${businessId}`);
    }
    console.log('Business profile:', business);

    const campaignName = `${creator.name} x ${business.business_name} Special`;
    const offerDetails = `Flat 15% Off on All Orders`;

    console.log('Inserting campaign...');
    // 1. Create campaign
    const campRes = await client.query(
      `INSERT INTO campaigns (business_id, name, description, campaign_type, offer_details, commission_type, commission_value, total_budget, spent_budget, lat, lng, radius_km, valid_from, valid_till, status)
       VALUES ($1, $2, $3, 'discount', $4, 'percentage', 10.00, 5000.00, 0, $5, $6, 5, CURRENT_DATE, CURRENT_DATE + 30, 'active')
       RETURNING id`,
      [businessId, campaignName, `Special partnership offer for ${creator.name}'s audience.`, offerDetails, business.lat, business.lng]
    );
    const campaignId = campRes.rows[0].id;
    console.log(`Campaign created successfully: ${campaignId}`);

    // 2. Join creator
    console.log('Inserting campaign_creators...');
    await client.query(
      `INSERT INTO campaign_creators (campaign_id, creator_id) VALUES ($1, $2)`,
      [campaignId, creatorId]
    );
    console.log('Creator joined successfully.');

    // 3. Create QR Code
    console.log('Inserting qr_codes...');
    const qrToken = `qr_${campaignId.substring(0, 8)}_${creatorId.substring(0, 8)}`;
    const qrLink = `http://localhost:3000/c/${qrToken}`;
    await client.query(
      `INSERT INTO qr_codes (campaign_id, creator_id, qr_token, qr_link)
       VALUES ($1, $2, $3, $4)`,
      [campaignId, creatorId, qrToken, qrLink]
    );
    console.log(`QR code created successfully with token: ${qrToken}`);

    await client.query('COMMIT');
    console.log('Transaction COMMITTED successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('TRANSACTION FAILED & ROLLED BACK. Error details:', err.message, err.stack);
  } finally {
    client.release();
  }
}

async function main() {
  // Test Meera Sharma & Poha Corner
  await testCreate('meera@localdrop.com', 'Poha Corner');
  
  // Test Sanjana Mandal & Mithai Palace
  await testCreate('sanjanamandal2018@gmail.com', 'Mithai Palace');
  
  process.exit(0);
}

main();
