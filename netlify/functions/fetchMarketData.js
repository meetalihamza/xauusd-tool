// ═══════════════════════════════════════════════════════════
// XAUUSD AI Trade Hunter Pro — Netlify Serverless Function
// Secure proxy for Twelve Data API
// API key is stored in Netlify environment variables — NEVER exposed to browser
// ═══════════════════════════════════════════════════════════

exports.handler = async function (event, context) {

  // CORS headers — allow requests from your Netlify domain
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Get Twelve Data API key from environment variable (set in Netlify dashboard)
  const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY;
  if (!TWELVE_DATA_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'TWELVE_DATA_API_KEY not configured in Netlify environment variables.' }),
    };
  }

  // Parse timeframe from query string: ?tf=4h or ?tf=1h or ?tf=15min or ?tf=5min
  const tf = event.queryStringParameters?.tf;
  const validTFs = { '4h': '4h', '1h': '1h', '15min': '15min', '5min': '5min' };

  if (!tf || !validTFs[tf]) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid timeframe. Use: 4h, 1h, 15min, 5min' }),
    };
  }

  try {
    // Fetch last 10 candles for XAUUSD from Twelve Data
    const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=${tf}&outputsize=10&apikey=${TWELVE_DATA_KEY}&format=JSON`;

    const response = await fetch(url);
    const data = await response.json();

    // Check for Twelve Data API errors
    if (data.status === 'error' || data.code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.message || 'Twelve Data API error', code: data.code }),
      };
    }

    // Return clean OHLC data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        timeframe: tf,
        symbol: 'XAU/USD',
        candles: data.values || [],
        fetched_at: new Date().toISOString(),
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Fetch failed: ' + err.message }),
    };
  }
};
