CREATE TABLE `tbl_Contract` (
  `CO_ID` integer PRIMARY KEY,
  `CO_Client_ID` integer,
  `CO_Facility_ID` integer,
  `CO_min_tpa` integer,
  `CO_max_tpa` integer,
  `CO_gate_fee` float,
  `CO_cpi_indexed` boolean,
  `CO_contract_term_years` integer,
  `CO_put_or_pay` boolean,
  `CO_created` datetime
);

CREATE TABLE `tbl_Client` (
  `CL_ID` integer PRIMARY KEY,
  `CL_name` text,
  `CL_region` text,
  `CL_waste_tpa` integer,
  `CL_location_lon` float,
  `CL_location_lat` float,
  `CL_created` datetime
);

CREATE TABLE `tbl_Client_Type` (
  `CT_ID` integer PRIMARY KEY,
  `CT_type` integer,
  `CT_created` datetime
);

CREATE TABLE `tbl_Facility` (
  `FA_ID` integer PRIMARY KEY,
  `FA_Technology_Type_ID` integer,
  `FA_Facility_Status_ID` integer,
  `FA_Open_Hours_ID` integer,
  `FA_Facility_Type_ID` integer,
  `FA_facility_name` text,
  `FA_location_lat` float,
  `FA_location_lon` float,
  `FA_permitted_capacity_tpa` integer,
  `FA_created` datetime
);

CREATE TABLE `tbl_Technology_Type` (
  `TT_ID` integer PRIMARY KEY,
  `TT_type` text,
  `TT_created` datetime
);

CREATE TABLE `tbl_Facility_Status` (
  `FS_ID` integer PRIMARY KEY,
  `FS_type` text,
  `FS_created` datetime
);

CREATE TABLE `tbl_Open_Hours` (
  `OH_ID` integer PRIMARY KEY,
  `OH_opening_time` time,
  `OH_closing_time` time,
  `OH_created` datetime
);

CREATE TABLE `tbl_Facility_Type` (
  `FT_ID` integer PRIMARY KEY,
  `FT_type` text,
  `FT_created` datetime
);

CREATE TABLE `tbl_Proximity` (
  `PR_ID` integer PRIMARY KEY,
  `PR_Client_ID` integer,
  `PR_Facility_ID` integer,
  `PR_distance_km` float,
  `PR_transport_cost_per_km` float,
  `PR_last_updated` datetime,
  `PR_created` datetime
);

CREATE TABLE `tbl_Services` (
  `SE_ID` integer PRIMARY KEY,
  `SE_name` varchar(255),
  `SE_created` datetime
);

CREATE TABLE `tbl_Facility_Services` (
  `FS_ID` integer PRIMARY KEY,
  `FS_Facility_ID` integer,
  `FS_Services_ID` integer,
  `FS_unit_price` float,
  `FS_created` datetime
);

CREATE TABLE `tbl_Workload` (
  `WL_ID` integer PRIMARY KEY,
  `WL_services_ID` integer,
  `WL_client_ID` integer,
  `WL_notes` varchar(255),
  `WL_quantity_tpa` float,
  `WL_created` datetime
);

CREATE TABLE `tbl_Financial_Assumption` (
  `FI_ID` integer PRIMARY KEY,
  `FI_name` text,
  `FI_fixed_opex_annual` float,
  `FI_var_opex_per_tonne` float,
  `FI_recovery_rate` float,
  `FI_commodity_revenue_per_tonne` float,
  `FI_inflation_rate` float,
  `FI_assumption_owner` text,
  `FI_last_updated` date,
  `FI_created` datetime
);

CREATE TABLE `tbl_Capital_Stack` (
  `CS_ID` integer PRIMARY KEY,
  `CS_Assumption_ID` integer,
  `CS_senior_pct` float,
  `CS_senior_tenor_years` integer,
  `CS_mezz_pct` float,
  `CS_mezz_rate` float,
  `CS_equity_pct` float,
  `CS_equity_hurdle` float,
  `CS_created` datetime
);

ALTER TABLE `tbl_Financial_Assumption` ADD FOREIGN KEY (`FI_ID`) REFERENCES `tbl_Capital_Stack` (`CS_Assumption_ID`);

ALTER TABLE `tbl_Client` ADD FOREIGN KEY (`CL_ID`) REFERENCES `tbl_Contract` (`CO_Client_ID`);

ALTER TABLE `tbl_Facility` ADD FOREIGN KEY (`FA_ID`) REFERENCES `tbl_Contract` (`CO_Facility_ID`);

ALTER TABLE `tbl_Client` ADD FOREIGN KEY (`CL_ID`) REFERENCES `tbl_Proximity` (`PR_Client_ID`);

ALTER TABLE `tbl_Facility` ADD FOREIGN KEY (`FA_ID`) REFERENCES `tbl_Proximity` (`PR_Facility_ID`);

ALTER TABLE `tbl_Facility_Services` ADD FOREIGN KEY (`FS_Facility_ID`) REFERENCES `tbl_Facility` (`FA_ID`);

ALTER TABLE `tbl_Facility_Services` ADD FOREIGN KEY (`FS_Services_ID`) REFERENCES `tbl_Services` (`SE_ID`);

ALTER TABLE `tbl_Client` ADD FOREIGN KEY (`CL_ID`) REFERENCES `tbl_Client_Type` (`CT_ID`);

ALTER TABLE `tbl_Client` ADD FOREIGN KEY (`CL_ID`) REFERENCES `tbl_Workload` (`WL_client_ID`);

ALTER TABLE `tbl_Workload` ADD FOREIGN KEY (`WL_services_ID`) REFERENCES `tbl_Services` (`SE_ID`);

ALTER TABLE `tbl_Facility` ADD FOREIGN KEY (`FA_Technology_Type_ID`) REFERENCES `tbl_Technology_Type` (`TT_ID`);

ALTER TABLE `tbl_Facility` ADD FOREIGN KEY (`FA_Facility_Status_ID`) REFERENCES `tbl_Facility_Status` (`FS_ID`);

ALTER TABLE `tbl_Facility` ADD FOREIGN KEY (`FA_Open_Hours_ID`) REFERENCES `tbl_Open_Hours` (`OH_ID`);

ALTER TABLE `tbl_Facility` ADD FOREIGN KEY (`FA_Facility_Type_ID`) REFERENCES `tbl_Facility_Type` (`FT_ID`);
