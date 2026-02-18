-- Insert Project
INSERT INTO tbl_Saved_Projects (
  SP_name,
  SP_description,
  SP_approach,
  SP_direct_discount_rate,
  SP_beta,
  SP_riskless_rate,
  SP_market_risk_premium,
  SP_debt_ratio,
  SP_cost_of_borrowing,
  SP_tax_rate,
  SP_initial_investment,
  SP_lifetime,
  SP_working_capital_initial_investment,
  SP_working_capital_percentage,
  SP_tax_credit,
  SP_opportunity_cost,
  SP_salvage_value
)
VALUES (
  'Waste Facility Base Case',
  '15 year waste processing project',
  1,
  0.12,
  1,
  0.04,
  0.08,
  0.5,
  0.08,
  0.30,
  11250000,
  15,
  0,
  0,
  0,
  0,
  0
)
RETURNING SP_ID;

INSERT INTO tbl_Other_Factors 
(OF_Saved_Projects_ID, OF_type, OF_label, OF_value, OF_default_growth_rate)
VALUES
(1, 1, 'Gate Fee', 6000000, 0.025),
(1, 1, 'Recyclable', 55740, 0),
(1, 1, 'Energy', -4875621, 0),
(1, 2, 'O&M Variable', 2250000, 0.025),
(1, 2, 'O&M Fixed', 0, 0.025);
