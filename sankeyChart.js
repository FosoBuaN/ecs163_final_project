// D3 Sankey visualization
class SankeyChart {
    constructor(container, width = 1000, height = 600) {
        this.container = container;
        this.width = width;
        this.height = height;
        this.margin = { top: 50, right: 20, bottom: 20, left: 20 };
        
        this.svg = d3.select(container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
            
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
            
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
        
        // Create the sankey layout
        this.sankey = d3.sankey()
            .nodeWidth(15)
            .nodePadding(10)
            .extent([[1, 1], [this.innerWidth - 1, this.innerHeight - 1]]);
    }
    
    render(data) {
        // Clear previous content
        this.g.selectAll('*').remove();
        
        // Prepare data for D3 Sankey
        const sankeyData = {
            nodes: data.nodes.map(d => ({ ...d })), // Clone to avoid mutation
            links: data.links.map(d => ({ ...d }))
        };
        
        // Apply the sankey layout
        this.sankey(sankeyData);
        
        // Color scale for different node categories
        const colorScale = d3.scaleOrdinal()
            .domain(['team', 'salary', 'performance'])
            .range(['#1f77b4', '#ff7f0e', '#2ca02c']);
        
        // Draw links
        const link = this.g.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(sankeyData.links)
            .enter()
            .append('path')
            .attr('d', d3.sankeyLinkHorizontal())
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.max(1, d.width))
            .attr('fill', 'none')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('stroke-opacity', 0.8);
                
                // Show tooltip
                const tooltip = d3.select('body').append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0,0,0,0.8)')
                    .style('color', 'white')
                    .style('padding', '8px')
                    .style('border-radius', '4px')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('opacity', 0);
                
                tooltip.transition().duration(200).style('opacity', 1);
                tooltip.html(`${d.source.name} → ${d.target.name}<br/>Flow: ${d.value}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function(event, d) {
                d3.select(this).attr('stroke-opacity', 0.6);
                d3.selectAll('.tooltip').remove();
            });
        
        // Draw nodes
        const node = this.g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(sankeyData.nodes)
            .enter()
            .append('g')
            .attr('class', 'node');
        
        // Node rectangles
        node.append('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('height', d => d.y1 - d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', d => colorScale(d.category))
            .attr('stroke', '#333')
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                d3.select(this).attr('fill-opacity', 0.8);
                
                // Highlight connected links
                link.attr('stroke-opacity', l => 
                    l.source === d || l.target === d ? 0.8 : 0.2
                );
                
                // Show tooltip
                const tooltip = d3.select('body').append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0,0,0,0.8)')
                    .style('color', 'white')
                    .style('padding', '8px')
                    .style('border-radius', '4px')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('opacity', 0);
                
                tooltip.transition().duration(200).style('opacity', 1);
                tooltip.html(`${d.name}<br/>Category: ${d.category}<br/>Value: ${d.value || 'N/A'}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function(event, d) {
                d3.select(this).attr('fill-opacity', 1);
                link.attr('stroke-opacity', 0.6);
                d3.selectAll('.tooltip').remove();
            });
        
        // Node labels
        node.append('text')
            .attr('x', d => d.x0 < this.innerWidth / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr('y', d => (d.y1 + d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', d => d.x0 < this.innerWidth / 2 ? 'start' : 'end')
            .attr('font-size', '11px')
            .attr('font-weight', 'bold')
            .text(d => d.name)
            .filter(d => d.x0 < this.innerWidth / 2)
            .attr('x', d => d.x1 + 6)
            .attr('text-anchor', 'start');
        
        // Add title
        this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .text('MLB Team → Salary → Performance Flow');
        
        // Add column labels
        const columnPositions = [
            { x: this.margin.left + 50, label: 'Teams' },
            { x: this.width / 2, label: 'Salary Range' },
            { x: this.width - this.margin.right - 50, label: 'Performance' }
        ];
        
        columnPositions.forEach(col => {
            this.svg.append('text')
                .attr('x', col.x)
                .attr('y', this.margin.top - 5)
                .attr('text-anchor', 'middle')
                .attr('font-size', '14px')
                .attr('font-weight', 'bold')
                .attr('fill', '#666')
                .text(col.label);
        });
        
        // Add legend
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width - 150}, ${this.height - 80})`);
        
        const legendData = [
            { category: 'team', color: '#1f77b4', label: 'Teams' },
            { category: 'salary', color: '#ff7f0e', label: 'Salary Ranges' },
            { category: 'performance', color: '#2ca02c', label: 'Performance' }
        ];
        
        const legendItems = legend.selectAll('.legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`);
        
        legendItems.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', d => d.color)
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
        
        legendItems.append('text')
            .attr('x', 18)
            .attr('y', 6)
            .attr('dy', '0.35em')
            .attr('font-size', '11px')
            .text(d => d.label);
    }
}

window.SankeyChart = SankeyChart;
