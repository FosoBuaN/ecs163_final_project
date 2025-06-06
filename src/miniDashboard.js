// src/miniDashboard.js

// ────────────────────────────────────────────────────────────────────────────────
// 1) Immediately create a hidden overlay + content box (all inline styles).
// ────────────────────────────────────────────────────────────────────────────────
(function initializeMiniDashboardOverlay() {
  // 1A) Create the overlay DIV (initially hidden, opacity=0)
  const overlay = d3
    .select("body")
    .append("div")
      // full‐screen, dark translucent backdrop
      .style("position", "fixed")
      .style("top", "0")
      .style("left", "0")
      .style("width", "100%")
      .style("height", "100%")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("display", "none")    // hidden by default
      .style("opacity", 0)         // will fade in
      .style("justify-content", "center")
      .style("align-items", "center")
      .style("z-index", 1000);

  // 1B) Create a white content box inside that overlay
  const contentBox = overlay
    .append("div")
      .style("position", "relative")
      .style("background", "#ffffff")
      .style("padding", "20px")
      .style("border-radius", "8px")
      .style("box-shadow", "0 2px 10px rgba(0,0,0,0.3)")
      .style("max-width", "80%")
      .style("max-height", "80%")
      .style("overflow-y", "auto")
      .style("display", "flex")
      .style("flex-direction", "column");

  // 1C) Add a close “×” button in the top‐right corner of contentBox
  contentBox
    .append("button")
      .text("×")
      .style("position", "absolute")
      .style("top", "10px")
      .style("right", "10px")
      .style("background", "transparent")
      .style("border", "none")
      .style("font-size", "24px")
      .style("cursor", "pointer")
      .on("click", () => {
        // fade out the overlay over 300 ms, then hide
        overlay
          .transition()
          .duration(300)
          .style("opacity", 0)
          .on("end", () => overlay.style("display", "none"));
      });

  // 1D) Save references so showMiniDashboard() can use them
  window._miniDashboardOverlay = overlay;
  window._miniDashboardContent = contentBox;
})();

// ────────────────────────────────────────────────────────────────────────────────
// 2) Entry point: called by SankeyChart’s click handler.
//    Fades in the overlay, adds a title, then draws a chart with animations.
// ────────────────────────────────────────────────────────────────────────────────
function showMiniDashboard(nodeDetails) {
  // nodeDetails = {
  //   nodeId: "...",
  //   nodeName: "...",
  //   nodeCategory: "salary" or "performance",
  //   players: [ { player_id, team_name, salary_category, performance_category, … }, … ]
  // }

  const overlay = window._miniDashboardOverlay;
  const contentBox = window._miniDashboardContent;

  // 2A) Clear out any previous <svg> / <h3> / <p> (but keep the “×” button)
  contentBox.selectAll("svg").remove();
  contentBox.selectAll("h3").remove();
  contentBox.selectAll("p").remove();

  // 2B) Depending on nodeCategory, insert a title and draw the chart:
  if (nodeDetails.nodeCategory === "salary") {
    contentBox
      .append("h3")
      .style("margin", "0 0 10px 0")
      .style("font-family", "sans-serif")
      .style("font-size", "18px")
      .style("text-align", "center")
      .text(`Players per Team (${nodeDetails.nodeName})`);

    drawSalaryBarChart(nodeDetails.players, contentBox);
  }
  else if (nodeDetails.nodeCategory === "performance") {
    contentBox
      .append("h3")
      .style("margin", "0 0 10px 0")
      .style("font-family", "sans-serif")
      .style("font-size", "18px")
      .style("text-align", "center")
      .text(`Salary Distribution (${nodeDetails.nodeName})`);

    drawPerformancePieChart(nodeDetails.players, contentBox);
  }
  else {
    contentBox
      .append("p")
      .style("font-family", "sans-serif")
      .style("font-size", "14px")
      .style("text-align", "center")
      .text("No mini-dashboard available for this node.");
  }

  // 2C) Finally, fade-in the overlay over 300 ms
  overlay
    .style("display", "flex")
    .transition()
    .duration(300)
    .style("opacity", 1);
}

