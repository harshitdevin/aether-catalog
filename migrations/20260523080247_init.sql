-- Create users table
CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(100) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  name VARCHAR(255)
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  value NUMERIC(12, 2),
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  condition VARCHAR(100),
  status VARCHAR(100),
  location VARCHAR(255),
  serial VARCHAR(255),
  tags JSONB,
  notes TEXT,
  image TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(50),
  "desc" TEXT,
  "time" TIMESTAMPTZ DEFAULT NOW()
);

-- Seed users
INSERT INTO users (username, password, role, name) VALUES
('admin', 'admin', 'admin', 'Admin Portal'),
('user', 'user', 'staff', 'Staff Registry')
ON CONFLICT (username) DO NOTHING;

-- Seed assets
INSERT INTO assets (id, name, category, value, manufacturer, model, condition, status, location, serial, tags, notes, image, "createdAt") VALUES
('AETHER-00121', 'Aether Book Pro 16"', 'Electronics', 249900.00, 'AetherTech', 'AB-16-M3X', 'Excellent', 'In Service', 'Executive Office A', 'SN-APL982K11', '["laptop", "hardware", "executive", "silicon"]'::jsonb, 'CTO primary machine. Loaded with M3 Max equivalent configuration, 64GB RAM, 2TB SSD. AppleCare coverage active till May 2028.', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect x="150" y="80" width="500" height="300" rx="15" fill="%231e293b" stroke="%23334155" stroke-width="3"/><rect x="170" y="100" width="460" height="260" rx="4" fill="%23020617"/><path d="M100,380 L700,380 L720,410 C720,415 710,420 700,420 L100,420 C90,420 80,415 80,410 Z" fill="%23334155"/><rect x="360" y="380" width="80" height="6" rx="3" fill="%231e293b"/><circle cx="400" cy="230" r="45" fill="url(%23g1)" opacity="0.85"/><polygon points="380,230 425,205 425,255" fill="%23ffffff"/><circle cx="400" cy="90" r="3" fill="%23475569"/><text x="400" y="470" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Book Pro 16</text></svg>', NOW() - INTERVAL '10 days'),
('AETHER-00122', 'Kinetic Ergonomic Mesh Chair', 'Office Gear', 1250.00, 'Herman Office', 'Aeron-Gen2', 'Good', 'In Service', 'Design Studio B', 'SN-HA-88291A', '["furniture", "ergonomic", "office", "studio"]'::jsonb, 'Premium posture correction chair with adjustable armrests and mesh backing. Back support tension re-calibrated in early 2026.', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><path d="M350,100 L450,100 L460,250 L340,250 Z" fill="none" stroke="url(%23g2)" stroke-width="8" stroke-linecap="round"/><path d="M320,250 L480,250 L490,290 L310,290 Z" fill="%231e293b" rx="5"/><rect x="330" y="150" width="140" height="80" fill="%23334155" opacity="0.3" rx="8"/><path d="M290,180 L310,260 M510,180 L490,260" stroke="%23475569" stroke-width="12" stroke-linecap="round"/><path d="M400,290 L400,400 M370,400 L430,400" stroke="%23334155" stroke-width="14"/><path d="M400,400 L320,450 M400,400 L480,450 M400,400 L400,460" stroke="%231e293b" stroke-width="10" stroke-linecap="round"/><circle cx="320" cy="450" r="10" fill="%23475569"/><circle cx="480" cy="450" r="10" fill="%23475569"/><circle cx="400" cy="460" r="10" fill="%23475569"/><text x="400" y="50" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Kinetic Ergonomic Chair</text></svg>', NOW() - INTERVAL '6 days'),
('AETHER-00123', 'Aether Cine FX3 Camera', 'Media Equipment', 3899.00, 'Sone', 'ILME-FX3-A', 'Excellent', 'Storage', 'Equipment Closet C', 'SN-SO-FX3-9921', '["camera", "media", "video", "production"]'::jsonb, 'Full-frame Cinema line camera. Used for marketing campaigns and tutorials. Stored in moisture-controlled case with 50mm f/1.2 lens.', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23ef4444"/></linearGradient></defs><rect x="250" y="180" width="300" height="180" rx="16" fill="%231e293b" stroke="%23334155" stroke-width="4"/><rect x="290" y="145" width="80" height="35" rx="5" fill="%23334155"/><circle cx="500" cy="220" r="8" fill="%23ef4444" stroke="%237f1d1d" stroke-width="2"/><circle cx="400" cy="270" r="70" fill="%230f172a" stroke="%23475569" stroke-width="6"/><circle cx="400" cy="270" r="50" fill="url(%23g3)" stroke="%23020617" stroke-width="4"/><circle cx="380" cy="250" r="15" fill="%23ffffff" opacity="0.25"/><text x="400" y="440" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Cine FX3 Camera</text></svg>', NOW() - INTERVAL '3 days'),
('AETHER-00124', 'Prism VR-X Spatial Headset', 'Electronics', 3499.00, 'AetherTech', 'PRISM-VRX', 'Excellent', 'In Service', 'Spatial Development Lab', 'SN-VRX-7762A', '["vr", "hardware", "spatial", "testing"]'::jsonb, 'Used by the spatial software development team. Checked out by Lead Architect. Calibrated for 90Hz eye-tracking.', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%23a855f7"/></linearGradient></defs><path d="M220,200 C220,130 580,130 580,200" fill="none" stroke="%23334155" stroke-width="12" stroke-linecap="round"/><rect x="200" y="200" width="400" height="150" rx="75" fill="%231e293b" stroke="%23334155" stroke-width="4"/><rect x="220" y="215" width="360" height="120" rx="60" fill="%23020617"/><path d="M240,275 Q400,310 560,275" fill="none" stroke="url(%23g4)" stroke-width="6" stroke-linecap="round" opacity="0.9"/><circle cx="280" cy="250" r="4" fill="%2306b6d4"/><circle cx="520" cy="250" r="4" fill="%23a855f7"/><text x="400" y="420" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Prism VR-X Headset</text></svg>', NOW() - INTERVAL '1 day'),
('AETHER-00125', 'BioScan-X Digital Microscope', 'Laboratory', 7800.00, 'Optika Labs', 'BSX-5000', 'Fair', 'Maintenance', 'R&D BioLab 2', 'SN-OP-5000-B3', '["lab", "microscope", "research", "optical"]'::jsonb, 'Digital optical microscope with 5000x magnification and USB capture output. Scheduled for lens cleaning and sensor calibration next Monday.', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23a855f7"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect x="300" y="400" width="200" height="20" rx="5" fill="%23334155"/><path d="M400,400 L400,280 Q400,200 460,180" fill="none" stroke="%23334155" stroke-width="16" stroke-linecap="round"/><path d="M460,150 L400,250" stroke="url(%23g5)" stroke-width="20" stroke-linecap="round"/><rect x="375" y="240" width="50" height="30" fill="%231e293b" stroke="%23475569" stroke-width="2" rx="4"/><circle cx="340" cy="300" r="10" fill="%233b82f6" opacity="0.8"/><text x="400" y="470" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether BioScan-X Microscope</text></svg>', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- Seed activities
INSERT INTO activities (id, type, "desc", "time") VALUES
('act-1', 'add', 'Asset <strong>Aether Book Pro 16"</strong> catalogued successfully by system initialization.', NOW() - INTERVAL '10 days'),
('act-2', 'add', 'Asset <strong>Kinetic Ergonomic Mesh Chair</strong> added to registry.', NOW() - INTERVAL '6 days'),
('act-3', 'voice', 'Hands-free capture processed: <strong>Aether Cine FX3 Camera</strong> logged via vocal command.', NOW() - INTERVAL '3 days'),
('act-4', 'add', 'Asset <strong>Prism VR-X Spatial Headset</strong> registered under Electronics.', NOW() - INTERVAL '1 day'),
('act-5', 'update', 'Status updated for <strong>BioScan-X Digital Microscope</strong>: shifted to <strong>Maintenance</strong>.', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;
