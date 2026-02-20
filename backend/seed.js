import db from './database.js';

console.log('Seeding database...');

// 1. Create default user
const user = db.prepare('SELECT * FROM users WHERE email = ?').get('demo@example.com');
let userId;

if (!user) {
  const info = db.prepare('INSERT INTO users (email, password, display_name, knowledge_level) VALUES (?, ?, ?, ?)').run('demo@example.com', 'demo123', 'Demo User', 'intermediaire');
  userId = info.lastInsertRowid;
  console.log('Created user: demo@example.com');
} else {
  userId = user.id;
  console.log('User already exists:', userId);
}

// 2. Create default portfolio
const portfolio = db.prepare('SELECT * FROM portfolios WHERE user_id = ?').get(userId);
let portfolioId;

if (!portfolio) {
  const info = db.prepare('INSERT INTO portfolios (user_id, name, type) VALUES (?, ?, ?)').run(userId, 'Mon PEA', 'PEA');
  portfolioId = info.lastInsertRowid;
  console.log('Created portfolio: Mon PEA');
} else {
  portfolioId = portfolio.id;
  console.log('Portfolio already exists:', portfolioId);
}

// 3. Create assets
const existingAssets = db.prepare('SELECT count(*) as count FROM assets WHERE user_id = ?').get(userId);

if (existingAssets.count === 0) {
  const assets = [
    { symbol: 'CW8.PA', name: 'Amundi MSCI World', category: 'etf', quantity: 10, unit_price: 450.50, currency: 'EUR' },
    { symbol: 'AI.PA', name: 'Air Liquide', category: 'action', quantity: 5, unit_price: 168.20, currency: 'EUR' },
    { symbol: 'BTC-USD', name: 'Bitcoin', category: 'crypto', quantity: 0.05, unit_price: 42000.00, currency: 'USD' }
  ];

  const stmt = db.prepare('INSERT INTO assets (user_id, portfolio_id, name, symbol, category, quantity, unit_price, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  
  for (const asset of assets) {
    stmt.run(userId, portfolioId, asset.name, asset.symbol, asset.category, asset.quantity, asset.unit_price, asset.currency);
  }
  console.log(`Created ${assets.length} assets`);
} else {
  console.log('Assets already exist');
}

// 4. Create watchlist
const existingWatchlist = db.prepare('SELECT count(*) as count FROM watchlists WHERE user_id = ?').get(userId);

if (existingWatchlist.count === 0) {
  const watchlist = ['AAPL', 'MSFT', 'TSLA', 'NVDA'];
  const stmt = db.prepare('INSERT INTO watchlists (user_id, symbol) VALUES (?, ?)');
  
  for (const symbol of watchlist) {
    stmt.run(userId, symbol);
  }
  console.log(`Created ${watchlist.length} watchlist items`);
}

console.log('Database seeded successfully!');
