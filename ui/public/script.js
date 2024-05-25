import {
  preprocess,
  calculateMaxMin,
  calculateScalingFactor,
  implementZoomPan,
  generateColors
} from "./utils.js";

// Create a new PixiJS application
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight + 30,
});

// Add the PixiJS application to the HTML body
document.body.appendChild(app.view);

// Create a container for all graphics
const container = new PIXI.Container();
app.stage.addChild(container);

// Create a PIXI Text object for the tooltip
const tooltip = new PIXI.Text("", {
  fontFamily: "Arial",
  fontSize: 18,
  fill: "white",
  backgroundColor: "black",
  padding: 5,
  wordWrap: true,
  wordWrapWidth: 200
});
tooltip.visible = false; // Initially hide the tooltip
app.stage.addChild(tooltip);

let points, max_episode_count, genres, labels, max_score, max_members_count, max_favorited_count, types, studios, demographics;
let minX, maxX, minY, maxY, scaleX, scaleY;

const genreColorMap = new Map();
const typeColorMap = new Map();
const studioColorMap = new Map();
const demographicColorMap = new Map();

async function loadData() {
  try {
    const response = await fetch("anime_embeddings_2d.csv");
    const data = await response.text();
    let processedData = preprocess(data);
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
    initializeColorMaps();
    updateGraph(parseInt(pointSlider.value));
    addCheckboxes();
  } catch (error) {
    console.error("Error loading anime_embeddings_2d.csv:", error);
  }
}

const initializeColorMaps = () => {
  const pastelColors = generateColors(Math.max(genres.size, types.size, studios.size, demographics.size));
  genres.forEach((genre, index) => genreColorMap.set(genre, pastelColors[index]));
  types.forEach((type, index) => typeColorMap.set(type, pastelColors[index]));
  demographics.forEach((demographic, index) => demographicColorMap.set(demographic, pastelColors[index]));
};

function updateGraph(numPoints, filteredPoints = points) {
  container.removeChildren();

  for (let i = 0; i < numPoints; i++) {
    const point = filteredPoints[i];
    const x = (parseFloat(point[0]) - minX) * scaleX;
    const y = (parseFloat(point[1]) - minY) * scaleY;

    const radius =
      (Math.sqrt(parseInt(point[10])) / Math.sqrt(max_members_count)) * 6; // Adjust multiplier as needed

    // Create a new circle graphics object for each point
    const circle = new PIXI.Graphics();
    circle.beginFill(0xff00);
    circle.drawCircle(0, 0, radius); // Increase the radius for better visibility
    circle.endFill();

    // Set the position of the circle
    circle.position.set(x, y);

    // Make the circle interactive
    circle.interactive = true;
    circle.buttonMode = true;
    circle.data = point;

    // Add event listeners for hover interaction
    circle.on("mouseover", (event) => {
      const pointData = event.currentTarget.data;
      let tooltipText = "";
      for (let i = 2; i < labels.length; i++) {
        tooltipText += `${labels[i]}: ${pointData[i]}\n`;
      }
      tooltip.text = tooltipText;
      tooltip.visible = true;
    });
    circle.on("mouseout", () => (tooltip.visible = false));
    circle.on("mousemove", (event) => {
      const newPosition = event.data.global;
      tooltip.position.set(newPosition.x + 10, newPosition.y + 10); // Offset to avoid cursor overlap
    });
    container.addChild(circle);
  }
}

const pointSlider = document.getElementById("pointSlider");
pointSlider.addEventListener("input", () => {
  updateGraph(parseInt(pointSlider.value));
  document.getElementById("numPoints").textContent = "Number of Anime Displayed: " + pointSlider.value; // Display the number of points
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
    const listItem = document.createElement("li");
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

    genresList.appendChild(listItem);
    genreCheckboxes[genre] = checkbox;
  });

  Object.values(genreCheckboxes).forEach((checkbox) => {
    checkbox.addEventListener("change", updateGraphWithCheckboxes);
  });
}

function updateGraphWithCheckboxes() {
  const selectedGenres = Object.keys(genreCheckboxes)
    .reduce((acc, genre) => genreCheckboxes[genre].checked ? acc.concat(genre) : acc, []);

  const filteredPoints = points.filter(point => point[4].some(genre => selectedGenres.includes(genre)));

  updateGraph(filteredPoints.length, points);
}

loadData();
implementZoomPan(app, container);