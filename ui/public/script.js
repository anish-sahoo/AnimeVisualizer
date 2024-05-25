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
const tooltip = new PIXI.Text('', {
  fontFamily: 'Arial',
  fontSize: 12,
  fill: 'white',
  backgroundColor: 'black',
  padding: 5,
  wordWrap: true,
  wordWrapWidth: 200
});
tooltip.visible = false; // Initially hide the tooltip
app.stage.addChild(tooltip);

// Load the anime_embeddings_2d.csv file
fetch("anime_embeddings_2d.csv")
  .then((response) => response.text())
  .then((data) => {
      // Parse the CSV data
      const lines = data.split("\n");
      const points = lines.map((line) => {
          const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
          return line.split(regex);
      }).slice(1, -1); // Skip the header row and drop the last row
      
      const genres = new Set();
      const types = new Set();
      const studios = new Set();
      const demographics = new Set();
      let max_episode_count = 0;
      let max_score = 0;
      let max_members_count = 0;
      let max_favorited_count = 0;
      points.forEach((point, index) => {
          genres.add(point[4]);
          types.add(point[5]);
          studios.add(point[12]);
          demographics.add(point[3]);
          max_episode_count = Math.max(max_episode_count, parseInt(point[6]));
          max_score = Math.max(max_score, parseFloat(point[7]));
          max_members_count = Math.max(max_members_count, parseInt(point[10]));
          max_favorited_count = Math.max(max_favorited_count, parseInt(point[11]));
      });

      console.log("Genres:", genres);
      console.log("Types:", types);
      console.log("Studios:", studios);
      console.log("Demographics:", demographics);
      console.log("Max episode count:", max_episode_count);
      console.log("Max score:", max_score);
      console.log("Max members count:", max_members_count);
      console.log("Max favorited count:", max_favorited_count);


      const labels = [
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
          "studio"
      ];

      // Find the minimum and maximum values for x and y
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      points.forEach((point) => {
          const x = parseFloat(point[0]);
          const y = parseFloat(point[1]);

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
      });

      // Calculate the scaling factors
      const scaleX = app.renderer.width / (maxX - minX);
      const scaleY = app.renderer.height / (maxY - minY);

      // Function to update the graph based on the number of points
      function updateGraph(numPoints, filteredPoints = points) {
          // Clear the container
          container.removeChildren();

          // Draw a circle for each point, scaled to fit the screen
          for (let i = 0; i < numPoints; i++) {
              const point = filteredPoints[i];
              const x = (parseFloat(point[0]) - minX) * scaleX;
              const y = (parseFloat(point[1]) - minY) * scaleY;

              const radius = Math.sqrt(parseInt(point[6])) / Math.sqrt(max_episode_count) * 10; // Adjust multiplier as needed

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
              circle.on('mouseover', onMouseOver);
              circle.on('mouseout', onMouseOut);
              circle.on('mousemove', onMouseMove);

              // Add the circle to the container
              container.addChild(circle);
          }
      }

      // Event handler for mouse over
      function onMouseOver(event) {
          const pointData = event.currentTarget.data;
          let tooltipText = '';
          for (let i = 0; i < labels.length; i++) {
              tooltipText += `${labels[i]}: ${pointData[i]}\n`;
          }
          tooltip.text = tooltipText;
          tooltip.visible = true;
      }

      // Event handler for mouse out
      function onMouseOut() {
          tooltip.visible = false;
      }

      // Event handler for mouse move
      function onMouseMove(event) {
          const newPosition = event.data.global;
          tooltip.position.set(newPosition.x + 10, newPosition.y + 10); // Offset to avoid cursor overlap
      }

      // Get the slider element
      const pointSlider = document.getElementById("pointSlider");

      // Add an event listener to the slider
      pointSlider.addEventListener("input", function () {
          const numPoints = parseInt(pointSlider.value);
          updateGraph(numPoints);
      });

      // Create checkboxes for each genre
      const genreCheckboxes = {};
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
    attributeList.appendChild(listItem);
    genreCheckboxes[genre] = checkbox;
});

      // Function to update the graph based on the selected checkboxes
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

      // Add event listeners to the checkboxes
      Object.values(genreCheckboxes).forEach((checkbox) => {
          checkbox.addEventListener("change", updateGraphWithCheckboxes);
      });

      // Initial graph update
      updateGraph(parseInt(pointSlider.value));
  })
  .catch((error) => {
      console.error("Error loading anime_embeddings_2d.csv:", error);
  });

// Implement zooming and panning
app.view.addEventListener("wheel", function (e) {
  // Zooming
  const scaleFactor = 1.1;
  const direction = e.deltaY < 0 ? 1 : -1;

  // Adjust the pivot point to the mouse position
  const pointerPosition = app.renderer.plugins.interaction.mouse.global;
  container.pivot.set(pointerPosition.x, pointerPosition.y);
  container.position.set(pointerPosition.x, pointerPosition.y);

  container.scale.x *= scaleFactor ** direction;
  container.scale.y *= scaleFactor ** direction;
});

let dragging = false;
let prevX = 0;
let prevY = 0;
app.view.addEventListener("mousedown", function (e) {
  dragging = true;
  prevX = e.clientX;
  prevY = e.clientY;
});
app.view.addEventListener("mouseup", function () {
  dragging = false;
});
app.view.addEventListener("mousemove", function (e) {
  // Panning
  if (dragging) {
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    container.pivot.x -= dx; // Adjust the pivot for panning
    container.pivot.y -= dy;
    prevX = e.clientX;
    prevY = e.clientY;
  }
});
