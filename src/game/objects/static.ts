const scaleFactor = 0.93;

export const staticObstacles = [
  {
    name: 'wall',
    startx: 0,
    starty: 0,
    endx: 4800 * scaleFactor,
    endy: 300 * scaleFactor,
  },
  {
    name: 'bar',
    startx: 0,
    starty: 600 * scaleFactor,
    endx: 2430 * scaleFactor,
    endy: 1300 * scaleFactor,
  },
  {
    name: 'piano',
    startx: 2340 * scaleFactor,
    starty: 200 * scaleFactor,
    endx: 2800 * scaleFactor,
    endy: 1500 * scaleFactor,
  },
  {
    name: 'table',
    startx: 2050 * scaleFactor,
    starty: 1150 * scaleFactor,
    endx: 2800 * scaleFactor,
    endy: 1450 * scaleFactor,
  },
]

export const smallObstacles = [
  {
    name: 'smallObstacle',
    startx: 0,
    starty: 0,
  },
]
