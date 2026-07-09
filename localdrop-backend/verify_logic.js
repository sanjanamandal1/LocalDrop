module.paths.push('c:/Users/Sanjana/Desktop/hack/hack/localdrop-backend/node_modules');
const path = require('path');
require('dotenv').config({ path: 'c:/Users/Sanjana/Desktop/hack/hack/localdrop-backend/.env' });

const { query } = require('c:/Users/Sanjana/Desktop/hack/hack/localdrop-backend/src/db/pool.js');
const { haversineDistanceMeters, haversineDistanceKm } = require('c:/Users/Sanjana/Desktop/hack/hack/localdrop-backend/src/utils/geoUtils.js');

async function testGeofence() {
  console.log('--- GEOFENCE TEST ---');
  // Cafe Shivam in Vijay Nagar
  const campLat = 22.7533;
  const campLng = 75.8937;
  
  // 1. Point within 100m (should be verified & clean)
  const userLat1 = 22.7535;
  const userLng1 = 75.8940;
  const dist1 = haversineDistanceMeters(userLat1, userLng1, campLat, campLng);
  console.log(`Point 1 (100m limit): Distance = ${dist1.toFixed(1)}m. Geofence zone: ${dist1 <= 200 ? 'Inside (0-200m)' : dist1 <= 500 ? 'Buffer (200-500m)' : 'Outside (>500m)'}`);
  
  // 2. Point within 350m (should be buffer/held)
  const userLat2 = 22.7555;
  const userLng2 = 75.8960;
  const dist2 = haversineDistanceMeters(userLat2, userLng2, campLat, campLng);
  console.log(`Point 2 (350m limit): Distance = ${dist2.toFixed(1)}m. Geofence zone: ${dist2 <= 200 ? 'Inside (0-200m)' : dist2 <= 500 ? 'Buffer (200-500m)' : 'Outside (>500m)'}`);
  
  // 3. Point outside 600m (should be rejected)
  const userLat3 = 22.7600;
  const userLng3 = 75.8990;
  const dist3 = haversineDistanceMeters(userLat3, userLng3, campLat, campLng);
  console.log(`Point 3 (600m limit): Distance = ${dist3.toFixed(1)}m. Geofence zone: ${dist3 <= 200 ? 'Inside (0-200m)' : dist3 <= 500 ? 'Buffer (200-500m)' : 'Outside (>500m)'}`);
}

async function testAIMatching() {
  console.log('\n--- AI MATCHING ENGINE SIMULATION ---');
  // Fetch Meera Sharma
  const creatorRes = await query("SELECT user_id, name, niche FROM creator_profiles WHERE name = 'Meera Sharma'");
  if (creatorRes.rows.length === 0) {
    console.error('Creator Meera Sharma not found!');
    return;
  }
  const creator = creatorRes.rows[0];
  console.log(`Creator: ${creator.name} (${creator.niche})`);

  // Query her matches using our matching logic
  const clustersRes = await query("SELECT area_name, lat, lng, weight_pct FROM audience_clusters WHERE creator_id = $1", [creator.user_id]);
  const clusters = clustersRes.rows.map(c => ({
    name: c.area_name,
    lat: parseFloat(c.lat),
    lng: parseFloat(c.lng),
    weight: parseInt(c.weight_pct, 10)
  }));
  console.log('Clusters:', clusters);

  const businessesRes = await query(`
    SELECT bp.user_id AS business_id, bp.business_name, bp.business_type, 
           bp.address, bp.lat, bp.lng,
           COALESCE(SUM(c.total_redemptions), 0)::integer AS redemptions
    FROM business_profiles bp
    LEFT JOIN campaigns c ON c.business_id = bp.user_id
    GROUP BY bp.user_id, bp.business_name, bp.business_type, bp.address, bp.lat, bp.lng
  `);
  const businesses = businessesRes.rows;

  const similarities = {
    'Indore food blogger': { 'Cafe': 0.95, 'Street food': 0.90, 'Desserts': 0.85, 'Tea': 0.80, 'Quick bites': 0.75, 'Home': 0.10 }
  };

  const matches = [];
  for (const b of businesses) {
    const bLat = parseFloat(b.lat);
    const bLng = parseFloat(b.lng);

    // 1. Geo score
    let geoScoreRaw = 0;
    let minDistance = Infinity;
    for (const cl of clusters) {
      const d = haversineDistanceKm(cl.lat, cl.lng, bLat, bLng);
      if (d < minDistance) minDistance = d;
      const closeness = Math.max(0, 1 - (d / 5.0));
      geoScoreRaw += closeness * (cl.weight / 100);
    }
    const geoScore = Math.min(100, Math.round(geoScoreRaw * 100));

    // 2. Content alignment
    const sim = similarities[creator.niche]?.[b.business_type] || 0.20;
    const contentScore = Math.round(sim * 100);

    // 3. Conversion score
    const conversionScore = Math.min(100, (b.redemptions * 5) + 30);

    // 4. Affinity score (keyword overlap)
    const creatorWords = new Set(`${creator.niche}`.toLowerCase().match(/\w+/g) || []);
    const bizWords = new Set(`${b.business_name} ${b.business_type}`.toLowerCase().match(/\w+/g) || []);
    let overlapCount = 0;
    for (const w of creatorWords) {
      if (bizWords.has(w)) overlapCount++;
    }
    const affinityScore = Math.min(100, overlapCount * 20 + 40);

    // Composite
    const score = Math.round(
      geoScore * 0.35 +
      contentScore * 0.30 +
      conversionScore * 0.25 +
      affinityScore * 0.10
    );

    matches.push({
      name: b.business_name,
      category: b.business_type,
      score: score,
      distance: `${minDistance.toFixed(2)} km`,
      signals: { geoScore, contentScore, conversionScore, affinityScore }
    });
  }

  matches.sort((a, b) => b.score - a.score);
  console.table(matches);
}

async function run() {
  try {
    await testGeofence();
    await testAIMatching();
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
