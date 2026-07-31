(function () {
  "use strict";

  const elements = {};

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
      "tutorialTapHint",
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
      "bagList",
      "finishExploreButton",
      "mobileActionButton",
      "virtualStick",
      "virtualStickKnob",
      "imagePreviewOverlay",
      "imagePreviewCloseButton",
      "imagePreview",
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
    const fragment = document.createDocumentFragment();
    elements.map.textContent = "";

    for (let y = 0; y < state.mapHeight; y += 1) {
      for (let x = 0; x < state.mapWidth; x += 1) {
        const tile = document.createElement("div");
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

        tile.className = makeTileClass(state.tiles[y][x]);
        if (isNearby || isNearbySign) {
          tile.classList.add("nearby");
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

        fragment.appendChild(tile);
      }
    }

    elements.map.appendChild(fragment);
    centerMapOnPlayer(state);
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
      const sidePanel = elements.plantInspector.parentElement;
      const guide = elements.phaseText.parentElement;
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      const bagPanel = sidePanel ? sidePanel.firstElementChild : null;
      const coveredRight =
        !isPortrait && isVisible(sidePanel) ? sidePanel.offsetWidth : 0;
      const coveredBottom = isPortrait
        ? (isVisible(bagPanel) ? bagPanel.offsetHeight : 0) +
          (isVisible(guide) ? guide.offsetHeight : 0)
        : isVisible(guide)
          ? guide.offsetHeight
          : 0;
      const visibleWidth = Math.max(1, mapPanel.clientWidth - coveredRight);
      const visibleHeight = Math.max(1, mapPanel.clientHeight - coveredBottom);
      mapPanel.scrollLeft = playerCenterX - visibleWidth / 2;
      mapPanel.scrollTop = playerCenterY - visibleHeight / 2;
    });
  }

  function isVisible(element) {
    return element && !element.classList.contains("hidden");
  }

  function renderInspector(plant, onCollect, sign, onReadSign) {
    elements.mobileActionButton.onclick = null;
    elements.mobileActionButton.onpointerup = null;
    elements.mobileActionButton.classList.add("hidden");
    elements.mobileActionButton.classList.remove("is-ready");

    if (sign) {
      elements.plantInspector.classList.remove("hidden");
      elements.plantInspector.classList.add("empty");
      elements.plantImageBox.classList.add("hidden");
      elements.plantImageBox.textContent = "";
      elements.plantImageBox.onclick = null;
      elements.plantName.textContent = "看板";
      elements.plantDescription.textContent = "島で生き延びるためのヒントが書かれています。";
      elements.mobileActionButton.textContent = "読む";
      elements.mobileActionButton.onclick = null;
      elements.mobileActionButton.onpointerup = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onReadSign();
      };
      elements.mobileActionButton.classList.remove("hidden");
      elements.mobileActionButton.classList.add("is-ready");
      return;
    }

    if (!plant) {
      elements.plantInspector.classList.add("hidden");
      elements.plantInspector.classList.add("empty");
      elements.plantImageBox.classList.add("hidden");
      elements.plantImageBox.textContent = "";
      elements.plantImageBox.onclick = null;
      elements.plantName.textContent = "近くに採取可能な植物はありません";
      elements.plantDescription.textContent = "植物に近づくと調査できます。";
      return;
    }

    elements.plantInspector.classList.remove("empty");
    elements.plantInspector.classList.remove("hidden");
    elements.plantImageBox.classList.remove("hidden");
    renderPlantImage(elements.plantImageBox, plant.data.name);
    elements.plantImageBox.onclick = () => {
      showImagePreview(PlantData.imagePath(plant.data.name), plant.data.name);
    };
    elements.plantName.textContent = plant.data.name;
    elements.plantDescription.textContent =
      plant.data.note || "説明はまだ登録されていません。";
    elements.mobileActionButton.textContent = "採取";
    elements.mobileActionButton.onclick = null;
    elements.mobileActionButton.onpointerup = (event) => {
      event.preventDefault();
      event.stopPropagation();
      onCollect();
    };
    elements.mobileActionButton.classList.remove("hidden");
    elements.mobileActionButton.classList.add("is-ready");
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

  function setupImagePreview() {
    elements.imagePreviewCloseButton.addEventListener("pointerup", (event) => {
      event.preventDefault();
      hideImagePreview();
    });
  }

  function showImagePreview(src, alt) {
    elements.imagePreview.src = src;
    elements.imagePreview.alt = alt;
    elements.imagePreviewOverlay.classList.remove("hidden");
  }

  function hideImagePreview() {
    elements.imagePreviewOverlay.classList.add("hidden");
    elements.imagePreview.removeAttribute("src");
    elements.imagePreview.alt = "";
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
    elements.dayResultContinueButton.textContent =
      summary.finalAction === "nextDay" ? "次の日へ" : "結果を見る";
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
    setupImagePreview,
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
