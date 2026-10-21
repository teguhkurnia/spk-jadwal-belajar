CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name VARCHAR(50) NOT NULL, 
    is_active BOOLEAN NOT NULL DEFAULT false,    
    
    max_study_pages INT NOT NULL DEFAULT 40,
    days_of_week JSONB NOT NULL DEFAULT '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
    start_tuton_date DATE NOT NULL,
    start_study_date DATE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_semesters_user_active ON semesters(user_id, is_active);