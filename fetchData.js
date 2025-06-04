// Data fetching utilities
async function loadCSV(filename) {
    try {
        const response = await fetch(filename);
        const text = await response.text();
        return d3.csvParse(text);
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return [];
    }
}

// Load all datasets
async function loadData() {
    const [teamData, salaryData, battingData] = await Promise.all([
        loadCSV('data/team.csv'),
        loadCSV('data/salary.csv'),
        loadCSV('data/batting.csv')
    ]);
    
    return { teamData, salaryData, battingData };
}
