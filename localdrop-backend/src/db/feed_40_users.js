// src/db/feed_40_users.js
'use strict';

require('dotenv').config();
const { pool } = require('./pool');

const PASSWORD_HASH = '$2a$10$SxDMsXvClRADvY.x1DmxGenoWNJWSg3JLX8TgPw7PYkVBrv7iyWla'; // password123

const creators = [
  // Original Indore Creators (3)
  { name: 'Meera Sharma', email: 'meera@localdrop.com', niche: 'Indore food blogger', bio: 'Food lover exploring the tastes of Indore! I review local dhabas, street food, and cafes.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577, profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80' },
  { name: 'Arjun Verma', email: 'arjun@localdrop.com', niche: 'Streetwear creator', bio: 'Fashion enthusiast bringing Tier-2 India the best in local and national streetwear trends.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577, profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80' },
  { name: 'Isha Jain', email: 'isha@localdrop.com', niche: 'Cafe and experiences', bio: 'Discovering aesthetic spaces and cool weekend experiences in Indore.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577, profile_photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80' },

  // Indore (7)
  { name: 'Kabir Joshi', niche: 'Indore Food Reviewer', bio: 'Exploring the best street food and fine dining in Indore.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577, profile_photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80' },
  { name: 'Riya Sen', niche: 'Fashion & Lifestyle', bio: 'Sharing daily style inspiration and lifestyle hacks from Indore.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577, profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' },
  { name: 'Aarav Patel', niche: 'Travel Filmmaker', bio: 'Capturing the unseen spots around Central India and beyond.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577, profile_photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80' },
  { name: 'Ananya Mishra', niche: 'Fitness & Yoga Coach', bio: 'Helping Indoris achieve their health and wellness goals.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577, profile_photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80' },
  { name: 'Rohan Malhotra', niche: 'Tech & Gadgets', bio: 'Unboxing and reviewing the latest tech products.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577, profile_photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80' },
  { name: 'Divya Nair', niche: 'Beauty & Makeup Artist', bio: 'Glam tips, tutorials, and skincare reviews.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Arjun Singhal', niche: 'Comedy & Vlogs', bio: 'Creating relatable comedy sketches and daily vlogs.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },

  // Kolkata (7)
  { name: 'Sneha Reddy', niche: 'Kolkata Food Blogger', bio: 'Fascinated by Kolkata street food, puchkas, and sweet shops.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639, profile_photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80' },
  { name: 'Aditya Rao', niche: 'Kolkata Explorer', bio: 'Sharing stories, history, and heritage sites of Kolkata.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Tanvi Kapoor', niche: 'Lifestyle & Travel', bio: 'Travel diaries and budget travel guides from Kolkata.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Ishaan Gupta', niche: 'Aesthetic Cafes', bio: 'Hunting down the most aesthetic spaces and cafes in Kolkata.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Pooja Sharma', niche: 'Fashion & Saree Styling', bio: 'Saree styling tips and ethnic wear inspiration from Kolkata.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Varun Verma', niche: 'Street Photography', bio: 'Capturing everyday moments on the busy streets of Kolkata.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Kavya Jain', niche: 'Home Decor & Plants', bio: 'DIY home interior decoration and urban gardening blogger.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },

  // Delhi (6)
  { name: 'Yash Mehta', niche: 'Delhi Street Food', bio: 'Finding the spiciest momos and best chole bhature in Delhi.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025, profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80' },
  { name: 'Ritu Aggarwal', niche: 'Tech & Gaming vlogger', bio: 'Unboxing gaming setups and mobile tech reviews from Delhi.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Siddharth Roy', niche: 'Indie Musician', bio: 'Singer-songwriter performing acoustic covers across Delhi NCR.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Neha Saxena', niche: 'Delhi Fashion Trends', bio: 'Sarojini Nagar hauls and thrift fashion styling hacks.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Akash Trivedi', niche: 'Fitness & Bodybuilding', bio: 'Daily workout splits, dieting, and gym motivation in Delhi.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Simran Gill', niche: 'Travel Vlogger', bio: 'Weekend getaways from Delhi to the Himalayas.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },

  // Extra 20 Creators (distributed)
  { name: 'Amit Patel', niche: 'Indore Street Food vlogger', bio: 'Hunting for the best dhabas and street food in Indore.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Simran Kaur', niche: 'Delhi Fashion & Hauls', bio: 'Bringing you the latest clothing styles and budget thrift updates from Delhi.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Deepak Pillai', niche: 'Kolkata Art & Culture', bio: 'Highlighting the rich heritage, museums, and galleries in Kolkata.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Swati Bhatt', niche: 'Delhi Food Explorer', bio: 'Indulging in street food, cafes, and fine dining hotspots around Delhi NCR.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Saurabh Tiwari', niche: 'Indore Fitness Coach', bio: 'Daily workouts, diets, and fitness splits for healthy living.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Lavanya Subramaniam', niche: 'Kolkata Book Blogger', bio: 'Book reviews, recommendations, and libraries in Kolkata.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Vinay Kulkarni', niche: 'Indore Tech & Gadgets', bio: 'Reviewing smart devices, gaming consoles, and mobile tech.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Preeti Saxena', niche: 'Delhi Travel Photographer', bio: 'Capturing the architectural monuments and vibrant culture of Delhi.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Harsh Goyal', niche: 'Kolkata Cafe Reviewer', bio: 'Finding the best coffee and workspace cafes in Kolkata.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Shweta Dixit', niche: 'Indore Beauty & Makeup', bio: 'Easy makeup tutorials, skincare routines, and beauty tips.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Pranav Doshi', niche: 'Delhi Standup Comedy', bio: 'Sharing funny sketches and daily lifestyle vlogs from Delhi.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Shreya Naik', niche: 'Kolkata Home Decor & DIY', bio: 'Budget home makeovers, aesthetic plants, and decor styling.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Tushar Jain', niche: 'Indore Auto & Biking', bio: 'Motorcycle enthusiast exploring scenic routes around MP.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Vandana Yadav', niche: 'Delhi Healthy Recipes', bio: 'Simple, nutritious vegetarian recipes for busy people.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Akash Bansal', niche: 'Kolkata Indie Music', bio: 'Performing acoustic covers and sharing behind-the-scenes music production.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Pallavi Venkatesh', niche: 'Indore Parenting & Vlogs', bio: 'My daily motherhood journey and family lifestyle tips.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Vivek Sharma', niche: 'Delhi Sneakerhead', bio: 'Reviewing shoes, streetwear drops, and local clothing stores.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Charu Agrawal', niche: 'Kolkata Street Art & Vlogs', bio: 'Exploring local graffiti, events, and subcultures in Kolkata.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Mohit Rawat', niche: 'Indore Gaming Streams', bio: 'Live streaming esports, gaming reviews, and setup tours.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Richa Pandey', niche: 'Delhi Outdoor Yoga', bio: 'Teaching yoga, mental health wellness, and meditation in Delhi parks.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 }
];

const businesses = [
  // Original Indore Businesses (6)
  { name: 'Cafe Shivam', email: 'shivam@cafe.com', type: 'Cafe', description: 'Cozy place in Vijay Nagar known for great conversations and delicious coffee.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7533, baseLng: 75.8937, logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=150&h=150&q=80', cover_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&h=400&q=80' },
  { name: 'Poha Corner', email: 'poha@streetfood.com', type: 'Street food', description: 'Authentic Indori Poha and Jalebi since 1998.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7156, baseLng: 75.8537, logo_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=150&h=150&q=80', cover_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=800&h=400&q=80' },
  { name: 'Mithai Palace', email: 'mithai@desserts.com', type: 'Desserts', description: 'Traditional Indian sweets made with pure ghee and lots of love.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7233, baseLng: 75.8787, logo_url: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=150&h=150&q=80', cover_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&h=400&q=80' },
  { name: 'Chai Adda', email: 'chai@adda.com', type: 'Tea', description: 'Indore\'s favorite hangout spot for hot kulhad masala chai.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7512, baseLng: 75.8899, logo_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=150&h=150&q=80', cover_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&h=400&q=80' },
  { name: 'Rolls Route', email: 'rolls@route.com', type: 'Quick bites', description: 'Fast, fresh, and filling rolls and wraps for people on the move.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7485, baseLng: 75.8955, logo_url: 'https://images.unsplash.com/photo-1626700051175-6518c4793fdf?auto=format&fit=crop&w=150&h=150&q=80', cover_url: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=800&h=400&q=80' },
  { name: 'Furniture Hub', email: 'furniture@hub.com', type: 'Home', description: 'Premium wooden furniture and home decor products.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7588, baseLng: 75.8912 },

  // Indore (7)
  { name: 'The Chai Factory', type: 'Tea', description: 'Indore\'s ultimate hub for tea lovers. Offering 20+ varieties of hot tea.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577, logo_url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=150&h=150&q=80', cover_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&h=400&q=80' },
  { name: 'Indori Tadka', type: 'Street food', description: 'Authentic local Indore delicacies with the perfect spicy tadka.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577, logo_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=150&h=150&q=80', cover_url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&h=400&q=80' },
  { name: 'Sweet Delights', type: 'Desserts', description: 'Your destination for premium cakes, pastries, and traditional sweets.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Trendz Boutique', type: 'Clothing', description: 'Curated collection of modern and ethnic outfits for every occasion.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577, logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=150&h=150&q=80', cover_url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=800&h=400&q=80' },
  { name: 'Iron Gym & Fitness', type: 'Gym', description: 'State-of-the-art gym with certified trainers and premium equipment.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Glitz & Glam Salon', type: 'Salon', description: 'Professional hair, makeup, and beauty services for men and women.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Organic Grocers', type: 'Grocery', description: 'Fresh, organic, and locally sourced vegetables and groceries.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },

  // Kolkata (7)
  { name: 'Cafe Mocha', type: 'Cafe', description: 'An aesthetic space for great coffee, delicious snacks, and working in Kolkata.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Mom\'s Kitchen', type: 'Quick bites', description: 'Homestyle meals and quick bites prepared with love and hygiene.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'The Dessert Bar', type: 'Desserts', description: 'Satisfy your sweet tooth with our unique waffles, pancakes, and sundaes.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Active Wear Hub', type: 'Clothing', description: 'Premium sports and gym apparel to keep you comfortable and stylish.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Book Nest Cafe', type: 'Cafe', description: 'A quiet cafe for book lovers. Grab a cup of coffee and read in peace.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Spice Symphony', type: 'Street food', description: 'Delicious street food and tandoori starters with rich flavors.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Green Leaf Cafe', type: 'Cafe', description: 'Serving healthy, vegan, and vegetarian food choices in a peaceful setting.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },

  // Delhi (6)
  { name: 'Elite Gym Delhi', type: 'Gym', description: 'Modern fitness center offering CrossFit, weightlifting, and cardio classes.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Style Lounge Salon', type: 'Salon', description: 'Transform your look with our professional salon and styling services.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025, logo_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=150&h=150&q=80', cover_url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&h=400&q=80' },
  { name: 'Daily Fresh Mart', type: 'Grocery', description: 'Your daily supermarket for groceries, dairy, and household essentials.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Brew & Bites Cafe', type: 'Cafe', description: 'Freshly brewed coffee, artisanal breads, and custom sandwiches.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Royal Sweets Delhi', type: 'Desserts', description: 'Legacy sweet shop famous for pure ghee Indian sweets and dry fruit boxes.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'The Craft Shop Delhi', type: 'Home', description: 'Handmade home decor products, candles, and custom gifts.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },

  // Extra 20 Businesses (distributed)
  { name: 'Indore Bakers', type: 'Desserts', description: 'Baking fresh artisanal breads, custom cakes, and cookies daily.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Delhi Dosa Express', type: 'Street food', description: 'Crispy South Indian dosas and hot filter coffee in Delhi.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Kolkata Biryani Zone', type: 'Quick bites', description: 'Legendary Kolkata-style chicken and mutton biryani with potato.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Indore Fitness Hub', type: 'Gym', description: 'Modern gym facility featuring weight training, cardio, and Zumba.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Delhi Glam Salon', type: 'Salon', description: 'Premium haircuts, hair spas, and beauty makeovers.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Kolkata Fresh Mart', type: 'Grocery', description: 'Local supermarket offering organic fresh produce and daily essentials.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Indore Mocha Cafe', type: 'Cafe', description: 'Brewing specialty coffee, iced lattes, and customized sandwiches.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Delhi Tandoori Nights', type: 'Quick bites', description: 'Rich tandoori platters, kebabs, and butter chicken roll.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Kolkata Sweet Castle', type: 'Desserts', description: 'Famous sweet parlour making rasgullas, sandesh, and mishti doi.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Indore Denim Studio', type: 'Clothing', description: 'Trendy custom jeans, jackets, and streetwear clothing store.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Delhi Book Hub Cafe', type: 'Cafe', description: 'Cozy library cafe offering books, filter tea, and snacks.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Kolkata Spice Route', type: 'Street food', description: 'Authentic street food, rolls, and cutlets of Kolkata.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Indore Wellness Spa', type: 'Salon', description: 'Relaxing massage therapy and body treatment services.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Delhi Daily Grocer', type: 'Grocery', description: 'Your neighborhood grocery mart for daily household goods.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Kolkata Brew House', type: 'Cafe', description: 'Chilled coolers, hand-drip coffee, and warm croissant.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Indore Gym Legends', type: 'Gym', description: 'CrossFit, powerlifting training center with top equipment.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Delhi Sweet Palace', type: 'Desserts', description: 'Traditional halwas, kaju katli, and pure milk sweets.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 },
  { name: 'Kolkata Craft Hub', type: 'Home', description: 'Beautiful handcrafted local furniture and home decor items.', city: 'Kolkata', state: 'West Bengal', baseLat: 22.5726, baseLng: 88.3639 },
  { name: 'Indore Food Station', type: 'Quick bites', description: 'Burgers, wraps, and french fries for quick takeaways.', city: 'Indore', state: 'Madhya Pradesh', baseLat: 22.7196, baseLng: 75.8577 },
  { name: 'Delhi Trendz Wear', type: 'Clothing', description: 'Fashionable summer and winter clothing for men and women.', city: 'Delhi', state: 'Delhi', baseLat: 28.7041, baseLng: 77.1025 }
];

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

function getCityCoordinates(baseLat, baseLng) {
  const latOffset = (Math.random() - 0.5) * 0.05; 
  const lngOffset = (Math.random() - 0.5) * 0.05;
  return { lat: baseLat + latOffset, lng: baseLng + lngOffset };
}

async function run() {
  const client = await pool.connect();
  try {
    console.log('Resetting and seeding database for Indore, Kolkata, and Delhi...');
    await client.query('BEGIN');

    // Truncate tables to clean the slate
    await client.query(`
      TRUNCATE TABLE 
      users, creator_profiles, business_profiles, campaigns, 
      campaign_creators, qr_codes, redemptions, earnings, payouts, disputes, audience_clusters
      RESTART IDENTITY CASCADE
    `);

    // 1. Insert Creators
    for (let i = 0; i < creators.length; i++) {
      const c = creators[i];
      const email = c.email || `${c.name.toLowerCase().replace(/\s+/g, '.')}@localdrop.com`;
      const coords = getCityCoordinates(c.baseLat, c.baseLng);

      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, role, is_active, is_verified)
         VALUES ($1, $2, 'creator', true, true)
         RETURNING id`,
        [email, PASSWORD_HASH]
      );
      const userId = userRes.rows[0].id;

      await client.query(
        `INSERT INTO creator_profiles (user_id, name, niche, bio, city, state, lat, lng, total_earnings, total_paid, pending_payout, profile_photo_url, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, $9, $10)`,
        [userId, c.name, c.niche, c.bio, c.city, c.state, coords.lat, coords.lng, c.profile_photo_url || null, c.profile_photo_url || null]
      );

      // Add city-specific audience clusters
      const cityLocs = cityAreas[c.city];
      const shuffledAreas = [...cityLocs].sort(() => 0.5 - Math.random());
      const selectedAreas = shuffledAreas.slice(0, 3);
      const weights = [50, 30, 20];

      for (let j = 0; j < selectedAreas.length; j++) {
        const area = selectedAreas[j];
        const clusterLat = area.lat + (Math.random() - 0.5) * 0.01;
        const clusterLng = area.lng + (Math.random() - 0.5) * 0.01;
        await client.query(
          `INSERT INTO audience_clusters (creator_id, area_name, lat, lng, weight_pct)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, area.name, clusterLat, clusterLng, weights[j]]
        );
      }
    }

    // 2. Insert Businesses
    const businessMap = {};
    for (let i = 0; i < businesses.length; i++) {
      const b = businesses[i];
      const email = b.email || `${b.name.toLowerCase().replace(/['\s]+/g, '.')}@business.com`;
      const coords = getCityCoordinates(b.baseLat, b.baseLng);

      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, role, is_active, is_verified)
         VALUES ($1, $2, 'business', true, true)
         RETURNING id`,
        [email, PASSWORD_HASH]
      );
      const userId = userRes.rows[0].id;

      await client.query(
        `INSERT INTO business_profiles (user_id, business_name, business_type, description, address, city, state, lat, lng, is_verified, logo_url, profile_photo_url, cover_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12)`,
        [userId, b.name, b.type, b.description, `${b.name}, ${b.city}`, b.city, b.state, coords.lat, coords.lng, b.logo_url || null, b.logo_url || null, b.cover_url || null]
      );

      if (!businessMap[b.city]) {
        businessMap[b.city] = [];
      }
      businessMap[b.city].push({ id: userId, ...b, lat: coords.lat, lng: coords.lng });
    }

    await client.query('COMMIT');
    console.log('✅ Base users successfully updated for Indore, Kolkata, and Delhi!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
