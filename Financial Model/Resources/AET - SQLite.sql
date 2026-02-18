PRAGMA foreign_keys = ON;

CREATE TABLE tbl_Saved_Projects (
  SP_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  SP_name TEXT,
  SP_description TEXT,
  SP_user_ID INTEGER,
  SP_approach INTEGER,
  SP_direct_discount_rate REAL,
  SP_beta REAL,
  SP_riskless_rate REAL,
  SP_market_risk_premium REAL,
  SP_debt_ratio REAL,
  SP_cost_of_borrowing REAL,
  SP_working_capital_initial_investment REAL,
  SP_working_capital_percentage REAL,
  SP_salvageable_fraction REAL,
  SP_tax_rate REAL,
  SP_initial_investment REAL,
  SP_opportunity_cost REAL,
  SP_lifetime INTEGER,
  SP_salvage_value REAL,
  SP_Depreciation_Method_ID INTEGER,
  SP_tax_credit REAL,
  SP_other_invest INTEGER,
  SP_created_at TEXT,
  SP_updated_at TEXT
);

CREATE TABLE tbl_Other_Factors (
  OF_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  OF_Saved_Projects_ID INTEGER,
  OF_type INTEGER,
  OF_label TEXT,
  OF_value REAL,
  OF_default_growth_rate REAL,
  FOREIGN KEY (OF_Saved_Projects_ID)
    REFERENCES tbl_Saved_Projects(SP_ID)
    ON DELETE CASCADE
);

CREATE TABLE tbl_Growth_Years (
  GY_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  GY_Other_Factors_ID INTEGER,
  GY_year INTEGER,
  GY_growth_rate REAL,
  FOREIGN KEY (GY_Other_Factors_ID)
    REFERENCES tbl_Other_Factors(OF_ID)
    ON DELETE CASCADE
);
