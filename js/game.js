(function () {
  "use strict";

  const MAP_WIDTH = 48;
  const MAP_HEIGHT = 32;
  const MAX_DAY = 5;
  const INITIAL_HP = 3;
  const MAX_HP = 3;
  const INITIAL_ECOSYSTEM = 3;
  const MAX_COLLECT = 5;
  const DAILY_PLANT_LIMIT = 16;
  const playerStart = { x: 24, y: 16 };
  const blockedTiles = new Set(["sea", "river", "tree", "rock", "sign", "camp"]);
  const invasiveCounts = {
    3: 5,
    2: 9,
    1: 12,
    0: 16
  };

  const state = {
    day: 1,
    maxDay: MAX_DAY,
    hp: INITIAL_HP,
    ecosystem: INITIAL_ECOSYSTEM,
    maxCollect: MAX_COLLECT,
    mapWidth: MAP_WIDTH,
    mapHeight: MAP_HEIGHT,
    tiles: [],
    player: { ...playerStart },
    plantsOnMap: [],
    collected: [],
    nearbyPlant: null,
    phase: "title",
    gameEnded: false
  };

  function init() {
    SurvivalUI.cacheElements();
    SurvivalUI.elements.startButton.addEventListener("click", startGame);
    SurvivalUI.elements.restartButton.addEventListener("click", startGame);
    SurvivalUI.elements.finishExploreButton.addEventListener("click", enterNightPhase);
    window.addEventListener("keydown", handleKeyDown);
    SurvivalUI.showScreen("title");
  }

  function startGame() {
    state.day = 1;
    state.hp = INITIAL_HP;
    state.ecosystem = INITIAL_ECOSYSTEM;
    state.phase = "explore";
    state.gameEnded = false;
    startDay();
    SurvivalUI.showScreen("game");
  }

  function startDay() {
    state.player = { ...playerStart };
    state.collected = [];
    state.tiles = createIslandTiles();
    state.plantsOnMap = createDailyPlants();
    updateNearbyPlant();
    render();
  }

  function createIslandTiles() {
    const tiles = [];
    const centerX = (MAP_WIDTH - 1) / 2;
    const centerY = (MAP_HEIGHT - 1) / 2;

    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      const row = [];
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const dx = Math.abs((x - centerX) / 22);
        const dy = Math.abs((y - centerY) / 13);
        const distance = dx * dx + dy * dy;

        if (distance > 1) {
          row.push("sea");
        } else if (distance > 0.68) {
          row.push("sand");
        } else {
          row.push("grass");
        }
      }
      tiles.push(row);
    }

    addRiver(tiles);
    addScenery(tiles);
    tiles[playerStart.y][playerStart.x] = "grass";

    return tiles;
  }

  function addRiver(tiles) {
    const riverPath = [
      [19, 5], [20, 5], [19, 6], [20, 6],
      [20, 7], [21, 7], [20, 8], [21, 8],
      [21, 9], [22, 9], [21, 10], [22, 10],
      [22, 11], [23, 11], [22, 12], [23, 12],
      [22, 13], [23, 13], [21, 14], [22, 14],
      [20, 15], [21, 15], [19, 16], [20, 16],
      [18, 17], [19, 17], [18, 18], [19, 18],
      [19, 19], [20, 19], [20, 20], [21, 20],
      [21, 21], [22, 21], [22, 22], [23, 22],
      [23, 23], [24, 23], [24, 24], [25, 24],
      [25, 25], [26, 25]
    ];

    riverPath.forEach(([x, y]) => {
      if (isDecoratableLand(tiles, x, y)) {
        tiles[y][x] = "river";
      }
    });

    [[19, 16], [20, 16]].forEach(([x, y]) => {
      if (isInsideMap(x, y)) {
        tiles[y][x] = "bridge";
      }
    });
  }

  function addScenery(tiles) {
    const scenery = {
      tree: [
        [12, 10], [13, 10], [14, 10], [15, 10],
        [11, 11], [13, 11], [15, 11], [16, 11],
        [10, 20], [11, 20], [12, 20], [13, 20],
        [11, 21], [12, 21], [14, 21],
        [31, 8], [32, 8], [33, 8], [34, 8],
        [32, 9], [34, 9], [35, 9],
        [34, 20], [35, 20], [36, 20], [35, 21]
      ],
      rock: [
        [36, 13], [37, 13], [38, 14],
        [39, 15], [37, 16], [38, 17],
        [14, 24], [15, 24], [16, 25],
        [30, 24], [31, 25], [32, 25]
      ],
      sign: [[17, 15]],
      camp: [[27, 17]]
    };

    Object.entries(scenery).forEach(([tile, positions]) => {
      positions.forEach(([x, y]) => {
        if (isDecoratableLand(tiles, x, y) && !isNearStart(x, y)) {
          tiles[y][x] = tile;
        }
      });
    });
  }

  function createDailyPlants() {
    const plants = [];
    const occupied = new Set([positionKey(playerStart.x, playerStart.y)]);
    const invasiveTotal = invasiveCounts[state.ecosystem];
    const otherTotal = DAILY_PLANT_LIMIT - invasiveTotal;
    const dailyData = [
      ...pickPlants("invasive", invasiveTotal),
      ...pickMixedNonInvasive(otherTotal)
    ];

    shuffle(dailyData).forEach((data, index) => {
      const position = findPlantPosition(occupied);
      if (position) {
        occupied.add(positionKey(position.x, position.y));
        plants.push({
          id: `${state.day}-${index}-${data.name}`,
          x: position.x,
          y: position.y,
          data,
          collected: false
        });
      }
    });

    return plants;
  }

  function pickPlants(category, count) {
    const source = PlantData.byCategory(category);
    const picked = [];
    for (let i = 0; i < count; i += 1) {
      picked.push(source[i % source.length]);
    }
    return picked;
  }

  function pickMixedNonInvasive(count) {
    if (count <= 0) {
      return [];
    }

    const categories = state.ecosystem === 0 ? [] : ["famine", "poison", "native"];
    const pool = categories.flatMap((category) => PlantData.byCategory(category));
    const picked = [];

    for (let i = 0; i < count; i += 1) {
      picked.push(pool[i % pool.length]);
    }

    return picked;
  }

  function findPlantPosition(occupied) {
    const preferredTiles = [];
    const grassTiles = [];
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        if (state.tiles[y][x] === "grass" && !occupied.has(positionKey(x, y))) {
          const position = { x, y };
          if (isNearFeature(x, y)) {
            preferredTiles.push(position);
          } else {
            grassTiles.push(position);
          }
        }
      }
    }
    shuffle(preferredTiles);
    shuffle(grassTiles);
    return preferredTiles[0] || grassTiles[0] || null;
  }

  function handleKeyDown(event) {
    if (state.phase === "title" && event.key === "Enter" && !state.gameEnded) {
      event.preventDefault();
      startGame();
      return;
    }

    if (state.phase !== "explore" || state.gameEnded) {
      return;
    }

    if (event.key === "Enter") {
      if (state.nearbyPlant && state.collected.length < MAX_COLLECT) {
        event.preventDefault();
        collectNearbyPlant();
      }
      return;
    }

    const keyMap = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      w: [0, -1],
      W: [0, -1],
      s: [0, 1],
      S: [0, 1],
      a: [-1, 0],
      A: [-1, 0],
      d: [1, 0],
      D: [1, 0]
    };

    const move = keyMap[event.key];
    if (!move) {
      return;
    }

    event.preventDefault();
    movePlayer(move[0], move[1]);
  }

  function movePlayer(dx, dy) {
    const next = {
      x: state.player.x + dx,
      y: state.player.y + dy
    };

    if (!isInsideMap(next.x, next.y) || blockedTiles.has(state.tiles[next.y][next.x])) {
      return;
    }

    state.player = next;
    updateNearbyPlant();
    render();
  }

  function updateNearbyPlant() {
    state.nearbyPlant = state.plantsOnMap.find((plant) => {
      if (plant.collected) {
        return false;
      }
      const distance = Math.abs(plant.x - state.player.x) + Math.abs(plant.y - state.player.y);
      return distance <= 1;
    }) || null;
  }

  function collectNearbyPlant() {
    if (!state.nearbyPlant || state.collected.length >= MAX_COLLECT) {
      return;
    }

    state.nearbyPlant.collected = true;
    state.collected.push(state.nearbyPlant.data);
    updateNearbyPlant();
    render();

    if (state.collected.length >= MAX_COLLECT) {
      enterNightPhase();
    }
  }

  function enterNightPhase() {
    if (state.phase !== "explore" || state.gameEnded) {
      return;
    }

    state.phase = "night";
    if (state.collected.length === 0) {
      resolveNight(null);
      return;
    }

    SurvivalUI.renderNight(state, resolveNight);
    SurvivalUI.showScreen("night");
  }

  function resolveNight(eatenPlant) {
    if (state.gameEnded) {
      return;
    }

    if (eatenPlant && eatenPlant.category === "poison") {
      endGame(false, `${eatenPlant.name}は有毒植物でした。食べたことでゲームオーバーです。`);
      return;
    }

    state.hp -= 1;
    if (eatenPlant && eatenPlant.category === "famine") {
      state.hp = Math.min(MAX_HP, state.hp + 1);
    }

    updateEcosystem();

    if (state.hp <= 0) {
      endGame(false, "夜を越える体力がなくなりました。HPが0になったためゲームオーバーです。");
      return;
    }

    if (state.day >= MAX_DAY) {
      endGame(true, "Day5終了時点で生存しています。植物を見きわめ、無人島で5日間生き延びました。");
      return;
    }

    state.day += 1;
    state.phase = "explore";
    startDay();
    SurvivalUI.showScreen("game");
  }

  function updateEcosystem() {
    const invasiveNames = new Set(
      state.collected
        .filter((plant) => plant.category === "invasive")
        .map((plant) => plant.name)
    );

    if (invasiveNames.size <= 1) {
      state.ecosystem = Math.max(0, state.ecosystem - 1);
    }
  }

  function endGame(win, text) {
    state.gameEnded = true;
    state.phase = "result";
    SurvivalUI.renderResult(win, text);
    SurvivalUI.showScreen("result");
  }

  function render() {
    SurvivalUI.updateHud(state);
    SurvivalUI.renderMap(state);
    SurvivalUI.renderInspector(state.nearbyPlant, collectNearbyPlant);
    SurvivalUI.renderBag(state.collected);
    SurvivalUI.elements.phaseText.textContent = state.nearbyPlant
      ? state.nearbyPlant.data.note || "説明はまだ登録されていません。"
      : `Day ${state.day}。植物を最大5種類まで採取できます。`;
  }

  function isInsideMap(x, y) {
    return x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT;
  }

  function isDecoratableLand(tiles, x, y) {
    return isInsideMap(x, y) && (tiles[y][x] === "grass" || tiles[y][x] === "sand");
  }

  function isNearStart(x, y) {
    return Math.abs(x - playerStart.x) + Math.abs(y - playerStart.y) <= 2;
  }

  function isNearFeature(x, y) {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const nx = x + dx;
        const ny = y + dy;
        if (!isInsideMap(nx, ny)) {
          continue;
        }
        if (["tree", "river", "rock"].includes(state.tiles[ny][nx])) {
          return true;
        }
      }
    }
    return false;
  }

  function positionKey(x, y) {
    return `${x},${y}`;
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
