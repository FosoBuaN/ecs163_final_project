//Designed with heavy use of GitHub Copilot - Enhanced with responsive design
// Updated to work with enhanced DataProcessor using batting.csv, salary.csv, and team.csv

// Main application logic
let battingData = [];
let salaryData = [];
let teamData = [];
let dataProcessor;
let sankeyChart;
let availableYears = [];
const startYear = 2004;

// // Updated loadData function to match DataProcessor expectations
// async function loadCSV(filename) {
//     try {
//         const response = await fetch(filename);
//         const text = await response.text();
//         return d3.csvParse(text);
//     } catch (error) {
//         console.error(`Error loading ${filename}:`, error);
//         return [];
//     }
// }

// // Load batting, salary, and team datasets
// async function loadData() {
//     const [battingData, salaryData, teamData] = await Promise.all([
//         loadCSV('data/batting.csv'),
//         loadCSV('data/salary.csv'),
//         loadCSV('data/team.csv')
//     ]);

//     return { battingData, salaryData, teamData };
// }

// Initialize the application
async function init() {
    try {
        console.log('Loading data...');
        const data = await loadData();
        battingData = data.battingData;
        salaryData = data.salaryData;
        teamData = data.teamData;

        console.log(`Loaded ${battingData.length} batting records, ${salaryData.length} salary records, and ${teamData.length} team records`);

        // Initialize data processor
        dataProcessor = new DataProcessor();

        // Initialize responsive Sankey chart
        // The chart will automatically size itself based on the container
        sankeyChart = new SankeyChart('body');

        // Create slider container
        let sliderContainer = document.getElementById('slider-container');
        if (!sliderContainer) {
            sliderContainer = document.createElement('div');
            sliderContainer.id = 'slider-container';
            sliderContainer.style.marginBottom = '20px';
            sliderContainer.style.marginTop = '20px';

            // Insert at the top of the body
            document.body.appendChild(sliderContainer, document.body.firstChild);
        }

        // Get available years first
        availableYears = dataProcessor.getAvailableYears(battingData, salaryData);
        console.log('Available years:', availableYears);

        if (availableYears.length === 0) {
            console.warn('No common years found between batting and salary data');
            return;
        }

        // Use the most recent available year or startYear if available
        const targetYear = availableYears.includes(startYear) ? startYear : availableYears[0];
        console.log(`Using year: ${targetYear}`);

        // Initialize the slider with available year range
        const minYear = Math.min(...availableYears);
        const maxYear = Math.max(...availableYears);

        const slider = new D3Slider({
            container: sliderContainer,
            yearValue: targetYear,
            minValue: minYear,
            maxValue: maxYear,
            callback: (value) => {
                console.log('Year changed to:', value);
                updateYear(value);
            }
        });

        // Process data for the target year (now includes teamData)
        console.log(`Processing data for year: ${targetYear}`);
        const processedData = dataProcessor.processDataForYear(battingData, salaryData, teamData, targetYear);

        console.log('Processed data:');
        console.log('Nodes:', processedData.nodes);
        console.log('Links:', processedData.links);

        if (processedData.nodes.length === 0) {
            console.warn('No data processed for the selected year');
            return;
        }

        // Render the Sankey chart
        sankeyChart.render(processedData);
        slider.render();

        // Display data summary
        displayDataSummary(processedData, targetYear);

        // Log detailed summary for debugging
        dataProcessor.logDetailedSummary();

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
        performanceLevels: data.nodes.filter(n => n.category === 'performance').length,
        totalPlayers: data.performanceStats ? data.performanceStats.totalPlayers : 'N/A'
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
        border: '1px solid #ccc',
        borderRadius: '5px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        fontSize: isSmallScreen ? '11px' : '12px',
        minWidth: isSmallScreen ? '180px' : '200px',
        maxWidth: isSmallScreen ? '180px' : '250px',
        zIndex: '1000',
        transition: 'all 0.3s ease'
    };

    // Apply styles
    Object.assign(summaryDiv.style, summaryStyles);

    // Create header with toggle button
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        padding: 10px 15px;
        margin: -15px -15px 0 -15px;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
        border-radius: 5px 5px 0 0;
        user-select: none;
    `;

    const titleSpan = document.createElement('span');
    titleSpan.style.cssText = `
        font-weight: bold;
        font-size: ${isSmallScreen ? '14px' : '16px'};
        margin: 0;
    `;
    titleSpan.textContent = 'Data Summary';

    const toggleButton = document.createElement('span');
    toggleButton.style.cssText = `
        font-size: 18px;
        transform: rotate(0deg);
        transition: transform 0.3s ease;
        color: #666;
    `;
    toggleButton.textContent = '▼';
    toggleButton.setAttribute('aria-label', 'Toggle summary details');

    headerDiv.appendChild(titleSpan);
    headerDiv.appendChild(toggleButton);

    // Create content div
    const contentDiv = document.createElement('div');
    contentDiv.className = 'summary-content';
    contentDiv.style.cssText = `
        padding: 15px;
        overflow: hidden;
        transition: max-height 0.3s ease, opacity 0.3s ease;
        max-height: 500px;
        opacity: 1;
    `;

    // Include performance statistics if available
    let performanceInfo = '';
    if (data.performanceStats) {
        const stats = data.performanceStats;
        performanceInfo = `
            <p><strong>Total Players:</strong> ${stats.totalPlayers}</p>
            <p><strong>Avg Score:</strong> ${stats.thresholds.average.toFixed(1)}</p>
            <p><strong>Score Range:</strong> ${stats.thresholds.low.toFixed(1)}-${stats.thresholds.max.toFixed(1)}</p>
        `;
    }

    contentDiv.innerHTML = `
        <p><strong>Year:</strong> ${summary.year}</p>
        <p><strong>Teams:</strong> ${summary.teams}</p>
        <p><strong>Salary Ranges:</strong> ${summary.salaryRanges}</p>
        <p><strong>Performance Levels:</strong> ${summary.performanceLevels}</p>
        <p><strong>Total Links:</strong> ${summary.totalLinks}</p>
        ${performanceInfo}
        <p style="color: #666; font-size: ${isSmallScreen ? '9px' : '10px'}; margin-bottom: 5px;">See console for detailed data</p>
        ${isSmallScreen ? '<p style="color: #999; font-size: 9px; margin-bottom: 0;">Rotate device for better view</p>' : ''}
    `;

    // Add toggle functionality
    let isCollapsed = false;
    const toggleSummary = () => {
        isCollapsed = !isCollapsed;

        if (isCollapsed) {
            contentDiv.style.maxHeight = '0px';
            contentDiv.style.opacity = '0';
            contentDiv.style.paddingTop = '0';
            contentDiv.style.paddingBottom = '0';
            toggleButton.style.transform = 'rotate(-90deg)';
            toggleButton.setAttribute('aria-label', 'Expand summary details');
        } else {
            contentDiv.style.maxHeight = '500px';
            contentDiv.style.opacity = '1';
            contentDiv.style.paddingTop = '15px';
            contentDiv.style.paddingBottom = '15px';
            toggleButton.style.transform = 'rotate(0deg)';
            toggleButton.setAttribute('aria-label', 'Collapse summary details');
        }
    };

    headerDiv.addEventListener('click', toggleSummary);

    // Add keyboard support
    headerDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSummary();
        }
    });
    headerDiv.setAttribute('tabindex', '0');
    headerDiv.setAttribute('role', 'button');

    // Assemble the summary
    summaryDiv.appendChild(headerDiv);
    summaryDiv.appendChild(contentDiv);
    document.body.appendChild(summaryDiv);

    // Add resize listener to reposition summary
    const repositionSummary = () => {
        const isSmallScreen = window.innerWidth < 768;
        summaryDiv.style.top = isSmallScreen ? 'auto' : '10px';
        summaryDiv.style.bottom = isSmallScreen ? '10px' : 'auto';
        summaryDiv.style.fontSize = isSmallScreen ? '11px' : '12px';
        summaryDiv.style.minWidth = isSmallScreen ? '180px' : '200px';
        summaryDiv.style.maxWidth = isSmallScreen ? '180px' : '250px';

        titleSpan.style.fontSize = isSmallScreen ? '14px' : '16px';

        const smallPs = contentDiv.querySelectorAll('p[style*="font-size"]');
        smallPs.forEach(p => {
            if (p.textContent.includes('console')) {
                p.style.fontSize = isSmallScreen ? '9px' : '10px';
            }
        });

        // Update rotation message
        const rotateMsg = contentDiv.querySelector('p[style*="color: #999"]');
        if (rotateMsg && !isSmallScreen) {
            rotateMsg.remove();
        } else if (!rotateMsg && isSmallScreen && !contentDiv.innerHTML.includes('Rotate device')) {
            contentDiv.innerHTML += '<p style="color: #999; font-size: 9px; margin-bottom: 0;">Rotate device for better view</p>';
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
    if (dataProcessor && battingData.length > 0 && salaryData.length > 0) {
        console.log(`Updating to year: ${year}`);

        // Check if the year has available data
        if (!availableYears.includes(year)) {
            console.warn(`Year ${year} not available in data. Available years:`, availableYears);
            return null;
        }

        // Now includes teamData parameter
        const processedData = dataProcessor.updateYear(year, battingData, salaryData, teamData);

        if (processedData.nodes.length === 0) {
            console.warn(`No data available for year ${year}`);
            return null;
        }

        sankeyChart.render(processedData);
        displayDataSummary(processedData, year);

        // Log updated summary
        dataProcessor.logDetailedSummary();

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
        
        .data-summary {
            transition: all 0.3s ease;
        }
        
        .slider-container {
            text-align: center;
            background: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);
}

// Global functions for debugging
window.getDataProcessor = () => dataProcessor;
window.getCurrentData = () => dataProcessor ? dataProcessor.getCurrentData() : null;
window.getAvailableYears = () => availableYears;
window.updateToYear = updateYear;

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