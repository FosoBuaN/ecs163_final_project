// Enhanced Data processor for Sankey visualization: Team -> Salary -> Performance
// Now using batting.csv with player-level granularity and detailed record keeping
// Updated to include team.csv for proper team name display

class DataProcessor {
    constructor() {
        this.nodes = [];
        this.links = [];
        this.nodeDetails = {}; // Store player records for each node
        this.linkDetails = {}; // Store player records for each link
        this.currentYear = 2004;
        this.performanceStats = {}; // Store raw performance statistics
        this.teamLookup = {}; // Store team ID to team name mapping
    }

    // Initialize team lookup from team.csv data
    initializeTeamLookup(teamData) {
        this.teamLookup = {};
        teamData.forEach(team => {
            this.teamLookup[team.team_id] = team.name || team.team_id; // Fallback to team_id if name not available
        });
        console.log(`Initialized team lookup with ${Object.keys(this.teamLookup).length} teams`);
    }

    // Get team name from team ID
    getTeamName(teamId) {
        return this.teamLookup[teamId] || teamId; // Fallback to team_id if not found
    }

    // Calculate performance score: 0.5 * hits + doubles
    calculatePerformanceScore(hits, doubles) {
        const h = parseInt(hits) || 0;
        const d = parseInt(doubles) || 0;
        return 0.5 * h + d;
    }

    // Categorize performance into levels using percentiles
    categorizePerformance(score, percentileThresholds) {
        if (score >= percentileThresholds.high) return 'High Performance';
        if (score >= percentileThresholds.medium) return 'Medium Performance';
        return 'Low Performance';
    }

    // Categorize salary into ranges (keeping same logic as before)
    categorizeSalary(salary) {
        const sal = parseFloat(salary) || 0;
        if (sal >= 6000000) return 'High Salary';
        if (sal >= 2500000) return 'Medium Salary';
        return 'Low Salary';
    }

    // Calculate percentile thresholds for performance scores
    calculatePerformancePercentiles(scores) {
        const sortedScores = scores.sort((a, b) => a - b);
        const len = sortedScores.length;
        
        return {
            low: sortedScores[0],
            medium: sortedScores[Math.floor(len * 0.33)],
            high: sortedScores[Math.floor(len * 0.67)],
            max: sortedScores[len - 1],
            count: len,
            average: scores.reduce((a, b) => a + b, 0) / len
        };
    }

    // Process player batting and salary data for a given year
    processPlayerData(battingData, salaryData, year) {
        console.log(`Processing player data for year ${year}`);
        
        // Filter data for the specified year
        const yearBattingData = battingData.filter(d => parseInt(d.year) === year);
        const yearSalaryData = salaryData.filter(d => parseInt(d.year) === year);
        
        console.log(`Batting entries for ${year}:`, yearBattingData.length);
        console.log(`Salary entries for ${year}:`, yearSalaryData.length);

        // Create salary lookup by player_id
        const salaryLookup = {};
        yearSalaryData.forEach(row => {
            salaryLookup[row.player_id] = parseFloat(row.salary) || 0;
        });

        // Process batting data and calculate performance scores
        const playerRecords = [];
        const performanceScores = [];

        yearBattingData.forEach(player => {
            const playerId = player.player_id;
            const teamId = player.team_id;
            const hits = parseInt(player.h) || 0;
            const doubles = parseInt(player.double) || 0;
            const salary = salaryLookup[playerId];

            // Only include players with salary data
            if (salary !== undefined) {
                const score = this.calculatePerformanceScore(hits, doubles);
                performanceScores.push(score);

                const playerRecord = {
                    player_id: playerId,
                    year: year,
                    team_id: teamId,
                    team_name: this.getTeamName(teamId), // Add team name
                    hits: hits,
                    doubles: doubles,
                    performance_score: score,
                    salary: salary,
                    salary_category: this.categorizeSalary(salary)
                };

                playerRecords.push(playerRecord);
            }
        });

        console.log(`Players with both batting and salary data: ${playerRecords.length}`);

        // Calculate performance percentiles
        const percentileThresholds = this.calculatePerformancePercentiles([...performanceScores]);
        console.log('Performance percentiles:', percentileThresholds);

        // Store performance statistics
        this.performanceStats[year] = {
            thresholds: percentileThresholds,
            totalPlayers: playerRecords.length,
            rawScores: performanceScores
        };

        // Add performance categories to player records
        playerRecords.forEach(player => {
            player.performance_category = this.categorizePerformance(
                player.performance_score, 
                percentileThresholds
            );
        });

        return playerRecords;
    }

