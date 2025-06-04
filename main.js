//Designed with heavy use of GitHub Copilot

// Main application logic
let teamData = [];
let salaryData = [];
let battingData = [];
let dataProcessor;
let sankeyChart;
let teamDetailChart;
let availableYears = [];

// Application state
let currentView = 'overview'; // 'overview' or 'team-detail'
let selectedTeamData = null; // Store currently selected team info

// Initialize the application
async function init() {
    try {
        console.log('Loading data...');
        const data = await loadData();
        teamData = data.teamData;
        salaryData = data.salaryData;
        battingData = data.battingData;
        
        console.log(`Loaded ${teamData.length} team records, ${salaryData.length} salary records, and ${battingData.length} batting records`);
        
        // Initialize data processor
        dataProcessor = new DataProcessor();
        
        // Initialize Sankey chart
        sankeyChart = new SankeyChart('body', 1000, 700);
        
        // Initialize team detail chart
        teamDetailChart = new TeamDetailChart('body', 600, 400);
        
        // Set up team click handler for Sankey chart
        sankeyChart.setTeamClickCallback(handleTeamSelection);
        
        // Set up back to overview handler for team detail chart
        teamDetailChart.setBackToOverviewCallback(handleBackToOverview);
        console.log('Back to overview callback set for team detail chart');
        
        // Get available years
        availableYears = dataProcessor.getAvailableYears(teamData, salaryData);
        console.log('Available years:', availableYears);
        
        // Initialize the year slider
        initializeYearSlider();
        
        // Process data for the initial year
        if (availableYears.length > 0) {
            const year = 2010; // Start with 2010 as default
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

// Initialize the year slider with proper range and event listeners
function initializeYearSlider() {
    const slider = document.getElementById('yearSlider');
    const yearDisplay = document.getElementById('yearDisplay');
    
    if (availableYears.length > 0) {
        const minYear = Math.min(...availableYears);
        const maxYear = Math.max(...availableYears);
        
        // Update slider attributes
        slider.min = minYear;
        slider.max = maxYear;
        slider.value = 2010; // Default to 2010 if available, otherwise use minYear
        
        // Update display
        yearDisplay.textContent = slider.value;
        
        console.log(`Year slider initialized: ${minYear} - ${maxYear}, default: ${slider.value}`);
        
        // Add event listener for slider changes
        slider.addEventListener('input', function(event) {
            const selectedYear = parseInt(event.target.value);
            yearDisplay.textContent = selectedYear;
            
            // Check if the selected year has data
            if (availableYears.includes(selectedYear)) {
                updateYear(selectedYear);
            } else {
                console.warn(`No data available for year ${selectedYear}`);
                // Find the closest available year
                const closestYear = availableYears.reduce((prev, curr) => 
                    Math.abs(curr - selectedYear) < Math.abs(prev - selectedYear) ? curr : prev
                );
                console.log(`Using closest available year: ${closestYear}`);
                updateYear(closestYear);
            }
        });
        
        // Add event listener for real-time updates while dragging
        slider.addEventListener('change', function(event) {
            const selectedYear = parseInt(event.target.value);
            console.log(`Year slider changed to: ${selectedYear}`);
        });
    } else {
        // Disable slider if no years available
        slider.disabled = true;
        yearDisplay.textContent = 'No data';
        console.warn('No years available - slider disabled');
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

// Function to update year (for interactivity)
function updateYear(year) {
    if (dataProcessor && teamData.length > 0 && salaryData.length > 0) {
        console.log(`Updating to year: ${year}`);
        
        // Update the year display
        const yearDisplay = document.getElementById('yearDisplay');
        if (yearDisplay) {
            yearDisplay.textContent = year;
        }
        
        // Update the slider value if it's different
        const slider = document.getElementById('yearSlider');
        if (slider && parseInt(slider.value) !== year) {
            slider.value = year;
        }
        
        // Update based on current view
        if (currentView === 'overview') {
            // Update Sankey chart
            const processedData = dataProcessor.updateYear(year, teamData, salaryData);
            sankeyChart.render(processedData);
            displayDataSummary(processedData, year);
            return processedData;
        } else if (currentView === 'team-detail' && selectedTeamData) {
            // Update team detail chart with new year
            const battingStats = teamDetailChart.calculateBattingStats(battingData, selectedTeamData.teamId, year);
            if (battingStats) {
                teamDetailChart.render(battingStats, selectedTeamData.teamName);
            }
        }
    }
    return null;
}

// Function to handle team selection from Sankey chart
function handleTeamSelection(teamName, teamId) {
    console.log(`Team selected: ${teamName} (${teamId})`);
    
    // Store selected team data
    selectedTeamData = { teamName, teamId };
    
    // Switch to team detail view
    currentView = 'team-detail';
    
    // Fade out the Sankey chart
    sankeyChart.fadeOut();
    
    // Hide the data summary
    const existingSummary = document.querySelector('.data-summary');
    if (existingSummary) {
        existingSummary.style.display = 'none';
    }
    
    // Get current year from the slider
    const slider = document.getElementById('yearSlider');
    const currentYear = parseInt(slider.value);
    
    // Calculate batting stats for the selected team
    const battingStats = teamDetailChart.calculateBattingStats(battingData, teamId, currentYear);
    
    if (battingStats) {
        console.log('Batting stats calculated:', battingStats);
        teamDetailChart.render(battingStats, teamName);
        teamDetailChart.show();
        
        // Update controls styling
        updateControlsForView();
    } else {
        console.warn(`No batting data available for ${teamName} in ${currentYear}`);
        alert(`No batting data available for ${teamName} in ${currentYear}`);
        // Reset to overview if no data
        handleBackToOverview();
    }
}

// Function to handle back to overview action
function handleBackToOverview() {
    console.log('Returning to overview');
    
    // Switch back to overview
    currentView = 'overview';
    selectedTeamData = null;
    
    // Fade in the Sankey chart
    sankeyChart.fadeIn();
    
    // Show the data summary again
    const existingSummary = document.querySelector('.data-summary');
    if (existingSummary) {
        existingSummary.style.display = 'block';
    }
    
    // Hide team detail chart
    teamDetailChart.hide();
    
    // Update controls styling
    updateControlsForView();
}

// Function to update controls styling based on view
function updateControlsForView() {
    const controlsContainer = document.querySelector('.controls-container');
    const controlsTitle = document.querySelector('.controls-title');
    
    if (currentView === 'team-detail' && selectedTeamData) {
        controlsContainer.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%)';
        controlsContainer.style.borderColor = '#1f77b4';
        controlsContainer.style.borderWidth = '2px';
        controlsTitle.textContent = 'Time Controls';
    } else {
        controlsContainer.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
        controlsContainer.style.borderColor = '#e9ecef';
        controlsContainer.style.borderWidth = '1px';
        controlsTitle.textContent = 'Time Controls';
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', init);