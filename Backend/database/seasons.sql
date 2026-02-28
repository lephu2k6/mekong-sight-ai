-- Create Seasons table
CREATE TABLE seasons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
    
    -- Season details
    season_type VARCHAR(20) NOT NULL CHECK (season_type IN ('shrimp', 'rice')),
    variety VARCHAR(100), -- Giống lúa (ST25, v.v) hoặc giống tôm
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_end_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view seasons of own farms"
    ON seasons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM farms
            WHERE farms.id = seasons.farm_id
            AND farms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage seasons of own farms"
    ON seasons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM farms
            WHERE farms.id = seasons.farm_id
            AND farms.user_id = auth.uid()
        )
    );
