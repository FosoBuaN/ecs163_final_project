// D3 Sankey visualization with responsive design and pulsing link animations
class SankeyChart {
    constructor(container, width = 1000, height = 600) {
        this.container = container;
        this.baseWidth = width;
        this.baseHeight = height;
        this.margin = { top: 50, right: 20, bottom: 20, left: 20 };
        this.data = null; // Store current data for re-rendering on resize

        // Debounce resize to prevent infinite loops
        this.resizeTimeout = null;
        this.isResizing = false;

        this.initializeSVG();
        this.setupResizeListener();
    }

    // Helper method to get container's available space considering margin and padding
    getContainerDimensions() {
        const containerElement = typeof this.container === 'string'
            ? document.querySelector(this.container)
            : this.container;

        if (!containerElement) {
            console.warn('Container element not found');
            return { width: this.baseWidth, height: this.baseHeight };
        }

        // Get the container's bounding box
        const containerRect = containerElement.getBoundingClientRect();

        // Get computed styles to account for padding and margin
        const computedStyle = window.getComputedStyle(containerElement);

        // Extract padding values
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

        // Extract margin values
        const marginLeft = parseFloat(computedStyle.marginLeft) || 0;
        const marginRight = parseFloat(computedStyle.marginRight) || 0;
        const marginTop = parseFloat(computedStyle.marginTop) || 0;
        const marginBottom = parseFloat(computedStyle.marginBottom) || 0;

        // Extract border values
        const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
        const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
        const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
        const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;

        // Calculate available space
        const horizontalSpacing = paddingLeft + paddingRight + marginLeft + marginRight + borderLeft + borderRight;
        const verticalSpacing = paddingTop + paddingBottom + marginTop + marginBottom + borderTop + borderBottom;

        // Available content area
        const availableWidth = Math.max(400, containerRect.width - horizontalSpacing);
        const availableHeight = Math.max(300, containerRect.height - verticalSpacing);

        // Also consider viewport constraints
        const maxViewportWidth = window.innerWidth - 40; // Leave some viewport margin
        const maxViewportHeight = window.innerHeight - 100; // Leave some viewport margin

        const finalWidth = Math.min(availableWidth, maxViewportWidth);
        const finalHeight = Math.min(availableHeight, maxViewportHeight, finalWidth * 0.6); // Maintain aspect ratio

        console.log('Container spacing calculation:', {
            containerRect: { width: containerRect.width, height: containerRect.height },
            padding: { left: paddingLeft, right: paddingRight, top: paddingTop, bottom: paddingBottom },
            margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
            border: { left: borderLeft, right: borderRight, top: borderTop, bottom: borderBottom },
            totalHorizontalSpacing: horizontalSpacing,
            totalVerticalSpacing: verticalSpacing,
            availableSpace: { width: availableWidth, height: availableHeight },
            finalDimensions: { width: finalWidth, height: finalHeight }
        });

        return { width: finalWidth, height: finalHeight };
    }

    initializeSVG() {
        // Remove existing SVG if present
        d3.select(this.container).select('svg').remove();

        // Get container dimensions considering spacing
        const dimensions = this.getContainerDimensions();
        this.width = dimensions.width;
        this.height = dimensions.height;

        // Create SVG with responsive dimensions
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .style('max-width', '100%')
            .style('height', 'auto')
            .style('display', 'block'); // Prevent inline spacing issues

        // Add defs for gradients
        this.svg.append('defs');

        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        this.updateInnerDimensions();
        this.createSankeyLayout();
    }

    updateInnerDimensions() {
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
    }

    createSankeyLayout() {
        // Create the sankey layout with current dimensions
        this.sankey = d3.sankey()
            .nodeWidth(Math.max(10, Math.min(20, this.width * 0.015)))
            .nodePadding(Math.max(5, Math.min(15, this.height * 0.02)))
            .extent([[1, 1], [this.innerWidth - 1, this.innerHeight - 1]]);
    }