// ────────────────────────────────────────────────────────────────────────────────
// 3) Draw a “salary” bar chart inside the white contentBox, with growth-from-0 animations.
// ────────────────────────────────────────────────────────────────────────────────
function drawSalaryBarChart(players, container) {
  // 3A) Group by team_name → count
  const countsByTeam = d3.rollup(
    players,
    v => v.length,
    d => d.team_name
  );
  const rawData = Array.from(countsByTeam, ([team, count]) => ({
    category: team,
    value: count
  }));

  // 3B) Chart dimensions (600×400)
  const margin = { top: 20, right: 20, bottom: 70, left: 50 };
  const totalWidth = 600;
  const totalHeight = 400;
  const width = totalWidth - margin.left - margin.right;
  const height = totalHeight - margin.top - margin.bottom;

  // 3C) Append SVG → <g> translated by margins
  const svg = container
    .append("svg")
      .attr("width", totalWidth)
      .attr("height", totalHeight)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // 3D) Scales
  const xScale = d3
    .scaleBand()
    .domain(rawData.map(d => d.category))
    .range([0, width])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(rawData, d => d.value)])
    .nice()
    .range([height, 0]);

  // 3E) X-axis (rotated labels)
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end")
      .style("font-size", "12px");

  // 3F) Y-axis
  svg
    .append("g")
    .call(d3.axisLeft(yScale).ticks(5))
    .selectAll("text")
      .style("font-size", "12px");

  // 3G) Bars: start at height=0 (y at baseline), then grow upward
  svg
    .selectAll("rect")
    .data(rawData)
    .enter()
    .append("rect")
      .attr("x", d => xScale(d.category))
      .attr("y", height)                     // y=baseline
      .attr("width", xScale.bandwidth())
      .attr("height", 0)                     // start with zero height
      .attr("fill", "#1f77b4")
    .transition()
      .delay((d, i) => i * 75)               // stagger each bar
      .duration(500)                         // animate growth over 500 ms
      .attr("y", d => yScale(d.value))       // move y to actual top
      .attr("height", d => height - yScale(d.value));

  // 3H) Bar labels: fade in after bar finishes growing
  svg
    .selectAll(".bar-label")
    .data(rawData)
    .enter()
    .append("text")
      .attr("class", "bar-label")
      .attr("x", d => xScale(d.category) + xScale.bandwidth() / 2)
      .attr("y", height)                     // start at baseline
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("opacity", 0)
      .text(d => d.value)
    .transition()
      .delay((d, i) => i * 75 + 500)         // after bar growth
      .duration(300)
      .attr("y", d => yScale(d.value) - 6)   // move to just above top
      .style("opacity", 1);
}

// ────────────────────────────────────────────────────────────────────────────────
// 4) Draw a “performance” pie chart inside the white contentBox, with gradual slice animations.
// ────────────────────────────────────────────────────────────────────────────────
function drawPerformancePieChart(players, container) {
  // 4A) Group by salary_category → count
  const countsBySalary = d3.rollup(
    players,
    v => v.length,
    d => d.salary_category
  );
  const rawData = Array.from(countsBySalary, ([salaryRange, count]) => ({
    category: salaryRange,
    count: count
  }));

  // 4B) Dimensions (500×400)
  const totalWidth = 500;
  const totalHeight = 400;
  const margin = { top: 30, right: 30, bottom: 30, left: 30 };
  const radius = Math.min(
    totalWidth - margin.left - margin.right,
    totalHeight - margin.top - margin.bottom
  ) / 2;

  // 4C) Append SVG → <g> centered in that SVG
  const svg = container
    .append("svg")
      .attr("width", totalWidth)
      .attr("height", totalHeight)
    .append("g")
      .attr("transform", `translate(${totalWidth / 2}, ${totalHeight / 2})`);

  // 4D) Color scale
  const color = d3
    .scaleOrdinal()
    .domain(rawData.map(d => d.category))
    .range(d3.schemeCategory10);

  // 4E) Pie generator
  const pie = d3.pie().sort(null).value(d => d.count);
  const dataReady = pie(rawData);

  // 4F) Arc generator
  const arc = d3
    .arc()
    .innerRadius(0)
    .outerRadius(radius);

  // 4G) Draw slices: animate from zero‐angle to full angle
  svg
    .selectAll("path")
    .data(dataReady)
    .enter()
    .append("path")
      .attr("d", d3.arc().innerRadius(0).outerRadius(0)) // start collapsed
      .attr("fill", d => color(d.data.category))
      .attr("stroke", "#ffffff")
      .style("stroke-width", "1px")
      .style("opacity", 0)
    .transition()
      .delay((d, i) => i * 100)               // stagger each slice
      .duration(500)                          // animate over 500 ms
      .attrTween("d", function(d) {
        const iArc = d3.interpolate(
          { startAngle: d.startAngle, endAngle: d.startAngle },
          { startAngle: d.startAngle, endAngle: d.endAngle }
        );
        return t => arc(iArc(t));
      })
      .style("opacity", 1);

  // 4H) Slice labels: fade in after last slice finishes
  const labelDelay = dataReady.length * 100 + 500;
  svg
    .selectAll("text")
    .data(dataReady)
    .enter()
    .append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("opacity", 0)
      .text(d => `${d.data.category} (${d.data.count})`)
    .transition()
      .delay(labelDelay)
      .duration(300)
      .style("opacity", 1);
}

// ────────────────────────────────────────────────────────────────────────────────
// 5) Expose showMiniDashboard globally so your SankeyChart can call it.
// ────────────────────────────────────────────────────────────────────────────────
window.showMiniDashboard = showMiniDashboard;
