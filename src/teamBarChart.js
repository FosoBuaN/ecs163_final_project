// Team Statistics Bar Chart
// Shows average OBP and Slugging Average for selected team vs league average

class TeamBarChart {
    constructor(container) {
        this.container = container;
        this.margin = { top: 90, right: 20, bottom: 60, left: 80 }; // More top margin for legend
        this.width = 600;
        this.height = 400;
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
        
        this.isVisible = false;
        this.currentYear = null;
        this.currentTeam = null;
        
        this.initializeContainer();
    }
    
    initializeContainer() {
        // Create overlay container
        this.overlay = d3.select('body')
            .append('div')
            .attr('class', 'team-bar-chart-overlay')
            .style('position', 'fixed')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            // Leave 120px at the bottom for the slider
            .style('height', 'calc(100% - 120px)')
            .style('background', 'rgba(0, 0, 0, 0.7)')
            .style('z-index', '1000')
            .style('display', 'none')
            .style('justify-content', 'center')
            .style('align-items', 'center');
            
        // Create chart container
        this.chartContainer = this.overlay
            .append('div')
            .attr('class', 'team-bar-chart-container')
            .style('background', 'white')
            .style('border-radius', '10px')
            .style('padding', '20px')
            .style('box-shadow', '0 4px 20px rgba(0,0,0,0.3)')
            .style('position', 'relative')
            .style('max-width', '90vw')
            .style('max-height', '90vh');
            
        // Add close button
        this.chartContainer
            .append('button')
            .attr('class', 'close-button')
            .style('position', 'absolute')
            .style('top', '10px')
            .style('right', '10px')
            .style('background', '#ff4444')
            .style('color', 'white')
            .style('border', 'none')
            .style('border-radius', '50%')
            .style('width', '30px')
            .style('height', '30px')
            .style('cursor', 'pointer')
            .style('font-size', '16px')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .text('×')
            .on('click', () => this.hide());
            
        // Create SVG
        this.svg = this.chartContainer
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
            
        this.g = this.svg
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
            
        // Click outside to close
        this.overlay.on('click', (event) => {
            if (event.target === this.overlay.node()) {
                this.hide();
            }
        });
    }
    
    // Calculate OBP (On-Base Percentage) = (H + BB + HBP) / (AB + BB + HBP + SF)
    calculateOBP(stats) {
        const h = parseFloat(stats.h) || 0;
        const bb = parseFloat(stats.bb) || 0;
        const hbp = parseFloat(stats.hbp) || 0;
        const ab = parseFloat(stats.ab) || 0;
        const sf = parseFloat(stats.sf) || 0;
        
        const denominator = ab + bb + hbp + sf;
        return denominator > 0 ? (h + bb + hbp) / denominator : 0;
    }
    
    // Calculate Slugging Average = Total Bases / At Bats
    // Total Bases = Singles + (2 * Doubles) + (3 * Triples) + (4 * Home Runs)
    calculateSluggingAverage(stats) {
        const h = parseFloat(stats.h) || 0;
        const doubles = parseFloat(stats.double) || 0;
        const triples = parseFloat(stats.triple) || 0;
        const hr = parseFloat(stats.hr) || 0;
        const ab = parseFloat(stats.ab) || 0;
        
        const singles = h - doubles - triples - hr;
        const totalBases = singles + (2 * doubles) + (3 * triples) + (4 * hr);
        
        return ab > 0 ? totalBases / ab : 0;
    }
    
    // Calculate team and league averages
    calculateAverages(battingData, teamId, year) {
        const yearData = battingData.filter(d => parseInt(d.year) === year);
        const teamData = yearData.filter(d => d.team_id === teamId);
        
        // Calculate team averages
        let teamTotalOBP = 0;
        let teamTotalSLG = 0;
        let teamPlayerCount = 0;
        
        teamData.forEach(player => {
            const obp = this.calculateOBP(player);
            const slg = this.calculateSluggingAverage(player);
            
            // Only include players with valid at-bats
            if (parseFloat(player.ab) > 0) {
                teamTotalOBP += obp;
                teamTotalSLG += slg;
                teamPlayerCount++;
            }
        });
        
        const teamAvgOBP = teamPlayerCount > 0 ? teamTotalOBP / teamPlayerCount : 0;
        const teamAvgSLG = teamPlayerCount > 0 ? teamTotalSLG / teamPlayerCount : 0;
        
        // Calculate league averages
        let leagueTotalOBP = 0;
        let leagueTotalSLG = 0;
        let leaguePlayerCount = 0;
        
        yearData.forEach(player => {
            const obp = this.calculateOBP(player);
            const slg = this.calculateSluggingAverage(player);
            
            // Only include players with valid at-bats
            if (parseFloat(player.ab) > 0) {
                leagueTotalOBP += obp;
                leagueTotalSLG += slg;
                leaguePlayerCount++;
            }
        });
        
        const leagueAvgOBP = leaguePlayerCount > 0 ? leagueTotalOBP / leaguePlayerCount : 0;
        const leagueAvgSLG = leaguePlayerCount > 0 ? leagueTotalSLG / leaguePlayerCount : 0;
        
        return {
            team: {
                obp: teamAvgOBP,
                slg: teamAvgSLG,
                playerCount: teamPlayerCount
            },
            league: {
                obp: leagueAvgOBP,
                slg: leagueAvgSLG,
                playerCount: leaguePlayerCount
            }
        };
    }
    
