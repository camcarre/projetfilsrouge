import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function testRegression(symbol) {
    console.log(`\n--- Analyse de régression pour ${symbol} ---`);
    
    // 1. Fetch data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // 90 jours d'historique

    try {
        console.log("Récupération des données...");
        // Use chart() instead of historical() to avoid deprecation warning
        const queryOptions = { period1: startDate, period2: endDate };
        const result = await yahooFinance.chart(symbol, queryOptions);
        
        const prices = result?.quotes?.map(q => q.close).filter(p => typeof p === 'number') || [];
        
        if (prices.length < 30) {
            console.log("Pas assez de données.");
            return;
        }

        const n = prices.length;
        
        console.log(`Données récupérées : ${n} jours de cotation.`);
        console.log(`Prix actuel : ${prices[n-1]}`);

        // 2. Linear Regression Calculation
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += prices[i];
            sumXY += i * prices[i];
            sumXX += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // 3. Calculate R-Squared
        const meanY = sumY / n;
        let ssTot = 0; // Total Sum of Squares
        let ssRes = 0; // Residual Sum of Squares

        for (let i = 0; i < n; i++) {
            const actual = prices[i];
            const predicted = slope * i + intercept;
            
            ssTot += Math.pow(actual - meanY, 2);
            ssRes += Math.pow(actual - predicted, 2);
        }

        const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

        console.log(`\nRésultats Statistiques :`);
        console.log(`- Pente (Slope) : ${slope.toFixed(4)} USD/jour`);
        console.log(`- Tendance : ${slope > 0 ? 'HAUSSIÈRE 🟢' : 'BAISSIÈRE 🔴'}`);
        console.log(`- R² (Coefficient de détermination) : ${rSquared.toFixed(4)}`);
        
        console.log("\nInterprétation :");
        if (rSquared > 0.8) console.log(">> Excellente corrélation. La tendance est très nette et fiable.");
        else if (rSquared > 0.5) console.log(">> Corrélation modérée. Une tendance existe mais avec de la volatilité.");
        else console.log(">> Faible corrélation. Le cours évolue sans direction claire (Range/Bruit).");

    } catch (e) {
        console.error("Erreur:", e.message);
    }
}

// Exécuter les tests sur quelques actifs représentatifs
console.log("Démarrage du script de test R²...");
await testRegression('AAPL');     // Souvent tendance
await testRegression('BTC-USD');  // Volatil
await testRegression('EURUSD=X'); // Souvent range
