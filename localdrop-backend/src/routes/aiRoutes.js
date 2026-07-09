// src/routes/aiRoutes.js — AI assistant chat backend
'use strict';

const { Router } = require('express');
const logger = require('../utils/logger');

const router = Router();

// Cute system prompts based on page pathname
function getSystemInstruction(pathname) {
  let context = "You are Droppy, a super cute, friendly, bubbly, and helpful AI assistant for LocalDrop! 🐱🌸 Use emojis (like 🌸, 🐱, ✨, 💖, 🐾, 📈, 💰) and sound super cheerful and enthusiastic! Keep your responses relatively short, sweet, and easy to read. " +
    "Be very helpful and answer questions correctly based on these LocalDrop platform facts:\n" +
    "- Matching / Match Score: Matches creators with local businesses by comparing follower audience clusters with the business location. A higher score means better audience overlap.\n" +
    "- Predictive Footfall AI: Estimates potential walk-ins and revenue a creator can bring based on match score and business category.\n" +
    "- Payouts / Holds: Earnings have a 48-hour safety hold after redemption to prevent fraud, then they become Available for payout.\n" +
    "- Disputes: Businesses have a 48-hour window to raise a dispute if a scan seems incorrect.\n" +
    "- Campaigns / QR codes: Creators share a unique QR code. Customers scan to claim the offer, then show it at the counter to redeem. The creator earns for each verified redemption.\n\n";
  
  if (pathname.includes('match')) {
    context += "The user is currently viewing the Creator Match Map page. Encourage them to explore local businesses on the map and tap on markers to view their Match Scores! 🗺️";
  } else if (pathname.includes('analytics')) {
    context += "The user is currently viewing the Analytics dashboard. Explain metrics like Claim Rate, Redemption Rate, or Conversion Rate if they ask! 📊";
  } else if (pathname.includes('/c/')) {
    context += "The user is on the Public Offer Claim page. Explain how customers can claim discounts or freebies here! 🎁";
  } else {
    context += "The user is exploring the platform. Help them learn how LocalDrop connects creators with local businesses! 🤝";
  }
  
  return context;
}

