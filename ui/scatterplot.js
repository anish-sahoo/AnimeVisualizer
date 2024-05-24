const margin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = 1800 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

// Append the SVG object
const svg = d3.select("#scatterplot")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Function to create the scatterplot
function createScatterplot(data, maxPoints) {
    // Clear previous plot
    svg.selectAll("*").remove();

    // Scale the range of the data
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => +d['Dimension 1']))
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => +d['Dimension 2']))
        .range([height, 0]);

    // Create a color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Add the points
    svg.selectAll("circle")
        .data(data.slice(0, maxPoints))
        .enter()
        .append("circle")
        .attr("cx", d => x(+d['Dimension 1']))
        .attr("cy", d => y(+d['Dimension 2']))
        .attr("r", 3)
        .style("fill", d => colorScale(d.genre))  // Use the color scale
        .append("title")  // Add a title element for the hover text
        .text(d => d.title);  // Use the title attribute for the hover text
}

// Load the CSV data
d3.csv("anime_embeddings_2d.csv").then(data => {
    const slider = document.getElementById("pointSlider");

    // Initial scatterplot
    createScatterplot(data, +slider.value);

    // Update scatterplot based on slider input
    slider.oninput = function() {
        createScatterplot(data, +this.value);
    };
});