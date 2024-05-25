import {
  preprocess,
  calculateMaxMin,
  calculateScalingFactor,
  implementZoomPan,
} from "./utils.js";
import { makeGraph } from "./visualizer.js";

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

fetch("anime_embeddings_2d.csv")
  .then((response) => response.text())
  .then((data) => {
    let processedData = preprocess(data);
    let { minX, maxX, minY, maxY } = calculateMaxMin(processedData.points);
    const { scaleX, scaleY } = calculateScalingFactor(
      app,
      maxX,
      minX,
      maxY,
      minY,
    );
    makeGraph(
      app,
      container,
      tooltip,
      minX,
      scaleX,
      minY,
      scaleY,
      processedData,
    );
  })
  .catch((error) => {
    console.error("Error loading anime_embeddings_2d.csv:", error);
  });

implementZoomPan(app, container);
