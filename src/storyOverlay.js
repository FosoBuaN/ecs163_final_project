// Fullscreen Overlay Presentation System with D3.js
(function() {
    let currentSlide = 0;
    let slides = [];
    let overlay;
    let contentContainer;

    // Presentation slides configuration
    const presentationSlides = [
        {
            title: "Welcome to MLB Analytics",
            content: function(container) {
                console.log('Creating slide 1 content'); // Debug
                
                container.append('h1')
                    .text('Welcome to MLB Analytics')
                    .style('font-size', '48px')
                    .style('color', 'white')
                    .style('text-align', 'center')
                    .style('margin-bottom', '30px')
                    .style('font-weight', 'bold')
                    .style('text-shadow', '2px 2px 4px rgba(0,0,0,0.8)');

                container.append('p')
                    .text('This interactive visualization shows player movement patterns across MLB teams.')
                    .style('font-size', '24px')
                    .style('line-height', '1.6')
                    .style('color', 'white')
                    .style('text-align', 'center')
                    .style('max-width', '600px')
                    .style('margin', '0 auto 40px auto')
                    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');
                
                container.append('div')
                    .text('⚾')
                    .style('font-size', '80px')
                    .style('text-align', 'center');
            }
        },
        {
            title: "Understanding the Flow",
            content: function(container) {
                console.log('Creating slide 2 content'); // Debug
                
                container.append('h1')
                    .text('Understanding the Flow')
                    .style('font-size', '48px')
                    .style('color', 'white')
                    .style('text-align', 'center')
                    .style('margin-bottom', '40px')
                    .style('font-weight', 'bold')
                    .style('text-shadow', '2px 2px 4px rgba(0,0,0,0.8)');

                container.append('p')
                    .text('The thickness of each connection represents the volume of player transfers.')
                    .style('font-size', '20px')
                    .style('color', 'white')
                    .style('margin-bottom', '30px')
                    .style('text-align', 'center')
                    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');

                const listContainer = container.append('div')
                    .style('max-width', '500px')
                    .style('margin', '0 auto');
                
                ['📊 Wider bands = More player movement', '🎨 Colors represent different teams', '🖱️ Hover for detailed information']
                    .forEach(item => {
                        listContainer.append('div')
                            .text(item)
                            .style('margin', '15px 0')
                            .style('font-size', '18px')
                            .style('color', 'white')
                            .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
                            .style('text-align', 'left');
                    });
            }
        },
        {
            title: "Ready to Explore",
            content: function(container) {
                console.log('Creating slide 3 content'); // Debug
                
                container.append('h1')
                    .text('Ready to Explore!')
                    .style('font-size', '48px')
                    .style('color', 'white')
                    .style('text-align', 'center')
                    .style('margin-bottom', '40px')
                    .style('font-weight', 'bold')
                    .style('text-shadow', '2px 2px 4px rgba(0,0,0,0.8)');

                container.append('p')
                    .text('Click "Start Exploring" to begin interacting with your MLB Sankey visualization.')
                    .style('font-size', '24px')
                    .style('color', 'white')
                    .style('margin-bottom', '40px')
                    .style('text-align', 'center')
                    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');

                container.append('div')
                    .text('🚀')
                    .style('font-size', '80px')
                    .style('text-align', 'center');
            }
        }
    ];

    function createOverlay() {
        // Create overlay container
        overlay = d3.select('body')
            .append('div')
            .attr('id', 'presentation-overlay')
            .style('position', 'fixed')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('background', 'rgba(0, 0, 0, 0.85)')
            .style('backdrop-filter', 'blur(5px)')
            .style('z-index', '10000')
            .style('opacity', '0')
            .style('visibility', 'hidden')
            .style('transition', 'opacity 0.4s ease, visibility 0.4s ease');

        // Add bounce animation keyframes
        overlay.append('style')
            .text(`
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
            `);

        // Add close button (top right)
        overlay.append('div')
            .attr('id', 'close-btn')
            .text('×')
            .style('position', 'fixed')
            .style('top', '20px')
            .style('right', '30px')
            .style('font-size', '32px')
            .style('cursor', 'pointer')
            .style('color', 'rgba(255,255,255,0.7)')
            .style('width', '40px')
            .style('height', '40px')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .style('border-radius', '50%')
            .style('transition', 'all 0.2s ease')
            .style('z-index', '10001')
            .on('mouseover', function() {
                d3.select(this)
                    .style('background', 'rgba(255,255,255,0.1)')
                    .style('color', 'white');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('background', 'transparent')
                    .style('color', 'rgba(255,255,255,0.7)');
            })
            .on('click', hideOverlay);

        // Add content container (centered)
        contentContainer = overlay
            .append('div')
            .attr('id', 'slide-content')
            .style('position', 'absolute')
            .style('top', '20%')
            .style('left', '5%')
            .style('right', '5%')
            .style('bottom', '100px')
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('justify-content', 'center')
            .style('align-items', 'center')
            .style('max-width', '1000px')
            .style('margin', '0 auto')
            .style('text-align', 'center')
            .style('z-index', '10001');

        // Add bottom navigation bar
        const bottomBar = overlay
            .append('div')
            .attr('id', 'bottom-nav')
            .style('position', 'fixed')
            .style('bottom', '0')
            .style('left', '0')
            .style('right', '0')
            .style('height', '80px')
            .style('background', 'rgba(0,0,0,0.3)')
            .style('backdrop-filter', 'blur(10px)')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'space-between')
            .style('padding', '0 40px')
            .style('z-index', '10001');

        // Progress dots (left side of bottom bar)
        const progressContainer = bottomBar
            .append('div')
            .attr('id', 'progress-dots')
            .style('display', 'flex')
            .style('gap', '12px');

        // Navigation button (right side of bottom bar)
        const navButton = bottomBar
            .append('button')
            .attr('id', 'nav-button')
            .style('background', 'rgba(255,255,255,0.9)')
            .style('color', '#333')
            .style('border', 'none')
            .style('padding', '12px 30px')
            .style('border-radius', '25px')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('cursor', 'pointer')
            .style('transition', 'all 0.3s ease')
            .style('backdrop-filter', 'blur(10px)')
            .on('mouseover', function() {
                d3.select(this)
                    .style('background', 'white')
                    .style('transform', 'translateY(-2px)')
                    .style('box-shadow', '0 4px 15px rgba(255,255,255,0.3)');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('background', 'rgba(255,255,255,0.9)')
                    .style('transform', 'translateY(0)')
                    .style('box-shadow', 'none');
            })
            .on('click', nextSlide);

        return overlay;
    }

    function updateProgressDots() {
        const dotsContainer = d3.select('#progress-dots');
        dotsContainer.selectAll('*').remove();

        presentationSlides.forEach((_, index) => {
            dotsContainer
                .append('div')
                .style('width', '12px')
                .style('height', '12px')
                .style('border-radius', '50%')
                .style('background', index === currentSlide ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)')
                .style('transition', 'background 0.3s ease')
                .style('cursor', 'pointer')
                .on('click', function() {
                    currentSlide = index;
                    renderCurrentSlide();
                });
        });
    }

    function renderCurrentSlide() {
        const slide = presentationSlides[currentSlide];
        
        // Clear and update content
        contentContainer.selectAll('*').remove();
        
        // Execute the content function
        if (slide && slide.content) {
            console.log('Rendering slide:', currentSlide, slide.title); // Debug log
            slide.content(contentContainer);
        } else {
            console.error('Slide not found or no content function:', currentSlide);
            // Fallback content
            contentContainer.append('h1')
                .text('Slide ' + (currentSlide + 1))
                .style('color', 'white')
                .style('font-size', '48px')
                .style('text-align', 'center');
        }

        // Update button text
        const isLastSlide = currentSlide === presentationSlides.length - 1;
        d3.select('#nav-button')
            .text(isLastSlide ? '🚀 Start Exploring' : 'Next →');

        // Update progress dots
        updateProgressDots();

        // Add slide transition animation
        contentContainer
            .style('opacity', '0')
            .transition()
            .duration(400)
            .style('opacity', '1');
    }

    function nextSlide() {
        if (currentSlide < presentationSlides.length - 1) {
            currentSlide++;
            renderCurrentSlide();
        } else {
            hideOverlay();
        }

        // Add button animation
        const button = d3.select('#nav-button');
        button
            .style('transform', 'translateY(-2px) scale(0.95)')
            .transition()
            .duration(150)
            .style('transform', 'translateY(0) scale(1)');
    }

    function showOverlay() {
        if (overlay) {
            blockInteractions();
            
            overlay
                .style('visibility', 'visible')
                .style('opacity', '1');
            
            renderCurrentSlide();
        }
    }

    function hideOverlay() {
        if (overlay) {
            overlay
                .style('opacity', '0')
                .style('visibility', 'hidden');
            
            unblockInteractions();
            
            setTimeout(() => {
                overlay.remove();
                overlay = null;
            }, 400);
        }
    }

    function blockInteractions() {
        d3.select('body')
            .append('div')
            .attr('id', 'interaction-blocker')
            .style('position', 'fixed')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('z-index', '9999')
            .style('pointer-events', 'all')
            .on('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
            });
    }

    function unblockInteractions() {
        d3.select('#interaction-blocker').remove();
    }

    // Public API for adding custom slides
    window.PresentationOverlay = {
        // Add a new slide
        addSlide: function(title, contentFunction) {
            presentationSlides.push({
                title: title,
                content: contentFunction
            });
        },
        
        // Replace all slides
        setSlides: function(slideArray) {
            presentationSlides.length = 0;
            presentationSlides.push(...slideArray);
        },
        
        // Show the presentation
        show: function() {
            currentSlide = 0;
            if (!overlay) {
                createOverlay();
            }
            showOverlay();
        },
        
        // Hide the presentation
        hide: function() {
            hideOverlay();
        }
    };

    // Auto-start presentation
    function init() {
        setTimeout(() => {
            createOverlay();
            showOverlay();
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    

})();

function setCaption(text) {
    d3.select("#captionBox").text(text);
}

// Expose to story.js
window.storyOverlay = {
    setCaption
};