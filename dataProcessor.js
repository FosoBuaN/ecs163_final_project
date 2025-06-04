// Data processor for Sankey visualization: Team -> Salary -> Performance

class DataProcessor {
    constructor() {
        this.nodes = [];
        this.links = [];
        this.currentYear = 2015; // Default year - within range of both datasets
    }

    // Calculate win percentage as performance metric
    calculateWinPercentage(wins, losses) {
        const totalGames = wins + losses;
        return totalGames > 0 ? wins / totalGames : 0;
    }

    // Categorize performance into levels
    categorizePerformance(winPercentage) {
        if (winPercentage >= 0.6) return 'High Performance';
        if (winPercentage >= 0.5) return 'Medium Performance';
        return 'Low Performance';
    }

    // Categorize salary into ranges (based on MLB salary analysis)
    categorizeSalary(avgSalary) {
        if (avgSalary >= 6000000) return 'High Salary';       // Top tier teams (>$6M avg)
        if (avgSalary >= 2500000) return 'Medium Salary';     // Middle tier teams ($2.5M-$6M avg)
        return 'Low Salary';                                   // Budget teams (<$2.5M avg)
    }

    // Process team salary data for a given year
    processTeamSalaries(salaryData, year) {
        const yearSalaries = salaryData.filter(d => +d.year === year);
        const teamSalaries = {};

        yearSalaries.forEach(row => {
            const teamId = row.team_id;
            const salary = +row.salary;
            
            if (!teamSalaries[teamId]) {
                teamSalaries[teamId] = [];
            }
            teamSalaries[teamId].push(salary);
        });

        // Calculate average salary per team
        const teamAvgSalaries = {};
        Object.keys(teamSalaries).forEach(teamId => {
            const salaries = teamSalaries[teamId];
            const avgSalary = salaries.reduce((sum, sal) => sum + sal, 0) / salaries.length;
            teamAvgSalaries[teamId] = avgSalary;
        });

        return teamAvgSalaries;
    }

