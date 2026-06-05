/* ==========================================================================
   AetherCatalog LocalStorage Database & Seed Data Module
   ========================================================================== */

// Beautiful Inline SVG Designs for Assets to prevent broken images and load instantly
const SVG_ASSETS = {
  macbook: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect x="150" y="80" width="500" height="300" rx="15" fill="%231e293b" stroke="%23334155" stroke-width="3"/><rect x="170" y="100" width="460" height="260" rx="4" fill="%23020617"/><path d="M100,380 L700,380 L720,410 C720,415 710,420 700,420 L100,420 C90,420 80,415 80,410 Z" fill="%23334155"/><rect x="360" y="380" width="80" height="6" rx="3" fill="%231e293b"/><circle cx="400" cy="230" r="45" fill="url(%23g1)" opacity="0.85"/><polygon points="380,230 425,205 425,255" fill="%23ffffff"/><circle cx="400" cy="90" r="3" fill="%23475569"/><text x="400" y="470" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Book Pro 16</text></svg>`,
  
  chair: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><path d="M350,100 L450,100 L460,250 L340,250 Z" fill="none" stroke="url(%23g2)" stroke-width="8" stroke-linecap="round"/><path d="M320,250 L480,250 L490,290 L310,290 Z" fill="%231e293b" rx="5"/><rect x="330" y="150" width="140" height="80" fill="%23334155" opacity="0.3" rx="8"/><path d="M290,180 L310,260 M510,180 L490,260" stroke="%23475569" stroke-width="12" stroke-linecap="round"/><path d="M400,290 L400,400 M370,400 L430,400" stroke="%23334155" stroke-width="14"/><path d="M400,400 L320,450 M400,400 L480,450 M400,400 L400,460" stroke="%231e293b" stroke-width="10" stroke-linecap="round"/><circle cx="320" cy="450" r="10" fill="%23475569"/><circle cx="480" cy="450" r="10" fill="%23475569"/><circle cx="400" cy="460" r="10" fill="%23475569"/><text x="400" y="50" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Kinetic Ergonomic Chair</text></svg>`,
  
  camera: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23ef4444"/></linearGradient></defs><rect x="250" y="180" width="300" height="180" rx="16" fill="%231e293b" stroke="%23334155" stroke-width="4"/><rect x="290" y="145" width="80" height="35" rx="5" fill="%23334155"/><circle cx="500" cy="220" r="8" fill="%23ef4444" stroke="%237f1d1d" stroke-width="2"/><circle cx="400" cy="270" r="70" fill="%230f172a" stroke="%23475569" stroke-width="6"/><circle cx="400" cy="270" r="50" fill="url(%23g3)" stroke="%23020617" stroke-width="4"/><circle cx="380" cy="250" r="15" fill="%23ffffff" opacity="0.25"/><text x="400" y="440" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Cine FX3 Camera</text></svg>`,
  
  headset: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%23a855f7"/></linearGradient></defs><path d="M220,200 C220,130 580,130 580,200" fill="none" stroke="%23334155" stroke-width="12" stroke-linecap="round"/><rect x="200" y="200" width="400" height="150" rx="75" fill="%231e293b" stroke="%23334155" stroke-width="4"/><rect x="220" y="215" width="360" height="120" rx="60" fill="%23020617"/><path d="M240,275 Q400,310 560,275" fill="none" stroke="url(%23g4)" stroke-width="6" stroke-linecap="round" opacity="0.9"/><circle cx="280" cy="250" r="4" fill="%2306b6d4"/><circle cx="520" cy="250" r="4" fill="%23a855f7"/><text x="400" y="420" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether Prism VR-X Headset</text></svg>`,
  
  microscope: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b0f19"/><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23a855f7"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect x="300" y="400" width="200" height="20" rx="5" fill="%23334155"/><path d="M400,400 L400,280 Q400,200 460,180" fill="none" stroke="%23334155" stroke-width="16" stroke-linecap="round"/><path d="M460,150 L400,250" stroke="url(%23g5)" stroke-width="20" stroke-linecap="round"/><rect x="375" y="240" width="50" height="30" fill="%231e293b" stroke="%23475569" stroke-width="2" rx="4"/><circle cx="340" cy="300" r="10" fill="%233b82f6" opacity="0.8"/><text x="400" y="470" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Aether BioScan-X Microscope</text></svg>`
};

// Fallback seed assets (INR values) if API is unavailable
const SEED_ASSETS = [
  {
    id: 'AETHER-00121',
    name: 'Aether Book Pro 16"',
    category: 'Electronics',
    value: 249900.00,
    manufacturer: 'AetherTech',
    model: 'AB-16-M3X',
    condition: 'Excellent',
    status: 'In Service',
    location: 'Executive Office A',
    serial: 'SN-APL982K11',
    tags: ['laptop', 'hardware', 'executive', 'silicon'],
    notes: 'CTO primary machine. Loaded with M3 Max equivalent configuration, 64GB RAM, 2TB SSD. AppleCare coverage active till May 2028.',
    image: SVG_ASSETS.macbook,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'AETHER-00122',
    name: 'Kinetic Ergonomic Mesh Chair',
    category: 'Office Gear',
    value: 45000.00,
    manufacturer: 'Herman Office',
    model: 'Aeron-Gen2',
    condition: 'Good',
    status: 'In Service',
    location: 'Design Studio B',
    serial: 'SN-HA-88291A',
    tags: ['furniture', 'ergonomic', 'office', 'studio'],
    notes: 'Premium posture correction chair with adjustable armrests and mesh backing. Back support tension re-calibrated in early 2026.',
    image: SVG_ASSETS.chair,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'AETHER-00123',
    name: 'Aether Cine FX3 Camera',
    category: 'Media Equipment',
    value: 389900.00,
    manufacturer: 'Sone',
    model: 'ILME-FX3-A',
    condition: 'Excellent',
    status: 'Storage',
    location: 'Equipment Closet C',
    serial: 'SN-SO-FX3-9921',
    tags: ['camera', 'media', 'video', 'production'],
    notes: 'Full-frame Cinema line camera. Used for marketing campaigns and tutorials. Stored in moisture-controlled case with 50mm f/1.2 lens.',
    image: SVG_ASSETS.camera,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'AETHER-00124',
    name: 'Prism VR-X Spatial Headset',
    category: 'Electronics',
    value: 310000.00,
    manufacturer: 'AetherTech',
    model: 'PRISM-VRX',
    condition: 'Excellent',
    status: 'In Service',
    location: 'Spatial Development Lab',
    serial: 'SN-VRX-7762A',
    tags: ['vr', 'hardware', 'spatial', 'testing'],
    notes: 'Used by the spatial software development team. Checked out by Lead Architect. Calibrated for 90Hz eye-tracking.',
    image: SVG_ASSETS.headset,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'AETHER-00125',
    name: 'BioScan-X Digital Microscope',
    category: 'Laboratory',
    value: 780000.00,
    manufacturer: 'Optika Labs',
    model: 'BSX-5000',
    condition: 'Fair',
    status: 'Maintenance',
    location: 'R&D BioLab 2',
    serial: 'SN-OP-5000-B3',
    tags: ['lab', 'microscope', 'research', 'optical'],
    notes: 'Digital optical microscope with 5000x magnification and USB capture output. Scheduled for lens cleaning and sensor calibration next Monday.',
    image: SVG_ASSETS.microscope,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];

// Fallback activities if API is offline
const SEED_ACTIVITIES = [
  {
    id: 'act-1',
    type: 'add',
    desc: 'Asset <strong>Aether Book Pro 16"</strong> catalogued successfully by system initialization.',
    time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'act-2',
    type: 'add',
    desc: 'Asset <strong>Kinetic Ergonomic Mesh Chair</strong> added to registry.',
    time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'act-3',
    type: 'voice',
    desc: 'Hands-free capture processed: <strong>Aether Cine FX3 Camera</strong> logged via vocal command.',
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'act-4',
    type: 'add',
    desc: 'Asset <strong>Prism VR-X Spatial Headset</strong> registered under Electronics.',
    time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'act-5',
    type: 'update',
    desc: 'Status updated for <strong>BioScan-X Digital Microscope</strong>: shifted to <strong>Maintenance</strong>.',
    time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];

export const DB = {
  _assetsCache: [],
  _activitiesCache: [],
  _usersCache: [],

  // Sync cache records from Python + MongoDB backend on startup
  async init() {
    try {
      console.log("Initializing database sync with Python backend...");
      
      // 1. Load users
      const userResponse = await fetch('/api/users');
      if (userResponse.ok) {
        this._usersCache = await userResponse.json();
      } else {
        throw new Error("Unable to sync users collection");
      }

      // 2. Load assets
      const assetResponse = await fetch('/api/assets');
      if (assetResponse.ok) {
        this._assetsCache = await assetResponse.json();
      } else {
        throw new Error("Unable to sync assets collection");
      }

      // 3. Load activities
      const activityResponse = await fetch('/api/activities');
      if (activityResponse.ok) {
        this._activitiesCache = await activityResponse.json();
      } else {
        throw new Error("Unable to sync activities collection");
      }

      console.log("Local caches synced successfully with MongoDB.");
    } catch (e) {
      console.error("Local database init failed. Using standalone memory fallback.", e);
      // Failover to client local cache logic
      this._assetsCache = SEED_ASSETS;
      this._activitiesCache = SEED_ACTIVITIES;
      this._usersCache = [
        { username: 'admin', password: 'admin', role: 'admin', name: 'Admin Portal' },
        { username: 'user', password: 'user', role: 'staff', name: 'Staff Registry' }
      ];
    }
  },

  // Fetch all assets from local cache
  getAllAssets() {
    return this._assetsCache;
  },

  // Get specific asset by ID
  getAssetById(id) {
    return this._assetsCache.find(a => a.id === id) || null;
  },

  // Save asset (Insert or Update write-through)
  saveAsset(asset) {
    const isNew = !asset.id;
    if (isNew) {
      asset.id = `AETHER-${Math.floor(10000 + Math.random() * 90000)}`;
      asset.createdAt = new Date().toISOString();
    }
    
    const existingIndex = this._assetsCache.findIndex(a => a.id === asset.id);
    
    if (existingIndex > -1) {
      this._assetsCache[existingIndex] = { ...this._assetsCache[existingIndex], ...asset };
      this.logActivity('update', `Asset <strong>${asset.name}</strong> attributes updated.`);
    } else {
      this._assetsCache.unshift(asset); // Add to beginning of cache list
      this.logActivity('add', `Asset <strong>${asset.name}</strong> registered successfully.`);
    }
    
    // Write-through to MongoDB asynchronously
    fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset)
    }).catch(e => {
      console.error("MongoDB async saveAsset fail:", e);
    });
    
    return asset;
  },

  // Delete asset write-through
  deleteAsset(id) {
    const index = this._assetsCache.findIndex(a => a.id === id);
    if (index > -1) {
      const asset = this._assetsCache[index];
      this._assetsCache.splice(index, 1); // remove from local cache list
      
      this.logActivity('del', `Asset <strong>${asset.name}</strong> removed from catalog.`);
      
      // Delete from MongoDB database asynchronously
      fetch(`/api/assets/${id}`, {
        method: 'DELETE'
      }).catch(e => {
        console.error("MongoDB async deleteAsset fail:", e);
      });
      return true;
    }
    return false;
  },

  // Get activities timeline from local cache
  getActivities() {
    return this._activitiesCache;
  },

  // Log system activity write-through
  logActivity(type, desc) {
    const newActivity = {
      id: `act-${Math.floor(100000 + Math.random() * 900000)}`,
      type,
      desc,
      time: new Date().toISOString()
    };
    this._activitiesCache.unshift(newActivity);
    
    // Keep max 30 activities in client cache
    if (this._activitiesCache.length > 30) {
      this._activitiesCache.pop();
    }
    
    // Write to server activities collection asynchronously
    fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newActivity)
    }).catch(e => {
      console.error("MongoDB async logActivity fail:", e);
    });
    
    // Dispatch custom event so app UI knows to update
    window.dispatchEvent(new CustomEvent('activity-updated', { detail: newActivity }));
    return newActivity;
  },

  // Purge database from server and reset app
  async purgeDB() {
    this._assetsCache = [];
    this._activitiesCache = [];
    this._usersCache = [];
    
    try {
      await fetch('/api/purge', { method: 'POST' });
    } catch (e) {
      console.error("MongoDB backend purge API call failed:", e);
    }
    
    // Clear user session from localStorage
    localStorage.removeItem('aether_logged_in_user');
    
    // Reload page to reseed
    window.location.reload();
  },

  // Verify credentials locally against synced users cache (keeps UI response synchronous)
  verifyCredentials(username, password, role) {
    const user = this._usersCache.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password && 
      u.role === role
    );
    return user || null;
  }
};
