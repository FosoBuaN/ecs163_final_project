// Altitude data processor for park elevation data
class AltitudeProcessor {
    constructor() {
        this.data = {}; // park_id -> {altitude, longitude, latitude, park_name, city, state, country}
        this.requestDelay = 1000; // 1 second between requests to stay under 1 RPS
        this.requestCount = 0;
        this.maxMonthlyRequests = 1000;
    }

    // Sleep function for rate limiting
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Make altitude API call with rate limiting
    async makeAltitudeRequest(longitude, latitude) {
        if (this.requestCount >= this.maxMonthlyRequests) {
            console.warn(`Monthly request limit of ${this.maxMonthlyRequests} reached. Skipping further requests.`);
            return null;
        }

        const url = `https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`;
        
        try {
            // Add delay to respect rate limit (1 RPS)
            if (this.requestCount > 0) {
                await this.sleep(this.requestDelay);
            }

            console.log(`Making altitude request ${this.requestCount + 1}: ${latitude}, ${longitude}`);
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Baseball Park Altitude Mapper for Data Visualization'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.requestCount++;

            if (data && data.results && data.results.length > 0) {
                return data.results[0].elevation;
            } else {
                console.warn(`No altitude results found for: ${longitude}, ${latitude}`);
                return null;
            }

        } catch (error) {
            console.error(`Error getting altitude for ${longitude}, ${latitude}:`, error);
            return null;
        }
    }

    // Load location file and populate altitude data
    async loadLocationFile(locationFile) {
        try {
            console.log(`Loading location data from: ${locationFile}`);
            
            let locationData;
            
            // Check if location file exists by attempting to load it
            try {
                if (typeof locationFile === 'string') {
                    const response = await fetch(locationFile);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${locationFile}`);
                    }
                    const text = await response.text();
                    locationData = d3.csvParse(text);
                } else {
                    locationData = locationFile;
                }
            } catch (fetchError) {
                console.warn(`Location file ${locationFile} does not exist. Need to run location processing first.`);
                
                // Check if we can create location data
                if (window.LocationProcessor) {
                    console.log('Running location processing...');
                    const locationProcessor = new window.LocationProcessor();
                    
                    // Try to load park data first
                    const parkLoadSuccess = await locationProcessor.loadParkFile('data/park.csv');
                    if (parkLoadSuccess) {
                        const exportSuccess = await locationProcessor.exportFile();
                        if (exportSuccess) {
                            console.log('Location processing completed. Please reload the location file.');
                        }
                    }
                }
                
                throw new Error(`Location file not available and could not be created`);
            }

            console.log(`Loaded ${locationData.length} location records`);

            // Process each location
            for (let i = 0; i < locationData.length; i++) {
                const location = locationData[i];
                const parkId = location.park_id;
                const longitude = parseFloat(location.longitude);
                const latitude = parseFloat(location.latitude);

                // Skip if coordinates are invalid
                if (isNaN(longitude) || isNaN(latitude)) {
                    console.log(`Skipping ${parkId}: invalid coordinates`);
                    continue;
                }

                console.log(`Processing location ${i + 1}/${locationData.length}: ${location.park_name} (${parkId})`);

                // Initialize data object for this park
                this.data[parkId] = {
                    park_name: location.park_name || '',
                    city: location.city || '',
                    state: location.state || '',
                    country: location.country || '',
                    longitude: longitude,
                    latitude: latitude,
                    altitude: null
                };

                // Make altitude request
                const altitude = await this.makeAltitudeRequest(longitude, latitude);
                
                if (altitude !== null) {
                    this.data[parkId].altitude = altitude;
                    console.log(`✓ Got altitude for ${location.park_name}: ${altitude}m`);
                } else {
                    console.log(`✗ Failed to get altitude for ${location.park_name}`);
                }

                // Progress update
                if ((i + 1) % 10 === 0) {
                    console.log(`Progress: ${i + 1}/${locationData.length} locations processed`);
                }
            }

            console.log(`Altitude processing complete. Successfully got altitude for ${Object.values(this.data).filter(p => p.altitude !== null).length}/${locationData.length} locations`);
            return true;

        } catch (error) {
            console.error('Error loading location file:', error);
            return false;
        }
    }

    // Export data to CSV file
    async exportFile() {
        try {
            if (Object.keys(this.data).length === 0) {
                console.warn('No data to export');
                return false;
            }

            // Prepare CSV data
            const csvData = [];
            
            // Add header
            csvData.push(['park_id', 'altitude', 'longitude', 'latitude', 'park_name', 'city', 'state', 'country']);

            // Add data rows
            Object.keys(this.data).forEach(parkId => {
                const park = this.data[parkId];
                csvData.push([
                    parkId,
                    park.altitude || '',
                    park.longitude || '',
                    park.latitude || '',
                    park.park_name || '',
                    park.city || '',
                    park.state || '',
                    park.country || ''
                ]);
            });

            // Convert to CSV string
            const csvContent = csvData.map(row => 
                row.map(field => {
                    // Handle fields that might contain commas or quotes
                    if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
                        return `"${field.replace(/"/g, '""')}"`;
                    }
                    return field;
                }).join(',')
            ).join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'altitudeMap.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }

            console.log(`Successfully exported altitude data for ${Object.keys(this.data).length} parks`);
            return true;

        } catch (error) {
            console.error('Error exporting file:', error);
            return false;
        }
    }

    // Get current data
    getData() {
        return this.data;
    }

    // Get statistics
    getStats() {
        const total = Object.keys(this.data).length;
        const withAltitude = Object.values(this.data).filter(p => p.altitude !== null).length;
        const altitudes = Object.values(this.data)
            .filter(p => p.altitude !== null)
            .map(p => p.altitude);
        
        return {
            total: total,
            withAltitude: withAltitude,
            failed: total - withAltitude,
            requestsMade: this.requestCount,
            minAltitude: altitudes.length > 0 ? Math.min(...altitudes) : null,
            maxAltitude: altitudes.length > 0 ? Math.max(...altitudes) : null,
            avgAltitude: altitudes.length > 0 ? altitudes.reduce((a, b) => a + b, 0) / altitudes.length : null
        };
    }
}

// Export for use in other files
window.AltitudeProcessor = AltitudeProcessor;