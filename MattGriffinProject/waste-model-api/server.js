const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Connect to your database
const db = new sqlite3.Database("./waste_model.db");

// Test endpoint
app.get("/", (req, res) => {
  res.send("Waste Model API is running");
});

// ===== ADD QUERIES BELOW THIS LINE =====

// Query 1
app.get("/clients/waste", (req, res) => {
  const sql = `
    SELECT CL_name, SUM(WL_quantity_tpa) AS total_tpa
    FROM tbl_Client
    JOIN tbl_Workload ON CL_ID = WL_client_ID
    GROUP BY CL_ID;
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// Query 2
app.get("/contracts", (req, res) => {
  const sql = `
    SELECT CL_name, FA_facility_name, CO_min_tpa, CO_max_tpa, CO_gate_fee
    FROM tbl_Contract
    JOIN tbl_Client ON CO_Client_ID = CL_ID
    JOIN tbl_Facility ON CO_Facility_ID = FA_ID;
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// Query 3
app.get("/facilities/summary", (req, res) => {
  const sql = `
    SELECT FA_facility_name, FT_type, FS_type, FA_permitted_capacity_tpa
    FROM tbl_Facility
    JOIN tbl_Facility_Type ON FA_Facility_Type_ID = FT_ID
    JOIN tbl_Facility_Status ON FA_Facility_Status_ID = FS_ID;
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
