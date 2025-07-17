import {
  preprocess,
  calculateMaxMin,
  calculateScalingFactor,
  getBestGenre,
  calculateRadius,
  calculateColor,
} from "./utils.js";
import { Viewport } from "pixi-viewport";

const point_limit = 5000;

// Create a new PixiJS application
const app = new PIXI.Application();

// Initialize the application
await app.init({
  width: window.innerWidth,
  height: window.innerHeight + 30,
});

// Add the PixiJS application to the HTML body
document.body.appendChild(app.canvas);

// Create viewport using the global Viewport from pixi-viewport
const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight + 30,
  worldWidth: window.innerWidth * 2,
  worldHeight: (window.innerHeight + 30) * 2,
  events: app.renderer.events
});

// Add the viewport to the stage
app.stage.addChild(viewport);

// Enable interaction plugins
viewport
  .drag()
  .pinch()
  .wheel()
  .decelerate()
  .clampZoom({
    minScale: 0.1,
    maxScale: 10
  });

// Create a container for all graphics
const container = new PIXI.Container();
viewport.addChild(container);

// Create a container for the tooltip with background
const tooltipContainer = new PIXI.Container();
tooltipContainer.visible = false;

// Create a background for the tooltip
const tooltipBackground = new PIXI.Graphics();

// Create a PIXI Text object for the tooltip
const tooltip = new PIXI.Text({
  text: "",
  style: {
    fontFamily: "Arial",
    fontSize: 18,
    fill: "black",
    padding: 8,
    wordWrap: true,
    wordWrapWidth: 200
  }
});

// Add background and text to the container
tooltipContainer.addChild(tooltipBackground);
tooltipContainer.addChild(tooltip);
app.stage.addChild(tooltipContainer);

let points, max_episode_count, genres, labels, max_score, max_members_count, max_favorited_count, types, studios, demographics, genre_counts;
let minX, maxX, minY, maxY, scaleX, scaleY;

async function loadData() {
  try {
    const response = await fetch("anime_embeddings_2d.csv");
    const data = await response.text();
    let processedData = preprocess(data, point_limit);
    ({
      points,
      genres,
      types,
      studios,
      demographics,
      max_episode_count,
      max_score,
      max_members_count,
      max_favorited_count,
      genre_counts,
    } = processedData);
    ({ minX, maxX, minY, maxY } = calculateMaxMin(points));
    ({ scaleX, scaleY } = calculateScalingFactor(app, maxX, minX, maxY, minY));

    labels = [
      "Dimension 1",
      "Dimension 2",
      "Title",
      "Demographic",
      "Genres",
      "Type",
      "No. of episodes",
      "Rating",
      "Year",
      "Rank",
      "Members count",
      "Favorited count",
      "Studio",
    ];
    updateGraph(parseInt(pointSlider.value));
    addCheckboxes();
  } catch (error) {
    console.error("Error loading anime_embeddings_2d.csv:", error);
  }
}

const colorAttributeDropdown = document.getElementById("colorAttributeDropdown");
const sizeAttributeDropdown = document.getElementById("sizeAttributeDropdown");
const studioDropdown = document.getElementById("studioDropdown");

colorAttributeDropdown.addEventListener("change", () => {
  updateGraphWithCheckboxes();
});

sizeAttributeDropdown.addEventListener("change", () => {
  updateGraphWithCheckboxes();
});

studioDropdown.addEventListener("change", () => {
  updateGraphWithCheckboxes();
});

function updateGraph(numPoints, filteredPoints = points) {
  container.removeChildren();

  const selectedColorAttribute = colorAttributeDropdown.value;
  const selectedSizeAttribute = sizeAttributeDropdown.value;

  for (let i = 0; i < Math.min(numPoints, point_limit); i++) {
    const point = filteredPoints[i];
    const x = (parseFloat(point[0]) - minX) * scaleX;
    const y = (parseFloat(point[1]) - minY) * scaleY;
    const multiplier = 1; // Multiplier to scale the radius
    const radius = calculateRadius(selectedSizeAttribute, point, multiplier, max_episode_count, max_members_count, max_favorited_count);
    const color = calculateColor(selectedColorAttribute, point);
    const mainGenre = getBestGenre(point[4]);

    const circle = new PIXI.Graphics();
    circle.circle(0, 0, radius);
    circle.fill(color);

    // Set the position of the circle
    circle.position.set(x, y);

    // Make the circle interactive
    circle.eventMode = 'static';
    circle.cursor = 'pointer';
    circle.data = point;
    circle.data.push(mainGenre);

    const border = new PIXI.Graphics();
    const borderWidth = 0.4; // Adjust border width as needed
    border.circle(0, 0, radius + borderWidth);
    border.stroke({ width: borderWidth, color: 0x000000 });
    circle.addChild(border);

    // Add event listeners for hover interaction
    circle.on("pointerover", onMouseOver);
    circle.on("pointerout", onMouseOut);
    circle.on("pointermove", onMouseMove);
    container.addChild(circle);
  }
}

