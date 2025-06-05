function createTutorialOverlay() {
    const sankeyChartInstance = window.sankeyGlobalInstance;

    // Tutorial steps content
    const tutorialSteps = [
        {
            title: "Welcome to the Dashboard",
            content: "This interactive visualization shows relationships between MLB teams, their salary ranges, and performance metrics. Use the controls to explore different years and data."
        },
        {
            title: "Navigation Controls",
            content: "Use the year selector to switch between different time periods. The legend on the right shows different node types (Teams, Salary, Performance) and their meanings."
        },
        {
            title: "Interactive Features",
            content: "Click and drag nodes to reposition them for a clearer view. Hover over connections (links) or nodes to see detailed tooltips. Team nodes can be clicked to see more stats."
        },
        {
            title: "Focus: Oakland Athletics' Salary Flow",
            content: "Let's highlight a specific data flow. Watch how the Oakland Athletics' spending connects to their salary range. The animated pulse shows the direction and connection.",
            onEnter: () => {
                const sankeyChart = window.sankeyGlobalInstance;
                if (!sankeyChart || !sankeyChart.sankey || !sankeyChart.g) {
                    console.warn("Sankey chart not ready for story action: Oakland Athletics.");
                    return;
                }

                const links = sankeyChart.g.selectAll('.links path');
                let targetLinkElement = null;
                let targetLinkData = null;

                links.each(function(d) {
                    // d.source and d.target are the node objects after sankey.js processes the data
                    if (d.source && d.source.name === "Oakland Athletics" && d.target && d.target.category === "salary") {
                        targetLinkElement = this; // 'this' is the DOM element
                        targetLinkData = d;
                    }
                });

                if (targetLinkElement && targetLinkData) {
                    // Store for cleanup
                    window.activeStoryAnimation = { element: targetLinkElement, data: targetLinkData };

                    // Create a mock event object
                    // pageX/Y are for tooltip positioning. currentTarget is crucial for the function.
                    const mockEvent = {
                        pageX: window.innerWidth / 2,
                        pageY: window.innerHeight / 3, // Position tooltip a bit higher
                        currentTarget: targetLinkElement
                    };
                    sankeyChart.showLinkTooltip(mockEvent, targetLinkData);
                } else {
                    console.warn("Could not find the 'Oakland Athletics' to salary link for story animation.");
                }
            },
            onLeave: () => {
                const sankeyChart = window.sankeyGlobalInstance;
                if (window.activeStoryAnimation && sankeyChart) {
                    const { element, data } = window.activeStoryAnimation;
                    // Create a mock event for hiding, only currentTarget is strictly needed by hideLinkTooltip
                    const mockEventLeave = { currentTarget: element };
                    sankeyChart.hideLinkTooltip(mockEventLeave, data);
                    window.activeStoryAnimation = null; // Clear the stored animation
                }
            }
        },
        {
            title: "Data Insights",
            content: "The visualization reveals patterns in team performance, salary distributions, and their correlations. Look for thick flows indicating strong connections or large values. Explore different years to see trends."
        },
        {
            title: "Explore Further!",
            content: "You've completed the overview! Now, feel free to explore the dashboard, change years, and discover interesting insights about MLB team dynamics."
        }
    ];

    let currentStep = 0;
    let previousStepIndex = -1; // To track the last active step for onLeave

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
    const isSmallScreen = window.innerWidth < 768; // Common tablet breakpoint
    const isMobile = window.innerWidth < 480;    // Common mobile breakpoint

    // Dynamic height calculation
    let tutorialHeight, tutorialMaxHeight, tutorialMinHeight;

    function calculateTutorialSize() {
        const currentIsLandscape = window.innerWidth > window.innerHeight;
        const currentIsMobile = window.innerWidth < 480;

        if (currentIsLandscape && !currentIsMobile) { // Landscape tablet/desktop
            tutorialHeight = '35vh';
            tutorialMaxHeight = '280px';
            tutorialMinHeight = '200px';
        } else if (currentIsLandscape && currentIsMobile) { // Landscape mobile
            tutorialHeight = '45vh'; // More height for landscape mobile
            tutorialMaxHeight = '250px';
            tutorialMinHeight = '180px';
        } else if (!currentIsLandscape && window.innerWidth < 768) { // Portrait tablet/mobile
            tutorialHeight = '25vh';
            tutorialMaxHeight = '220px';
            tutorialMinHeight = '150px';
        }
         else { // Portrait desktop (less common for this type of overlay) or larger portrait
            tutorialHeight = '20vh';
            tutorialMaxHeight = '200px';
            tutorialMinHeight = '120px';
        }
        tutorialDiv.style.height = tutorialHeight;
        tutorialDiv.style.maxHeight = tutorialMaxHeight;
        tutorialDiv.style.minHeight = tutorialMinHeight;
    }
    
    calculateTutorialSize(); // Initial calculation


    // Styling for the tutorial overlay
    const tutorialStyles = {
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        // height, minHeight, maxHeight are set by calculateTutorialSize
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Modern gradient
        color: 'white',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif', // Simple, readable font
        transition: 'all 0.5s ease',
        animation: 'slideUp 0.6s ease-out'
    };

    Object.assign(tutorialDiv.style, tutorialStyles);

    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(100%); opacity: 0; }
        }
        .tutorial-overlay.fade-out {
            animation: fadeOut 0.5s ease-in forwards;
        }

        /* Base styles for content elements for responsiveness */
        .tutorial-header { padding: 8px 20px 5px 20px; }
        .tutorial-content { padding: 10px 20px; }
        .tutorial-content h3 { font-size: 17px; margin-bottom: 8px; }
        .tutorial-content p { font-size: 13px; line-height: 1.5; }
        .tutorial-footer { padding: 5px 20px 8px 20px; }
        .progress-indicator div { width: 6px; height: 6px; }
        .tutorial-footer button { padding: 6px 12px; font-size: 12px; }
        .tutorial-header button { font-size: 18px; padding: 3px;}
        .tutorial-footer span { font-size: 11px;}


        /* Small mobile screens (portrait & landscape) */
        @media screen and (max-width: 480px) {
            .tutorial-content h3 { font-size: 15px; margin-bottom: 5px; }
            .tutorial-content p { font-size: 12px; line-height: 1.4; }
            .tutorial-footer button { padding: 5px 10px; font-size: 11px; }
            .tutorial-header { padding: 6px 15px 4px 15px; }
            .tutorial-content { padding: 8px 15px; }
            .tutorial-footer { padding: 4px 15px 6px 15px; }
        }

        /* Tablets and larger phones (portrait) */
        @media screen and (min-width: 481px) and (max-width: 767px) and (orientation: portrait) {
            .tutorial-content h3 { font-size: 16px; }
            .tutorial-content p { font-size: 13px; }
        }
        
        /* Tablets (landscape) & Small Desktops */
        @media screen and (min-width: 768px) and (max-width: 1199px), screen and (min-width:481px) and (max-width: 767px) and (orientation: landscape) {
            .tutorial-header { padding: 10px 25px 6px 25px; }
            .tutorial-content { padding: 12px 25px; }
            .tutorial-content h3 { font-size: 18px; margin-bottom: 10px; }
            .tutorial-content p { font-size: 14px; line-height: 1.6; }
            .tutorial-footer { padding: 6px 25px 10px 25px; }
            .progress-indicator div { width: 7px; height: 7px; }
            .tutorial-footer button { padding: 7px 14px; font-size: 13px; }
            .tutorial-header button { font-size: 20px; }
             .tutorial-footer span { font-size: 12px;}
        }

        /* Larger Desktops */
        @media screen and (min-width: 1200px) {
            .tutorial-header { padding: 12px 30px 8px 30px; }
            .tutorial-content { padding: 15px 30px; }
            .tutorial-content h3 { font-size: 20px; margin-bottom: 12px; }
            .tutorial-content p { font-size: 15px; line-height: 1.6; max-width: 90%;} /* Limit text width on large screens */
            .tutorial-footer { padding: 8px 30px 12px 30px; }
            .progress-indicator div { width: 8px; height: 8px; }
            .tutorial-footer button { padding: 8px 16px; font-size: 14px; }
            .tutorial-header button { font-size: 22px; }
             .tutorial-footer span { font-size: 12px;}
        }
        
        /* Very wide screens - center the tutorial */
        @media screen and (min-width: 1600px) {
            .tutorial-overlay {
                max-width: 1200px; /* Max width for the tutorial box */
                left: 50%;
                transform: translateX(-50%) !important; /* Important to override inline style */
                border-radius: 10px 10px 0 0; /* Rounded top corners */
            }
        }
    `;
    document.head.appendChild(styleSheet);
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'tutorial-header';
    headerDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        flex-shrink: 0;
    `;

    const progressDiv = document.createElement('div');
    progressDiv.className = 'progress-indicator';
    progressDiv.style.cssText = `display: flex; gap: 6px; align-items: center;`;

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
        background: none; border: none; color: white;
        cursor: pointer; border-radius: 3px;
        transition: background 0.2s ease, transform 0.2s ease; opacity: 0.7;
    `;
    closeButton.innerHTML = '×'; // Use HTML entity for close icon
    closeButton.setAttribute('aria-label', 'Close tutorial');
    closeButton.onmouseenter = () => { closeButton.style.background = 'rgba(255,255,255,0.2)'; closeButton.style.opacity = '1'; closeButton.style.transform = 'scale(1.1)';};
    closeButton.onmouseleave = () => { closeButton.style.background = 'none'; closeButton.style.opacity = '0.7'; closeButton.style.transform = 'scale(1)';};

    headerDiv.appendChild(progressDiv);
    headerDiv.appendChild(closeButton);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'tutorial-content';
    contentDiv.style.cssText = `
        flex: 1; display: flex; flex-direction: column;
        justify-content: center; overflow: auto; /* Allow scrolling for content taller than area */
    `;

    const titleElement = document.createElement('h3');
    titleElement.style.cssText = `font-weight: bold; opacity: 0.95; margin-top:0;`;

    const contentElement = document.createElement('p');
    contentElement.style.cssText = `margin-bottom:0; opacity: 0.9;`;

    contentDiv.appendChild(titleElement);
    contentDiv.appendChild(contentElement);

    const footerDiv = document.createElement('div');
    footerDiv.className = 'tutorial-footer';
    footerDiv.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.1);
    `;

    const stepIndicator = document.createElement('span');
    stepIndicator.style.opacity = '0.8';

    const nextButton = document.createElement('button');
    nextButton.style.cssText = `
        background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
        color: white; border-radius: 18px; cursor: pointer;
        display: flex; align-items: center; gap: 6px;
        transition: all 0.3s ease; font-weight: 500;
    `;
    nextButton.onmouseenter = () => { nextButton.style.background = 'rgba(255,255,255,0.3)'; nextButton.style.transform = 'translateY(-1px)';};
    nextButton.onmouseleave = () => { nextButton.style.background = 'rgba(255,255,255,0.2)'; nextButton.style.transform = 'translateY(0)';};

    footerDiv.appendChild(stepIndicator);
    footerDiv.appendChild(nextButton);

    tutorialDiv.appendChild(headerDiv);
    tutorialDiv.appendChild(contentDiv);
    tutorialDiv.appendChild(footerDiv);

    function updateProgressIndicator() {
        progressDiv.innerHTML = '';
        tutorialSteps.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.style.cssText = `
                border-radius: 50%;
                background: ${i <= currentStep ? 'white' : 'rgba(255,255,255,0.3)'};
                transition: all 0.3s ease;
            `;
            progressDiv.appendChild(dot);
        });
    }

    function updateContent() {
        if (previousStepIndex !== -1 && previousStepIndex < tutorialSteps.length) {
            const prevStep = tutorialSteps[previousStepIndex];
            if (prevStep.onLeave) {
                prevStep.onLeave();
            }
        }

        const step = tutorialSteps[currentStep];
        titleElement.textContent = step.title;
        contentElement.innerHTML = step.content; // Use innerHTML if content might have simple HTML like <strong>
        stepIndicator.textContent = `Step ${currentStep + 1} of ${tutorialSteps.length}`;
        
        nextButton.innerHTML = (currentStep === tutorialSteps.length - 1) ? 'Finish ✓' : 'Next →';
        
        updateProgressIndicator();

        if (step.onEnter) {
            step.onEnter();
        }
        previousStepIndex = currentStep;
    }

    function handleNext() {
        if (currentStep === tutorialSteps.length - 1) {
            const lastStep = tutorialSteps[currentStep];
            if (lastStep.onLeave) {
                lastStep.onLeave();
            }
            closeTutorial();
        } else {
            // onLeave for current step will be handled by updateContent in the next call
            currentStep++;
            updateContent();
        }
    }
    
    function closeTutorial() {
        tutorialDiv.classList.add('fade-out');
        setTimeout(() => {
            if (tutorialDiv.parentNode) {
                tutorialDiv.parentNode.removeChild(tutorialDiv);
            }
            if (styleSheet.parentNode) {
                styleSheet.parentNode.removeChild(styleSheet);
            }
            window.removeEventListener('orientationchange', handleSizeRecalculation);
            window.removeEventListener('resize', handleSizeRecalculation);
        }, 500);
    }


    function handleClose() {
        if (currentStep >= 0 && currentStep < tutorialSteps.length) {
            const currentStepObj = tutorialSteps[currentStep];
            if (currentStepObj.onLeave) {
                currentStepObj.onLeave();
            }
        }
        closeTutorial();
    }
    
    function handleSizeRecalculation() {
        calculateTutorialSize();
        // Potentially re-trigger onEnter if slide elements need repositioning based on new size
        // For now, just recalculating size.
    }


    nextButton.addEventListener('click', handleNext);
    closeButton.addEventListener('click', handleClose);
    // Use a single handler for resize and orientation change
    window.addEventListener('orientationchange', handleSizeRecalculation);
    window.addEventListener('resize', handleSizeRecalculation);


    tutorialDiv.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); handleNext(); }
        else if (e.key === 'Escape') { e.preventDefault(); handleClose(); }
    });
    tutorialDiv.setAttribute('tabindex', '0');

    updateContent();
    document.body.appendChild(tutorialDiv);
    tutorialDiv.focus();
}

// Initialize tutorial on page load, ensuring DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createTutorialOverlay);
} else {
    createTutorialOverlay(); // DOMContentLoaded has already fired
}
