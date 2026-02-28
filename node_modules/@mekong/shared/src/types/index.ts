export interface UserProfile {
    id: string;
    phone_number: string;
    full_name: string;
    role: 'admin' | 'farmer' | 'expert';
    created_at: Date;
    updated_at: Date;
}

export interface Farm {
    id: string;
    user_id: string;
    name: string;
    location: {
        latitude: number;
        longitude: number;
    };
    size: number; // in hectares
    type: 'shrimp' | 'rice' | 'mixed';
    status: 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
}

export interface SensorReading {
    id: string;
    device_id: string;
    timestamp: Date;
    type: 'salinity' | 'temperature' | 'ph' | 'water_level';
    value: number;
    unit: string;
}

export interface Alert {
    id: string;
    farm_id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    resolved: boolean;
    created_at: Date;
}

export interface Season {
    id: string;
    farm_id: string;
    season_type: 'shrimp' | 'rice';
    start_date: Date;
    expected_end_date?: Date;
    variety: string;
    status: 'active' | 'completed';
    created_at: Date;
}
