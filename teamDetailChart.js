// Team Detail Chart - Bar chart showing team batting statistics vs league average
class TeamDetailChart {
    constructor(container, width = 600, height = 400) {
        this.container = container;
        this.width = width;
        this.height = height;
        this.margin = { top: 50, right: 80, bottom: 60, left: 80 };
        this.isVisible = false;
        
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
        
        // Create backdrop overlay
        this.backdrop = d3.select(container)
            .append('div')
            .attr('class', 'team-detail-backdrop')
            .style('display', 'none')
            .style('opacity', 0)
            .style('position', 'fixed')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('background', 'rgba(0,0,0,0.5)')
            .style('z-index', '999')
            .style('backdrop-filter', 'blur(3px)');
        
        // Create container div for the chart
        this.chartContainer = d3.select(container)
            .append('div')
            .attr('class', 'team-detail-container')
            .style('display', 'none')
            .style('opacity', 0)
            .style('position', 'fixed')
            .style('top', '50%')
            .style('left', '50%')
            .style('transform', 'translate(-50%, -50%)')
            .style('z-index', '1000')
            .style('max-width', '90vw')
            .style('max-height', '70vh') // Reduced from 80vh to leave room for controls
            .style('overflow', 'auto')
            .style('margin', '0')
            .style('padding', '20px')
            .style('background', 'white')
            .style('border-radius', '12px')
            .style('box-shadow', '0 8px 32px rgba(0,0,0,0.3)')
            .style('border', '1px solid #e9ecef');
        
        // Add click handler to backdrop to close modal
        this.backdrop.on('click', () => {
            console.log('Backdrop clicked - closing modal');
            this.backToOverview();
        });
        
        // Prevent clicks on the chart container from bubbling to backdrop
        this.chartContainer.on('click', (event) => {
            event.stopPropagation();
        });
        
        // Add header with back button only
        const header = this.chartContainer.append('div')
            .style('display', 'flex')
            .style('justify-content', 'space-between')
            .style('align-items', 'center')
            .style('margin-bottom', '15px')
            .style('padding-bottom', '10px')
            .style('border-bottom', '2px solid #e9ecef');
        
        // Back to overview button
        this.backButton = header.append('button')
            .attr('class', 'back-btn')
            .style('background', '#1f77b4')
            .style('color', 'white')
            .style('border', 'none')
            .style('border-radius', '5px')
            .style('padding', '8px 15px')
            .style('cursor', 'pointer')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text('← Back to Overview')
            .on('click', () => this.backToOverview());
        
        // Title area
        this.titleDiv = header.append('div')
            .style('text-align', 'center')
            .style('flex', '1');
        
        // Empty div for spacing (instead of close button)
        header.append('div')
            .style('width', '80px'); // Same width as back button for balance
        
        // Create SVG
        this.svg = this.chartContainer
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
            
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
    }
    
    calculateBattingStats(battingData, teamId, year) {
        // Filter for team and year
        const teamBatting = battingData.filter(d => 
            d.team_id === teamId && +d.year === year
        );
        
        // Filter for all players in the league for that year
        const leagueBatting = battingData.filter(d => +d.year === year);
        
        if (teamBatting.length === 0 || leagueBatting.length === 0) {
            return null;
        }
        
        // Calculate team stats
        const teamStats = this.calculateStats(teamBatting);
        const leagueStats = this.calculateStats(leagueBatting);
        
        return {
            team: teamStats,
            league: leagueStats,
            teamId: teamId,
            year: year
        };
    }
    
    calculateStats(battingData) {
        let totalAB = 0, totalH = 0, totalBB = 0, totalHBP = 0, totalSF = 0;
        let totalSingles = 0, totalDoubles = 0, totalTriples = 0, totalHR = 0;
        
        battingData.forEach(d => {
            const ab = +d.ab || 0;
            const h = +d.h || 0;
            const bb = +d.bb || 0;
            const hbp = +d.hbp || 0;
            const sf = +d.sf || 0;
            const doubles = +d.double || 0;
            const triples = +d.triple || 0;
            const hr = +d.hr || 0;
            const singles = h - doubles - triples - hr;
            
            totalAB += ab;
            totalH += h;
            totalBB += bb;
            totalHBP += hbp;
            totalSF += sf;
            totalSingles += singles;
            totalDoubles += doubles;
            totalTriples += triples;
            totalHR += hr;
        });
        
        // Calculate OBP: (H + BB + HBP) / (AB + BB + HBP + SF)
        const obpDenominator = totalAB + totalBB + totalHBP + totalSF;
        const obp = obpDenominator > 0 ? (totalH + totalBB + totalHBP) / obpDenominator : 0;
        
        // Calculate Slugging: (1B + 2*2B + 3*3B + 4*HR) / AB
        const totalBases = totalSingles + (2 * totalDoubles) + (3 * totalTriples) + (4 * totalHR);
        const slug = totalAB > 0 ? totalBases / totalAB : 0;
        
        return {
            obp: obp,
            slug: slug,
            games: battingData.length
        };
    }
    
