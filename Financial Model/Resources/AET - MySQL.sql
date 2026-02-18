CREATE TABLE `tbl_Saved_Projects` (
  `SP_ID` int PRIMARY KEY AUTO_INCREMENT,
  `SP_name` varchar(255),
  `SP_description` varchar(255),
  `SP_user_ID` int,
  `SP_approach` int,
  `SP_direct_discount_rate` decimal,
  `SP_beta` int,
  `SP_riskless_rate` decimal,
  `SP_market_risk_premium` decimal,
  `SP_debt_ratio` decimal,
  `SP_cost_of_borrowing` decimal,
  `SP_working_capital_initial_investment` float,
  `SP_working_capital_percentage` decimal,
  `SP_salvageable_fraction` decimal,
  `SP_tax_rate` decimal,
  `SP_initial_investment` float,
  `SP_opportunity_cost` float,
  `SP_lifetime` int,
  `SP_salvage_value` float,
  `SP_Depreciation_Method_ID` int,
  `SP_tax_credit` decimal,
  `SP_other_invest` int,
  `SP_created_at` timestamp,
  `SP_updated_at` timestamp
);

CREATE TABLE `tbl_Other_Factors` (
  `OF_ID` int PRIMARY KEY,
  `OF_Saved_Projects_ID` int,
  `OF_type` int,
  `OF_label` text,
  `OF_value` float,
  `OF_default_growth_rate` decimal
);

CREATE TABLE `tbl_Growth_Years` (
  `GY_ID` int PRIMARY KEY,
  `GY_Other_Factors_ID` int,
  `GY_year` int,
  `GY_growth_rate` decimal
);

ALTER TABLE `tbl_Other_Factors` ADD FOREIGN KEY (`OF_Saved_Projects_ID`) REFERENCES `tbl_Saved_Projects` (`SP_ID`);

ALTER TABLE `tbl_Growth_Years` ADD FOREIGN KEY (`GY_Other_Factors_ID`) REFERENCES `tbl_Other_Factors` (`OF_ID`);
