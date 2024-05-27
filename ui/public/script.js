import {
  preprocess,
  calculateMaxMin,
  calculateScalingFactor,
  implementZoomPan,
  getBestGenre,
  calculateRadius,
  calculateColor,
} from "./utils.js";

const point_limit = 5000; // Limit the number of points to display

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

colorAttributeDropdown.addEventListener("change", () => {
  updateGraphWithCheckboxes();
});

sizeAttributeDropdown.addEventListener("change", () => {
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
    circle.beginFill(color);
    circle.drawCircle(0, 0, radius); // Increase the radius for better visibility
    circle.endFill();

    // Set the position of the circle
    circle.position.set(x, y);

    // Make the circle interactive
    circle.interactive = true;
    circle.buttonMode = true;
    circle.data = point;
    circle.data.push(mainGenre);

    const border = new PIXI.Graphics();
    const borderWidth = 0.5; // Adjust border width as needed
    border.lineStyle(borderWidth, 0x000000); // Choose border color
    border.drawCircle(0, 0, radius + borderWidth); // Larger circle for border
    border.endFill();
    circle.addChild(border);

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

    genresList.appendChild(listItem);
    genreCheckboxes[genre] = checkbox;

    listItem.style.display = "flex"; // Set display to flex for alignment
    isolateButton.style.marginLeft = "auto";
  }); 

  Object.values(genreCheckboxes).forEach((checkbox) => {
    checkbox.addEventListener("change", updateGraphWithCheckboxes);
  });
}

function updateGraphWithCheckboxes(numPoints = parseInt(pointSlider.value)) {
  const selectedGenres = Object.keys(genreCheckboxes)
    .reduce((acc, genre) => genreCheckboxes[genre].checked ? acc.concat(genre) : acc, []);
  // console.log("Selected genres:", selectedGenres, typeof selectedGenres[0]);
  // const filteredPoints = points.filter(point => point[4].includes(selectedGenres[0]));
  const filteredPoints = points.filter(point => selectedGenres.some(genre => point[4].includes(genre))).slice(0, numPoints);
  // console.log("Filtered points length:", filteredPoints.length);
  updateGraph(filteredPoints.length, filteredPoints);
}

loadData();
implementZoomPan(app, container);