    show(teamName, teamId, battingData, year) {
        this.currentTeam = teamName;
        this.currentYear = year;
        
        console.log(`Showing bar chart for team: ${teamName} (${teamId}) for year ${year}`);
        console.log(`Batting data length: ${battingData.length}`);
        
        // Calculate statistics
        const stats = this.calculateAverages(battingData, teamId, year);
        
        console.log('Calculated stats:', stats);
        
        // Prepare data for chart
        const chartData = [
            {
                statistic: 'On-Base Percentage',
                team: stats.team.obp,
                league: stats.league.obp
            },
            {
                statistic: 'Slugging Average',
                team: stats.team.slg,
                league: stats.league.slg
            }
        ];
        
        this.renderChart(chartData, stats);
        
        // Show overlay with transition
        this.overlay
            .style('display', 'flex')
            .style('opacity', 0)
            .transition()
            .duration(300)
            .style('opacity', 1);
            
        this.isVisible = true;
    }
    
    hide() {
        if (!this.isVisible) return;
        
        this.overlay
            .transition()
            .duration(300)
            .style('opacity', 0)
            .on('end', () => {
                this.overlay.style('display', 'none');
            });
            
        this.isVisible = false;
    }
    
    renderChart(data, stats) {
        // Clear previous chart
        this.g.selectAll('*').remove();
        
        // Add title
        this.chartContainer.select('.chart-title').remove();
        this.chartContainer
            .insert('h2', 'svg')
            .attr('class', 'chart-title')
            .style('text-align', 'center')
            .style('margin', '0 0 10px 0')
            .style('color', '#333')
            .text(`${this.currentTeam} vs League Average (${this.currentYear})`);
            
        // Set up scales
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.statistic))
            .range([0, this.innerWidth])
            .padding(0.3);
            
        const maxValue = d3.max(data, d => Math.max(d.team, d.league));
        const yScale = d3.scaleLinear()
            .domain([0, maxValue * 1.1])
            .range([this.innerHeight, 0]);
            
        // Create grouped bar chart
        const statisticGroups = this.g.selectAll('.statistic-group')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'statistic-group')
            .attr('transform', d => `translate(${xScale(d.statistic)}, 0)`);
            
        const barWidth = xScale.bandwidth() / 2;
        
        // Team bars
        statisticGroups
            .append('rect')
            .attr('class', 'team-bar')
            .attr('x', 0)
            .attr('y', d => yScale(d.team))
            .attr('width', barWidth)
            .attr('height', d => this.innerHeight - yScale(d.team))
            .attr('fill', '#1f77b4')
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
            
        // League bars
        statisticGroups
            .append('rect')
            .attr('class', 'league-bar')
            .attr('x', barWidth)
            .attr('y', d => yScale(d.league))
            .attr('width', barWidth)
            .attr('height', d => this.innerHeight - yScale(d.league))
            .attr('fill', '#ff7f0e')
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
            
        // Add value labels on bars
        statisticGroups
            .append('text')
            .attr('class', 'team-value')
            .attr('x', barWidth / 2)
            .attr('y', d => yScale(d.team) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(d => d.team.toFixed(3));
            
        statisticGroups
            .append('text')
            .attr('class', 'league-value')
            .attr('x', barWidth + barWidth / 2)
            .attr('y', d => yScale(d.league) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(d => d.league.toFixed(3));
            
        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale).tickFormat(d3.format('.3f'));
        
        this.g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${this.innerHeight})`)
            .call(xAxis);
            
        this.g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis);
            
        // Add axis labels
        this.g.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left + 20)
            .attr('x', 0 - this.innerHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .text('Average Value');
            
        // Add legend ABOVE the chart, not inside SVG
        this.chartContainer.select('.bar-legend').remove();
        const legendDiv = this.chartContainer
            .insert('div', ':first-child')
            .attr('class', 'bar-legend')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('gap', '30px')
            .style('margin-bottom', '10px');
        legendDiv.html(`
            <span style="display:inline-flex;align-items:center;"><span style="display:inline-block;width:16px;height:16px;background:#1f77b4;border:1px solid #333;margin-right:6px;"></span>${this.currentTeam}</span>
            <span style="display:inline-flex;align-items:center;"><span style="display:inline-block;width:16px;height:16px;background:#ff7f0e;border:1px solid #333;margin-right:6px;"></span>League Average</span>
        `);
        
        // Remove SVG legend (if any)
        this.g.select('.legend').remove();
        
        // Add player count info
        this.chartContainer.select('.player-info').remove();
        this.chartContainer
            .append('div')
            .attr('class', 'player-info')
            .style('text-align', 'center')
            .style('margin-top', '10px')
            .style('font-size', '12px')
            .style('color', '#666')
            .html(`Team players: ${stats.team.playerCount} | League players: ${stats.league.playerCount}`);
    }
    
    // Update chart when year changes
    updateYear(newYear) {
        if (this.isVisible && this.currentTeam) {
            // Re-fetch batting data and update
            // This will be called from the main application
            this.currentYear = newYear;
        }
    }
    
    // Refresh chart with new data
    refreshChart(teamName, teamId, battingData, year) {
        if (this.isVisible) {
            this.show(teamName, teamId, battingData, year);
        }
    }
    
    destroy() {
        if (this.overlay) {
            this.overlay.remove();
        }
    }
}

// Export for use in other modules
window.TeamBarChart = TeamBarChart;