    // Process data for Sankey visualization
    processDataForYear(teamData, salaryData, year = this.currentYear) {
        console.log(`Processing data for year ${year}`);
        console.log(`Team data entries for ${year}:`, teamData.filter(d => +d.year === year).length);
        console.log(`Salary data entries for ${year}:`, salaryData.filter(d => +d.year === year).length);
        
        this.currentYear = year;
        this.nodes = [];
        this.links = [];

        // Filter team data for the specified year
        const yearTeamData = teamData.filter(d => +d.year === year);
        
        // Get team salary data
        const teamSalaries = this.processTeamSalaries(salaryData, year);
        console.log(`Team salaries calculated:`, Object.keys(teamSalaries).length);

        // Debug: Log some salary examples
        const salaryValues = Object.values(teamSalaries);
        if (salaryValues.length > 0) {
            console.log(`Salary range: $${Math.min(...salaryValues).toFixed(0)} - $${Math.max(...salaryValues).toFixed(0)}`);
            console.log(`Average team salary: $${(salaryValues.reduce((a,b) => a+b, 0) / salaryValues.length).toFixed(0)}`);
        }

        // Create nodes sets
        const teams = new Map(); // Map to store team name -> team_id mapping
        const salaryRanges = new Set(['Low Salary', 'Medium Salary', 'High Salary']);
        const performanceLevels = new Set(['Low Performance', 'Medium Performance', 'High Performance']);

        // Process team data and create flows
        const flows = {}; // key: "source->target", value: count/value
        
        yearTeamData.forEach(team => {
            const teamName = team.name || team.team_id;
            const wins = +team.w || 0;
            const losses = +team.l || 0;
            const winPercentage = this.calculateWinPercentage(wins, losses);
            
            teams.set(teamName, team.team_id); // Store team name to ID mapping
            
            // Get team's average salary
            const avgSalary = teamSalaries[team.team_id] || 0;
            const salaryCategory = this.categorizeSalary(avgSalary);
            const performanceCategory = this.categorizePerformance(winPercentage);

            console.log(`${teamName}: wins=${wins}, losses=${losses}, winPct=${winPercentage.toFixed(3)}, avgSalary=${avgSalary.toFixed(0)}, salaryCategory=${salaryCategory}, performanceCategory=${performanceCategory}`);

            // Create flow: Team -> Salary Range
            const teamToSalary = `${teamName}->${salaryCategory}`;
            flows[teamToSalary] = (flows[teamToSalary] || 0) + 1;

            // Create flow: Salary Range -> Performance
            const salaryToPerformance = `${salaryCategory}->${performanceCategory}`;
            flows[salaryToPerformance] = (flows[salaryToPerformance] || 0) + 1;
        });

        console.log(`Processed ${teams.size} teams`);

        // Debug: Show salary category distribution
        const salaryCategoryCount = {};
        Object.keys(flows).forEach(flowKey => {
            if (flowKey.includes('->') && flowKey.includes('Salary')) {
                const [, target] = flowKey.split('->');
                if (target.includes('Salary')) {
                    salaryCategoryCount[target] = (salaryCategoryCount[target] || 0) + flows[flowKey];
                }
            }
        });
        console.log('Salary category distribution:', salaryCategoryCount);

        // Create nodes array - only include nodes that are actually used
        const nodeIndex = {};
        let index = 0;
        
        // Get unique nodes from flows
        const usedNodes = new Set();
        Object.keys(flows).forEach(flowKey => {
            const [source, target] = flowKey.split('->');
            usedNodes.add(source);
            usedNodes.add(target);
        });

        // Add team nodes (only used ones)
        teams.forEach((teamId, teamName) => {
            if (usedNodes.has(teamName)) {
                this.nodes.push({ id: index, name: teamName, category: 'team', teamId: teamId });
                nodeIndex[teamName] = index++;
            }
        });

        // Add salary range nodes (only used ones)
        const allSalaryRanges = ['Low Salary', 'Medium Salary', 'High Salary'];
        allSalaryRanges.forEach(range => {
            if (usedNodes.has(range)) {
                this.nodes.push({ id: index, name: range, category: 'salary' });
                nodeIndex[range] = index++;
            }
        });

        // Add performance level nodes (only used ones)
        const allPerformanceLevels = ['Low Performance', 'Medium Performance', 'High Performance'];
        allPerformanceLevels.forEach(level => {
            if (usedNodes.has(level)) {
                this.nodes.push({ id: index, name: level, category: 'performance' });
                nodeIndex[level] = index++;
            }
        });

        // Create links array
        Object.keys(flows).forEach(flowKey => {
            const [source, target] = flowKey.split('->');
            const sourceIndex = nodeIndex[source];
            const targetIndex = nodeIndex[target];
            const value = flows[flowKey];

            if (sourceIndex !== undefined && targetIndex !== undefined) {
                this.links.push({
                    source: sourceIndex,
                    target: targetIndex,
                    value: value
                });
            }
        });

        console.log(`Created ${this.nodes.length} nodes and ${this.links.length} links`);
        return { nodes: this.nodes, links: this.links };
    }

    // Get available years from the datasets
    getAvailableYears(teamData, salaryData) {
        const teamYears = new Set(teamData.map(d => +d.year));
        const salaryYears = new Set(salaryData.map(d => +d.year));
        
        // Find intersection of years
        const commonYears = [...teamYears].filter(year => salaryYears.has(year));
        return commonYears.sort((a, b) => b - a); // Sort descending (newest first)
    }

    // Get processed data for current year
    getCurrentData() {
        return { nodes: this.nodes, links: this.links, year: this.currentYear };
    }

    // Update year and reprocess data
    updateYear(year, teamData, salaryData) {
        return this.processDataForYear(teamData, salaryData, year);
    }
}

// Export for use in main.js
window.DataProcessor = DataProcessor;