// --- Parameters & Global Setup ---
let currentScene = 1;
const totalScenes = 3;
let carData;

const margin = { top: 20, right: 30, bottom: 60, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#vis-container")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

svg.append("g").attr("class", "annotation-group");

// --- Data Loading & Initial Drawing ---
d3.csv("data/cars2017.csv").then(data => {
    // Coerce data types from strings to numbers
    data.forEach(d => {
        d.EngineCylinders = +d.EngineCylinders;
        d.AverageHighwayMPG = +d.AverageHighwayMPG;
        d.AverageCityMPG = +d.AverageCityMPG;
    });
    
    carData = data.filter(d => d.EngineCylinders > 0 && d.AverageHighwayMPG > 0);
    
    const xScale = d3.scaleLinear()
        .domain([d3.min(carData, d => d.EngineCylinders) - 1, d3.max(carData, d => d.EngineCylinders) + 1])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(carData, d => d.AverageHighwayMPG) + 5]) // Add padding to top
        .range([height, 0]);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.max(carData, d => d.EngineCylinders)));

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Engine Cylinders");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .text("Average Highway MPG");
        
    svg.append("g")
        .selectAll("circle")
        .data(carData)
        .enter()
        .append("circle")
            .attr("class", "car-circle")
            .attr("cx", d => xScale(d.EngineCylinders))
            .attr("cy", d => yScale(d.AverageHighwayMPG));

    updateVisualization();
});


// --- Scene Update Functions ---

function updateToScene1() {
    d3.select("#narrative-text").html(`
        <h2>Scene 1: The Efficiency Trade-Off</h2>
        <p>This chart plots engine cylinders against highway fuel efficiency (MPG). There is a clear negative correlation: more cylinders generally leads to lower MPG.</p>
    `);

    svg.selectAll(".car-circle")
        .transition()
        .duration(1000)
        .attr("fill", "#69b3a2")
        .attr("r", 5)
        .attr("opacity", 0.7);

    // Annotation for Scene 1
    const annotations = [{
        note: {
            label: "As the number of cylinders increases, fuel efficiency tends to drop significantly.",
            wrap: 200
        },
        x: 400, y: 300, dy: 50, dx: 50
    }];
    const makeAnnotations = d3.annotation().annotations(annotations);
    svg.select(".annotation-group").call(makeAnnotations);
}

function updateToScene2() {
    d3.select("#narrative-text").html(`
        <h2>Scene 2: The Gas Guzzlers</h2>
        <p>Let's focus on the least efficient cars. The <strong>red dots</strong> represent vehicles getting less than 20 MPG. They are almost exclusively high-cylinder models.</p>
    `);
    
    svg.selectAll(".car-circle")
        .transition()
        .duration(1000)
        .attr("fill", d => d.AverageHighwayMPG < 20 ? "firebrick" : "#ccc")
        .attr("r", d => d.AverageHighwayMPG < 20 ? 7 : 4)
        .attr("opacity", d => d.AverageHighwayMPG < 20 ? 0.9 : 0.5);

    const annotations = [{
        note: {
            label: "The least efficient cars predominantly feature 8 or 12 cylinders.",
            wrap: 180,
            title: "Low Efficiency Cluster"
        },
        x: 600, y: 280, dy: 50, dx: -50 // bottom left, pointer starts higher
    }];
    const makeAnnotations = d3.annotation().annotations(annotations);
    svg.select(".annotation-group").call(makeAnnotations);
}

function updateToScene3() {
    d3.select("#narrative-text").html(`
        <h2>Scene 3: The Fuel Sippers & Free Exploration</h2>
        <p>In contrast, the most efficient cars (over 35 MPG) are shown in <strong>blue</strong>. They are all 3 or 4-cylinder models. <strong>Hover over any point to explore details.</strong></p>
        <p class="scene-instruction">Tip: Move your mouse over any dot to see more information about the car.</p>
    `);

    svg.selectAll(".car-circle")
        .transition()
        .duration(1000)
        .attr("fill", d => d.AverageHighwayMPG > 35 ? "steelblue" : "#ccc")
        .attr("r", d => d.AverageHighwayMPG > 35 ? 7 : 4)
        .attr("opacity", d => d.AverageHighwayMPG > 35 ? 0.9 : 0.5);

    svg.selectAll(".car-circle")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`<strong>${d.Make}</strong><br/>Model: ${d.Model}<br/>Cylinders: ${d.EngineCylinders}<br/>Highway MPG: ${d.AverageHighwayMPG}<br/>City MPG: ${d.AverageCityMPG}`)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });
        
    const annotations = [{
        note: {
            label: "The most fuel-efficient vehicles are exclusively 3 or 4-cylinder models.",
            wrap: 200,
            title: "High Efficiency Cluster",
            align: "top"
        },
        x: 200, y: 80, dy: 30, dx: 120 // angled to bottom right then right
    }];
    const makeAnnotations = d3.annotation().annotations(annotations);
    svg.select(".annotation-group").call(makeAnnotations);
}

// --- Controller Functions ---

function updateVisualization() {
    svg.select(".annotation-group").selectAll("*").remove();
    svg.selectAll(".car-circle").on("mouseover", null).on("mouseout", null);

    switch (currentScene) {
        case 1:
            updateToScene1();
            break;
        case 2:
            updateToScene2();
            break;
        case 3:
            updateToScene3();
            break;
    }
    updateButtons();
}

function updateButtons() {
    d3.select("#prev-btn").property("disabled", currentScene === 1);
    d3.select("#next-btn").property("disabled", currentScene === totalScenes);
}

// --- Triggers ---
d3.select("#next-btn").on("click", () => {
    if (currentScene < totalScenes) {
        currentScene++;
        updateVisualization();
    }
});

d3.select("#prev-btn").on("click", () => {
    if (currentScene > 1) {
        currentScene--;
        updateVisualization();
    }
});