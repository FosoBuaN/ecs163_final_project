// -----------------------------------------------------------------------------
// src/miniDashboard.js
// -----------------------------------------------------------------------------
//
// AFTER YOU OVERWRITE THIS FILE, your index.html already has:
//   <div id="mini-dashboard"></div>
// so all charts will be drawn inside that DIV.
//
// API Contract:
//   Sankey’s click‐handler will call:
//     window.showMiniDashboard(nodeDetails)
//   where nodeDetails is exactly the object from DataProcessor containing:
//     {
//       nodeId,
//       nodeName,
//       nodeCategory,       // either "salary" or "performance"
//       totalPlayers,
//       players: [ ... ]    // array of playerRecord objects
//     }
//
// This file must define and assign window.showMiniDashboard.
//


// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
//
// Singly exported—attaches itself to window as showMiniDashboard.
// Clears out any prior chart in "#mini-dashboard" and then delegates:
//
//   • If nodeDetails.nodeCategory === "salary":
//       ⇒ showSalaryDashboard(nodeDetails.players, container)
//   • If nodeDetails.nodeCategory === "performance":
//       ⇒ showPerformanceDashboard(nodeDetails.players, container)
//   • Else: show a “No dashboard” placeholder message.
//
// -----------------------------------------------------------------------------
function onNodeClick(nodeDetails) {
  // 1) “#mini-dashboard” is the DIV in index.html where we draw
  const container = d3.select("#mini-dashboard");
  container.selectAll("*").remove(); // clear previous SVG/DOM

  // 2) If it’s a salary‐category node, show bar chart “Players per Team”
  if (nodeDetails.nodeCategory === "salary") {
    showSalaryDashboard(nodeDetails.players, container);
    return;
  }

  // 3) If it’s a performance‐category node, show pie chart “Salary‐Range Distribution”
  if (nodeDetails.nodeCategory === "performance") {
    showPerformanceDashboard(nodeDetails.players, container);
    return;
  }

  // 4) Otherwise, no mini‐dashboard for this node
  container
    .append("p")
    .style("font-family", "sans-serif")
    .style("font-size", "14px")
    .text("No mini‐dashboard available for this node.");
}


// ─── SALARY BAR CHART ──────────────────────────────────────────────────────────
//
// When you click a “salary” node (e.g. “Low Salary”), nodeDetails.players
// is an array of playerRecord objects all in that salary‐range. We now group
// them by team_name and draw a bar chart: each bar = “# of players on that team”.
//
// -----------------------------------------------------------------------------
function showSalaryDashboard(players, container) {
  // players: [ { player_id, team_id, team_name, salary, salary_category, … }, … ]

  // 1. Group by team_name → count
  const countsByTeam = d3.rollup(
    players,
    v => v.length,
    d => d.team_name
  );
  const rawData = Array.from(countsByTeam, ([team, count]) => ({
    category: team,
    value: count,
  }));

  // 2. Set up margins, width, height
  const margin = { top: 20, right: 20, bottom: 70, left: 50 };
  const totalWidth = 500;
  const totalHeight = 350;
  const width = totalWidth - margin.left - margin.right;
  const height = totalHeight - margin.top - margin.bottom;

  // 3. Append SVG
  const svg = container
    .append("svg")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 4. X‐scale: team names
  const xScale = d3
    .scaleBand()
    .domain(rawData.map(d => d.category))
    .range([0, width])
    .padding(0.15);

  // 5. Y‐scale: counts
  const yMax = d3.max(rawData, d => d.value) || 0;
  const yScale = d3
    .scaleLinear()
    .domain([0, yMax])
    .nice()
    .range([height, 0]);

  // 6. X‐axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end")
    .attr("dx", "-0.6em")
    .attr("dy", "0.15em");

  // 7. Y‐axis
  svg.append("g").call(d3.axisLeft(yScale).ticks(5));

  // 8. Bars (initially height=0, then animate up)
  svg
    .selectAll(".bar")
    .data(rawData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.category))
    .attr("width", xScale.bandwidth())
    .attr("y", height) // start at bottom
    .attr("height", 0) // zero height
    .attr("fill", "#1f77b4")
    .transition()
    .duration(800)
    .delay((d, i) => i * 75)
    .attr("y", d => yScale(d.value))
    .attr("height", d => height - yScale(d.value));

  // 9. Value labels (appear after bars grow)
  svg
    .selectAll(".label")
    .data(rawData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => xScale(d.category) + xScale.bandwidth() / 2)
    .attr("y", d => yScale(d.value) - 5)
    .style("text-anchor", "middle")
    .style("font-family", "sans-serif")
    .style("font-size", "12px")
    .style("opacity", 0)
    .text(d => d.value)
    .transition()
    .delay(800 + rawData.length * 75)
    .duration(300)
    .style("opacity", 1);

  // 10. Title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -6)
    .attr("text-anchor", "middle")
    .style("font-family", "sans-serif")
    .style("font-size", "16px")
    .style("font-weight", "600")
    .text(`Players per Team (${players[0]?.salary_category || ""})`);
}


