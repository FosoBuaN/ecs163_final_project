function createTutorialOverlay() {
    const sankeyChartInstance = window.sankeyGlobalInstance;

    // Function to change the Sankey diagram's year by calling the globally exposed updateToYear from main.js
    window.changeSankeyYear = async function(year) {
        console.log(`Attempting to change year to: ${year} via story.js by calling window.updateToYear`);

        if (typeof window.updateToYear === 'function') {
            const parsedYear = parseInt(year, 10);
            const processedData = window.updateToYear(parsedYear);

            if (processedData && processedData.nodes && processedData.nodes.length > 0) {
                console.log(`Year change to ${parsedYear} processed successfully by main.js logic.`);
                await new Promise(resolve => setTimeout(resolve, 500)); 
                return true; 
            } else {
                console.warn(`window.updateToYear did not return valid processed data for year ${parsedYear}, or year was invalid/unavailable.`);
                if(typeof window.getAvailableYears === 'function'){
                    console.log("Available years in main.js scope:", window.getAvailableYears());
                }
                return false; 
            }
        } else {
            console.error("window.updateToYear function is not defined. Cannot programmatically change year from story.js.");
            const yearSliderElement = document.querySelector('#slider-container input[type="range"], #year-slider'); 
            if (yearSliderElement) {
                console.warn("Fallback: Attempting to manipulate year slider directly as window.updateToYear was not found.");
                yearSliderElement.value = year;
                yearSliderElement.dispatchEvent(new Event('input', { bubbles: true }));
                yearSliderElement.dispatchEvent(new Event('change', { bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, 100)); 
                console.log(`Fallback: Year change to ${year} initiated via slider manipulation.`);
                return true; 
            } else {
                 console.error("Fallback failed: Year slider not found with common selectors.");
                 return false;
            }
        }
    };

    // Helper function to stop all story-initiated pulse animations
    function stopAllStoryPulseAnimations(sankeyChart) {
        if (!sankeyChart || !sankeyChart.svg) {
            console.warn("Sankey chart instance or SVG not available for stopping animations.");
            return;
        }

        // Clear any tracked animations from window.activeStoryAnimations
        if (window.activeStoryAnimations && window.activeStoryAnimations.length > 0) {
            console.log("Stopping tracked story animations:", window.activeStoryAnimations.length);
            window.activeStoryAnimations.forEach(anim => {
                if (anim.element && anim.data && sankeyChart.hideLinkTooltip) {
                    try {
                        sankeyChart.hideLinkTooltip({ currentTarget: anim.element }, anim.data);
                    } catch (e) {
                        console.warn("Error hiding link tooltip during stopAllStoryPulseAnimations:", e);
                    }
                }
            });
        }
        window.activeStoryAnimations = []; // Ensure it's cleared

        // More general cleanup for any orphaned tooltips or gradients
        // sankeyChart.hideLinkTooltip internally calls d3.selectAll('.sankey-tooltip').remove();
        // So, calling it (even with dummy args if we don't have specifics) might be one way,
        // but direct removal of tooltips and gradients is safer if hideLinkTooltip isn't robust to nulls.
        
        // Force remove all tooltips that might have been created by the story.
        d3.selectAll('.sankey-tooltip').remove();

        // Force remove all pulse gradients created by the story from the SVG definitions.
        // These IDs are generated in sankeyChart.js's showLinkTooltip and showNodeTooltip.
        sankeyChart.svg.select('defs').selectAll('linearGradient[id^="link-pulse-gradient-"]').remove();
        sankeyChart.svg.select('defs').selectAll('linearGradient[id^="node-link-pulse-gradient-"]').remove();
        
        // Restore default opacity to all links if they were dimmed.
        // The hideLinkTooltip and hideNodeTooltip in sankeyChart.js should handle this for involved links.
        // If a global dimming effect was applied that isn't reset, that would need specific handling.
        // For now, this focuses on the pulse/tooltip effects.
        if (sankeyChart.g) {
             sankeyChart.g.selectAll('.links path').attr('stroke-opacity', 0.6); // Default link opacity
             sankeyChart.g.selectAll('.nodes .node rect').attr('fill-opacity', 1); // Default node opacity
        }
        console.log("All story-initiated pulse animations, tooltips, and gradients should be cleared.");
    }


    // Tutorial steps content
    const tutorialSteps = [
        { // Index 0
            title: "Welcome to the Dashboard",
            content: "This interactive visualization shows relationships between MLB teams, their salary ranges, and performance metrics."
        },
        { // Index 1
            title: "Navigation Controls",
            content: "Use the year selector to switch between different time periods. The legend on the right shows different node types (Teams, Salary, Performance) and their meanings."
        },
        { // Index 2
            title: "Interactive Features",
            content: "Hover over connections (links) or nodes to see detailed tooltips. Team nodes can be clicked to see more stats."
        },
        { // Index 3
            title: "Focus: Oakland Athletics' Salary to Performance Flow",
            content: "For example, let's examine an interesting case in the Oakland A's. Watch how the Oakland A's low spending connects to their low salary range. The animated pulse shows the connection.",
            onEnter: () => {
                const sankeyChart = window.sankeyGlobalInstance;
                if (!sankeyChart || !sankeyChart.sankey || !sankeyChart.g) {
                    console.warn("Sankey chart not ready for story action: Oakland Athletics (current year).");
                    return;
                }
                window.activeStoryAnimations = []; 

                const links = sankeyChart.g.selectAll('.links path');
                let targetLinkElement = null;
                let targetLinkData = null;

                links.each(function(d) {
                    if (d.source && d.source.name === "Oakland Athletics" && d.target && d.target.category === "salary") {
                        targetLinkElement = this;
                        targetLinkData = d;
                    }
                });

                if (targetLinkElement && targetLinkData) {
                    window.activeStoryAnimations.push({ element: targetLinkElement, data: targetLinkData });
                    const mockEvent = {
                        pageX: window.innerWidth / 2,
                        pageY: window.innerHeight / 3,
                        currentTarget: targetLinkElement
                    };
                    sankeyChart.showLinkTooltip(mockEvent, targetLinkData);
                } else {
                    console.warn("Could not find the 'Oakland Athletics' to salary link for story animation (current year).");
                }
            },
            onLeave: () => {
                const sankeyChart = window.sankeyGlobalInstance;
                if (sankeyChart) {
                    stopAllStoryPulseAnimations(sankeyChart); // Use general cleanup
                }
            }
        },
        { // Index 4
            title: "Insight: Low Salary to High Performance",
            content: "Now, let's see an interesting pattern: The Oakland A's are one of 3 teams in 2004 who paid low salaries but still exhibited high performance. This highlights the teams achieving top results with lower spending.",
            onEnter: () => {
                const sankeyChart = window.sankeyGlobalInstance;
                if (!sankeyChart || !sankeyChart.sankey || !sankeyChart.g) {
                    console.warn("Sankey chart not ready for story action: Low Salary to High Performance.");
                    return;
                }
                window.activeStoryAnimations = []; 

                const links = sankeyChart.g.selectAll('.links path');
                let targetLinkElement = null;
                let targetLinkData = null;

                const sourceNodeName = "Low Salary"; 
                const sourceNodeCategory = "salary";
                const targetNodeName = "High Performance"; 
                const targetNodeCategory = "performance";

                links.each(function(d) {
                    if (d.source && d.source.name === sourceNodeName && d.source.category === sourceNodeCategory &&
                        d.target && d.target.name === targetNodeName && d.target.category === targetNodeCategory) {
                        targetLinkElement = this;
                        targetLinkData = d;
                    }
                });

                if (targetLinkElement && targetLinkData) {
                    window.activeStoryAnimations.push({ element: targetLinkElement, data: targetLinkData });
                    const mockEvent = {
                        pageX: window.innerWidth / 2,
                        pageY: window.innerHeight / 2, 
                        currentTarget: targetLinkElement
                    };
                    sankeyChart.showLinkTooltip(mockEvent, targetLinkData);
                } else {
                    console.warn(`Could not find the link from '${sourceNodeName}' to '${targetNodeName}' for story animation. Please check node names and categories.`);
                }
            },
            onLeave: () => {
                const sankeyChart = window.sankeyGlobalInstance;
                 if (sankeyChart) {
                    stopAllStoryPulseAnimations(sankeyChart);
                }
            }
        },
        { // Index 5
            title: "Year 2005: Oakland A's & Salary Insights",
            content: "Let's travel to 2005. Once again, the Oakland A's spent less compared to the rest of the teams, but the entire league exhibited mediocre performance that year on average.",
            onEnter: async () => {
                const sankeyChart = window.sankeyGlobalInstance;
                if (!sankeyChart) {
                    console.warn("Sankey chart instance not available for year change in story.");
                    return;
                }
                window.activeStoryAnimations = []; 
                
                const yearChangedSuccessfully = await window.changeSankeyYear(2005); 

                if (!yearChangedSuccessfully) {
                    console.error("Failed to change year to 2005 for story slide. Highlight will not proceed.");
                    return;
                }
                
                if (!sankeyChart.g) { 
                     console.warn("Sankey chart's graph group (g) not ready after attempting year change to 2005 for highlighting.");
                     return;
                }
                const links = sankeyChart.g.selectAll('.links path');
                
                let teamLinkElement = null; 
                let teamLinkData = null;
                const teamName = "Oakland Athletics";
                const targetSalaryNodeNameOakland = "Low Salary"; 

                links.each(function(d) {
                    if (d.source && d.source.name === teamName && d.source.category === "team" &&
                        d.target && d.target.name === targetSalaryNodeNameOakland && d.target.category === "salary") {
                        teamLinkElement = this; 
                        teamLinkData = d;
                    }
                });

                if (teamLinkElement && teamLinkData) {
                    window.activeStoryAnimations.push({ element: teamLinkElement, data: teamLinkData });
                    const mockEventTeam = { 
                        pageX: window.innerWidth * 0.4, 
                        pageY: window.innerHeight / 3, 
                        currentTarget: teamLinkElement 
                    };
                    sankeyChart.showLinkTooltip(mockEventTeam, teamLinkData);
                } else {
                    console.warn(`Could not find link from '${teamName}' to '${targetSalaryNodeNameOakland}' for year 2005.`);
                }

                let salaryPerfLinkElement = null;
                let salaryPerfLinkData = null;
                const sourceSalaryNodeName = "Low Salary";
                const targetPerformanceNodeName = "Medium Performance"; 

                links.each(function(d) {
                    if (d.source && d.source.name === sourceSalaryNodeName && d.source.category === "salary" &&
                        d.target && d.target.name === targetPerformanceNodeName && d.target.category === "performance") {
                        salaryPerfLinkElement = this;
                        salaryPerfLinkData = d;
                    }
                });

                if (salaryPerfLinkElement && salaryPerfLinkData) {
                    window.activeStoryAnimations.push({ element: salaryPerfLinkElement, data: salaryPerfLinkData });
                     const mockEventSalaryPerf = { 
                        pageX: window.innerWidth * 0.6, 
                        pageY: window.innerHeight / 2.5, 
                        currentTarget: salaryPerfLinkElement 
                    };
                    sankeyChart.showLinkTooltip(mockEventSalaryPerf, salaryPerfLinkData);
                } else {
                    console.warn(`Could not find link from '${sourceSalaryNodeName}' to '${targetPerformanceNodeName}' for year 2005. Check node names.`);
                }
            },
            onLeave: () => {
                const sankeyChart = window.sankeyGlobalInstance;
                if (sankeyChart) {
                    stopAllStoryPulseAnimations(sankeyChart);
                }
            }
        },
        { // Index 6
            title: "Year 2006: A's Low Salary & Performance Link",
            content: "And finally let's look at 2006. Once again, observe the Oakland A's connection with 'Low Salary' and 'High Performance'.",
            onEnter: async () => {
                const sankeyChart = window.sankeyGlobalInstance;
                if (!sankeyChart) {
                    console.warn("Sankey chart instance not available for year change in story.");
                    return;
                }
                window.activeStoryAnimations = [];
                
                const yearChangedSuccessfully = await window.changeSankeyYear(2006); 

                if (!yearChangedSuccessfully) {
                    console.error("Failed to change year to 2006 for story slide. Highlight will not proceed.");
                    return;
                }
                
                if (!sankeyChart.g) { 
                     console.warn("Sankey chart's graph group (g) not ready after attempting year change to 2006 for highlighting.");
                     return;
                }
                const links = sankeyChart.g.selectAll('.links path');
                
                let teamLinkElement = null; 
                let teamLinkData = null;
                const teamNameOakland = "Oakland Athletics";
                const targetSalaryNodeNameOakland2006 = "Low Salary"; 

                links.each(function(d) {
                    if (d.source && d.source.name === teamNameOakland && d.source.category === "team" &&
                        d.target && d.target.name === targetSalaryNodeNameOakland2006 && d.target.category === "salary") {
                        teamLinkElement = this; 
                        teamLinkData = d;
                    }
                });

                if (teamLinkElement && teamLinkData) {
                     window.activeStoryAnimations.push({ element: teamLinkElement, data: teamLinkData });
                    const mockEventOakland = { 
                        pageX: window.innerWidth * 0.4, 
                        pageY: window.innerHeight / 3, 
                        currentTarget: teamLinkElement 
                    };
                    sankeyChart.showLinkTooltip(mockEventOakland, teamLinkData);
                } else {
                    console.warn(`Could not find link from '${teamNameOakland}' to '${targetSalaryNodeNameOakland2006}' for year 2006.`);
                }

                let salaryPerfLinkElement2006 = null;
                let salaryPerfLinkData2006 = null;
                const sourceSalaryNodeName2006 = "Low Salary";
                const targetPerformanceNodeName2006 = "High Performance"; 

                links.each(function(d) {
                    if (d.source && d.source.name === sourceSalaryNodeName2006 && d.source.category === "salary" &&
                        d.target && d.target.name === targetPerformanceNodeName2006 && d.target.category === "performance") {
                        salaryPerfLinkElement2006 = this;
                        salaryPerfLinkData2006 = d;
                    }
                });

                if (salaryPerfLinkElement2006 && salaryPerfLinkData2006) {
                    window.activeStoryAnimations.push({ element: salaryPerfLinkElement2006, data: salaryPerfLinkData2006 });
                     const mockEventSalaryPerf2006 = { 
                        pageX: window.innerWidth * 0.6, 
                        pageY: window.innerHeight / 2.5, 
                        currentTarget: salaryPerfLinkElement2006 
                    };
                    sankeyChart.showLinkTooltip(mockEventSalaryPerf2006, salaryPerfLinkData2006);
                } else {
                    console.warn(`Could not find link from '${sourceSalaryNodeName2006}' to '${targetPerformanceNodeName2006}' for year 2006. Check node names.`);
                }
            },
            onLeave: () => {
                const sankeyChart = window.sankeyGlobalInstance;
                if (sankeyChart) {
                    stopAllStoryPulseAnimations(sankeyChart);
                }
            }
        },
        { // Index 7 - This is the 8th slide.
            title: "Data Insights & Exploration", // Updated title
            content: "We were able to see how the Oakland A's consistently spent low salaries but still maintained average to good performance. Review the overall patterns over the years to discover your own insights about team spending and performance.",
            onEnter: async () => {
                console.log("Entering 'Data Insights & Exploration' slide: Resetting to year 2004 and stopping all animations.");
                const sankeyChart = window.sankeyGlobalInstance;
                if (sankeyChart) {
                    stopAllStoryPulseAnimations(sankeyChart); // Ensure all prior animations are cleared
                }
                
                await window.changeSankeyYear(2004); // Reset to default/starting year
                console.log("Year reset to 2004 for 'Data Insights & Exploration' slide.");
                window.activeStoryAnimations = []; // Ensure this is clear for this clean slide
            },
            onLeave: () => { // Clean up if any unexpected state occurs
                const sankeyChart = window.sankeyGlobalInstance;
                if (sankeyChart) {
                    stopAllStoryPulseAnimations(sankeyChart);
                }
                 window.activeStoryAnimations = [];
            }
        },
        { // Index 8
            title: "Explore Further!",
            content: "You've completed the guided tour! Now, feel free to explore the dashboard independently. Change years, hover over flows, and click on teams to discover interesting insights about MLB team dynamics.",
             onEnter: async () => { // Ensure clean state and correct year on the final slide too
                console.log("Entering 'Explore Further!' slide: Ensuring year is 2004 and animations are stopped.");
                const sankeyChart = window.sankeyGlobalInstance;
                if (sankeyChart) {
                    stopAllStoryPulseAnimations(sankeyChart);
                }
                // Confirm or reset year to 2004 if it might have changed
                const yearSlider = document.getElementById('year-slider');
                if (yearSlider && yearSlider.value !== "2004") {
                    console.log("Final slide: Re-confirming year to 2004.");
                    await window.changeSankeyYear(2004);
                } else if (!yearSlider) { // If slider not found, still try to change year
                     await window.changeSankeyYear(2004);
                }
                 window.activeStoryAnimations = [];
                console.log("Ready for free exploration, year confirmed/set to 2004.");
            },
            onLeave: () => { // Final cleanup when even the last slide is left (e.g., tutorial closes)
                const sankeyChart = window.sankeyGlobalInstance;
                if (sankeyChart) {
                    stopAllStoryPulseAnimations(sankeyChart);
                }
                 window.activeStoryAnimations = [];
            }
        }
    ];

    let currentStep = 0;
    let previousStepIndex = -1; 

    const existingTutorial = document.querySelector('.tutorial-overlay');
    if (existingTutorial) {
        existingTutorial.remove();
    }

    const tutorialDiv = document.createElement('div');
    tutorialDiv.className = 'tutorial-overlay';

    let tutorialHeight, tutorialMaxHeight, tutorialMinHeight;

    function calculateTutorialSize() {
        const currentIsLandscape = window.innerWidth > window.innerHeight;
        const currentIsMobile = window.innerWidth < 480;
        if (currentIsLandscape && !currentIsMobile) { 
            tutorialHeight = '35vh'; tutorialMaxHeight = '280px'; tutorialMinHeight = '200px';
        } else if (currentIsLandscape && currentIsMobile) { 
            tutorialHeight = '45vh'; tutorialMaxHeight = '250px'; tutorialMinHeight = '180px';
        } else if (!currentIsLandscape && window.innerWidth < 768) { 
            tutorialHeight = '25vh'; tutorialMaxHeight = '220px'; tutorialMinHeight = '150px';
        } else { 
            tutorialHeight = '20vh'; tutorialMaxHeight = '200px'; tutorialMinHeight = '120px';
        }
        tutorialDiv.style.height = tutorialHeight;
        tutorialDiv.style.maxHeight = tutorialMaxHeight;
        tutorialDiv.style.minHeight = tutorialMinHeight;
    }
    calculateTutorialSize(); 

    const tutorialStyles = {
        position: 'fixed', bottom: '0', left: '0', right: '0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white', boxShadow: '0 -4px 20px rgba(0,0,0,0.3)', zIndex: '9999',
        display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', 
        transition: 'all 0.5s ease', animation: 'slideUp 0.6s ease-out'
    };
    Object.assign(tutorialDiv.style, tutorialStyles);

    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(100%); opacity: 0; } }
        .tutorial-overlay.fade-out { animation: fadeOut 0.5s ease-in forwards; }
        .tutorial-header { padding: 8px 20px 5px 20px; } .tutorial-content { padding: 10px 20px; }
        .tutorial-content h3 { font-size: 17px; margin-bottom: 8px; } .tutorial-content p { font-size: 13px; line-height: 1.5; }
        .tutorial-footer { padding: 5px 20px 8px 20px; } .progress-indicator div { width: 6px; height: 6px; }
        .tutorial-footer button { padding: 6px 12px; font-size: 12px; } .tutorial-header button { font-size: 18px; padding: 3px;}
        .tutorial-footer span { font-size: 11px;}
        @media screen and (max-width: 480px) {
            .tutorial-content h3 { font-size: 15px; margin-bottom: 5px; } .tutorial-content p { font-size: 12px; line-height: 1.4; }
            .tutorial-footer button { padding: 5px 10px; font-size: 11px; } .tutorial-header { padding: 6px 15px 4px 15px; }
            .tutorial-content { padding: 8px 15px; } .tutorial-footer { padding: 4px 15px 6px 15px; }
        }
        @media screen and (min-width: 481px) and (max-width: 767px) and (orientation: portrait) {
            .tutorial-content h3 { font-size: 16px; } .tutorial-content p { font-size: 13px; }
        }
        @media screen and (min-width: 768px) and (max-width: 1199px), screen and (min-width:481px) and (max-width: 767px) and (orientation: landscape) {
            .tutorial-header { padding: 10px 25px 6px 25px; } .tutorial-content { padding: 12px 25px; }
            .tutorial-content h3 { font-size: 18px; margin-bottom: 10px; } .tutorial-content p { font-size: 14px; line-height: 1.6; }
            .tutorial-footer { padding: 6px 25px 10px 25px; } .progress-indicator div { width: 7px; height: 7px; }
            .tutorial-footer button { padding: 7px 14px; font-size: 13px; } .tutorial-header button { font-size: 20px; }
             .tutorial-footer span { font-size: 12px;}
        }
        @media screen and (min-width: 1200px) {
            .tutorial-header { padding: 12px 30px 8px 30px; } .tutorial-content { padding: 15px 30px; }
            .tutorial-content h3 { font-size: 20px; margin-bottom: 12px; } .tutorial-content p { font-size: 15px; line-height: 1.6; max-width: 90%;}
            .tutorial-footer { padding: 8px 30px 12px 30px; } .progress-indicator div { width: 8px; height: 8px; }
            .tutorial-footer button { padding: 8px 16px; font-size: 14px; } .tutorial-header button { font-size: 22px; }
             .tutorial-footer span { font-size: 12px;}
        }
        @media screen and (min-width: 1600px) {
            .tutorial-overlay { max-width: 1200px; left: 50%; transform: translateX(-50%) !important; border-radius: 10px 10px 0 0; }
        }
    `;
    document.head.appendChild(styleSheet);
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'tutorial-header';
    headerDiv.style.cssText = `display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.2); flex-shrink: 0;`;

    const progressDiv = document.createElement('div');
    progressDiv.className = 'progress-indicator';
    progressDiv.style.cssText = `display: flex; gap: 6px; align-items: center;`;

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `background: none; border: none; color: white; cursor: pointer; border-radius: 3px; transition: background 0.2s ease, transform 0.2s ease; opacity: 0.7;`;
    closeButton.innerHTML = '×'; 
    closeButton.setAttribute('aria-label', 'Close tutorial');
    closeButton.onmouseenter = () => { closeButton.style.background = 'rgba(255,255,255,0.2)'; closeButton.style.opacity = '1'; closeButton.style.transform = 'scale(1.1)';};
    closeButton.onmouseleave = () => { closeButton.style.background = 'none'; closeButton.style.opacity = '0.7'; closeButton.style.transform = 'scale(1)';};
    headerDiv.appendChild(progressDiv);
    headerDiv.appendChild(closeButton);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'tutorial-content';
    contentDiv.style.cssText = `flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: auto;`;

    const titleElement = document.createElement('h3');
    titleElement.style.cssText = `font-weight: bold; opacity: 0.95; margin-top:0;`;

    const contentElement = document.createElement('p');
    contentElement.style.cssText = `margin-bottom:0; opacity: 0.9;`;
    contentDiv.appendChild(titleElement);
    contentDiv.appendChild(contentElement);

    const footerDiv = document.createElement('div');
    footerDiv.className = 'tutorial-footer';
    footerDiv.style.cssText = `display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.1);`;

    const stepIndicator = document.createElement('span');
    stepIndicator.style.opacity = '0.8';

    const nextButton = document.createElement('button');
    nextButton.style.cssText = `background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 18px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.3s ease; font-weight: 500;`;
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
            dot.style.cssText = `border-radius: 50%; background: ${i <= currentStep ? 'white' : 'rgba(255,255,255,0.3)'}; transition: all 0.3s ease;`;
            progressDiv.appendChild(dot);
        });
    }

    async function updateContent() { 
        if (previousStepIndex !== -1 && previousStepIndex < tutorialSteps.length) {
            const prevStep = tutorialSteps[previousStepIndex];
            if (prevStep.onLeave) {
                try { await prevStep.onLeave(); } 
                catch (e) { console.error("Error in onLeave for previous step:", e); }
            }
        }

        const step = tutorialSteps[currentStep];
        titleElement.textContent = step.title;
        contentElement.innerHTML = step.content; 
        stepIndicator.textContent = `Step ${currentStep + 1} of ${tutorialSteps.length}`;
        nextButton.innerHTML = (currentStep === tutorialSteps.length - 1) ? 'Finish ✓' : 'Next →';
        updateProgressIndicator();

        if (step.onEnter) {
            try { await step.onEnter(); } 
            catch (e) { console.error("Error in onEnter for current step:", e); }
        }
        previousStepIndex = currentStep;
    }

    async function handleNext() { 
        if (currentStep === tutorialSteps.length - 1) {
            const lastStep = tutorialSteps[currentStep];
            if (lastStep.onLeave) { 
                try { await lastStep.onLeave(); } 
                catch (e) { console.error("Error in onLeave for last step:", e); }
            }
            closeTutorial();
        } else {
            currentStep++;
            await updateContent(); 
        }
    }
    
    function closeTutorial() {
        if (currentStep >= 0 && currentStep < tutorialSteps.length) {
            const currentStepObj = tutorialSteps[currentStep];
            if (currentStepObj.onLeave) { 
                 (async () => {
                    try { await currentStepObj.onLeave(); } 
                    catch (e) { console.error("Error in onLeave during closeTutorial:", e); }
                 })();
            }
        }

        tutorialDiv.classList.add('fade-out');
        setTimeout(() => {
            if (tutorialDiv.parentNode) { tutorialDiv.parentNode.removeChild(tutorialDiv); }
            if (styleSheet.parentNode) { styleSheet.parentNode.removeChild(styleSheet); }
            window.removeEventListener('orientationchange', handleSizeRecalculation);
            window.removeEventListener('resize', handleSizeRecalculation);
        }, 500);
    }

    async function handleClose() { 
        if (currentStep >= 0 && currentStep < tutorialSteps.length) {
            const currentStepObj = tutorialSteps[currentStep];
            if (currentStepObj.onLeave) { 
                try { await currentStepObj.onLeave(); } 
                catch(e) { console.error("Error in onLeave during handleClose:", e); }
            }
        }
        closeTutorial(); 
    }
    
    function handleSizeRecalculation() { calculateTutorialSize(); }

    nextButton.addEventListener('click', handleNext); 
    closeButton.addEventListener('click', handleClose); 
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createTutorialOverlay);
} else {
    createTutorialOverlay();
}
