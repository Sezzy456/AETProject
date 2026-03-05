-- Allow anyone to read/write to these tables for now
CREATE POLICY "Public Access" ON tbl_saved_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON tbl_other_factors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON tbl_growth_years FOR ALL USING (true) WITH CHECK (true);