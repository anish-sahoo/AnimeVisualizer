import {
  preprocess,
  calculateMaxMin,
  calculateScalingFactor,
  implementZoomPan,
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
  fontSize: 12,
  fill: "white",
  backgroundColor: "black",
  padding: 5,
  wordWrap: true,
  wordWrapWidth: 200,
});
tooltip.visible = false; // Initially hide the tooltip
app.stage.addChild(tooltip);

let points, max_episode_count, genres, labels;
let minX, maxX, minY, maxY, scaleX, scaleY;

fetch("anime_embeddings_2d.csv")
  .then((response) => response.text())
  .then((data) => {
    let processedData = preprocess(data);
    ({ points, max_episode_count, genres } = processedData);
    ({ minX, maxX, minY, maxY } = calculateMaxMin(points));
    ({ scaleX, scaleY } = calculateScalingFactor(app, maxX, minX, maxY, minY));

    labels = [
      "Dimension 1",
      "Dimension 2",
      "title",
      "demographic",
      "genre",
      "type",
      "episode_count",
      "score",
      "year_first_aired",
      "ranked",
      "members_count",
      "favorited_count",
      "studio",
    ];

    updateGraph(parseInt(pointSlider.value));
    addCheckboxes();
  })
  .catch((error) => {
    console.error("Error loading anime_embeddings_2d.csv:", error);
  });

implementZoomPan(app, container);

function updateGraph(numPoints, filteredPoints = points) {
  // Clear the container
  container.removeChildren();

  // Draw a circle for each point, scaled to fit the screen
  for (let i = 0; i < numPoints; i++) {
    const point = filteredPoints[i];
    const x = (parseFloat(point[0]) - minX) * scaleX;
    const y = (parseFloat(point[1]) - minY) * scaleY;

    const radius =
      (Math.sqrt(parseInt(point[6])) / Math.sqrt(max_episode_count)) * 10; // Adjust multiplier as needed

    // Create a new circle graphics object for each point
    const circle = new PIXI.Graphics();
    circle.beginFill(0xff0000);
    circle.drawCircle(0, 0, radius); // Increase the radius for better visibility
    circle.endFill();

    // Set the position of the circle
    circle.position.set(x, y);

    // Make the circle interactive
    circle.interactive = true;
    circle.buttonMode = true;
    circle.data = point;

    // Add event listeners for hover interaction
    circle.on("mouseover", onMouseOver);
    circle.on("mouseout", onMouseOut);
    circle.on("mousemove", onMouseMove);

    // Add the circle to the container
    container.addChild(circle);
  }
}

function onMouseOver(event) {
  const pointData = event.currentTarget.data;
  let tooltipText = "";
  for (let i = 0; i < labels.length; i++) {
    tooltipText += `${labels[i]}: ${pointData[i]}\n`;
  }
  tooltip.text = tooltipText;
  tooltip.visible = true;
}
function onMouseOut() {
  tooltip.visible = false;
}
function onMouseMove(event) {
  const newPosition = event.data.global;
  tooltip.position.set(newPosition.x + 10, newPosition.y + 10); // Offset to avoid cursor overlap
}

const pointSlider = document.getElementById("pointSlider");
pointSlider.addEventListener("input", function () {
  const numPoints = parseInt(pointSlider.value);
  updateGraph(numPoints);
});

const genreCheckboxes = {};

const selectAllButton = document.getElementById("selectAllButton");
selectAllButton.addEventListener("click", () => {
  Object.values(genreCheckboxes).forEach((cb) => {
    cb.checked = true;
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
      // Uncheck all other checkboxes
      Object.values(genreCheckboxes).forEach((cb) => {
        cb.checked = cb === checkbox;
      });
      // Update the graph with only the selected genre
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
  const selectedGenres = new Set();
  Object.keys(genreCheckboxes).forEach((genre) => {
    if (genreCheckboxes[genre].checked) {
      selectedGenres.add(genre);
    }
  });

  // Filter points based on selected genres
  const filteredPoints = points.filter((point) => selectedGenres.has(point[4]));

  // Update the graph with filtered points
  updateGraph(filteredPoints.length, filteredPoints);
}