    // Aggregate player data by team
    aggregateByTeam(playerRecords) {
        const teamAggregation = {};

        playerRecords.forEach(player => {
            const teamId = player.team_id;
            
            if (!teamAggregation[teamId]) {
                teamAggregation[teamId] = {
                    team_id: teamId,
                    team_name: player.team_name, // Use team name from player record
                    players: [],
                    total_salary: 0,
                    total_performance_score: 0,
                    salary_categories: { 'Low Salary': 0, 'Medium Salary': 0, 'High Salary': 0 },
                    performance_categories: { 'Low Performance': 0, 'Medium Performance': 0, 'High Performance': 0 }
                };
            }

            const team = teamAggregation[teamId];
            team.players.push(player);
            team.total_salary += player.salary;
            team.total_performance_score += player.performance_score;
            team.salary_categories[player.salary_category]++;
            team.performance_categories[player.performance_category]++;
        });

        // Calculate team averages and determine team categories
        Object.values(teamAggregation).forEach(team => {
            const playerCount = team.players.length;
            team.avg_salary = team.total_salary / playerCount;
            team.avg_performance_score = team.total_performance_score / playerCount;
            
            // Team category based on average salary
            team.team_salary_category = this.categorizeSalary(team.avg_salary);
            
            // Team performance category based on average performance score
            team.team_performance_category = this.categorizePerformance(
                team.avg_performance_score,
                this.performanceStats[this.currentYear].thresholds
            );
        });

        return teamAggregation;
    }

    // Process data for Sankey visualization with detailed record keeping
    processDataForYear(battingData, salaryData, teamData, year = this.currentYear) {
        console.log(`\n=== Processing Sankey data for year ${year} ===`);
        
        // Initialize team lookup if teamData is provided
        if (teamData && teamData.length > 0) {
            this.initializeTeamLookup(teamData);
        }
        
        this.currentYear = year;
        this.nodes = [];
        this.links = [];
        this.nodeDetails = {};
        this.linkDetails = {};

        // Process player data
        const playerRecords = this.processPlayerData(battingData, salaryData, year);
        if (playerRecords.length === 0) {
            console.warn('No player records found for the given year');
            return { nodes: [], links: [] };
        }

        // Aggregate by team
        const teamAggregation = this.aggregateByTeam(playerRecords);
        const teams = Object.values(teamAggregation);
        
        console.log(`Processed ${teams.length} teams with player data`);

        // Create node sets and flows
        const flows = {}; // key: "source->target", value: count
        const usedNodes = new Set();
        
        // Process each team and create flows
        teams.forEach(team => {
            const teamName = team.team_name; // Now using team name instead of team_id
            const salaryCategory = team.team_salary_category;
            const performanceCategory = team.team_performance_category;

            // Track used nodes
            usedNodes.add(teamName);
            usedNodes.add(salaryCategory);
            usedNodes.add(performanceCategory);

            // Create flows
            const teamToSalary = `${teamName}->${salaryCategory}`;
            const salaryToPerformance = `${salaryCategory}->${performanceCategory}`;

            flows[teamToSalary] = (flows[teamToSalary] || 0) + 1;
            flows[salaryToPerformance] = (flows[salaryToPerformance] || 0) + 1;

            console.log(`${teamName}: ${team.players.length} players, avg_salary=${team.avg_salary.toFixed(0)}, avg_score=${team.avg_performance_score.toFixed(2)}, ${salaryCategory} -> ${performanceCategory}`);
        });

        // Create nodes array with detailed records
        const nodeIndex = {};
        let index = 0;

        // Add team nodes
        teams.forEach(team => {
            const teamName = team.team_name; // Use team name
            if (usedNodes.has(teamName)) {
                this.nodes.push({ 
                    id: index, 
                    name: teamName, 
                    category: 'team',
                    value: team.players.length // Number of players
                });
                
                // Store detailed player records for this node
                this.nodeDetails[index] = {
                    nodeId: index,
                    nodeName: teamName,
                    nodeCategory: 'team',
                    teamId: team.team_id, // Keep team_id for reference
                    totalPlayers: team.players.length,
                    avgSalary: team.avg_salary,
                    avgPerformanceScore: team.avg_performance_score,
                    players: team.players
                };
                
                nodeIndex[teamName] = index++;
            }
        });

        // Add salary range nodes
        const salaryRanges = ['Low Salary', 'Medium Salary', 'High Salary'];
        salaryRanges.forEach(range => {
            if (usedNodes.has(range)) {
                // Count players in this salary range
                const playersInRange = playerRecords.filter(p => p.salary_category === range);
                
                this.nodes.push({ 
                    id: index, 
                    name: range, 
                    category: 'salary',
                    value: playersInRange.length
                });
                
                this.nodeDetails[index] = {
                    nodeId: index,
                    nodeName: range,
                    nodeCategory: 'salary',
                    totalPlayers: playersInRange.length,
                    players: playersInRange
                };
                
                nodeIndex[range] = index++;
            }
        });

        // Add performance level nodes
        const performanceLevels = ['Low Performance', 'Medium Performance', 'High Performance'];
        performanceLevels.forEach(level => {
            if (usedNodes.has(level)) {
                // Count players in this performance range
                const playersInLevel = playerRecords.filter(p => p.performance_category === level);
                
                this.nodes.push({ 
                    id: index, 
                    name: level, 
                    category: 'performance',
                    value: playersInLevel.length
                });
                
                this.nodeDetails[index] = {
                    nodeId: index,
                    nodeName: level,
                    nodeCategory: 'performance',
                    totalPlayers: playersInLevel.length,
                    players: playersInLevel
                };
                
                nodeIndex[level] = index++;
            }
        });

        // Create links array with detailed records
        Object.keys(flows).forEach(flowKey => {
            const [source, target] = flowKey.split('->');
            const sourceIndex = nodeIndex[source];
            const targetIndex = nodeIndex[target];
            const value = flows[flowKey];

            if (sourceIndex !== undefined && targetIndex !== undefined) {
                const linkId = this.links.length;
                
                this.links.push({
                    source: sourceIndex,
                    target: targetIndex,
                    value: value
                });

                // Store detailed records for this link
                let linkPlayers = [];
                
                if (source.includes('Salary') && target.includes('Performance')) {
                    // Salary -> Performance link
                    linkPlayers = playerRecords.filter(p => 
                        p.salary_category === source && p.performance_category === target
                    );
                } else {
                    // Team -> Salary link
                    const team = teams.find(t => t.team_name === source); // Use team_name for matching
                    if (team) {
                        linkPlayers = team.players.filter(p => p.salary_category === target);
                    }
                }

                this.linkDetails[linkId] = {
                    linkId: linkId,
                    source: source,
                    target: target,
                    sourceIndex: sourceIndex,
                    targetIndex: targetIndex,
                    value: value,
                    totalPlayers: linkPlayers.length,
                    players: linkPlayers
                };
            }
        });

        console.log(`Created ${this.nodes.length} nodes and ${this.links.length} links`);
        console.log('Performance statistics:', this.performanceStats[year]);
        
        return { 
            nodes: this.nodes, 
            links: this.links,
            nodeDetails: this.nodeDetails,
            linkDetails: this.linkDetails,
            performanceStats: this.performanceStats[year]
        };
    }

