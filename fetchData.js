// Updated fetchData.js to load batting.csv, salary.csv, and team.csv
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

// Load batting, salary, and team datasets
async function loadData() {
    const [battingData, salaryData, teamData] = await Promise.all([
        loadCSV('data/batting.csv'),
        loadCSV('data/salary.csv'),
        loadCSV('data/team.csv') 
    ]);
    
    return { battingData, salaryData, teamData };
}