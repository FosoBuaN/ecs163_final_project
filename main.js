//Designed with heavy use of GitHub Copilot - Enhanced with responsive design

// Main application logic
let teamData = [];
let salaryData = [];
let dataProcessor;
let sankeyChart;
let availableYears = [];
const startYear = 2004;

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
        
        // Initialize responsive Sankey chart
        // The chart will automatically size itself based on the container
        sankeyChart = new SankeyChart('body');

        
        
        let sliderContainer = document.getElementById('slider-container');
        if (!sliderContainer) {
            sliderContainer = document.createElement('div');
            sliderContainer.id = 'slider-container';
            sliderContainer.style.marginBottom = '20px';
            sliderContainer.style.marginTop = '20px';
            
            // Insert at the top of the body (or wherever you want it)
            document.body.appendChild(sliderContainer, document.body.firstChild);
        }

        // Now initialize the slider
        const slider = new D3Slider({
            container: sliderContainer, // Use the actual element, not getElementById
            yearValue: startYear,
            minValue: 1980,
            maxValue: 2015,
            callback: (value) => {
                console.log('Year changed to:', value);
                updateYear(value);
            }
        });
        
        // Get available years
        availableYears = dataProcessor.getAvailableYears(teamData, salaryData);
        console.log('Available years:', availableYears);
        
        // Process data for the most recent year with both datasets
        if (availableYears.length > 0) {
            const year = startYear; // Try 2010 to see if we get better distribution
            console.log(`Processing data for year: ${year}`);
            const processedData = dataProcessor.processDataForYear(teamData, salaryData, year);
            
            console.log('Processed data:');
            console.log('Nodes:', processedData.nodes);
            console.log('Links:', processedData.links);
            
            // Render the Sankey chart
            sankeyChart.render(processedData);
            slider.render();
            
            // Display data summary
            displayDataSummary(processedData, year);
        } else {
            console.warn('No common years found between team and salary data');
        }
        
    } catch (error) {
        console.error('Error initializing application:', error);
    }


    
    // Add resize test to window for debugging
    window.testResize = () => {
        if (sankeyChart) {
            sankeyChart.testResize();
        } else {
            console.log('SankeyChart not initialized yet');
        }
    };
    
    console.log('Application initialized. Type testResize() in console to test resize functionality.');
}

// Display a summary of the processed data with responsive positioning
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
    
    // Add summary info with responsive positioning
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'data-summary';
    
    // Responsive positioning and styling
    const isSmallScreen = window.innerWidth < 768;
    const summaryStyles = {
        position: 'fixed',
        top: isSmallScreen ? 'auto' : '10px',
        bottom: isSmallScreen ? '10px' : 'auto',
        right: '10px',
        background: 'white',
        padding: '15px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        fontSize: isSmallScreen ? '11px' : '12px',
        minWidth: isSmallScreen ? '180px' : '200px',
        maxWidth: isSmallScreen ? '180px' : '250px',
        zIndex: '1000'
    };
    
    // Apply styles
    Object.assign(summaryDiv.style, summaryStyles);
    
    summaryDiv.innerHTML = `
        <h3 style="margin-top: 0; font-size: ${isSmallScreen ? '14px' : '16px'};">Data Summary</h3>
        <p><strong>Year:</strong> ${summary.year}</p>
        <p><strong>Teams:</strong> ${summary.teams}</p>
        <p><strong>Salary Ranges:</strong> ${summary.salaryRanges}</p>
        <p><strong>Performance Levels:</strong> ${summary.performanceLevels}</p>
        <p><strong>Total Links:</strong> ${summary.totalLinks}</p>
        <p style="color: #666; font-size: ${isSmallScreen ? '9px' : '10px'};">See console for detailed data</p>
        ${isSmallScreen ? '<p style="color: #999; font-size: 9px;">Rotate device for better view</p>' : ''}
    `;
    
    document.body.appendChild(summaryDiv);
    
    // Add resize listener to reposition summary
    const repositionSummary = () => {
        const isSmallScreen = window.innerWidth < 768;
        summaryDiv.style.top = isSmallScreen ? 'auto' : '10px';
        summaryDiv.style.bottom = isSmallScreen ? '10px' : 'auto';
        summaryDiv.style.fontSize = isSmallScreen ? '11px' : '12px';
        summaryDiv.style.minWidth = isSmallScreen ? '180px' : '200px';
        summaryDiv.style.maxWidth = isSmallScreen ? '180px' : '250px';
        
        const h3 = summaryDiv.querySelector('h3');
        if (h3) h3.style.fontSize = isSmallScreen ? '14px' : '16px';
        
        const smallPs = summaryDiv.querySelectorAll('p[style*="font-size"]');
        smallPs.forEach(p => {
            if (p.textContent.includes('console')) {
                p.style.fontSize = isSmallScreen ? '9px' : '10px';
            }
        });
        
        // Update rotation message
        const rotateMsg = summaryDiv.querySelector('p[style*="color: #999"]');
        if (rotateMsg && !isSmallScreen) {
            rotateMsg.remove();
        } else if (!rotateMsg && isSmallScreen) {
            summaryDiv.innerHTML += '<p style="color: #999; font-size: 9px;">Rotate device for better view</p>';
        }
    };
    
    let resizeTimeout;
    const debouncedReposition = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(repositionSummary, 100);
    };
    
    window.addEventListener('resize', debouncedReposition);
}

// Function to update year
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

// Add some basic responsive styles to prevent horizontal scrolling
function addResponsiveStyles() {
    const style = document.createElement('style');
    style.textContent = `
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            overflow-x: auto;
            min-width: 400px;
        }
        
        svg {
            display: block;
            margin: 0 auto;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
        }
        
        @media (max-width: 480px) {
            body {
                padding: 5px;
            }
        }
        
        .sankey-tooltip {
            max-width: 200px;
            word-wrap: break-word;
        }
    `;
    document.head.appendChild(style);
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    addResponsiveStyles();
    init();
});

// Cleanup function for proper memory management
window.addEventListener('beforeunload', () => {
    if (sankeyChart && typeof sankeyChart.destroy === 'function') {
        sankeyChart.destroy();
    }
});