    // Get available years from the datasets
    getAvailableYears(battingData, salaryData) {
        const battingYears = new Set(battingData.map(d => parseInt(d.year)));
        const salaryYears = new Set(salaryData.map(d => parseInt(d.year)));
        
        // Find intersection of years
        const commonYears = [...battingYears].filter(year => salaryYears.has(year));
        return commonYears.sort((a, b) => b - a); // Sort descending (newest first)
    }

    // Get processed data for current year
    getCurrentData() {
        return { 
            nodes: this.nodes, 
            links: this.links, 
            year: this.currentYear,
            nodeDetails: this.nodeDetails,
            linkDetails: this.linkDetails,
            performanceStats: this.performanceStats[this.currentYear]
        };
    }

    // Update year and reprocess data
    updateYear(year, battingData, salaryData, teamData) {
        return this.processDataForYear(battingData, salaryData, teamData, year);
    }

    // Get detailed information for a specific node
    getNodeDetails(nodeId) {
        return this.nodeDetails[nodeId] || null;
    }

    // Get detailed information for a specific link
    getLinkDetails(linkId) {
        return this.linkDetails[linkId] || null;
    }

    // Get performance statistics for current or specified year
    getPerformanceStats(year = this.currentYear) {
        return this.performanceStats[year] || null;
    }

    // Debug method to log detailed information
    logDetailedSummary() {
        console.log('\n=== DETAILED DATA SUMMARY ===');
        console.log(`Year: ${this.currentYear}`);
        console.log(`Total Nodes: ${this.nodes.length}`);
        console.log(`Total Links: ${this.links.length}`);
        
        console.log('\nNode Details:');
        Object.values(this.nodeDetails).forEach(node => {
            console.log(`  ${node.nodeName} (${node.nodeCategory}): ${node.totalPlayers} players`);
        });
        
        console.log('\nLink Details:');
        Object.values(this.linkDetails).forEach(link => {
            console.log(`  ${link.source} -> ${link.target}: ${link.totalPlayers} players`);
        });

        if (this.performanceStats[this.currentYear]) {
            const stats = this.performanceStats[this.currentYear];
            console.log('\nPerformance Statistics:');
            console.log(`  Total Players: ${stats.totalPlayers}`);
            console.log(`  Score Range: ${stats.thresholds.low.toFixed(2)} - ${stats.thresholds.max.toFixed(2)}`);
            console.log(`  Average Score: ${stats.thresholds.average.toFixed(2)}`);
            console.log(`  33rd Percentile: ${stats.thresholds.medium.toFixed(2)}`);
            console.log(`  67th Percentile: ${stats.thresholds.high.toFixed(2)}`);
        }
    }
}

// Export for use in main.js
window.DataProcessor = DataProcessor;