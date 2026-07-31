(function () {
  "use strict";

  const elements = {};
  const mapRenderCache = {
    width: 0,
    height: 0,
    tiles: [],
    tileTypes: [],
  };
  const buttonSound = new Audio("Audio/button.mp3");
  buttonSound.preload = "auto";
  buttonSound.volume = 0.75;
  buttonSound.load();
  const resultSounds = {
    clear: new Audio("Audio/clear.mp3"),
    gameOver: new Audio("Audio/gameover.mp3"),
  };
  Object.values(resultSounds).forEach((sound) => {
    sound.preload = "auto";
    sound.volume = 0.85;
    sound.load();
  });
  let buttonSoundSetup = false;
  let lastButtonSoundTime = 0;

  function cacheElements() {
    [
      "titleScreen",
      "tutorialScreen",
      "gameScreen",
      "nightScreen",
      "dayResultScreen",
      "resultScreen",
      "startButton",
      "tutorialImage",
      "tutorialPageLabel",
      "restartButton",
      "dayLabel",
      "hpLabel",
      "ecosystemHud",
      "ecosystemLabel",
      "collectLabel",
      "phaseText",
      "map",
      "plantInspector",
      "plantImageBox",
      "plantName",
      "plantDescription",
      "collectButton",
      "bagList",
      "finishExploreButton",
      "nightTitle",
      "nightText",
      "nightChoices",
      "dayResultTitle",
      "dayResultImageBox",
      "dayResultDetails",
      "dayResultContinueButton",
      "resultBadge",
      "resultTitle",
      "resultText",
    ].forEach((id) => {
      elements[id] = document.getElementById(id);
    });
  }

  function showScreen(name) {
    elements.titleScreen.classList.toggle("hidden", name !== "title");
    elements.tutorialScreen.classList.toggle("hidden", name !== "tutorial");
    elements.gameScreen.classList.toggle("hidden", name !== "game");
    elements.nightScreen.classList.toggle("hidden", name !== "night");
    elements.dayResultScreen.classList.toggle("hidden", name !== "dayResult");
    elements.resultScreen.classList.toggle("hidden", name !== "result");
  }

  function setupButtonSound() {
    if (buttonSoundSetup) {
      return;
    }

    buttonSoundSetup = true;
    ["pointerdown", "touchstart", "click"].forEach((eventName) => {
      document.addEventListener(
        eventName,
        (event) => {
          const button = event.target.closest("button");
          if (!button || button.disabled) {
            return;
          }

          playButtonSound();
        },
        true,
      );
    });

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.repeat || !isActionKey(event)) {
          return;
        }

        playButtonSound();
      },
      true,
    );
  }

  function isActionKey(event) {
    return event.key === "Enter" || event.key === " " || event.code === "Space";
  }

  function playButtonSound() {
    const now = Date.now();
    if (now - lastButtonSoundTime < 120) {
      return;
    }

    lastButtonSoundTime = now;
    playSound(buttonSound);
  }

  function stopResultSounds() {
    Object.values(resultSounds).forEach((sound) => {
      sound.pause();
      sound.currentTime = 0;
    });
  }

  function playResultSound(win) {
    stopResultSounds();
    playSound(win ? resultSounds.clear : resultSounds.gameOver);
  }

  function playSound(sound) {
    try {
      sound.pause();
      sound.currentTime = 0;
      sound.play().catch(() => {});
    } catch (error) {
      // Audio can fail until the browser receives a user gesture.
    }
  }

  function renderTutorialSlide(src, currentIndex, totalSlides) {
    elements.tutorialImage.src = src;
    elements.tutorialPageLabel.textContent = `${currentIndex + 1} / ${totalSlides}`;
  }

  function updateHud(state) {
    elements.dayLabel.textContent = `${state.day} / ${state.maxDay}`;
    elements.hpLabel.textContent = "♥ ".repeat(state.hp).trim() || "0";
    elements.ecosystemLabel.textContent = `生態系レベル：${state.ecosystem}`;
    elements.ecosystemHud.classList.toggle("danger", state.ecosystem === 1);
    elements.ecosystemHud.classList.toggle("critical", state.ecosystem === 0);
    elements.collectLabel.textContent = `${state.collected.length} / ${state.maxCollect}`;
  }

  function makeTileClass(tile) {
    return `tile ${tile}`;
  }

  function renderMap(state) {
    ensureMapTiles(state);

    for (let y = 0; y < state.mapHeight; y += 1) {
      for (let x = 0; x < state.mapWidth; x += 1) {
        const index = y * state.mapWidth + x;
        const tile = mapRenderCache.tiles[index];
        const plant = state.plantsOnMap.find(
          (item) => !item.collected && item.x === x && item.y === y,
        );
        const isPlayer = state.player.x === x && state.player.y === y;
        const isNearby =
          state.nearbyPlant &&
          state.nearbyPlant.x === x &&
          state.nearbyPlant.y === y;
        const isNearbySign =
          state.nearbySign &&
          state.nearbySign.x === x &&
          state.nearbySign.y === y;
        const isNearbyCamp =
          state.nearbyCamp &&
          state.nearbyCamp.x === x &&
          state.nearbyCamp.y === y;

        tile.className = makeTileClass(state.tiles[y][x]);
        if (isNearby || isNearbySign || isNearbyCamp) {
          tile.classList.add("nearby");
        }

        if (tile.firstChild) {
          tile.replaceChildren();
        }

        if (plant) {
          const plantEntity = document.createElement("span");
          plantEntity.className = "entity plant";
          plantEntity.title = plant.data.name;
          tile.appendChild(plantEntity);
        }

        if (isPlayer) {
          const player = document.createElement("span");
          player.className = "entity player";
          player.title = "プレイヤー";
          tile.appendChild(player);
        }
      }
    }

    centerMapOnPlayer(state);
  }

  function ensureMapTiles(state) {
    const needsRebuild =
      mapRenderCache.width !== state.mapWidth ||
      mapRenderCache.height !== state.mapHeight ||
      mapRenderCache.tileTypes.length !== state.mapWidth * state.mapHeight ||
      hasTileTypeChanges(state);

    if (!needsRebuild) {
      return;
    }

    const fragment = document.createDocumentFragment();
    mapRenderCache.width = state.mapWidth;
    mapRenderCache.height = state.mapHeight;
    mapRenderCache.tiles = [];
    mapRenderCache.tileTypes = [];
    elements.map.textContent = "";

    for (let y = 0; y < state.mapHeight; y += 1) {
      for (let x = 0; x < state.mapWidth; x += 1) {
        const tile = document.createElement("div");
        const tileType = state.tiles[y][x];
        tile.className = makeTileClass(tileType);
        mapRenderCache.tiles.push(tile);
        mapRenderCache.tileTypes.push(tileType);
        fragment.appendChild(tile);
      }
    }

    elements.map.appendChild(fragment);
  }

  function hasTileTypeChanges(state) {
    for (let y = 0; y < state.mapHeight; y += 1) {
      for (let x = 0; x < state.mapWidth; x += 1) {
        const index = y * state.mapWidth + x;
        if (mapRenderCache.tileTypes[index] !== state.tiles[y][x]) {
          return true;
        }
      }
    }

    return false;
  }

  function centerMapOnPlayer(state) {
    window.requestAnimationFrame(() => {
      const mapPanel = elements.map.parentElement;
      const firstTile = elements.map.firstElementChild;
      if (!mapPanel || !firstTile) {
        return;
      }

      const tileRect = firstTile.getBoundingClientRect();
      const tileWidth = tileRect.width;
      const tileHeight = tileRect.height;
      if (!tileWidth || !tileHeight) {
        return;
      }

      const playerCenterX = (state.player.x + 0.5) * tileWidth;
      const playerCenterY = (state.player.y + 0.5) * tileHeight;
      mapPanel.scrollLeft = playerCenterX - mapPanel.clientWidth / 2;
      mapPanel.scrollTop = playerCenterY - mapPanel.clientHeight / 2;
    });
  }

  function renderInspector(plant, onCollect, sign, onReadSign, camp, onReadCamp) {
    elements.collectButton.onclick = null;

    if (sign) {
      elements.plantInspector.classList.add("empty");
      elements.plantImageBox.classList.add("hidden");
      elements.plantImageBox.textContent = "";
      elements.plantName.textContent = "看板";
      elements.plantDescription.textContent = "島で生き延びるためのヒントが書かれています。";
      elements.collectButton.disabled = false;
      elements.collectButton.textContent = "Enterで看板を読む";
      elements.collectButton.onclick = onReadSign;
      return;
    }

    if (camp) {
      elements.plantInspector.classList.add("empty");
      elements.plantImageBox.classList.add("hidden");
      elements.plantImageBox.textContent = "";
      elements.plantName.textContent = "家";
      elements.plantDescription.textContent = "何か書かれているようです。";
      elements.collectButton.disabled = false;
      elements.collectButton.textContent = "Enterで読む";
      elements.collectButton.onclick = onReadCamp;
      return;
    }

    if (!plant) {
      elements.plantInspector.classList.add("empty");
      elements.plantImageBox.classList.add("hidden");
      elements.plantImageBox.textContent = "";
      elements.plantName.textContent = "近くに採取可能な植物はありません";
      elements.plantDescription.textContent = "植物に近づくと調査できます。";
      elements.collectButton.disabled = true;
      elements.collectButton.textContent = "Enterで採取";
      return;
    }

    elements.plantInspector.classList.remove("empty");
    elements.plantImageBox.classList.remove("hidden");
    renderPlantImage(elements.plantImageBox, plant.data.name);
    elements.plantName.textContent = plant.data.name;
    elements.plantDescription.textContent =
      plant.data.note || "説明はまだ登録されていません。";
    elements.collectButton.disabled = false;
    elements.collectButton.textContent = "Enterで採取";
    elements.collectButton.onclick = onCollect;
  }

  function renderPlantImage(container, name) {
    container.textContent = "";
    const image = document.createElement("img");
    image.alt = name;
    image.src = PlantData.imagePath(name);
    image.onerror = () => {
      container.textContent = "画像が設定されていません";
    };
    container.appendChild(image);
  }

  function renderBag(collected) {
    elements.bagList.textContent = "";
    if (collected.length === 0) {
      const empty = document.createElement("li");
      empty.textContent = "まだ採取していません";
      elements.bagList.appendChild(empty);
      return;
    }

    collected.forEach((plant) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = plant.name;
      item.appendChild(name);
      elements.bagList.appendChild(item);
    });
  }

  function renderNight(state, onEat) {
    elements.nightTitle.textContent = `Day ${state.day} の夜`;
    elements.nightText.textContent =
      state.collected.length > 0
        ? "採取した植物の中から、食べる植物を1種類選んでください。"
        : "今日は植物を採取していません。食べる植物を選べないため、そのまま夜を越します。";
    elements.nightChoices.textContent = "";

    state.collected.forEach((plant) => {
      elements.nightChoices.appendChild(
        makeChoiceCard(plant, () => onEat(plant)),
      );
    });
  }

  function makeChoiceCard(plant, onClick) {
    const card = document.createElement("article");
    card.className = "choice-card";
    const title = document.createElement("h3");
    const text = document.createElement("p");
    const button = document.createElement("button");
    title.textContent = plant.name;
    text.textContent = plant.note || "説明はまだ登録されていません。";
    button.className = "choice-button";
    button.textContent = "これを食べる";
    button.addEventListener("click", onClick);
    card.append(title, text, button);
    return card;
  }

  function renderDayResult(summary, onContinue) {
    elements.dayResultTitle.textContent = summary.eatenPlant
      ? `${summary.eatenPlant.name}を食べた`
      : "食べる植物がありませんでした";
    elements.dayResultImageBox.textContent = "";
    elements.dayResultImageBox.classList.toggle("empty", !summary.eatenPlant);

    if (summary.eatenPlant) {
      renderPlantImage(elements.dayResultImageBox, summary.eatenPlant.name);
    } else {
      elements.dayResultImageBox.textContent = "植物画像はありません";
    }

    elements.dayResultDetails.textContent = "";
    elements.dayResultDetails.append(
      makeResultLine("Status", summary.statusLabel, summary.isPoison),
      makeResultLine(
        "HP",
        `${summary.hpBefore} → ${summary.hpAfter}`,
        summary.hpAfter < summary.hpBefore,
      ),
      makeResultLine(
        "生態系",
        `${summary.ecosystemBefore} → ${summary.ecosystemAfter}`,
        summary.ecosystemAfter < summary.ecosystemBefore,
      ),
      makeResultLine(
        "Day",
        `${summary.dayBefore} → ${summary.dayAfterLabel}`,
        summary.isGameOver,
      ),
    );

    summary.messages.forEach((message) => {
      const item = document.createElement("p");
      item.className = message.negative
        ? "result-note negative"
        : "result-note";
      item.textContent = message.text;
      elements.dayResultDetails.appendChild(item);
    });

    elements.dayResultContinueButton.onclick = onContinue;
  }

  function makeResultLine(label, value, negative) {
    const row = document.createElement("p");
    row.className = "result-line";
    const labelElement = document.createElement("span");
    const valueElement = document.createElement("strong");
    labelElement.textContent = `${label}：`;
    valueElement.textContent = value;
    if (negative) {
      valueElement.classList.add("negative");
    }
    row.append(labelElement, valueElement);
    return row;
  }

  function renderResult(win, text) {
    elements.resultBadge.textContent = win ? "CLEAR" : "GAME OVER";
    elements.resultTitle.textContent = win ? "救助された！" : "サバイバル失敗";
    elements.resultText.textContent = text;
  }

  window.SurvivalUI = {
    elements,
    cacheElements,
    setupButtonSound,
    stopResultSounds,
    playResultSound,
    showScreen,
    renderTutorialSlide,
    updateHud,
    renderMap,
    renderInspector,
    renderBag,
    renderNight,
    renderDayResult,
    renderResult,
  };
})();
