PRAGMA foreign_keys = ON;

CREATE TABLE tbl_Client (
  CL_ID INTEGER PRIMARY KEY,
  CL_name TEXT NOT NULL,
  CL_region TEXT,
  CL_waste_tpa INTEGER,
  CL_location_lon REAL,
  CL_location_lat REAL,
  CL_created DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tbl_Facility_Type (
  FT_ID INTEGER PRIMARY KEY,
  FT_type TEXT NOT NULL,
  FT_created DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tbl_Technology_Type (
  TT_ID INTEGER PRIMARY KEY,
  TT_type TEXT NOT NULL,
  TT_created DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tbl_Facility_Status (
  FS_ID INTEGER PRIMARY KEY,
  FS_type TEXT NOT NULL,
  FS_created DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tbl_Open_Hours (
  OH_ID INTEGER PRIMARY KEY,
  OH_opening_time TEXT,
  OH_closing_time TEXT,
  OH_created DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tbl_Facility (
  FA_ID INTEGER PRIMARY KEY,
  FA_facility_name TEXT NOT NULL,
  FA_location_lat REAL,
  FA_location_lon REAL,
  FA_permitted_capacity_tpa INTEGER,
  FA_Technology_Type_ID INTEGER,
  FA_Facility_Status_ID INTEGER,
  FA_Open_Hours_ID INTEGER,
  FA_Facility_Type_ID INTEGER,
  FA_created DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (FA_Technology_Type_ID) REFERENCES tbl_Technology_Type(TT_ID),
  FOREIGN KEY (FA_Facility_Status_ID) REFERENCES tbl_Facility_Status(FS_ID),
  FOREIGN KEY (FA_Open_Hours_ID) REFERENCES tbl_Open_Hours(OH_ID),
  FOREIGN KEY (FA_Facility_Type_ID) REFERENCES tbl_Facility_Type(FT_ID)
);
CREATE TABLE tbl_Contract (
  CO_ID INTEGER PRIMARY KEY,
  CO_Client_ID INTEGER NOT NULL,
  CO_Facility_ID INTEGER NOT NULL,
  CO_min_tpa INTEGER,
  CO_max_tpa INTEGER,
  CO_gate_fee REAL,
  CO_cpi_indexed INTEGER,
  CO_contract_term_years INTEGER,
  CO_put_or_pay INTEGER,
  CO_created DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (CO_Client_ID) REFERENCES tbl_Client(CL_ID),
  FOREIGN KEY (CO_Facility_ID) REFERENCES tbl_Facility(FA_ID)
);
CREATE TABLE tbl_Proximity (
  PR_ID INTEGER PRIMARY KEY,
  PR_Client_ID INTEGER NOT NULL,
  PR_Facility_ID INTEGER NOT NULL,
  PR_distance_km REAL,
  PR_transport_cost_per_km REAL,
  PR_last_updated DATETIME,
  PR_created DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (PR_Client_ID) REFERENCES tbl_Client(CL_ID),
  FOREIGN KEY (PR_Facility_ID) REFERENCES tbl_Facility(FA_ID)
);
CREATE TABLE tbl_Services (
  SE_ID INTEGER PRIMARY KEY,
  SE_name TEXT NOT NULL,
  SE_created DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tbl_Facility_Services (
  FS_ID INTEGER PRIMARY KEY,
  FS_Facility_ID INTEGER NOT NULL,
  FS_Services_ID INTEGER NOT NULL,
  FS_unit_price REAL,
  FS_created DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (FS_Facility_ID) REFERENCES tbl_Facility(FA_ID),
  FOREIGN KEY (FS_Services_ID) REFERENCES tbl_Services(SE_ID)
);
CREATE TABLE tbl_Workload (
  WL_ID INTEGER PRIMARY KEY,
  WL_client_ID INTEGER NOT NULL,
  WL_services_ID INTEGER NOT NULL,
  WL_notes TEXT,
  WL_quantity_tpa REAL,
  WL_created DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (WL_client_ID) REFERENCES tbl_Client(CL_ID),
  FOREIGN KEY (WL_services_ID) REFERENCES tbl_Services(SE_ID)
);
CREATE TABLE tbl_Financial_Assumption (
  FI_ID INTEGER PRIMARY KEY,
  FI_name TEXT NOT NULL,
  FI_fixed_opex_annual REAL,
  FI_var_opex_per_tonne REAL,
  FI_recovery_rate REAL,
  FI_commodity_revenue_per_tonne REAL,
  FI_inflation_rate REAL,
  FI_assumption_owner TEXT,
  FI_last_updated DATE,
  FI_created DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tbl_Capital_Stack (
  CS_ID INTEGER PRIMARY KEY,
  CS_Assumption_ID INTEGER NOT NULL,
  CS_senior_pct REAL,
  CS_senior_rate REAL,
  CS_senior_tenor_years INTEGER,
  CS_mezz_pct REAL,
  CS_mezz_rate REAL,
  CS_equity_pct REAL,
  CS_equity_hurdle REAL,
  CS_created DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (CS_Assumption_ID) REFERENCES tbl_Financial_Assumption(FI_ID)
);
