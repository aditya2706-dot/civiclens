const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');

let cityDatasets = [];

// Load all GeoJSON files from the data directory
const loadData = () => {
    try {
        const dataDir = path.join(__dirname, '../data');
        if (fs.existsSync(dataDir)) {
            const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
            cityDatasets = files.map(file => {
                const content = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
                return {
                    name: file.replace('.json', '').replace(/_/g, ' '),
                    data: content
                };
            }).filter(d => d.data && d.data.features);
            console.log(`Loaded ${cityDatasets.length} spatial datasets.`);
        }
    } catch (error) {
        console.error("Failed to load ward data:", error.message);
    }
};

loadData();

/**
 * Detects the MCD ward from geographic coordinates using LOCAL GeoJSON only.
 * This avoids external API calls and rate limits (429 errors).
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string|null} - Ward ID/Name or null if not found in local data
 */
const getWardFromCoordinates = (lat, lng) => {
    if (!lat || !lng) return null;

    const point = turf.point([lng, lat]); // Turf uses [lng, lat]

    // Priority: Try GeoJSON Polygons
    for (const dataset of cityDatasets) {
        for (const feature of dataset.data.features) {
            try {
                if (feature.geometry && feature.geometry.type && turf.booleanPointInPolygon(point, feature)) {
                    const props = feature.properties;
                    // Detect Delhi properties
                    if (props.id && props.zone) {
                        return `Ward ${props.id} (Zone ${props.zone})`;
                    }
                    // Generic fallback for any other feature
                    return props.name || props.WardName || props.id || "Found Ward";
                }
            } catch (err) {
                continue;
            }
        }
    }

    // RETURNS NULL if not in local polygon. 
    // AI service will be used as a smart fallback later in the flow.
    return null;
};

module.exports = {
    getWardFromCoordinates
};
