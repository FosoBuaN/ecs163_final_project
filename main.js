//Designed with heavy use of GitHub Copilot

// Main application logic
let teamData = [];
let salaryData = [];
let dataProcessor;
let sankeyChart;
let availableYears = [];

// Initialize the application
async function init() {
    try {
        console.log('Loading data...');
        const data = await loadData();
        teamData = data.teamData;
        salaryData = data.salaryData;
        
        console.log(`Loaded ${teamData.length} team records and ${salaryData.length} salary records`);
        
        // Initialize data processor
        dataProcessor = new DataProcessor();
        
        // Initialize Sankey chart
        sankeyChart = new SankeyChart('body', 1000, 700);
        
        // Get available years
        availableYears = dataProcessor.getAvailableYears(teamData, salaryData);
        console.log('Available years:', availableYears);
        
        // Process data for the most recent year with both datasets
        if (availableYears.length > 0) {
            const year = 2010; // Try 2010 to see if we get better distribution
            console.log(`Processing data for year: ${year}`);
            const processedData = dataProcessor.processDataForYear(teamData, salaryData, year);
            
            console.log('Processed data:');
            console.log('Nodes:', processedData.nodes);
            console.log('Links:', processedData.links);
            
            // Render the Sankey chart
            sankeyChart.render(processedData);
            
            // Display data summary
            displayDataSummary(processedData, year);
        } else {
            console.warn('No common years found between team and salary data');
        }
        
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

// Display a summary of the processed data
function displayDataSummary(data, year) {
    const summary = {
        year: year,
        totalNodes: data.nodes.length,
        totalLinks: data.links.length,
        teams: data.nodes.filter(n => n.category === 'team').length,
        salaryRanges: data.nodes.filter(n => n.category === 'salary').length,
        performanceLevels: data.nodes.filter(n => n.category === 'performance').length
    };
    
    console.log('Data Summary:', summary);
    
    // Remove existing summary if present
    const existingSummary = document.querySelector('.data-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    // Add summary info
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'data-summary';
    summaryDiv.style.cssText = `
        position: absolute; 
        top: 10px; 
        right: 10px; 
        background: white; 
        padding: 15px; 
        border: 1px solid #ccc;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        font-size: 12px;
        min-width: 200px;
    `;
    
    summaryDiv.innerHTML = `
        <h3 style="margin-top: 0;">Data Summary</h3>
        <p><strong>Year:</strong> ${summary.year}</p>
        <p><strong>Teams:</strong> ${summary.teams}</p>
        <p><strong>Salary Ranges:</strong> ${summary.salaryRanges}</p>
        <p><strong>Performance Levels:</strong> ${summary.performanceLevels}</p>
        <p><strong>Total Links:</strong> ${summary.totalLinks}</p>
        <p style="color: #666; font-size: 10px;">See console for detailed data</p>
    `;
    
    document.body.appendChild(summaryDiv);
}

// Function to update year (for future interactivity)
function updateYear(year) {
    if (dataProcessor && teamData.length > 0 && salaryData.length > 0) {
        console.log(`Updating to year: ${year}`);
        const processedData = dataProcessor.updateYear(year, teamData, salaryData);
        sankeyChart.render(processedData);
        displayDataSummary(processedData, year);
        return processedData;
    }
    return null;
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', init);