function onMouseOver(event) {
  const pointData = event.currentTarget.data;
  let tooltipText = "";
  for (let i = 2; i < labels.length; i++) {
    tooltipText += `${labels[i]}: ${pointData[i]}\n`;
  }
  tooltip.text = tooltipText;
  
  // Update the background size based on text content
  const bounds = tooltip.getBounds();
  tooltipBackground.clear();
  tooltipBackground.roundRect(0, 0, bounds.width + 16, bounds.height + 16, 8);
  tooltipBackground.fill(0xFFFFFF); // White background
  tooltipBackground.stroke({ width: 1, color: 0x333333 }); // Dark gray border
  
  // Position the text with some padding from the background
  tooltip.position.set(8, 8);
  
  tooltipContainer.visible = true;
}

function onMouseOut() {
  tooltipContainer.visible = false;
}

function onMouseMove(event) {
  const newPosition = event.global;
  tooltipContainer.position.set(newPosition.x + 10, newPosition.y + 10);
}

const pointSlider = document.getElementById("pointSlider");
pointSlider.setAttribute('max', point_limit);
pointSlider.setAttribute('value', point_limit);
document.getElementById("numPoints").textContent = `Number of Anime Displayed: ${point_limit}`;
pointSlider.addEventListener("input", () => {
  updateGraphWithCheckboxes(parseInt(pointSlider.value));
  document.getElementById("numPoints").textContent = "Number of Anime Displayed: " + pointSlider.value; // Display the number of points
});

document.getElementById("toggleCheckboxesButton").addEventListener("click", () => {
  const checkboxContainer = document.getElementById("checkboxContainer");
  checkboxContainer.classList.toggle("hidden");
});

const genreCheckboxes = {};

document.getElementById("selectAllButton").addEventListener("click", () => {
  Object.values(genreCheckboxes).forEach((cb) => {
    cb.checked = true;
  });
  updateGraphWithCheckboxes();
});

document.getElementById("deselectAllButton").addEventListener("click", () => {
  Object.values(genreCheckboxes).forEach((cb) => {
    cb.checked = false;
  });
  updateGraphWithCheckboxes();
});

function addCheckboxes() {
  // Add checkboxes for each genre
  genres.forEach((genre) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = genre;
    checkbox.id = genre;
    checkbox.checked = true; // Set to checked by default
    
    const label = document.createElement("label");
    label.htmlFor = genre;
    label.appendChild(document.createTextNode(genre));
    
    const count = genre_counts[genre] || 0; // Use 0 as a default value if the genre is not found in the counts object
    const countText = document.createTextNode(` (${count})`);
    label.appendChild(countText);

    const listItem = document.createElement("li");
    listItem.classList.add("checkbox-item");
    listItem.appendChild(checkbox);
    listItem.appendChild(label);

    // Create isolate button
    const isolateButton = document.createElement("button");
    isolateButton.textContent = "Isolate";
    isolateButton.addEventListener("click", () => {
      Object.values(genreCheckboxes).forEach((cb) => {
        cb.checked = cb === checkbox;
      });
      updateGraphWithCheckboxes();
    });
    listItem.appendChild(isolateButton);

    document.getElementById("genresList").appendChild(listItem);
    genreCheckboxes[genre] = checkbox;

    listItem.style.display = "flex"; // Set display to flex for alignment
    isolateButton.style.marginLeft = "auto";
  }); 

  document.getElementById("genresList").addEventListener("change", (event) => {
    if (event.target.type === "checkbox") {
      updateGraphWithCheckboxes(parseInt(pointSlider.value));
    }
  });
}

document.querySelectorAll('input[name="genreOperation"]').forEach(radio => {
  radio.addEventListener('change', () => {
    updateGraphWithCheckboxes(parseInt(pointSlider.value));
  });
});

function updateGraphWithCheckboxes(numPoints = parseInt(pointSlider.value)) {
  const selectedGenres = Object.keys(genreCheckboxes)
    .reduce((acc, genre) => genreCheckboxes[genre].checked ? acc.concat(genre) : acc, []);
  const operation = document.querySelector('input[name="genreOperation"]:checked').value;
  
  const selectedStudio = studioDropdown.value;
  let filteredPoints = selectedStudio == "none" ? points : points.filter(point => point[12].includes(selectedStudio));
  
  // let filteredPoints = points;
  if (operation === "union") {
    filteredPoints = filteredPoints
      .filter(point => selectedGenres.every(genre => point[4].includes(genre)))
      .slice(0, numPoints);
  }
  else if (operation === "intersection")  {
    filteredPoints = filteredPoints
    .filter(point => selectedGenres.some(genre => point[4].includes(genre)))
    .slice(0, numPoints);
  }
  updateGraph(filteredPoints.length, filteredPoints);
}

// Initialize the application
(async () => {
  loadData();
})();