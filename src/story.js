function createTutorialOverlay() {
    // Tutorial steps content
    const tutorialSteps = [
        {
            title: "Welcome to the Dashboard",
            content: "This interactive visualization shows relationships between teams, salary ranges, and performance metrics. Use the controls to explore different years and data."
        },
        {
            title: "Navigation Controls",
            content: "Use the year selector to switch between different time periods. The legend on the right shows different node types and their meanings."
        },
        {
            title: "Interactive Features",
            content: "Click and drag nodes to reposition them. Hover over connections to see relationship details. Use zoom controls to get a closer look at specific areas."
        },
        {
            title: "Data Insights",
            content: "The visualization reveals patterns in team performance, salary distributions, and their correlations. Look for clusters and connections to understand the data better."
        }
    ];

    let currentStep = 0;

    // Remove existing tutorial if present
    const existingTutorial = document.querySelector('.tutorial-overlay');
    if (existingTutorial) {
        existingTutorial.remove();
    }

    // Create main tutorial container
    const tutorialDiv = document.createElement('div');
    tutorialDiv.className = 'tutorial-overlay';

    // Detect orientation and screen size
    const isLandscape = window.innerWidth > window.innerHeight;
    const isSmallScreen = window.innerWidth < 768;
    const isMobile = window.innerWidth < 480;

    // Dynamic height calculation for landscape
    let tutorialHeight, tutorialMaxHeight, tutorialMinHeight;
    if (isLandscape && !isMobile) {
        tutorialHeight = '35vh';
        tutorialMaxHeight = '280px';
        tutorialMinHeight = '200px';
    } else if (isLandscape && isMobile) {
        tutorialHeight = '45vh';
        tutorialMaxHeight = '250px';
        tutorialMinHeight = '180px';
    } else {
        tutorialHeight = '20vh';
        tutorialMaxHeight = '200px';
        tutorialMinHeight = '120px';
    }

    // Styling for the tutorial overlay
    const tutorialStyles = {
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        height: tutorialHeight,
        minHeight: tutorialMinHeight,
        maxHeight: tutorialMaxHeight,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        transition: 'all 0.5s ease',
        animation: 'slideUp 0.6s ease-out'
    };

    // Apply styles
    Object.assign(tutorialDiv.style, tutorialStyles);

    // Add comprehensive CSS for different screen orientations
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes slideUp {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(100%);
                opacity: 0;
            }
        }
        
        .tutorial-overlay.fade-out {
            animation: fadeOut 0.5s ease-in forwards;
        }
        
        /* Landscape tablet and desktop */
        @media screen and (min-width: 768px) and (orientation: landscape) {
            .tutorial-overlay {
                height: 35vh !important;
                max-height: 280px !important;
                min-height: 200px !important;
            }
            
            .tutorial-content {
                padding: 12px 30px !important;
            }
            
            .tutorial-content h3 {
                font-size: 20px !important;
                margin-bottom: 10px !important;
            }
            
            .tutorial-content p {
                font-size: 15px !important;
                line-height: 1.5 !important;
            }
            
            .tutorial-header {
                padding: 12px 30px 8px 30px !important;
            }
            
            .tutorial-footer {
                padding: 8px 30px 12px 30px !important;
            }
        }
        
        /* Large landscape screens */
        @media screen and (min-width: 1200px) and (orientation: landscape) {
            .tutorial-overlay {
                height: 30vh !important;
                max-height: 320px !important;
                min-height: 220px !important;
            }
            
            .tutorial-content {
                padding: 15px 40px !important;
            }
            
            .tutorial-content h3 {
                font-size: 22px !important;
                margin-bottom: 12px !important;
            }
            
            .tutorial-content p {
                font-size: 16px !important;
                line-height: 1.6 !important;
                max-width: 80% !important;
            }
            
            .tutorial-header {
                padding: 15px 40px 10px 40px !important;
            }
            
            .tutorial-footer {
                padding: 10px 40px 15px 40px !important;
            }
        }
        
        /* Mobile landscape */
        @media screen and (max-width: 767px) and (orientation: landscape) {
            .tutorial-overlay {
                height: 45vh !important;
                max-height: 250px !important;
                min-height: 180px !important;
            }
            
            .tutorial-content {
                padding: 8px 20px !important;
            }
            
            .tutorial-content h3 {
                font-size: 16px !important;
                margin-bottom: 6px !important;
            }
            
            .tutorial-content p {
                font-size: 13px !important;
                line-height: 1.4 !important;
            }
            
            .tutorial-header {
                padding: 8px 20px 5px 20px !important;
            }
            
            .tutorial-footer {
                padding: 5px 20px 8px 20px !important;
            }
        }
        
        /* Portrait mobile (original behavior) */
        @media screen and (max-width: 767px) and (orientation: portrait) {
            .tutorial-overlay {
                height: 25vh !important;
                min-height: 140px !important;
                max-height: 200px !important;
            }
        }
        
        /* Very small screens */
        @media screen and (max-width: 480px) {
            .tutorial-overlay {
                font-size: 14px !important;
            }
            
            .tutorial-content h3 {
                font-size: 15px !important;
            }
            
            .tutorial-content p {
                font-size: 12px !important;
            }
        }
        
        /* Ensure tutorial doesn't interfere with content on very wide screens */
        @media screen and (min-width: 1600px) {
            .tutorial-overlay {
                max-width: 1400px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                border-radius: 8px 8px 0 0 !important;
            }
        }
    `;
    document.head.appendChild(styleSheet);

    // Create header with progress indicator - REDUCED PADDING
    const headerDiv = document.createElement('div');
    headerDiv.className = 'tutorial-header';
    headerDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 20px 5px 20px;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        flex-shrink: 0;
    `;

    // Progress indicator
    const progressDiv = document.createElement('div');
    progressDiv.className = 'progress-indicator';
    progressDiv.style.cssText = `
        display: flex;
        gap: 6px;
        align-items: center;
    `;

    // Close button - SMALLER SIZE
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 3px;
        border-radius: 3px;
        transition: background 0.2s ease;
        opacity: 0.7;
    `;
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Close tutorial');
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'rgba(255,255,255,0.2)';
        closeButton.style.opacity = '1';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'none';
        closeButton.style.opacity = '0.7';
    });

    headerDiv.appendChild(progressDiv);
    headerDiv.appendChild(closeButton);

    // Create content area - INCREASED PADDING TO TAKE MORE SPACE
    const contentDiv = document.createElement('div');
    contentDiv.className = 'tutorial-content';
    contentDiv.style.cssText = `
        flex: 1;
        padding: 12px 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
    `;

    // Create title element - REDUCED MARGIN
    const titleElement = document.createElement('h3');
    titleElement.style.cssText = `
        margin: 0 0 6px 0;
        font-size: 18px;
        font-weight: bold;
        opacity: 0.95;
    `;

    // Create content text element
    const contentElement = document.createElement('p');
    contentElement.style.cssText = `
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
        opacity: 0.9;
    `;

    contentDiv.appendChild(titleElement);
    contentDiv.appendChild(contentElement);

    // Create footer with navigation - REDUCED PADDING
    const footerDiv = document.createElement('div');
    footerDiv.className = 'tutorial-footer';
    footerDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 20px 8px 20px;
        flex-shrink: 0;
    `;

    // Step indicator text - SMALLER FONT
    const stepIndicator = document.createElement('span');
    stepIndicator.style.cssText = `
        font-size: 11px;
        opacity: 0.8;
    `;

    // Next/Finish button - SMALLER PADDING
    const nextButton = document.createElement('button');
    nextButton.style.cssText = `
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 6px 14px;
        border-radius: 18px;
        cursor: pointer;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
        font-weight: 500;
    `;
    
    nextButton.addEventListener('mouseenter', () => {
        nextButton.style.background = 'rgba(255,255,255,0.3)';
        nextButton.style.transform = 'translateY(-1px)';
    });
    
    nextButton.addEventListener('mouseleave', () => {
        nextButton.style.background = 'rgba(255,255,255,0.2)';
        nextButton.style.transform = 'translateY(0)';
    });

    footerDiv.appendChild(stepIndicator);
    footerDiv.appendChild(nextButton);

    // Assemble the tutorial
    tutorialDiv.appendChild(headerDiv);
    tutorialDiv.appendChild(contentDiv);
    tutorialDiv.appendChild(footerDiv);

    // Update progress indicator - SMALLER DOTS
    function updateProgressIndicator() {
        progressDiv.innerHTML = '';
        for (let i = 0; i < tutorialSteps.length; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: ${i <= currentStep ? 'white' : 'rgba(255,255,255,0.3)'};
                transition: all 0.3s ease;
            `;
            progressDiv.appendChild(dot);
        }
    }

    // Update content
    function updateContent() {
        const step = tutorialSteps[currentStep];
        titleElement.textContent = step.title;
        contentElement.textContent = step.content;
        stepIndicator.textContent = `Step ${currentStep + 1} of ${tutorialSteps.length}`;
        
        // Update button text and icon
        if (currentStep === tutorialSteps.length - 1) {
            nextButton.innerHTML = 'Finish ✓';
        } else {
            nextButton.innerHTML = 'Next →';
        }
        
        updateProgressIndicator();
    }

    // Handle next/finish button click
    function handleNext() {
        if (currentStep === tutorialSteps.length - 1) {
            // Finish - remove tutorial
            tutorialDiv.classList.add('fade-out');
            setTimeout(() => {
                if (tutorialDiv.parentNode) {
                    tutorialDiv.parentNode.removeChild(tutorialDiv);
                }
                // Remove the style sheet as well
                if (styleSheet.parentNode) {
                    styleSheet.parentNode.removeChild(styleSheet);
                }
            }, 500);
        } else {
            // Next step
            currentStep++;
            updateContent();
        }
    }

    // Handle close button
    function handleClose() {
        tutorialDiv.classList.add('fade-out');
        setTimeout(() => {
            if (tutorialDiv.parentNode) {
                tutorialDiv.parentNode.removeChild(tutorialDiv);
            }
            if (styleSheet.parentNode) {
                styleSheet.parentNode.removeChild(styleSheet);
            }
        }, 500);
    }

    // Handle orientation change
    function handleOrientationChange() {
        // Recalculate dimensions based on new orientation
        const newIsLandscape = window.innerWidth > window.innerHeight;
        const newIsMobile = window.innerWidth < 480;
        
        if (newIsLandscape && !newIsMobile) {
            tutorialDiv.style.height = '35vh';
            tutorialDiv.style.maxHeight = '280px';
            tutorialDiv.style.minHeight = '200px';
        } else if (newIsLandscape && newIsMobile) {
            tutorialDiv.style.height = '45vh';
            tutorialDiv.style.maxHeight = '250px';
            tutorialDiv.style.minHeight = '180px';
        } else {
            tutorialDiv.style.height = '20vh';
            tutorialDiv.style.maxHeight = '200px';
            tutorialDiv.style.minHeight = '120px';
        }
    }

    // Add event listeners
    nextButton.addEventListener('click', handleNext);
    closeButton.addEventListener('click', handleClose);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Keyboard navigation
    tutorialDiv.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
            e.preventDefault();
            handleNext();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleClose();
        }
    });

    // Make tutorial focusable
    tutorialDiv.setAttribute('tabindex', '0');

    // Initialize content
    updateContent();

    // Add to page
    document.body.appendChild(tutorialDiv);

    // Focus the tutorial for keyboard navigation
    tutorialDiv.focus();

    // Auto-advance option (optional - uncomment if needed)
    // setTimeout(() => {
    //     if (currentStep < tutorialSteps.length - 1) {
    //         handleNext();
    //     }
    // }, 10000); // Auto-advance after 10 seconds
}

// Initialize tutorial on page load
document.addEventListener('DOMContentLoaded', createTutorialOverlay);

// Or call it directly when needed
// createTutorialOverlay();