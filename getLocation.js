// Location data processor for park geocoding
class LocationProcessor {
    constructor() {
        this.data = {}; // park_id -> {longitude, latitude, park_name, city, state, country}
        this.requestDelay = 1000; // 1 second between requests to respect rate limit
        this.requestCount = 0;
        this.maxDailyRequests = 2500;
    }

    // Sleep function for rate limiting
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Format query string for API call
    formatQuery(parkName, city, state, country) {
        // Replace spaces with + and handle empty values
        const parts = [parkName, city, state, country]
            .filter(part => part && part.trim())
            .map(part => part.trim().replace(/\s+/g, '+'));
        return parts.join('+');
    }

    // Make geocoding API call with rate limiting
    async makeGeocodingRequest(parkName, city, state, country) {
        if (this.requestCount >= this.maxDailyRequests) {
            console.warn(`Daily request limit of ${this.maxDailyRequests} reached. Skipping further requests.`);
            return null;
        }

        const query = this.formatQuery(parkName, city, state, country);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
        
        try {
            // Add delay to respect rate limit (1 request per second)
            if (this.requestCount > 0) {
                await this.sleep(this.requestDelay);
            }

            console.log(`Making request ${this.requestCount + 1}: ${query}`);
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Baseball Park Location Mapper for Data Visualization',
                    'Referer': window.location.origin
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.requestCount++;

            if (data && data.length > 0) {
                return {
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon)
                };
            } else {
                console.warn(`No results found for: ${query}`);
                return null;
            }

        } catch (error) {
            console.error(`Error geocoding ${query}:`, error);
            return null;
        }
    }

    // Load park file and populate data with geocoding
    async loadParkFile(parkFile) {
        try {
            console.log(`Loading park data from: ${parkFile}`);
            
            // Load CSV data
            let parkData;
            if (typeof parkFile === 'string') {
                // If it's a filename, fetch it
                const response = await fetch(parkFile);
                const text = await response.text();
                parkData = d3.csvParse(text);
            } else {
                // If it's already parsed data
                parkData = parkFile;
            }

            console.log(`Loaded ${parkData.length} park records`);

            // Process each park
            for (let i = 0; i < parkData.length; i++) {
                const park = parkData[i];
                const parkId = park.park_id;
                const parkName = park.park_name || park.name || '';
                const city = park.city || '';
                const state = park.state || '';
                const country = park.country || 'US'; // Default to US

                console.log(`Processing park ${i + 1}/${parkData.length}: ${parkName} (${parkId})`);

                // Initialize data object for this park
                this.data[parkId] = {
                    park_name: parkName,
                    city: city,
                    state: state,
                    country: country,
                    longitude: null,
                    latitude: null
                };

                // Make geocoding request
                const coordinates = await this.makeGeocodingRequest(parkName, city, state, country);
                
                if (coordinates) {
                    this.data[parkId].longitude = coordinates.longitude;
                    this.data[parkId].latitude = coordinates.latitude;
                    console.log(`✓ Geocoded ${parkName}: ${coordinates.latitude}, ${coordinates.longitude}`);
                } else {
                    console.log(`✗ Failed to geocode ${parkName}`);
                }

                // Progress update
                if ((i + 1) % 10 === 0) {
                    console.log(`Progress: ${i + 1}/${parkData.length} parks processed`);
                }
            }

            console.log(`Geocoding complete. Successfully geocoded ${Object.values(this.data).filter(p => p.latitude && p.longitude).length}/${parkData.length} parks`);
            return true;

        } catch (error) {
            console.error('Error loading park file:', error);
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
            csvData.push(['park_id', 'longitude', 'latitude', 'park_name', 'city', 'state', 'country']);

            // Add data rows
            Object.keys(this.data).forEach(parkId => {
                const park = this.data[parkId];
                csvData.push([
                    parkId,
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
                link.setAttribute('download', 'locationMap.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }

            console.log(`Successfully exported location data for ${Object.keys(this.data).length} parks`);
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
        const geocoded = Object.values(this.data).filter(p => p.latitude && p.longitude).length;
        return {
            total: total,
            geocoded: geocoded,
            failed: total - geocoded,
            requestsMade: this.requestCount
        };
    }
}

// Export for use in other files
window.LocationProcessor = LocationProcessor;