// [
//   0d1 "-15.129277",
//   1d2 "64.4753",
//   2title "Naruto the Movie 3: Guardians of the Crescent Moon Kingdom",
//   3demographic "Shounen",
//   4genre"\"Action, Adventure, Fantasy\"",
//   5type"Movie",
//   6episode_count"1",
//   7score"6.92",
//   8year_first_aired"2006",
//   9ranked"4605",
//   10members_count"212047",
//   11favorited_count"161",
//   12studio"Pierrot"
//   13synopsis
// ]

import { genreColorMap, demographicColorMap, typeColorMap, studioColorMap } from './colors.js';

export function preprocess(data, point_limit) {
  const lines = data.split("\n");
  const points = lines
    .map((line) => {
      const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
      return line.split(regex);
    })
    .slice(1, -1)
    .slice(0, point_limit);

  const genres = new Set();
  const types = new Set();
  const studios = new Set();
  const demographics = new Set();
  const genre_counts = {};
  let max_episode_count = 0;
  let max_score = 0;
  let max_members_count = 0;
  let max_favorited_count = 0;
  points.forEach((point, index) => {
    const pointGenres = point[4]
      .split(",")
      .map((genre) => genre.replace(/"/g, "").replace("\n", "").trim());
    point[4] = pointGenres;
    pointGenres.forEach((genre) => {
      genres.add(genre);
      if (genre_counts[genre]) {
        genre_counts[genre]++;
      } else {
        genre_counts[genre] = 1;
      }
    });
    types.add(point[5]);
    studios.add(point[12].replace(/"/g, "").replace("\n", "").trim());
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
    genre_counts,
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
  const scaleX = app.screen.width / (maxX - minX);
  const scaleY = app.screen.height / (maxY - minY);
  return { scaleX, scaleY };
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return { r, g, b };
}

function rgbToHex(r, g, b) {
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `0x${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generateColors(numColors) {
  const colors = [];
  const saturation = 100; // High saturation for bright colors
  const lightness = 50; // Medium lightness for bright colors

  for (let i = 0; i < numColors; i++) {
      const hue = Math.floor(Math.random() * 360); // Random hue
      const { r, g, b } = hslToRgb(hue, saturation, lightness);
      const hexColor = rgbToHex(r, g, b);
      colors.push(hexColor);
  }

  return colors;
}

export const getBestGenre = (genres) => {
  const main_genres = ['Adventure', 'Comedy', 'Mecha', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Supernatural', 'Thriller'];
  const secondary_genres = ['Action', 'Drama', 'Fantasy', 'Horror', 'Magic', 'Military', 'Music', 'Parody', 'School', 'Shounen', 'Sports', 'Super Power'];
    
  const genresSet = new Set(genres);
    for (let i = 0; i < main_genres.length; i++) {
      if (genresSet.has(main_genres[i])) {
      return main_genres[i];
      }
    }
    for (let i = 0; i < secondary_genres.length; i++) {
    if (genresSet.has(secondary_genres[i])) {
      return secondary_genres[i];
    }
    }
    return genres[0];
}

export const calculateRadius = (selectedSizeAttribute, point, multiplier, max_episode_count, max_members_count, max_favorited_count) => {
  switch (selectedSizeAttribute) {
    case "episode":
      return (Math.sqrt(parseInt(point[6])) / Math.sqrt(max_episode_count)) * 40 * multiplier;
    case "rating":
      return Math.pow(parseFloat(point[7]) / 10, 8) * 20 * multiplier; // Cubing the rating
    case "members":
      // return (parseInt(point[10]) / max_members_count) * 20 * multiplier;
      return 2 + (parseInt(point[10]) / max_members_count) * 20 * multiplier;
    case "favorited":
      return (2 + (parseInt(point[11]) / max_favorited_count) * 20) * multiplier;
  }
  return 2 * multiplier;
}

export const calculateColor = (selectedColorAttribute, point) => {
  switch (selectedColorAttribute) {
    case "genre":
      const mainGenre = getBestGenre(point[4]);
      return genreColorMap.get(mainGenre);
    case "demographic":
      return demographicColorMap.get(point[3]);
    case "type":
      return typeColorMap.get(point[5]);
    case "studio":
      return studioColorMap.get(point[12]) || 0xffffff;
  }
  return 0xffffff;
}