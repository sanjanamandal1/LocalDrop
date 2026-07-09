// src/db/seed_live_activity.js
'use strict';

require('dotenv').config();
const { pool } = require('./pool');
const { generateToken } = require('../utils/cryptoUtils');

const PASSWORD_HASH = '$2a$10$SxDMsXvClRADvY.x1DmxGenoWNJWSg3JLX8TgPw7PYkVBrv7iyWla'; // password123

const cityAreas = {
  'Indore': [
    { name: 'Vijay Nagar', lat: 22.7533, lng: 75.8937 },
    { name: 'Palasia', lat: 22.7233, lng: 75.8787 },
    { name: 'Rajwada', lat: 22.7156, lng: 75.8537 },
    { name: 'Bhawarkua', lat: 22.6899, lng: 75.8655 },
    { name: 'MG Road', lat: 22.7222, lng: 75.8611 }
  ],
  'Kolkata': [
    { name: 'Salt Lake', lat: 22.5804, lng: 88.4179 },
    { name: 'Park Street', lat: 22.5483, lng: 88.3509 },
    { name: 'Gariahat', lat: 22.5186, lng: 88.3686 },
    { name: 'Howrah', lat: 22.5958, lng: 88.2636 },
    { name: 'New Town', lat: 22.5790, lng: 88.4863 }
  ],
  'Delhi': [
    { name: 'Connaught Place', lat: 28.6304, lng: 77.2177 },
    { name: 'Karol Bagh', lat: 28.6444, lng: 77.1873 },
    { name: 'Saket', lat: 28.5244, lng: 77.2066 },
    { name: 'Hauz Khas', lat: 28.5494, lng: 77.2001 },
    { name: 'Chandni Chowk', lat: 28.6506, lng: 77.2303 }
  ]
};

const indianNames = [
  'Aarav Sharma', 'Aditya Verma', 'Amit Patel', 'Ananya Gupta', 'Arjun Singhal',
  'Deepak Pillai', 'Divya Nair', 'Harsh Goyal', 'Ishaan Gupta', 'Kabir Joshi',
  'Kavya Jain', 'Lavanya Subramaniam', 'Manoj Srivastava', 'Neha Saxena', 'Nikhil Desai',
  'Pooja Sharma', 'Pranav Doshi', 'Priya Sen', 'Rahul Pandey', 'Riya Sen',
  'Rohan Malhotra', 'Ritu Aggarwal', 'Saurabh Tiwari', 'Shreya Naik', 'Siddharth Roy',
  'Simran Gill', 'Sneha Reddy', 'Tanvi Kapoor', 'Varun Verma', 'Yash Mehta'
];

const phoneNumbers = [
  '+91-9876543210', '+91-9823456789', '+91-9898765432', '+91-9812345678', '+91-9834567890',
  '+91-9856789012', '+91-9870123456', '+91-9889012345', '+91-9890123456', '+91-9811223344',
  '+91-9822334455', '+91-9833445566', '+91-9844556677', '+91-9855667788', '+91-9866778899'
];