// Cute mock answers tailored to user intent and page pathname
function getMockResponse(userMessage, pathname) {
  const msg = userMessage.toLowerCase();
  const activePath = pathname || '/';
  
  // 1. Greetings / Help introduction
  if (/\b(hi|hello|hey|hola|greetings|help|who are you|who are u|hey there)\b/i.test(msg)) {
    return "Hi there! I'm Droppy, your LocalDrop buddy! 🌸 Ask me anything about matching, analytics, payouts, disputes, or how to get started. I'm here to help you shine! ✨";
  }

  // 2. Referral / Invite
  if (msg.includes('refer') || msg.includes('invite') || msg.includes('recommend')) {
    return "Love LocalDrop? Share the love! 💖 Go to [Refer a Business](/creator/settings) (or tap the sidebar link). Enter the email address of any local café, store, or salon. Once they register and run a campaign, your creator profile gets a **bonus visibility boost** on our matchmaking maps! 🗺️🚀";
  }

  // 3. KYC / Verification
  if (msg.includes('kyc') || msg.includes('verification') || msg.includes('gov id') || msg.includes('aadhaar') || msg.includes('pan')) {
    return "To enable payouts, you need to complete KYC verification! 📝 Go to [Settings -> Verification & KYC](/creator/settings). Enter your Government ID/PAN/Aadhaar number and upload an address proof document. Once submitted, our team reviews it immediately to unlock instant withdrawals! 🔓✨";
  }

  // 4. Branches / Store Locations
  if (msg.includes('branch') || msg.includes('outlet') || msg.includes('store location')) {
    return "As a **Business**, you can manage your branches in settings! ⚙️ Go to [Settings -> Store Locations](/business/settings) and click **Add Store Branch**. Enter the address, latitude, and longitude of your new outlet. This ensures geofencing works perfectly for all your physical locations! 🏢🗺️";
  }

  // 5. Join Campaign
  if (msg.includes('join') && (msg.includes('campaign') || msg.includes('offer') || msg.includes('business'))) {
    return "As a **Creator**, you can join campaigns in two ways: 1️⃣ Go to the [Match Map](/creator/match) page, tap on any business marker, and click 'Join Campaign'! 🗺️ 2️⃣ Or visit [Campaigns -> Available](/creator/campaigns/available) to see all active offers you can join. Once joined, your unique QR code will be ready! 🎁✨";
  }

  // 6. Create Campaign
  if (msg.includes('create') && (msg.includes('campaign') || msg.includes('offer') || msg.includes('new'))) {
    return "As a **Business**, you can create campaigns to drive walk-ins! Go to the [Campaigns](/business/campaigns) page and click the [**+ Create Campaign**](/business/campaigns) button. Fill in the campaign name, type (Discount, Cashback, or Freebie), budget, and target radius. Your campaign will go live instantly! 📈🚀";
  }

  // 7. Redeem / Verify / Scan Coupon
  if (msg.includes('verify') || msg.includes('redeem') || msg.includes('coupon') || msg.includes('customer scan') || msg.includes('claim offer')) {
    return "As a **Business**, you can redeem a customer's offer in two ways: 1️⃣ Go to the [Scan / Redeem](/business/redeem) page in the sidebar. Allow camera access to scan their QR code directly! 📸 2️⃣ Or enter the coupon code manually in the input box on the same page. The system will verify if they are inside the geofence and approve or hold it! 🛡️✨";
  }

  // 8. Connected Apps / Social Media
  if (msg.includes('instagram') || msg.includes('facebook') || msg.includes('tiktok') || msg.includes('connect')) {
    return "Go to [Settings -> Connected Apps](/creator/settings) to connect your Instagram, TikTok, or Facebook accounts. This pulls in your latest follower demographics and helps calculate higher Match Scores with local brands! 📈✨";
  }

  // 9. UPI / Payout Method / Bank
  if (msg.includes('upi') || msg.includes('bank') || msg.includes('payment method') || msg.includes('withdraw method')) {
    return "You can configure how you receive payouts! 💰 Go to [Settings -> Payment Details](/creator/settings) (or business settings) to set up your UPI ID or Bank Account (Account Number & IFSC code) for instant payouts. 💸🌸";
  }

  // 10. Audience / Heatmap / Map / Geolocation
  if (msg.includes('heat') || msg.includes('map') || msg.includes('zone') || msg.includes('location') || msg.includes('indore') || msg.includes('city') || msg.includes('cities') || msg.includes('where')) {
    return "Your **Audience Heatmap** 🗺️ shows where your followers live and hang out in Indore! Deep red hotspots mean very high follower density, while yellow/green zones show moderate density. You can filter cities in settings. It helps businesses see how well your geofenced reach aligns with their physical store! 📍✨";
  }

  // 11. Matching / Creator-Business Match Map
  if (msg.includes('match') || msg.includes('score') || msg.includes('partner') || msg.includes('collaborate') || msg.includes('fit') || msg.includes('clusters') || msg.includes('overlap')) {
    return "Ooh! Matching is where the magic happens! 💖 LocalDrop matches creators with local businesses by looking at your followers' locations (audience clusters) and matching them with where the business is located. The **Match Score** shows how perfectly your audience fits the business! A higher score means a higher chance of bringing in awesome customers! 🗺️✨";
  }

  // 12. Footfall / Predictive AI
  if (msg.includes('footfall') || msg.includes('visitor') || msg.includes('predict') || msg.includes('revenue') || msg.includes('estimated') || msg.includes('walk-in') || msg.includes('walkin') || msg.includes('traffic')) {
    return "Our **Predictive Footfall AI** is super smart! 🧠 It looks at your match score and historical walk-ins to estimate how many customers will scan your QR code and visit the store, plus the revenue you could generate for the business! It helps businesses see how valuable your influence is! 🥳💸";
  }

  // 13. Payouts / Earnings / Holds / Payout Holds
  if (msg.includes('hold') || msg.includes('payout') || msg.includes('pay') || msg.includes('paid') || msg.includes('earning') || msg.includes('money') || msg.includes('withdraw') || msg.includes('balance') || msg.includes('income') || msg.includes('funds') || msg.includes('cash')) {
    return "Money talk! 💰 Earnings have a soft **48-hour security hold** after a customer redeems an offer. This gives the business time to verify everything is genuine. Once the hold passes, it moves to your 'Available' balance, and you can withdraw it instantly from your [Payouts](/creator/payouts) / [Earnings](/creator/earnings) page! 💸✨";
  }

  // 14. Disputes / Fraud / Safety / Reviews
  if (msg.includes('dispute') || msg.includes('fraud') || msg.includes('wrong') || msg.includes('incorrect') || msg.includes('scam') || msg.includes('flag') || msg.includes('review') || msg.includes('safety') || msg.includes('security')) {
    return "Oh! Disputes are very rare, but if a business thinks a redemption scan was incorrect or duplicate, they have **48 hours** to raise a dispute. Our LocalDrop support team reviews them immediately to keep things fair and happy for everyone! 🤝🌸";
  }

  // 15. Analytics / Conversion Rate / Claims / Views
  if (msg.includes('analytics') || msg.includes('conversion') || msg.includes('rate') || msg.includes('claim') || msg.includes('view') || msg.includes('graph') || msg.includes('chart') || msg.includes('metric') || msg.includes('performance') || msg.includes('statistics')) {
    return "We track everything in real-time! 📊 **Claim Rate** is the percentage of people who saw your QR code page and clicked 'Claim'. **Redemption Rate** is the percentage of claimants who actually visited the store. **Conversion Rate** is the ultimate win—how many views turned into real store walk-ins! You can boost it by posting stories while hanging out at the store! 📈✨";
  }

  // 16. QR Codes / Scanning / Campaigns
  if (msg.includes('campaign') || msg.includes('qr') || msg.includes('scan') || msg.includes('redeem') || msg.includes('geofence') || msg.includes('gps') || msg.includes('code') || msg.includes('coupon') || msg.includes('discount') || msg.includes('offer')) {
    return "It's so simple and fun! 🎁 1️⃣ Businesses set up a campaign with an offer (like a free coffee or 20% off). 2️⃣ You join and get a unique QR code. 3️⃣ You share it with your followers. 4️⃣ They scan it, claim the offer, and show the coupon code at the store to redeem it! You earn money for every successful redemption! 📸☕";
  }

  // 17. Settings / Profile / Edit / Change
  if (msg.includes('setting') || msg.includes('profile') || msg.includes('edit') || msg.includes('change') || msg.includes('avatar') || msg.includes('cover') || msg.includes('address') || msg.includes('gstin') || msg.includes('id')) {
    return "You can manage your account in **Settings**! ⚙️ Edit your profile details, upload your avatar/cover photos, connect social accounts, or set up your payout method (UPI or Bank). Creators can also upload government IDs for KYC verification to enable payouts! 📝✨";
  }

  // 18. Notifications / Bell
  if (msg.includes('notification') || msg.includes('bell') || msg.includes('alert') || msg.includes('unread')) {
    return "Click the **Bell icon** in the topbar to view your notifications! 🔔 Creators get alerts about newly joined campaigns, earnings holds clearing, or new matches. Businesses get alerts about new redemptions, payout approvals, or disputes. You can clear them or mark them as read! 🌸";
  }

  // 19. General platform info / What is LocalDrop
  if (msg.includes('localdrop') || msg.includes('platform') || msg.includes('app') || msg.includes('website') || msg.includes('what is this') || msg.includes('how it works') || msg.includes('start')) {
    return "LocalDrop is a super cool platform that connects local creators (like foodies, lifestyle, and fashion influencers) with neighborhood businesses (like cozy cafes, cool boutiques, and relaxing salons)! 🌸 Creators get to monetize their local influence, and businesses get more walk-ins and trackable marketing! 🗺️🤝";
  }

  // 20. Pathname-specific fallbacks (when message doesn't match any specific intent)
  if (activePath.includes('match')) {
    return "Welcome to the Match Map! 🌸 Here you can find awesome local businesses nearby who want to collaborate. Just tap on any hotspot marker to view their offer details and matching score! ✨ Need help joining one?";
  }
  
  if (activePath.includes('analytics')) {
    return "This is your Analytics center! 📊 You can see views, claims, redemptions, and earnings here. Everything updates dynamically! Ask me about payout holds or how to read the graphs! 🥰";
  }
  
  if (activePath.includes('/c/')) {
    return "Yay! You found a special offer! 🎁 Just enter your name and phone number to claim it. Once claimed, show the code at the store to get your discount or freebie! So simple! 😋";
  }

  return "Beep boop! 🤖 I'm Droppy, your LocalDrop buddy! I can help you track campaigns, understand your audience heatmap, check payout holds, or explain matching scores. What would you like to explore today? 💕";
}

router.post('/chat', async (req, res) => {
  const { messages, pathname } = req.body;
  
  logger.info(`AI chat request: pathname=${pathname || '/'} messages=${Array.isArray(messages) ? messages.length : 0}`);
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid messages array.' });
  }
  
  const lastMessage = messages[messages.length - 1].text;
  const activePathname = pathname || '/';
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    // Return cute mock response when API key is not present
    const mockReply = getMockResponse(lastMessage, activePathname);
    return res.json({ success: true, reply: mockReply });
  }
  
  try {
    const systemInstruction = getSystemInstruction(activePathname);
    
    // Map messages to Gemini API format
    const contents = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Gemini API error status ${response.status}: ${errorText}`);
      throw new Error(`Gemini API call failed with status ${response.status}`);
    }
    
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                  "Oops! I couldn't process that. Could you try asking again? 🌸";
                  
    return res.json({ success: true, reply });
  } catch (err) {
    logger.error('Error contacting Gemini API:', err);
    // Fallback to mock reply so frontend never fails
    const mockReply = getMockResponse(lastMessage, activePathname);
    return res.json({ success: true, reply: mockReply });
  }
});

module.exports = router;
