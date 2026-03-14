import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("voltview.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS ChargingStations (
    StationID INTEGER PRIMARY KEY AUTOINCREMENT,
    StationName TEXT,
    Location TEXT,
    ChargerType TEXT,
    TotalEnergyDelivered REAL DEFAULT 0,
    Status TEXT,
    InstallationDate TEXT,
    Lat REAL,
    Lng REAL
  );

  CREATE TABLE IF NOT EXISTS ChargingSessions (
    SessionID INTEGER PRIMARY KEY AUTOINCREMENT,
    StationID INTEGER,
    VehicleID TEXT,
    StartTime TEXT,
    EndTime TEXT,
    EnergyDelivered_kWh REAL,
    Cost REAL,
    FOREIGN KEY(StationID) REFERENCES ChargingStations(StationID)
  );

  CREATE TABLE IF NOT EXISTS EnergyAnalytics (
    Date TEXT PRIMARY KEY,
    TotalEnergyConsumed REAL,
    PeakDemandHour INTEGER,
    SolarEnergyGenerated REAL
  );

  CREATE TABLE IF NOT EXISTS RevenueAnalytics (
    Date TEXT PRIMARY KEY,
    TotalRevenue REAL,
    RevenuePerStation TEXT
  );
`);

// Seed Data Helper
function seedData() {
  const stationCount = db.prepare("SELECT COUNT(*) as count FROM ChargingStations").get().count;
  if (stationCount === 0) {
    const stations = [
      ["Cyber Hub Alpha", "Downtown Core", "Fast", "Online", "2024-01-15", 34.0522, -118.2437],
      ["Neon Plaza Beta", "Uptown District", "Standard", "Online", "2024-02-10", 34.0622, -118.2537],
      ["Volt Station Gamma", "Tech Park", "Fast", "Online", "2024-03-05", 34.0422, -118.2337],
      ["Eco Charge Delta", "Green Valley", "Standard", "Maintenance", "2024-01-20", 34.0722, -118.2637],
      ["Grid Node Epsilon", "Industrial Zone", "Fast", "Offline", "2024-04-12", 34.0322, -118.2237],
    ];

    const insertStation = db.prepare("INSERT INTO ChargingStations (StationName, Location, ChargerType, Status, InstallationDate, Lat, Lng) VALUES (?, ?, ?, ?, ?, ?, ?)");
    stations.forEach(s => insertStation.run(...s));

    // Seed Sessions (100+)
    const insertSession = db.prepare("INSERT INTO ChargingSessions (StationID, VehicleID, StartTime, EndTime, EnergyDelivered_kWh, Cost) VALUES (?, ?, ?, ?, ?, ?)");
    const now = new Date();
    for (let i = 0; i < 120; i++) {
      const stationId = Math.floor(Math.random() * 5) + 1;
      const energy = Math.random() * 50 + 10;
      const cost = energy * 0.35;
      const startTime = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + Math.random() * 2 * 60 * 60 * 1000);
      insertSession.run(stationId, `EV-${1000 + i}`, startTime.toISOString(), endTime.toISOString(), energy, cost);
    }

    // Update Station Totals
    db.exec(`
      UPDATE ChargingStations 
      SET TotalEnergyDelivered = (
        SELECT SUM(EnergyDelivered_kWh) FROM ChargingSessions WHERE StationID = ChargingStations.StationID
      )
    `);
  }
}

seedData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get("/api/dashboard", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        SUM(EnergyDelivered_kWh) as totalEnergy,
        SUM(Cost) as totalRevenue,
        COUNT(*) as totalSessions
      FROM ChargingSessions
    `).get();

    const activeSessions = Math.floor(Math.random() * 15) + 5; // Simulated live data
    
    const networkStatus = db.prepare(`
      SELECT Status, COUNT(*) as count FROM ChargingStations GROUP BY Status
    `).all();

    res.json({
      totalEnergy: stats.totalEnergy.toFixed(2),
      totalRevenue: stats.totalRevenue.toFixed(2),
      totalSessions: stats.totalSessions,
      activeSessions,
      networkStatus,
      peakDemand: "18:00 - 21:00"
    });
  });

  app.get("/api/stations", (req, res) => {
    const stations = db.prepare("SELECT * FROM ChargingStations").all();
    res.json(stations);
  });

  app.get("/api/analytics/energy", (req, res) => {
    // Group by hour for a typical day
    const hourlyData = [];
    for (let i = 0; i < 24; i++) {
      hourlyData.push({
        hour: `${i}:00`,
        consumption: Math.random() * 100 + (i > 17 && i < 22 ? 150 : 50),
        solar: Math.max(0, Math.sin((i - 6) * Math.PI / 12) * 80)
      });
    }
    res.json(hourlyData);
  });

  app.get("/api/analytics/revenue", (req, res) => {
    const revenuePerStation = db.prepare(`
      SELECT s.StationName, SUM(sess.Cost) as revenue
      FROM ChargingStations s
      JOIN ChargingSessions sess ON s.StationID = sess.StationID
      GROUP BY s.StationID
    `).all();
    res.json(revenuePerStation);
  });

  app.get("/api/ai-insights", (req, res) => {
    res.json([
      {
        id: 1,
        title: "Peak Demand Alert",
        description: "Cyber Hub Alpha experiences peak demand between 6 PM and 9 PM. Consider dynamic pricing to balance load.",
        type: "warning"
      },
      {
        id: 2,
        title: "Efficiency Optimization",
        description: "Solar generation is at 95% capacity. Recommend prioritizing charging sessions during daylight hours.",
        type: "success"
      },
      {
        id: 3,
        title: "Maintenance Prediction",
        description: "Eco Charge Delta shows unusual voltage fluctuations. Scheduled maintenance recommended within 48 hours.",
        type: "info"
      }
    ]);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VoltView AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