    setupResizeListener() {
        // Use debounced resize to prevent infinite loops
        this.resizeHandler = () => {
            if (this.isResizing) return;

            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                console.log('Window resized, triggering chart resize...');
                this.handleResize();
            }, 150); // Reduced debounce for better responsiveness
        };

        // Add the event listener
        window.addEventListener('resize', this.resizeHandler, { passive: true });
        console.log('Resize listener added');
    }

    handleResize() {
        if (this.isResizing || !this.data) {
            console.log('Resize blocked - isResizing:', this.isResizing, 'hasData:', !!this.data);
            return;
        }

        console.log('Starting resize process...');
        this.isResizing = true;

        try {
            // Get new container dimensions considering spacing
            const dimensions = this.getContainerDimensions();
            const newWidth = dimensions.width;
            const newHeight = dimensions.height;

            console.log(`Current dimensions: ${this.width} x ${this.height}`);
            console.log(`New dimensions: ${newWidth} x ${newHeight}`);

            // Only resize if dimensions actually changed significantly
            const widthDiff = Math.abs(newWidth - this.width);
            const heightDiff = Math.abs(newHeight - this.height);

            if (widthDiff < 10 && heightDiff < 10) {
                console.log('Dimensions change too small, skipping resize');
                this.isResizing = false;
                return;
            }

            this.width = newWidth;
            this.height = newHeight;

            // Update SVG dimensions
            this.svg
                .attr('width', this.width)
                .attr('height', this.height);

            this.updateInnerDimensions();
            this.createSankeyLayout();

            console.log('Re-rendering chart with new dimensions...');
            // Re-render with current data
            this.render(this.data);
        } catch (error) {
            console.error('Error during resize:', error);
        } finally {
            // Use setTimeout to ensure isResizing flag is cleared after render completes
            setTimeout(() => {
                this.isResizing = false;
                console.log('Resize process completed');
            }, 50);
        }
    }

    getResponsiveFontSize(baseSize) {
        // Very conservative scaling
        const scaleFactor = Math.max(0.8, Math.min(1.2, this.width / 1200));
        return Math.round(baseSize * scaleFactor);
    }

    render(data, storeData = true) {
        // Store data for resize re-rendering
        if (storeData) {
            this.data = data;
            console.log('Data stored for future resizing');
        }

        this.renderChart(data);
    }

    renderChart(data) {
        console.log('Rendering chart...');

        // Clear previous content
        this.g.selectAll('*').remove();
        this.svg.selectAll('.chart-title').remove();
        this.svg.selectAll('.column-labels').remove();
        this.svg.selectAll('.legend').remove();
        // Clear gradients but keep defs element
        this.svg.select('defs').selectAll('*').remove();

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

        // Draw links with responsive stroke width
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
            .on('mouseover', (event, d) => this.showLinkTooltip(event, d))
            .on('mouseout', (event, d) => this.hideLinkTooltip(event, d));

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
            .on('mouseover', (event, d) => this.showNodeTooltip(event, d, link))
            .on('mouseout', (event, d) => this.hideNodeTooltip(event, d, link));

        // Node labels with responsive font size
        const labelFontSize = this.getResponsiveFontSize(11);
        node.append('text')
            .attr('x', d => d.x0 < this.innerWidth / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr('y', d => (d.y1 + d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', d => d.x0 < this.innerWidth / 2 ? 'start' : 'end')
            .attr('font-size', `${labelFontSize}px`)
            .attr('font-weight', 'bold')
            .text(d => {
                // Truncate long team names on smaller screens
                const maxLength = this.width < 600 ? 8 : (this.width < 800 ? 12 : 20);
                return d.name.length > maxLength ? d.name.substring(0, maxLength) + '...' : d.name;
            })
            .filter(d => d.x0 < this.innerWidth / 2)
            .attr('x', d => d.x1 + 6)
            .attr('text-anchor', 'start');

        // Add responsive title
        const titleFontSize = this.getResponsiveFontSize(18);
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', this.width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .attr('font-size', `${titleFontSize}px`)
            .attr('font-weight', 'bold')
            .text('MLB Team → Salary → Performance Flow');

        // Add responsive column labels
        const columnLabelFontSize = this.getResponsiveFontSize(14);
        const columnLabels = this.svg.append('g').attr('class', 'column-labels');

        const columnPositions = [
            { x: this.margin.left + Math.max(30, this.innerWidth * 0.15), label: 'Teams' },
            { x: this.width / 2, label: 'Salary Range' },
            { x: this.width - this.margin.right - Math.max(30, this.innerWidth * 0.15), label: 'Performance' }
        ];

        columnPositions.forEach(col => {
            columnLabels.append('text')
                .attr('x', col.x)
                .attr('y', this.margin.top - 5)
                .attr('text-anchor', 'middle')
                .attr('font-size', `${columnLabelFontSize}px`)
                .attr('font-weight', 'bold')
                .attr('fill', '#666')
                .text(col.label);
        });

        // Add responsive legend
        this.addResponsiveLegend();

        console.log('Chart rendering completed');
    }

    addResponsiveLegend() {
        const legendFontSize = this.getResponsiveFontSize(11);
        const legendRectSize = Math.max(8, Math.min(15, this.width * 0.012));

        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', () => {
                // Position legend based on screen size
                if (this.width < 600) {
                    return `translate(10, ${this.height - 80})`;
                } else {
                    return `translate(${this.width - 150}, ${this.height - 80})`;
                }
            });

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
            .attr('transform', (d, i) => `translate(0, ${i * (legendRectSize + 8)})`);

        legendItems.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .attr('fill', d => d.color)
            .attr('stroke', '#333')
            .attr('stroke-width', 1);

        legendItems.append('text')
            .attr('x', legendRectSize + 6)
            .attr('y', legendRectSize / 2)
            .attr('dy', '0.35em')
            .attr('font-size', `${legendFontSize}px`)
            .text(d => d.label);
    }

    showLinkTooltip(event, d) {
        const linkElement = d3.select(event.currentTarget);

        // Store original stroke for restoration
        const originalStroke = linkElement.attr('stroke');

        // Set highlighted opacity
        linkElement.attr('stroke-opacity', 0.8);

        // Create pulsing gradient for the link
        const defs = this.svg.select('defs');
        const gradientId = `link-pulse-gradient-${Math.random().toString(36).substr(2, 9)}`;

        const gradient = defs.append('linearGradient')
            .attr('id', gradientId)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%')
            .attr('gradientUnits', 'objectBoundingBox');

        // Create gradient stops for the pulse effect
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', originalStroke || '#999')
            .attr('stop-opacity', 0.4);

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', originalStroke || '#999')
            .attr('stop-opacity', 1)
            .attr('class', 'pulse-highlight');

        gradient.append('stop')
            .attr('offset', '15%')
            .attr('stop-color', originalStroke || '#999')
            .attr('stop-opacity', 0.4);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', originalStroke || '#999')
            .attr('stop-opacity', 0.4);

        // Apply gradient to link
        linkElement.attr('stroke', `url(#${gradientId})`);

        // Animate the pulse - seamless continuous animation
        const pulseHighlight = gradient.select('.pulse-highlight');

        // Create a seamless infinite loop animation
        function createContinuousAnimation() {
            pulseHighlight
                .attr('offset', '-15%') // Start before visible area
                .transition()
                .duration(2500) // Slower, smoother animation
                .ease(d3.easeLinear)
                .attr('offset', '115%') // End after visible area
                .on('end', function () {
                    // Only continue if tooltip still exists
                    if (d3.select('.sankey-tooltip').node()) {
                        createContinuousAnimation();
                    }
                });
        }

        // Start the animation
        createContinuousAnimation();

        // Store cleanup data on the link element
        linkElement.node().__pulseData = {
            gradientId: gradientId,
            originalStroke: originalStroke
        };

        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'sankey-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', `${this.getResponsiveFontSize(12)}px`)
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', '1000');

        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`${d.source.name} → ${d.target.name}<br/>Flow: ${d.value}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }

    hideLinkTooltip(event, d) {
        const linkElement = d3.select(event.currentTarget);

        // Clean up pulse animation
        if (linkElement.node().__pulseData) {
            const pulseData = linkElement.node().__pulseData;

            // Remove the gradient
            this.svg.select(`#${pulseData.gradientId}`).remove();

            // Restore original stroke
            linkElement.attr('stroke', pulseData.originalStroke);

            // Clean up stored data
            delete linkElement.node().__pulseData;
        }

        // Restore opacity
        linkElement.attr('stroke-opacity', 0.6);

        // Remove tooltip
        d3.selectAll('.sankey-tooltip').remove();
    }

    showNodeTooltip(event, d, link) {
        d3.select(event.currentTarget).attr('fill-opacity', 0.8);

        // Store active pulse data for cleanup
        const activePulseData = [];

        // Highlight connected links with pulsing effect
        link.each(function (l) {
            const linkElement = d3.select(this);

            if (l.source === d || l.target === d) {
                // This link is connected to the hovered node
                linkElement.attr('stroke-opacity', 0.8);

                // Store original stroke for restoration
                const originalStroke = linkElement.attr('stroke');

                // Create pulsing gradient for the connected link
                const defs = linkElement.select(function () {
                    return this.ownerSVGElement.querySelector('defs');
                }) || d3.select(this.svg).select('defs');

                const gradientId = `node-link-pulse-gradient-${Math.random().toString(36).substr(2, 9)}`;

                const gradient = d3.select(defs.node()).append('linearGradient')
                    .attr('id', gradientId)
                    .attr('x1', '0%')
                    .attr('y1', '0%')
                    .attr('x2', '100%')
                    .attr('y2', '0%')
                    .attr('gradientUnits', 'objectBoundingBox');

                // Create gradient stops for the pulse effect
                gradient.append('stop')
                    .attr('offset', '0%')
                    .attr('stop-color', originalStroke || '#999')
                    .attr('stop-opacity', 0.4);

                gradient.append('stop')
                    .attr('offset', '0%')
                    .attr('stop-color', originalStroke || '#999')
                    .attr('stop-opacity', 1)
                    .attr('class', 'pulse-highlight');

                gradient.append('stop')
                    .attr('offset', '15%')
                    .attr('stop-color', originalStroke || '#999')
                    .attr('stop-opacity', 0.4);

                gradient.append('stop')
                    .attr('offset', '100%')
                    .attr('stop-color', originalStroke || '#999')
                    .attr('stop-opacity', 0.4);

                // Apply gradient to link
                linkElement.attr('stroke', `url(#${gradientId})`);

                // Animate the pulse - seamless continuous animation
                const pulseHighlight = gradient.select('.pulse-highlight');

                // Create a seamless infinite loop animation
                function createContinuousAnimation() {
                    pulseHighlight
                        .attr('offset', '-15%') // Start before visible area
                        .transition()
                        .duration(2500) // Slower, smoother animation
                        .ease(d3.easeLinear)
                        .attr('offset', '115%') // End after visible area
                        .on('end', function () {
                            // Only continue if tooltip still exists
                            if (d3.select('.sankey-tooltip').node()) {
                                createContinuousAnimation();
                            }
                        });
                }

                // Start the animation
                createContinuousAnimation();

                // Store cleanup data
                const pulseData = {
                    gradientId: gradientId,
                    originalStroke: originalStroke,
                    linkElement: linkElement
                };

                activePulseData.push(pulseData);
                linkElement.node().__nodePulseData = pulseData;

            } else {
                // This link is not connected - dim it
                linkElement.attr('stroke-opacity', 0.2);
            }
        });

        // Store pulse data on the node for cleanup
        d3.select(event.currentTarget).node().__activePulseData = activePulseData;

        const tooltip = d3.select('body').append('div')
            .attr('class', 'sankey-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', `${this.getResponsiveFontSize(12)}px`)
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', '1000');

        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`${d.name}<br/>Category: ${d.category}<br/>Value: ${d.value || 'N/A'}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }

    hideNodeTooltip(event, d, link) {
        const nodeElement = d3.select(event.currentTarget);
        nodeElement.attr('fill-opacity', 1);

        // Clean up pulse animations for connected links
        const activePulseData = nodeElement.node().__activePulseData;
        if (activePulseData) {
            activePulseData.forEach(pulseData => {
                // Remove the gradient
                d3.select(`#${pulseData.gradientId}`).remove();

                // Restore original stroke
                pulseData.linkElement.attr('stroke', pulseData.originalStroke);

                // Clean up stored data on link element
                delete pulseData.linkElement.node().__nodePulseData;
            });

            // Clean up stored data on node element
            delete nodeElement.node().__activePulseData;
        }

        // Restore all link opacities
        link.attr('stroke-opacity', 0.6);

        // Remove tooltip
        d3.selectAll('.sankey-tooltip').remove();
    }

    // Method to manually trigger resize (useful for testing)
    triggerResize() {
        console.log('Manual resize triggered');
        this.handleResize();
    }

    // Method to test if resize listener is working
    testResize() {
        console.log('Testing resize functionality...');
        console.log('Current dimensions:', this.width, 'x', this.height);
        console.log('Window dimensions:', window.innerWidth, 'x', window.innerHeight);
        console.log('Has data:', !!this.data);
        console.log('Is resizing:', this.isResizing);

        // Show detailed container info
        const dimensions = this.getContainerDimensions();
        console.log('Container analysis:', dimensions);

        // Simulate a small resize
        window.dispatchEvent(new Event('resize'));
    }

    // Cleanup method to remove event listeners
    destroy() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        clearTimeout(this.resizeTimeout);
        d3.selectAll('.sankey-tooltip').remove();
        d3.select(this.container).select('svg').remove();
    }
}

window.SankeyChart = SankeyChart;