# ⚾ Salary vs. Performance — MLB Visualization

**Team 25 – ECS163 Final Project**  
Interactive Sankey diagram + storytelling walkthrough for exploring the relationship between MLB team salary and performance across 30 seasons.

---

## Motivation

We wanted to explore the relationship between how much a team spends and how well they perform. It's a common sports debate, and visualizing this over time seemed like a great way to spot patterns or outliers — especially teams that succeed without splurging.

---

##  Data

- **Source:** [Kaggle – MLB Team Stats and Salaries](https://www.kaggle.com/)
- **Years Covered:** 1985–2015
- **Included Attributes:** Team IDs, average salaries, on-base %, slugging average, win percentage, etc.

---

## 🌐 How It Works

- **Sankey Diagram** encodes team ➝ salary ➝ performance percentiles with animated flows  
- **Legend + Slider:** Users can select a specific year and explore trends  
- **Hover Interactions:** Pulsing flows show directionality from node to node  
- **Storytelling Walkthrough:** A 9-slide footer guides users through a curated data narrative (focused on Oakland A’s 2004–2006)  
- **Expandable Views:** Clicking on a team reveals performance bar charts vs league average  

---

## 🔧 Installation

To host the site:

1. Clone this repo  
2. Change into this directory  
3. Open with the **Live Server** VS Code extension *(recommended)*  
4. Use a modern web browser to view the project

**Alternative:**  
Run using Python's built-in server:

```bash
python3 -m http.server 8000
```
Then open your browser to:
http://localhost:8000
