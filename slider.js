class D3Slider {
  constructor({
    container,
    width = null,
    height = 80,
    yearValue = 2000,
    minValue = 1990,
    maxValue = 2015,
    callback = null,
    margins = { left: 40, right: 40, top: 20, bottom: 20 }
  }) {
    this.container = container;
    this.baseWidth = width;
    this.height = height;
    this.yearValue = yearValue;
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.callback = callback;
    this.margins = margins;
    
    // Internal state
    this.svg = null;
    this.scale = null;
    this.handle = null;
    this.track = null;
    this.label = null;
    this.isDragging = false;
    
    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this.drag = this.drag.bind(this);
    
    // Set up resize listener
    window.addEventListener('resize', this.handleResize);
  }
  
  getWidth() {
    if (this.baseWidth) {
      return this.baseWidth;
    }
    // Take up 80% of window width with minimum and maximum constraints
    const windowWidth = window.innerWidth;
    return Math.min(Math.max(windowWidth * 0.8, 300), 1200);
  }
  
  getInnerWidth() {
    return this.getWidth() - this.margins.left - this.margins.right;
  }
  
  getInnerHeight() {
    return this.height - this.margins.top - this.margins.bottom;
  }
  
  createScale() {
    this.scale = d3.scaleLinear()
      .domain([this.minValue, this.maxValue])
      .range([0, this.getInnerWidth()])
      .clamp(true);
  }
  
  render() {
    // Clear existing content
    d3.select(this.container).selectAll('*').remove();
    
    // Create scale
    this.createScale();
    
    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.getWidth())
      .attr('height', this.height)
      .style('display', 'block')
      .style('margin', '0 auto');
    
    // Create main group
    const g = this.svg.append('g')
      .attr('transform', `translate(${this.margins.left}, ${this.margins.top})`);
    
    // Create track
    this.track = g.append('rect')
      .attr('class', 'slider-track')
      .attr('x', 0)
      .attr('y', this.getInnerHeight() / 2 - 2)
      .attr('width', this.getInnerWidth())
      .attr('height', 4)
      .attr('rx', 2)
      .style('fill', '#e0e0e0')
      .style('cursor', 'pointer');
    
    // Create progress track
    this.progressTrack = g.append('rect')
      .attr('class', 'slider-progress')
      .attr('x', 0)
      .attr('y', this.getInnerHeight() / 2 - 2)
      .attr('width', this.scale(this.yearValue))
      .attr('height', 4)
      .attr('rx', 2)
      .style('fill', '#4285f4')
      .style('cursor', 'pointer');
    
    // Create ticks
    this.createTicks(g);
    
    // Create handle
    this.handle = g.append('circle')
      .attr('class', 'slider-handle')
      .attr('cx', this.scale(this.yearValue))
      .attr('cy', this.getInnerHeight() / 2)
      .attr('r', 12)
      .style('fill', '#4285f4')
      .style('stroke', '#fff')
      .style('stroke-width', '2px')
      .style('cursor', 'grab')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
      .on('mouseenter', function() {
        d3.select(this).transition().duration(150).attr('r', 14);
      })
      .on('mouseleave', function() {
        d3.select(this).transition().duration(150).attr('r', 12);
      });
    
    // Create label
    this.label = g.append('text')
      .attr('class', 'slider-label')
      .attr('x', this.scale(this.yearValue))
      .attr('y', this.getInnerHeight() / 2 - 20)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Arial, sans-serif')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(this.yearValue);
    
    // Add drag behavior
    this.addDragBehavior(g);
    
    // Add click behavior to track
    this.addTrackClickBehavior();
    
    return this;
  }
  
  createTicks(g) {
    const tickCount = Math.min(10, this.maxValue - this.minValue + 1);
    const tickValues = this.scale.ticks(tickCount);
    
    // Remove existing ticks
    g.selectAll('.tick').remove();
    
    // Create tick group
    const tickGroup = g.append('g').attr('class', 'ticks');
    
    // Store reference to this before the D3 callbacks
    const self = this;
    
    tickGroup.selectAll('.tick')
      .data(tickValues)
      .enter()
      .append('g')
      .attr('class', 'tick')
      .attr('transform', d => `translate(${this.scale(d)}, 0)`)
      .each(function(d) {
        const tick = d3.select(this);
        
        // Tick line
        tick.append('line')
          .attr('y1', self.getInnerHeight() / 2 + 8)
          .attr('y2', self.getInnerHeight() / 2 + 12)
          .style('stroke', '#999')
          .style('stroke-width', '1px');
        
        // Tick label
        tick.append('text')
          .attr('y', self.getInnerHeight() / 2 + 25)
          .attr('text-anchor', 'middle')
          .style('font-family', 'Arial, sans-serif')
          .style('font-size', '11px')
          .style('fill', '#666')
          .text(d);
      });
  }
  
  addDragBehavior(g) {
    const self = this;
    
    const dragBehavior = d3.drag()
      .on('start', function(event) {
        self.isDragging = true;
        d3.select(this).style('cursor', 'grabbing');
      })
      .on('drag', function(event) {
        self.drag(event);
      })
      .on('end', function(event) {
        self.isDragging = false;
        d3.select(this).style('cursor', 'grab');
      });
    
    this.handle.call(dragBehavior);
  }
  
  addTrackClickBehavior() {
    const self = this;
    
    this.track.on('click', function(event) {
      if (!self.isDragging) {
        const [x] = d3.pointer(event, this);
        const newValue = Math.round(self.scale.invert(x));
        self.updateValue(newValue, true);
      }
    });
    
    this.progressTrack.on('click', function(event) {
      if (!self.isDragging) {
        const [x] = d3.pointer(event, this);
        const newValue = Math.round(self.scale.invert(x));
        self.updateValue(newValue, true);
      }
    });
  }
  
  drag(event) {
    const newValue = Math.round(this.scale.invert(event.x));
    this.updateValue(newValue, false);
  }
  
  updateValue(newValue, animate = true) {
    // Clamp value to valid range
    newValue = Math.max(this.minValue, Math.min(this.maxValue, newValue));
    
    if (newValue !== this.yearValue) {
      this.yearValue = newValue;
      
      if (animate) {
        // Animate handle and label
        this.handle
          .transition()
          .duration(200)
          .ease(d3.easeOutCubic)
          .attr('cx', this.scale(this.yearValue));
        
        this.label
          .transition()
          .duration(200)
          .ease(d3.easeOutCubic)
          .attr('x', this.scale(this.yearValue))
          .tween('text', () => {
            const interpolator = d3.interpolateNumber(parseFloat(this.label.text()), this.yearValue);
            return t => this.label.text(Math.round(interpolator(t)));
          });
        
        this.progressTrack
          .transition()
          .duration(200)
          .ease(d3.easeOutCubic)
          .attr('width', this.scale(this.yearValue));
      } else {
        // Update immediately
        this.handle.attr('cx', this.scale(this.yearValue));
        this.label
          .attr('x', this.scale(this.yearValue))
          .text(this.yearValue);
        this.progressTrack.attr('width', this.scale(this.yearValue));
      }
      
      // Trigger callback
      if (this.callback && typeof this.callback === 'function') {
        this.callback(this.yearValue);
      }
    }
  }
  
  handleResize() {
    if (this.svg) {
      // Update SVG width
      this.svg.attr('width', this.getWidth());
      
      // Recreate scale with new dimensions
      this.createScale();
      
      // Update track width
      this.track.attr('width', this.getInnerWidth());
      
      // Update progress track
      this.progressTrack.attr('width', this.scale(this.yearValue));
      
      // Update handle position
      this.handle.attr('cx', this.scale(this.yearValue));
      
      // Update label position
      this.label.attr('x', this.scale(this.yearValue));
      
      // Recreate ticks
      const g = this.svg.select('g');
      this.createTicks(g);
    }
  }
  
  setValue(newValue, animate = true) {
    this.updateValue(newValue, animate);
    return this;
  }
  
  getValue() {
    return this.yearValue;
  }
  
  setRange(minValue, maxValue) {
    this.minValue = minValue;
    this.maxValue = maxValue;
    
    // Ensure current value is within new range
    this.yearValue = Math.max(minValue, Math.min(maxValue, this.yearValue));
    
    if (this.svg) {
      this.createScale();
      this.render();
    }
    
    return this;
  }
  
  destroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.container) {
      d3.select(this.container).selectAll('*').remove();
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = D3Slider;
}