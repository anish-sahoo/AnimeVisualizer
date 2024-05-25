export function preprocess(data) {
  const lines = data.split("\n");
  const points = lines
    .map((line) => {
      const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
      return line.split(regex);
    })
    .slice(1, -1); // Skip the header row and drop the last row

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

  return {
    points,
    genres,
    types,
    studios,
    demographics,
    max_episode_count,
    max_score,
    max_members_count,
    max_favorited_count,
  };
}

export function calculateMaxMin(points) {
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
  return { minX, maxX, minY, maxY };
}

export function calculateScalingFactor(app, maxX, minX, maxY, minY) {
  // Calculate the scaling factors
  const scaleX = app.renderer.width / (maxX - minX);
  const scaleY = app.renderer.height / (maxY - minY);
  return { scaleX, scaleY };
}

export function implementZoomPan(app, container) {
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
}