async function run() {
  const client = await pool.connect();
  try {
    console.log('Clearing old activity data (campaigns, redemptions, earnings, payouts, disputes)...');
    await client.query('BEGIN');

    await client.query(`
      TRUNCATE TABLE 
        campaigns, campaign_creators, qr_codes, redemptions, earnings, payouts, disputes, store_locations
      RESTART IDENTITY CASCADE
    `);

    // 0. Ensure Admin accounts exist
    console.log('Ensuring admin users exist...');
    const admins = [
      { email: 'admin@localdrop.com', role: 'admin' },
      { email: 'superadmin@localdrop.com', role: 'admin' }
    ];
    for (const admin of admins) {
      const exist = await client.query('SELECT id FROM users WHERE email = $1', [admin.email]);
      if (exist.rows.length === 0) {
        await client.query(
          `INSERT INTO users (email, password_hash, role, is_active, is_verified)
           VALUES ($1, $2, $3, true, true)`,
          [admin.email, PASSWORD_HASH, admin.role]
        );
      }
    }

    // Fetch all creators and businesses
    const creatorsRes = await client.query(`
      SELECT cp.user_id, cp.name, cp.city, cp.state, cp.lat, cp.lng 
      FROM creator_profiles cp
    `);
    const creators = creatorsRes.rows;

    const businessesRes = await client.query(`
      SELECT bp.user_id, bp.business_name, bp.business_type, bp.city, bp.state, bp.lat, bp.lng 
      FROM business_profiles bp
    `);
    const businesses = businessesRes.rows;

    console.log(`Fetched ${creators.length} creators and ${businesses.length} businesses.`);

    // Seed Store Locations
    console.log('Seeding store branches (store_locations)...');
    for (const b of businesses) {
      // Create a main branch location
      await client.query(
        `INSERT INTO store_locations (business_id, branch_name, address, city, state, lat, lng)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [b.user_id, 'Main Branch', b.address || `${b.business_name}, ${b.city}`, b.city, b.state, b.lat, b.lng]
      );

      // Create 2 additional branches
      const cityLocs = cityAreas[b.city] || [];
      const extraAreas = cityLocs.filter(area => area.name !== b.address && area.name !== b.city).slice(0, 2);
      for (let j = 0; j < extraAreas.length; j++) {
        const area = extraAreas[j];
        const branchLat = parseFloat(area.lat) + (Math.random() - 0.5) * 0.005;
        const branchLng = parseFloat(area.lng) + (Math.random() - 0.5) * 0.005;
        await client.query(
          `INSERT INTO store_locations (business_id, branch_name, address, city, state, lat, lng)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [b.user_id, `${b.business_name} - ${area.name}`, `${area.name}, ${b.city}`, b.city, b.state, branchLat, branchLng]
        );
      }
    }

    const campaignTypes = ['discount', 'bogo', 'freebie', 'cashback'];
    const offersByType = {
      'Cafe': {
        'discount': ['Flat 20% Off on All Coffee & Snacks', 'Save 15% on billing above Rs 500', 'Flat Rs 100 Off on your first visit'],
        'bogo': ['Buy 1 Get 1 Free on Special Cold Brew', 'BOGO on all shakes and coolers', 'Buy any sandwich and get a hot coffee free'],
        'freebie': ['Free cookie with any large cappuccino', 'Get a free muffin on bills above Rs 400', 'Free garlic bread with any pasta order'],
        'cashback': ['Get 10% cashback on UPI payments', 'Rs 30 cashback on Instagram story share', 'Cashback of 5% on billing above Rs 1000']
      },
      'Tea': {
        'discount': ['Flat 15% Off on All Orders', 'Save 10% on bill above Rs 300', 'Flat Rs 50 Off on your first visit'],
        'bogo': ['Buy 1 Get 1 Free on Special Kulhad Chai', 'BOGO on all iced teas and coolers', 'Buy any bun maska and get a regular tea free'],
        'freebie': ['Free Masala Chai with Any Samosa Order', 'Get free biscuits on bills above Rs 200', 'Free cookies with any premium tea pot'],
        'cashback': ['Get 10% cashback on UPI payments', 'Rs 20 cashback on review post', 'Cashback of 5% on billing above Rs 500']
      },
      'Street food': {
        'discount': ['Flat 15% Off on All Orders', 'Save 10% on bill above Rs 200', 'Flat Rs 50 Off on your first visit'],
        'bogo': ['Buy 1 Get 1 Free on special chat platters', 'BOGO on all pani puris', 'Buy any main plate and get a regular nimbu soda free'],
        'freebie': ['Free extra pav with any bhaji order', 'Get a free sweet lassi on bills above Rs 300', 'Free extra chutney & sev with any order'],
        'cashback': ['Get 10% cashback on UPI payments', 'Rs 20 cashback on review post', 'Cashback of 5% on billing above Rs 500']
      },
      'Quick bites': {
        'discount': ['Flat 20% Off on All Orders', 'Save 15% on bill above Rs 400', 'Flat Rs 80 Off on your first visit'],
        'bogo': ['Buy 1 Get 1 Free on Chicken/Paneer rolls', 'BOGO on all wraps and burgers', 'Buy any combo and get a regular beverage free'],
        'freebie': ['Free extra dips with any roll order', 'Get a free side of fries on bills above Rs 500', 'Free extra double egg layer with any roll'],
        'cashback': ['Get 10% cashback on UPI payments', 'Rs 30 cashback on review post', 'Cashback of 5% on billing above Rs 800']
      },
      'Desserts': {
        'discount': ['Flat 20% Off on All Desserts', 'Save 15% on bill above Rs 600', 'Flat Rs 100 Off on your first visit'],
        'bogo': ['Buy 1 Get 1 Free on ice cream scoops', 'BOGO on all waffles and pancakes', 'Buy any large cake and get a pastry free'],
        'freebie': ['Free extra chocolate sauce/toppings', 'Get a free cupcake on bills above Rs 500', 'Free hot chocolate shot with any waffle order'],
        'cashback': ['Get 10% cashback on UPI payments', 'Rs 40 cashback on review post', 'Cashback of 5% on billing above Rs 1000']
      },
      'Clothing': {
        'discount': ['Flat 20% Off on Premium Summer Wear', 'Save 15% on purchase above Rs 2000', 'Flat Rs 500 Off on your first purchase'],
        'bogo': ['Buy 1 Get 1 Free on selected t-shirts', 'BOGO on all unisex streetwear hoodies', 'Buy any denim jeans and get a graphic tee free'],
        'freebie': ['Free custom tote bag on bills above Rs 1500', 'Get a free belt on purchase of any trouser', 'Free custom keychain with any purchase'],
        'cashback': ['Get 10% cashback on UPI payments', 'Rs 200 cashback on Instagram haul tag', 'Cashback of 5% on billing above Rs 3000']
      },
      'Salon': {
        'discount': ['Flat 20% Off on Hair Spa & Styling Services', 'Save 15% on bill above Rs 1500', 'Flat Rs 300 Off on your first visit'],
        'bogo': ['Buy 1 Get 1 Free on Hair Spa & Scalp Massage', 'BOGO on cleanups and basic facials', 'Get a free trim with any hair color service'],
        'freebie': ['Free hair serum application after styling', 'Get a free basic manicure on bills above Rs 2000', 'Free head massage with any premium haircut'],
        'cashback': ['Get 10% cashback on UPI payments', 'Rs 150 cashback on Google Maps review', 'Cashback of 5% on billing above Rs 2500']
      },
      'Gym': {
        'discount': ['Flat 20% Off on Annual Memberships', 'Save 15% on 3-month personal training plans', 'Flat Rs 1000 Off on new admissions'],
        'bogo': ['Buy 1 Get 1 Free Month on couple admissions', 'BOGO on weekly group CrossFit classes', 'Get 1 free session with any fitness test'],
        'freebie': ['Free gym shaker bottle on admissions', 'Get a free diet consultation on joining', 'Free body fat analysis checkup'],
        'cashback': ['Get 10% cashback on UPI payments', 'Rs 500 cashback on referral admission', 'Cashback of 5% on annual plan payments']
      },
      'Home': {
        'discount': ['Flat 15% Off on All Furnitures', 'Save 10% on bills above Rs 5000', 'Flat Rs 1000 Off on your first order'],
        'bogo': ['Buy 1 Get 1 Free on custom throw pillows', 'BOGO on selected handcrafted candles', 'Buy any dining table and get 2 chairs free'],
        'freebie': ['Free wood polish spray with any furniture', 'Get a free wall painting on bills above Rs 10000', 'Free home decor catalog book'],
        'cashback': ['Get 10% cashback on UPI payments', 'Rs 300 cashback on review share', 'Cashback of 5% on billing above Rs 15000']
      },
      'Grocery': {
        'discount': ['Flat 10% Off on Organic Groceries', 'Save 5% on bill above Rs 1000', 'Flat Rs 100 Off on your first grocery list'],
        'bogo': ['Buy 1 Get 1 Free on organic honey/jams', 'BOGO on selected fresh farm juices', 'Buy any 5kg rice bag and get 1kg pulses free'],
        'freebie': ['Free eco-friendly cotton carry bag', 'Get free organic green tea on bills above Rs 1500', 'Free fresh coriander & mint bundle with any purchase'],
        'cashback': ['Get 10% cashback on UPI payments', 'Rs 50 cashback on review post', 'Cashback of 5% on billing above Rs 2000']
      }
    };

    const campaignImagesByType = {
      'Cafe': [
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&h=400&q=80'
      ],
      'Street food': [
        'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&h=400&q=80'
      ],
      'Tea': [
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1563887550-d7f3dbdf2000?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&h=400&q=80'
      ],
      'Desserts': [
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&h=400&q=80'
      ],
      'Quick bites': [
        'https://images.unsplash.com/photo-1626700051175-6518c4793fdf?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=600&h=400&q=80'
      ],
      'Clothing': [
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=600&h=400&q=80'
      ],
      'Salon': [
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&h=400&q=80'
      ],
      'Gym': [
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&h=400&q=80'
      ],
      'Home': [
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&h=400&q=80'
      ],
      'Grocery': [
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&h=400&q=80',
        'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&h=400&q=80'
      ]
    };

    const campaignsList = [];
    const campaignCreatorsList = [];
    const qrCodesList = [];

    // 1. Generate 1 Campaign per Business
    const specificCampaignImages = {
      'Cafe Shivam': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&h=400&q=80',
      'Poha Corner': 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&h=400&q=80',
      'Chai Adda': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&h=400&q=80',
      'The Chai Factory': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&h=400&q=80',
      'Indori Tadka': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&h=400&q=80',
      'Style Lounge Salon': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&h=400&q=80',
      'Trendz Boutique': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&h=400&q=80',
      'Mithai Palace': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&h=400&q=80',
      'Rolls Route': 'https://images.unsplash.com/photo-1626700051175-6518c4793fdf?auto=format&fit=crop&w=600&h=400&q=80'
    };

    for (let i = 0; i < businesses.length; i++) {
      const b = businesses[i];
      const type = campaignTypes[i % campaignTypes.length];
      
      const categoryOffers = offersByType[b.business_type] || offersByType['Cafe'];
      const offersList = categoryOffers[type] || categoryOffers['discount'];
      const offer = offersList[i % offersList.length];

      const commType = i % 2 === 0 ? 'fixed' : 'percentage';
      const commVal = commType === 'fixed' ? 80.00 : 10.00; // Rs 80 or 10%

      let imageUrl = specificCampaignImages[b.business_name];
      if (!imageUrl) {
        const images = campaignImagesByType[b.business_type] || campaignImagesByType['Cafe'];
        imageUrl = images[i % images.length];
      }

      const campaignRes = await client.query(
        `INSERT INTO campaigns (business_id, name, description, campaign_type, offer_details, image_url, commission_type, commission_value, total_budget, spent_budget, lat, lng, radius_km, valid_from, valid_till, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 10000.00, 0, $9, $10, 5, CURRENT_DATE - 30, CURRENT_DATE + 30, 'active')
         RETURNING *`,
        [b.user_id, `${b.business_name} Promo`, `Join ${b.business_name} for this exclusive offer!`, type, offer, imageUrl, commType, commVal, b.lat, b.lng]
      );
      campaignsList.push(campaignRes.rows[0]);
    }
    console.log(`Created ${campaignsList.length} campaigns.`);

    // 2. Creators join campaigns from their own city
    for (const c of creators) {
      // Find campaigns in the same city
      const cityCampaigns = campaignsList.filter(camp => {
        const biz = businesses.find(b => b.user_id === camp.business_id);
        return biz && biz.city === c.city;
      });

      // Join 2 campaigns randomly
      const joined = cityCampaigns.sort(() => 0.5 - Math.random()).slice(0, 2);
      for (const camp of joined) {
        await client.query(
          `INSERT INTO campaign_creators (campaign_id, creator_id) VALUES ($1, $2)`,
          [camp.id, c.user_id]
        );
        campaignCreatorsList.push({ campaign_id: camp.id, creator_id: c.user_id });

        const qrToken = `qr_${c.name.toLowerCase().replace(/\s+/g, '')}_${camp.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const qrLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/c/${qrToken}`;
        const scans = Math.floor(Math.random() * 200) + 100;
        const claims = Math.floor(scans * (Math.random() * 0.3 + 0.1)); // 10% to 40% claim rate

        const qrRes = await client.query(
          `INSERT INTO qr_codes (campaign_id, creator_id, qr_token, qr_link, scan_count, claim_count)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [camp.id, c.user_id, qrToken, qrLink, scans, claims]
        );
        qrCodesList.push(qrRes.rows[0]);
      }
    }
    console.log(`Seeded QR codes and joined campaigns for creators.`);

    // 3. Generate Redemptions and Earnings
    let redemptionCounter = 1;
    const redemptions = [];
    const earnings = [];

    for (const qr of qrCodesList) {
      const campaign = campaignsList.find(camp => camp.id === qr.campaign_id);
      const creator = creators.find(cr => cr.user_id === qr.creator_id);

      // Generate 8 to 22 redemptions per QR
      const redCount = Math.floor(Math.random() * 15) + 8;
      const claimCount = qr.claim_count;

      for (let j = 0; j < Math.min(redCount, claimCount); j++) {
        const code = `RD${String(redemptionCounter).padStart(6, '0')}`;
        redemptionCounter++;

        const customer = indianNames[Math.floor(Math.random() * indianNames.length)];
        const phone = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];

        // Spread claimed_at over the last 90 days
        const daysAgo = Math.random() * 90;
        const claimedAt = new Date();
        claimedAt.setDate(claimedAt.getDate() - daysAgo);

        // Status: 80% confirmed, 10% claimed, 10% reversed
        const rand = Math.random();
        let status = 'confirmed';
        if (rand < 0.1) status = 'claimed';
        else if (rand < 0.2) status = 'reversed';

        let confirmedAt = null;
        let billAmount = null;
        let commissionAmount = null;
        let confirmLat = null;
        let confirmLng = null;
        let geoVerified = false;
        let geoDistance = null;

        const claimLat = parseFloat(campaign.lat) + (Math.random() - 0.5) * 0.002;
        const claimLng = parseFloat(campaign.lng) + (Math.random() - 0.5) * 0.002;

        if (status === 'confirmed' || status === 'reversed') {
          confirmedAt = new Date(claimedAt.getTime() + (Math.random() * 60 + 5) * 60000);
          billAmount = parseFloat((Math.random() * 1200 + 300).toFixed(2));

          if (campaign.commission_type === 'fixed') {
            commissionAmount = parseFloat(campaign.commission_value);
          } else {
            commissionAmount = parseFloat((billAmount * (parseFloat(campaign.commission_value) / 100)).toFixed(2));
          }

          // 95% of confirmed scans are within 200m
          const distanceZone = Math.random();
          if (distanceZone < 0.95) {
            confirmLat = parseFloat(campaign.lat) + (Math.random() - 0.5) * 0.001;
            confirmLng = parseFloat(campaign.lng) + (Math.random() - 0.5) * 0.001;
            geoVerified = true;
            geoDistance = parseFloat((Math.random() * 120 + 10).toFixed(2));
          } else {
            // buffer zone
            confirmLat = parseFloat(campaign.lat) + (Math.random() - 0.5) * 0.004;
            confirmLng = parseFloat(campaign.lng) + (Math.random() - 0.5) * 0.004;
            geoVerified = false;
            geoDistance = parseFloat((Math.random() * 300 + 200).toFixed(2));
          }
        }

        const redRes = await client.query(
          `INSERT INTO redemptions (redemption_code, campaign_id, creator_id, qr_id, customer_name, customer_phone, device_fingerprint, status, claim_lat, claim_lng, claim_accuracy, confirm_lat, confirm_lng, confirm_accuracy, geo_distance_m, geo_verified, claimed_at, confirmed_at, bill_amount, commission_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 10.00, $11, $12, 10.00, $13, $14, $15, $16, $17, $18)
           RETURNING *`,
          [code, campaign.id, creator.user_id, qr.id, customer, phone, `fp_${Math.floor(Math.random() * 900000 + 100000)}_browser`, status, claimLat, claimLng, confirmLat, confirmLng, geoDistance, geoVerified, claimedAt, confirmedAt, billAmount, commissionAmount]
        );
        const redemption = redRes.rows[0];
        redemptions.push(redemption);

        // Earnings (Only for confirmed / reversed)
        if (status === 'confirmed' || status === 'reversed') {
          let earnStatus = status === 'reversed' ? 'reversed' : 'available';

          // If confirmed_at is less than 48 hours ago, status is 'pending'
          const holdHoursAgo = new Date();
          holdHoursAgo.setHours(holdHoursAgo.getHours() - 48);
          if (status === 'confirmed' && confirmedAt > holdHoursAgo) {
            earnStatus = 'pending';
          }

          const availableAt = new Date(confirmedAt.getTime() + 48 * 60 * 60 * 1000);

          const earnRes = await client.query(
            `INSERT INTO earnings (redemption_id, creator_id, campaign_id, amount, status, available_at, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [redemption.id, creator.user_id, campaign.id, commissionAmount, earnStatus, availableAt, confirmedAt]
          );
          earnings.push(earnRes.rows[0]);
        }
      }
    }
    console.log(`Created ${redemptions.length} redemptions and ${earnings.length} earnings rows.`);

    // 4. Generate Payouts for Creators
    // Select creators who have available earnings and request a payout
    for (const c of creators) {
      const creatorEarnings = earnings.filter(e => e.creator_id === c.user_id && e.status === 'available');
      if (creatorEarnings.length >= 3) {
        // Payout some available earnings
        const payAmount = creatorEarnings.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

        const payoutRes = await client.query(
          `INSERT INTO payouts (creator_id, amount, status, utr_number, payout_method, upi_id, requested_at, processed_at, paid_at)
           VALUES ($1, $2, 'paid', $3, 'upi', $4, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
           RETURNING id`,
          [c.user_id, payAmount, `UTR${Math.floor(Math.random() * 90000000000 + 10000000000)}`, `${c.name.toLowerCase().replace(/\s+/g, '')}@okaxis`]
        );
        const payoutId = payoutRes.rows[0].id;

        // Update the earnings to paid
        const ids = creatorEarnings.map(e => e.id);
        await client.query(
          `UPDATE earnings SET status = 'paid', payout_id = $1, paid_at = NOW() - INTERVAL '2 days' WHERE id = ANY($2)`,
          [payoutId, ids]
        );
      }
    }
    console.log('Processed mock payouts.');

    // 5. Generate a few Disputes
    // Pick 3 confirmed redemptions/earnings and raise disputes
    const eligibleEarnings = earnings.filter(e => e.status === 'pending' || e.status === 'available');
    const disputeCount = Math.min(3, eligibleEarnings.length);
    for (let i = 0; i < disputeCount; i++) {
      const earn = eligibleEarnings[i];
      const businessId = campaignsList.find(camp => camp.id === earn.campaign_id).business_id;

      await client.query(
        `INSERT INTO disputes (redemption_id, earning_id, business_id, reason, status, filed_at)
         VALUES ($1, $2, $3, $4, 'open', NOW() - INTERVAL '12 hours')`,
        [earn.redemption_id, earn.id, businessId, 'Customer claimed but did not complete minimum checkout requirements.']
      );

      // Freeze earning
      await client.query(
        `UPDATE earnings SET status = 'disputed' WHERE id = $1`,
        [earn.id]
      );
    }
    console.log(`Raised ${disputeCount} open disputes.`);

    // 6. Update Creator Profile Stats (denormalized earnings fields)
    for (const c of creators) {
      const totalEarned = earnings
        .filter(e => e.creator_id === c.user_id && e.status !== 'reversed')
        .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

      const totalPaid = earnings
        .filter(e => e.creator_id === c.user_id && e.status === 'paid')
        .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

      const pendingPay = earnings
        .filter(e => e.creator_id === c.user_id && e.status === 'available')
        .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

      await client.query(
        `UPDATE creator_profiles
         SET total_earnings = $1, total_paid = $2, pending_payout = $3
         WHERE user_id = $4`,
        [totalEarned, totalPaid, pendingPay, c.user_id]
      );
    }
    console.log('Updated creator profile stats.');

    // 7. Update Campaign cumulative stats
    for (const camp of campaignsList) {
      const campQrs = qrCodesList.filter(qr => qr.campaign_id === camp.id);
      const totalViews = campQrs.reduce((acc, curr) => acc + curr.scan_count, 0);
      const totalClaims = campQrs.reduce((acc, curr) => acc + curr.claim_count, 0);

      const campReds = redemptions.filter(r => r.campaign_id === camp.id && r.status === 'confirmed');
      const totalRedemptionsVal = campReds.length;
      const totalRevenue = campReds.reduce((acc, curr) => acc + parseFloat(curr.bill_amount || 0), 0);
      const spentBudget = campReds.reduce((acc, curr) => acc + parseFloat(curr.commission_amount || 0), 0);

      await client.query(
        `UPDATE campaigns
         SET total_views = $1, total_claims = $2, total_redemptions = $3, total_revenue = $4, spent_budget = $5
         WHERE id = $6`,
        [totalViews, totalClaims, totalRedemptionsVal, totalRevenue, spentBudget, camp.id]
      );
    }
    console.log('Updated campaign cumulative stats.');

    await client.query('COMMIT');
    console.log('✅ All data integrated and live activity seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error integrating data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
