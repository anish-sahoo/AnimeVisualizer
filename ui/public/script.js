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

// Load the anime_embeddings_2d.csv file
fetch("anime_embeddings_2d.csv")
  .then((response) => response.text())
  .then((data) => {
    // Parse the CSV data
    const lines = data.split("\n");
    const points = lines.map((line) => line.split(","));

    console.log(points[0]);
    console.log(points[1]);

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

    // Create a PixiJS Graphics object
    const graphics = new PIXI.Graphics();
    container.addChild(graphics);

    // Function to update the graph based on the number of points
    function updateGraph(numPoints) {
      // Clear the graphics object
      graphics.clear();

      // Draw a circle for each point, scaled to fit the screen
      for (let i = 0; i < numPoints; i++) {
        const point = points[i];
        const x = (parseFloat(point[0]) - minX) * scaleX;
        const y = (parseFloat(point[1]) - minY) * scaleY;

        graphics.beginFill(0xff0000);
        graphics.drawCircle(x, y, 1);
        graphics.endFill();
      }
    }

    // Get the slider element
    const pointSlider = document.getElementById("pointSlider");

    // Add an event listener to the slider
    pointSlider.addEventListener("input", function () {
      const numPoints = parseInt(pointSlider.value);
      updateGraph(numPoints);
    });

    // Initial graph update
    updateGraph(parseInt(pointSlider.value));

    // Populate the attribute list
    const attributeList = document.getElementById("attributeList");
    for (let i = 2; i < points[0].length; i++) {
      const attribute = points[0][i];
      const listItem = document.createElement("li");
      listItem.textContent = attribute;
      attributeList.appendChild(listItem);
    }
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
    container.x += dx;
    container.y += dy;
    prevX = e.clientX;
    prevY = e.clientY;
  }
});