// ─── PERFORMANCE PIE CHART ─────────────────────────────────────────────────────
//
// When you click a “performance” node (e.g. “High Performance”), nodeDetails.players
// is an array of playerRecord objects all in that performance‐category. We now group
// them by salary_category and draw a pie chart showing how many of those players are
// in “Low Salary,” “Medium Salary,” “High Salary,” etc.
//
// -----------------------------------------------------------------------------
function showPerformanceDashboard(players, container) {
  // players: [ { player_id, team_name, salary_category, performance_category, … }, … ]

  // 1. Group by salary_category → count
  const countsBySalary = d3.rollup(
    players,
    v => v.length,
    d => d.salary_category
  );
  const rawData = Array.from(countsBySalary, ([salaryCat, count]) => ({
    rating: salaryCat,
    count: count,
  }));

  // 2. Set up dimensions
  const totalWidth = 350;
  const totalHeight = 350;
  const margin = 20;
  const radius = Math.min(totalWidth, totalHeight) / 2 - margin;

  // 3. Append SVG & center group
  const svg = container
    .append("svg")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .append("g")
    .attr(
      "transform",
      `translate(${totalWidth / 2}, ${totalHeight / 2 + 10})`
    );

  // 4. Color scale
  const color = d3
    .scaleOrdinal()
    .domain(rawData.map(d => d.rating))
    .range(d3.schemeCategory10);

  // 5. Pie layout
  const pie = d3
    .pie()
    .sort(null)
    .value(d => d.count);

  const dataReady = pie(rawData);

  // 6. Arc generator
  const arc = d3
    .arc()
    .innerRadius(0)
    .outerRadius(radius);

  // 7. Draw slices (start at 0‐angle → then tween)
  const slices = svg
    .selectAll("path")
    .data(dataReady)
    .enter()
    .append("path")
    .attr("fill", d => color(d.data.rating))
    .attr("stroke", "#fff")
    .attr("stroke-width", "1px")
    .attr("d", d => {
      const start = { startAngle: d.startAngle, endAngle: d.startAngle };
      return arc(start);
    })
    .each(function (d) {
      this._current = d;
    });

  slices
    .transition()
    .duration(600)
    .delay((d, i) => i * 400)
    .attrTween("d", function (d) {
      const interpolation = d3.interpolate(
        { startAngle: d.startAngle, endAngle: d.startAngle },
        { startAngle: d.startAngle, endAngle: d.endAngle }
      );
      return t => arc(interpolation(t));
    });

  // 8. Labels (after slices animate in)
  setTimeout(() => {
    svg
      .selectAll("text")
      .data(dataReady)
      .enter()
      .append("text")
      .text(d => d.data.rating)
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("font-family", "sans-serif")
      .style("font-size", "12px");
  }, rawData.length * 400 + 200);

  // 9. Hover‐effects: expand slice + tooltip
  slices
    .on("mouseover", function (event, d) {
      // Expand slice by 10px
      d3.select(this)
        .transition()
        .duration(200)
        .attr(
          "d",
          d3
            .arc()
            .innerRadius(0)
            .outerRadius(radius + 10)
        );

      // Tooltip DIV
      const tooltip = d3
        .select("body")
        .selectAll("#mini-tooltip")
        .data([d.data])
        .join("div")
        .attr("id", "mini-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "#fff")
        .style("padding", "4px 8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("opacity", 0)
        .text(`${d.data.rating}: ${d.data.count}`);

      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px")
        .transition()
        .duration(100)
        .style("opacity", 1);
    })
    .on("mouseout", function () {
      // Revert slice
      d3.select(this)
        .transition()
        .duration(200)
        .attr(
          "d",
          d3
            .arc()
            .innerRadius(0)
            .outerRadius(radius)
        );

      // Remove tooltip
      d3.select("#mini-tooltip")
        .transition()
        .duration(100)
        .style("opacity", 0)
        .remove();
    });

  // 10. Title
  svg
    .append("text")
    .attr("x", 0)
    .attr("y", -radius - 10)
    .attr("text-anchor", "middle")
    .style("font-family", "sans-serif")
    .style("font-size", "16px")
    .style("font-weight", "600")
    .text(`Salary Distribution (${players[0]?.performance_category || ""})`);
}


// ─── EXPOSE GLOBAL ─────────────────────────────────────────────────────────────
//
// Assign our onNodeClick(...) function to window.showMiniDashboard, so that
// sankeyChart.js can simply do:
//
//     window.showMiniDashboard(nodeDetails)
//
window.showMiniDashboard = onNodeClick;