    render(battingStats, teamName) {
        if (!battingStats) {
            console.warn('No batting stats available for rendering');
            return;
        }
        
        // Clear ALL previous content from the entire SVG
        this.svg.selectAll('*').remove();
        
        // Recreate the main group element
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        
        // Prepare data for the bar chart
        const data = [
            {
                metric: 'On-Base Percentage',
                team: battingStats.team.obp,
                league: battingStats.league.obp,
                format: '.3f'
            },
            {
                metric: 'Slugging Average',
                team: battingStats.team.slug,
                league: battingStats.league.slug,
                format: '.3f'
            }
        ];
        
        // Set up scales
        const maxValue = d3.max(data, d => Math.max(d.team, d.league));
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.metric))
            .range([0, this.innerWidth])
            .padding(0.3);
            
        const yScale = d3.scaleLinear()
            .domain([0, maxValue * 1.1])
            .range([this.innerHeight, 0]);
        
        // Color scale
        const colorScale = d3.scaleOrdinal()
            .domain(['team', 'league'])
            .range(['#1f77b4', '#ff7f0e']);
        
        // Create grouped bar chart
        const groupScale = d3.scaleBand()
            .domain(['team', 'league'])
            .range([0, xScale.bandwidth()])
            .padding(0.1);
        
        // Add bars for each metric
        const groups = this.g.selectAll('.metric-group')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'metric-group')
            .attr('transform', d => `translate(${xScale(d.metric)},0)`);
        
        // Team bars
        groups.append('rect')
            .attr('class', 'team-bar')
            .attr('x', groupScale('team'))
            .attr('y', d => yScale(d.team))
            .attr('width', groupScale.bandwidth())
            .attr('height', d => this.innerHeight - yScale(d.team))
            .attr('fill', colorScale('team'))
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
        
        // League bars
        groups.append('rect')
            .attr('class', 'league-bar')
            .attr('x', groupScale('league'))
            .attr('y', d => yScale(d.league))
            .attr('width', groupScale.bandwidth())
            .attr('height', d => this.innerHeight - yScale(d.league))
            .attr('fill', colorScale('league'))
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
        
        // Add value labels on bars
        groups.selectAll('.team-label')
            .data(d => [d])
            .enter()
            .append('text')
            .attr('class', 'team-label')
            .attr('x', groupScale('team') + groupScale.bandwidth() / 2)
            .attr('y', d => yScale(d.team) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', 'bold')
            .text(d => d3.format(d.format)(d.team));
        
        groups.selectAll('.league-label')
            .data(d => [d])
            .enter()
            .append('text')
            .attr('class', 'league-label')
            .attr('x', groupScale('league') + groupScale.bandwidth() / 2)
            .attr('y', d => yScale(d.league) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', 'bold')
            .text(d => d3.format(d.format)(d.league));
        
        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale).tickFormat(d3.format('.3f'));
        
        this.g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(xAxis)
            .selectAll('text')
            .style('font-size', '12px');
        
        this.g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .style('font-size', '12px');
        
        // Update title in the header div
        this.titleDiv.html(`
            <h2 style="margin: 0; color: #1f77b4;">${teamName} Team Analysis</h2>
            <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">vs League Average (${battingStats.year})</p>
        `);
        
        // Add legend
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width - 120}, 50)`);
        
        const legendData = [
            { label: teamName, color: colorScale('team') },
            { label: 'League Avg', color: colorScale('league') }
        ];
        
        const legendItems = legend.selectAll('.legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`);
        
        legendItems.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', d => d.color)
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
        
        legendItems.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .attr('font-size', '12px')
            .text(d => d.label);
    }
    
    show() {
        this.backdrop.style('display', 'block');
        this.chartContainer.style('display', 'block');
        this.isVisible = true;
        
        // Use requestAnimationFrame to ensure the display changes are applied before transitions
        requestAnimationFrame(() => {
            this.backdrop.transition().duration(200).style('opacity', 1);
            this.chartContainer.transition().duration(300).style('opacity', 1);
        });
    }
    
    hide() {
        // Fade out and then hide
        this.backdrop.transition().duration(200).style('opacity', 0)
            .on('end', () => this.backdrop.style('display', 'none'));
        this.chartContainer.transition().duration(200).style('opacity', 0)
            .on('end', () => this.chartContainer.style('display', 'none'));
        
        this.isVisible = false;
    }
    
    backToOverview() {
        console.log('Team detail chart: backToOverview called');
        this.hide();
        
        // Call the back to overview callback
        if (this.onBackToOverview) {
            console.log('Team detail chart: calling back to overview callback');
            this.onBackToOverview();
        } else {
            console.warn('Team detail chart: no back to overview callback set');
        }
    }
    
    // Set callback for back to overview action
    setBackToOverviewCallback(callback) {
        this.onBackToOverview = callback;
    }
}
