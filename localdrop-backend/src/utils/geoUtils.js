// src/utils/geoUtils.js — Haversine geo calculations
'use strict';

const EARTH_RADIUS_KM = 6371;

/**
 * Compute the distance in kilometers between two lat/lng points.
 */
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Return distance in meters.
 */
function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  return haversineDistanceKm(lat1, lng1, lat2, lng2) * 1000;
}

/**
 * Verify that a point (userLat, userLng) is within radiusKm of (campLat, campLng).
 * Buffer: we allow 200m extra to tolerate GPS imprecision.
 */
function isWithinRadius(userLat, userLng, campLat, campLng, radiusKm) {
  const distKm = haversineDistanceKm(userLat, userLng, campLat, campLng);
  const bufferKm = 0.2; // 200m GPS buffer
  return distKm <= radiusKm + bufferKm;
}

/**
 * Raw SQL clause to select campaigns within radius (Haversine in SQL).
 * Returns { sql, params } to append to a WHERE clause.
 */
function buildGeoRadiusSQL(lat, lng, radiusKm, latCol = 'lat', lngCol = 'lng', paramOffset = 0) {
  const sql = `
    (
      6371 * acos(
        LEAST(1.0, cos(radians($${paramOffset + 1})) * cos(radians(${latCol}))
        * cos(radians(${lngCol}) - radians($${paramOffset + 2}))
        + sin(radians($${paramOffset + 1})) * sin(radians(${latCol})))
      )
    ) <= $${paramOffset + 3}
  `;
  return { sql, params: [lat, lng, radiusKm] };
}

module.exports = { haversineDistanceKm, haversineDistanceMeters, isWithinRadius, buildGeoRadiusSQL };
