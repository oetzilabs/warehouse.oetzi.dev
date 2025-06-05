import { StorageType } from "./types";

export const setupCanvas = (canvas: HTMLCanvasElement, width: number, height: number, zoom: number = 1) => {
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.scale(dpr * zoom, dpr * zoom);
  }
  return ctx;
};

export const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, dotColor: string) => {
  const gridSize = 20;
  ctx.fillStyle = dotColor;

  for (let x = gridSize; x < width; x += gridSize) {
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

export const isPointInStorage = (x: number, y: number, storage: StorageType) => {
  const sx = storage.boundingBox?.x ?? 0;
  const sy = storage.boundingBox?.y ?? 0;
  const sw = storage.boundingBox?.width ?? 100;
  const sh = storage.boundingBox?.height ?? 100;

  return x >= sx && x <= sx + sw && y >= sy && y <= sy + sh;
};
