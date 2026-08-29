(() => {
  "use strict";

  if (globalThis.ModResearchFramework) {
    console.warn("[Mod Research Framework] Already loaded.");
    return;
  }

  const api = sandkit.api;
  const React = sandkit.react;
  const engineState = sandkit.engine?.state || null;

  const API_VERSION = 1;
  const FRAMEWORK_VERSION = "0.3.0";

  const categories = new Map();
  const nodes = new Map();
  const occupied = new Set();
  const listeners = new Set();

  const discoveredIds = new Set();
  let lastNativeScanCount = 0;
  let lastTaggedScanCount = 0;

  const DEFAULTS = [
    ["logistics",   "Logistics",   40,  2],
    ["power",       "Power",       40, 10],
    ["thermal",     "Thermal",     40, 18],
    ["processing",  "Processing",  40, 26],
    ["extraction",  "Extraction",  52,  2],
    ["storage",     "Storage",     52, 10],
    ["automation",  "Automation",  52, 18],
    ["utility",     "Utility",     52, 26],
    ["materials",   "Materials",   64,  2],
    ["special",     "Special",     64, 10],
    ["endgame",     "End Game",    64, 18],
    ["misc",        "MISC",        64, 26],
    ["other",       "Other Mods",  76,  2],
  ];

  function key(row, col) {
    return `${row}:${col}`;
  }

  function normalizeId(value, label) {
    if (typeof value !== "string" || !value.trim()) {
      throw new TypeError(`[Mod Research Framework] ${label} must be a non-empty string.`);
    }
    return value.trim();
  }

  function emitChange() {
    for (const fn of listeners) {
      try { fn(); } catch (_) {}
    }
  }


  function discoverRegisteredMods() {
    try {
      const registered =
        sandkit.engine?.api?.tech?.getModDefinitions?.();

      if (!registered || typeof registered !== "object") {
        lastNativeScanCount = -1;
        return;
      }

      const entries =
        Object.entries(registered);

      lastNativeScanCount =
        entries.length;

      let taggedThisScan = 0;

      for (const [id, definition] of entries) {
        if (!definition || typeof definition !== "object") continue;

        const meta =
          definition.modResearch ||
          definition.modResearchFramework;

        if (!meta || typeof meta !== "object") continue;

        taggedThisScan++;

        if (discoveredIds.has(id) || nodes.has(id)) continue;

        const categoryId =
          meta.category || "other";

        const category =
          categories.get(categoryId) ||
          registerCategory({
            id: categoryId,
            name: meta.categoryName || categoryId
          });

        const record = {
          id,
          modId:
            meta.modId ||
            definition.modId ||
            "unknown",
          category:
            category.id,
          parentId:
            meta.parentId ??
            definition.requires ??
            null,
          name:
            meta.name ||
            definition.name ||
            definition.nameKey ||
            id,
          description:
            meta.description ||
            definition.description ||
            definition.descriptionKey ||
            "",
          position:
            null,
          definition,
          nativeTech:
            true,
          discovered:
            true
        };

        nodes.set(id, record);
        category.nodeIds.push(id);
        discoveredIds.add(id);
        emitChange();

        console.log(
          `[Mod Research Framework] discovered standalone mod tech ${id} -> ${category.name}`
        );
      }

      lastTaggedScanCount =
        taggedThisScan;
    } catch (error) {
      console.warn(
        "[Mod Research Framework] mod-tech definition discovery failed:",
        error
      );
    }
  }


  function registerCategory(definition) {
    if (!definition || typeof definition !== "object") {
      throw new TypeError("[Mod Research Framework] Category definition is required.");
    }

    const id = normalizeId(definition.id, "category id");
    if (categories.has(id)) return categories.get(id);

    const row = Number.isFinite(definition.row) ? Math.floor(definition.row) : 76;
    const col = Number.isFinite(definition.col) ? Math.floor(definition.col) : 2 + categories.size * 8;

    const category = {
      id,
      name: definition.name || id,
      description: definition.description || "",
      row,
      col,
      direction: definition.direction === "horizontal" ? "horizontal" : "vertical",
      spacing: Math.max(1, Math.floor(definition.spacing || 2)),
      order: Number.isFinite(definition.order) ? definition.order : categories.size,
      color: definition.color || null,
      nodeIds: [],
    };

    categories.set(id, category);
    emitChange();
    return category;
  }

  function findPosition(category, preferredPosition) {
    if (preferredPosition &&
        Number.isFinite(preferredPosition.row) &&
        Number.isFinite(preferredPosition.col)) {
      const row = Math.floor(preferredPosition.row);
      const col = Math.floor(preferredPosition.col);
      if (!occupied.has(key(row, col))) {
        occupied.add(key(row, col));
        return { row, col };
      }
    }

    let step = category.nodeIds.length;
    for (let tries = 0; tries < 500; tries++, step++) {
      const row = category.direction === "vertical"
        ? category.row + step * category.spacing
        : category.row;
      const col = category.direction === "horizontal"
        ? category.col + step * category.spacing
        : category.col;

      if (!occupied.has(key(row, col))) {
        occupied.add(key(row, col));
        return { row, col };
      }
    }

    throw new Error(`[Mod Research Framework] No free position found in category "${category.id}".`);
  }

  function register(definition) {
    if (!definition || typeof definition !== "object") {
      throw new TypeError("[Mod Research Framework] Research definition is required.");
    }

    const id = normalizeId(definition.id, "research id");
    if (nodes.has(id)) {
      console.warn(`[Mod Research Framework] Duplicate research id ignored: ${id}`);
      return nodes.get(id);
    }

    const categoryId = definition.category || "other";
    const category = categories.get(categoryId) || registerCategory({
      id: categoryId,
      name: definition.categoryName || categoryId
    });

    const position = findPosition(category, definition.preferredPosition);

    const techDefinition = Object.assign({}, definition.tech || {}, {
      name: definition.name ?? definition.tech?.name,
      nameKey: definition.nameKey ?? definition.tech?.nameKey,
      description: definition.description ?? definition.tech?.description,
      descriptionKey: definition.descriptionKey ?? definition.tech?.descriptionKey,
      cost: definition.cost ?? definition.tech?.cost ?? 0,
      currencyType: definition.currencyType ?? definition.tech?.currencyType,
      unlocks: definition.unlocks ?? definition.tech?.unlocks ?? {},
    });

    const parentId = definition.parentId || definition.parent || "shaker";

    const actualPosition = api.tech.registerNode(
      id,
      techDefinition,
      {
        parentId,
        preferredPosition: position
      }
    ) || position;

    const record = {
      id,
      modId: definition.modId || definition.author || "unknown",
      category: category.id,
      parentId,
      name: definition.name || techDefinition.name || id,
      description: definition.description || techDefinition.description || "",
      position: actualPosition,
      tech: techDefinition,
    };

    nodes.set(id, record);
    category.nodeIds.push(id);
    emitChange();

    console.log(
      `[Mod Research Framework] Registered ${id} in ${category.name} at`,
      actualPosition
    );

    return record;
  }

  function getCategories() {
    return Array.from(categories.values())
      .sort((a, b) => a.order - b.order)
      .map(c => Object.assign({}, c, { nodeIds: [...c.nodeIds] }));
  }

  function getNodes(categoryId) {
    const list = Array.from(nodes.values());
    return (categoryId ? list.filter(n => n.category === categoryId) : list)
      .map(n => Object.assign({}, n));
  }

  function onChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  for (const [id, name, row, col] of DEFAULTS) {
    registerCategory({ id, name, row, col, spacing: 2 });
  }

  const framework = Object.freeze({
    apiVersion: API_VERSION,
    version: FRAMEWORK_VERSION,
    register,
    registerNode: register,
    registerCategory,
    getCategories,
    getNodes,
    onChange,
    discover: discoverRegisteredMods,
    isAvailable: true,
  });

  globalThis.ModResearchFramework = framework;
  globalThis.ModResearch = framework;

  /*
   * v0.1.6 discovery prototype
   * --------------------------
   * Compatible mods register their actual tech directly with Sandustry and tag
   * that native definition with a small modResearch metadata object.
   * The framework discovers the real native node list directly.
   */
  discoverRegisteredMods();

  const discoveryTimer = setInterval(
    discoverRegisteredMods,
    1500
  );


  /*
   * Prototype Mods tab.
   *
   * Sandustry 0.5.5 exposes tech registration cleanly, but it does not expose
   * a public research-tab registration function. This alpha therefore adds a
   * patch-free DOM tab/index while leaving purchases to native tech nodes.
   *
   * This is intentionally isolated here so the registration API remains stable
   * even if the UI adapter changes in a future version.
   */
  function formatResearchCost(definition) {
    if (!definition) return "Unknown cost";

    const customLabel =
      definition?.modResearch?.costLabel ||
      definition?.modResearchFramework?.costLabel;

    if (customLabel) {
      return String(customLabel);
    }

    const amount =
      Number(definition.cost || 0);

    const currency =
      definition.currencyType || "gold";

    const label =
      currency === "gold"
        ? "Gold"
        : currency === "auralite"
          ? "Auralite"
          : currency;

    return `${Math.max(0, Math.floor(amount)).toLocaleString()} ${label}`;
  }

  function getPrerequisiteIds(definition, record) {
    const requires =
      definition?.requires ??
      record?.parentId;

    if (requires == null) return [];

    return Array.isArray(requires)
      ? requires
      : [requires];
  }

  function getPrerequisiteLabel(id) {
    /*
     * Sandustry's own Tech Tree calls getTechDisplayName(state, parsedNode).
     * Passing only getTechDefinition(id) is not equivalent for numeric built-in
     * Tech enum values and was why v0.2.4 fell back to labels such as "43".
     */
    try {
      const nodes =
        sandkit.engine?.api?.tech?.getNodes?.() ||
        [];

      const node =
        nodes.find(
          candidate =>
            String(candidate?.id) ===
            String(id)
        );

      if (node) {
        const displayName =
          sandkit.engine.api.tech.getDisplayName?.(
            sandkit.state,
            node
          );

        if (
          displayName &&
          displayName !== String(id)
        ) {
          return displayName;
        }

        if (
          node.name &&
          node.name !== String(id)
        ) {
          return String(node.name);
        }
      }
    } catch (_) {}

    /*
     * String-ID custom vanilla nodes can still resolve from their definition.
     */
    try {
      const definition =
        sandkit.engine.api.tech.getDefinition(id);

      if (definition) {
        const displayName =
          sandkit.engine.api.tech.getDisplayName?.(
            sandkit.state,
            Object.assign(
              { id },
              definition
            )
          );

        if (
          displayName &&
          displayName !== String(id)
        ) {
          return displayName;
        }

        if (
          definition.name &&
          definition.name !== String(id)
        ) {
          return String(definition.name);
        }
      }
    } catch (_) {}

    /*
     * Last-resort names for current Sandustry 0.5.5 enum IDs used by the pack.
     * This branch should normally never be reached now that getNodes() is
     * exposed, but it guarantees the UI never regresses to bare numbers.
     */
    const fallback = {
      20: "Planter Box",
      21: "Drying & Condensing",
      30: "Conveyors Mk2",
      43: "Logistics IV",
      48: "Alien",
      60: "Vacuum",
      70: "Drill",
      82: "Quantum Portal",
      87: "Refining VIII",
      96: "Precision Tools",
      101: "Wall Tool",
      106: "Mining Laser",
      107: "Gold Battery",
      prismalineWell: "Prismaline Well"
    };

    return (
      fallback[String(id)] ??
      fallback[id] ??
      String(id)
    );
  }


  function isResearchComplete(id) {
    try {
      return !!sandkit.engine.api.tech.isResearched(
        sandkit.state,
        id
      );
    } catch (_) {
      return !!sandkit.state?.store?.player?.tech?.[id];
    }
  }

  function prerequisitesMet(definition, record) {
    return getPrerequisiteIds(
      definition,
      record
    ).every(
      id => isResearchComplete(id)
    );
  }

  function purchaseModResearch(record) {
    const definition =
      record?.definition ||
      sandkit.engine.api.tech.getDefinition(record?.id);

    if (!definition) return false;

    try {
      return !!sandkit.engine.api.tech.unlock(
        sandkit.state,
        Object.assign(
          {
            id: record.id
          },
          definition
        ),
        {
          playSound: true
        }
      );
    } catch (error) {
      console.error(
        "[Mod Research Framework] purchase failed:",
        error
      );
      return false;
    }
  }


  function findVanillaTechElement(techId, techLabel) {
    const exactId =
      String(techId);

    /*
     * First preference: our 0.5.5 compatibility patch stamps every native
     * research node with data-mrf-tech-id. This is deterministic and does not
     * depend on translated text or Sandustry's internal focus implementation.
     */
    const escapedId =
      globalThis.CSS?.escape
        ? globalThis.CSS.escape(exactId)
        : exactId.replace(
            /["\\]/g,
            "\\$&"
          );

    const stamped =
      document.querySelector(
        `[data-mrf-tech-id="${escapedId}"]`
      );

    if (stamped) {
      return stamped;
    }

    /*
     * Fallback for future builds where the data attribute is unavailable:
     * find a visible node by its displayed vanilla research name.
     */
    const label =
      String(techLabel || "").trim();

    if (!label) return null;

    const candidates =
      Array.from(
        document.querySelectorAll(
          "button, [role='button'], [tabindex]"
        )
      );

    return candidates.find(element => {
      const text =
        (element.textContent || "")
          .replace(/\s+/g, " ")
          .trim();

      return (
        text === label ||
        text.startsWith(`${label} `) ||
        text.includes(label)
      );
    }) || null;
  }

  function highlightVanillaPrerequisite(techId, techLabel, attempt = 0) {
    const target =
      findVanillaTechElement(
        techId,
        techLabel
      );

    if (!target) {
      if (attempt < 20) {
        setTimeout(
          () =>
            highlightVanillaPrerequisite(
              techId,
              techLabel,
              attempt + 1
            ),
          100
        );
      }
      return;
    }

    try {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center"
      });
    } catch (_) {
      try {
        target.scrollIntoView();
      } catch (_) {}
    }

    try {
      target.focus?.({
        preventScroll: true
      });
    } catch (_) {}

    const oldPosition =
      target.style.position;

    const oldZIndex =
      target.style.zIndex;

    const oldOutline =
      target.style.outline;

    const oldOutlineOffset =
      target.style.outlineOffset;

    const oldBoxShadow =
      target.style.boxShadow;

    target.style.position =
      oldPosition || "relative";

    target.style.zIndex =
      "9999";

    target.style.outline =
      "3px solid #ffe600";

    target.style.outlineOffset =
      "4px";

    target.style.boxShadow =
      "0 0 8px #ffe600, 0 0 22px rgba(255,230,0,.95), 0 0 44px rgba(255,230,0,.45)";

    try {
      target.animate(
        [
          {
            transform: "scale(1)",
            filter:
              "brightness(1)"
          },
          {
            transform: "scale(1.18)",
            filter:
              "brightness(1.5)"
          },
          {
            transform: "scale(1)",
            filter:
              "brightness(1)"
          }
        ],
        {
          duration: 650,
          iterations: 5,
          easing: "ease-in-out"
        }
      );
    } catch (_) {}

    setTimeout(
      () => {
        target.style.position =
          oldPosition;

        target.style.zIndex =
          oldZIndex;

        target.style.outline =
          oldOutline;

        target.style.outlineOffset =
          oldOutlineOffset;

        target.style.boxShadow =
          oldBoxShadow;
      },
      3600
    );
  }

  function ModsTabController() {
    const [, forceRender] = React.useState(0);

    React.useEffect(
      () => onChange(() => forceRender(x => x + 1)),
      []
    );

    React.useEffect(() => {
      if (typeof document === "undefined") return;

      let mountedButton = null;
      let panel = null;
      let nativeContent = null;
      let active = false;
      let installScheduled = false;

      function findResearchUi() {
        const buttons = Array.from(document.querySelectorAll("button"));

        const techButton = buttons.find(
          b => (b.textContent || "").trim().toLowerCase() === "tech tree"
        );

        const conservatoryButton = buttons.find(
          b => (b.textContent || "").trim().toLowerCase() === "conservatory"
        );

        const anchor = conservatoryButton || techButton;
        if (!anchor || !anchor.parentElement) return null;

        return {
          techButton,
          conservatoryButton,
          anchor,
          tabs: anchor.parentElement
        };
      }

      function findViewport(tabs) {
        let shell = tabs.parentElement;

        for (let depth = 0; shell && depth < 5; depth++, shell = shell.parentElement) {
          const tabRect = tabs.getBoundingClientRect();
          const candidates = Array.from(shell.children || [])
            .filter(el => el !== tabs && el !== panel && !el.contains?.(tabs))
            .map(el => ({ el, rect: el.getBoundingClientRect?.() }))
            .filter(x =>
              x.rect &&
              x.rect.width > 300 &&
              x.rect.height > 180 &&
              x.rect.top >= tabRect.bottom - 8
            )
            .sort((a, b) =>
              (b.rect.width * b.rect.height) -
              (a.rect.width * a.rect.height)
            );

          if (candidates.length) {
            return { shell, viewport: candidates[0].el };
          }
        }

        return {
          shell: tabs.parentElement,
          viewport: null
        };
      }

      function ensureRainbowStyle() {
        if (document.getElementById("mod-research-framework-rainbow-style")) return;

        const style = document.createElement("style");
        style.id = "mod-research-framework-rainbow-style";
        style.textContent = `
          @keyframes mrfRainbowShift {
            0%   { background-position:   0% 50%; }
            100% { background-position: 300% 50%; }
          }

          @keyframes mrfRainbowGlow {
            0%   { filter: drop-shadow(0 0 3px rgba(255, 60, 60, .45)); }
            20%  { filter: drop-shadow(0 0 4px rgba(255, 215, 0, .55)); }
            40%  { filter: drop-shadow(0 0 4px rgba(60, 255, 120, .50)); }
            60%  { filter: drop-shadow(0 0 4px rgba(60, 190, 255, .55)); }
            80%  { filter: drop-shadow(0 0 4px rgba(180, 80, 255, .55)); }
            100% { filter: drop-shadow(0 0 3px rgba(255, 60, 60, .45)); }
          }

          button[data-mod-research-framework-tab="1"] {
            color: transparent !important;
            background-image:
              linear-gradient(
                90deg,
                #ff3b3b,
                #ff9f1a,
                #ffe600,
                #4dff73,
                #32d7ff,
                #5b7cff,
                #b85cff,
                #ff4dc4,
                #ff3b3b
              ) !important;
            background-size: 300% 100% !important;
            background-clip: text !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            animation:
              mrfRainbowShift 2.4s linear infinite,
              mrfRainbowGlow 2.4s linear infinite !important;
            text-shadow: none !important;
          }

          button[data-mod-research-framework-tab="1"]:hover {
            animation-duration: 1.35s, 1.35s !important;
          }

          button[data-mod-research-framework-tab="1"][data-mrf-active="1"] {
            border-bottom-color: #ffe600 !important;
          }
        `;
        document.head.appendChild(style);
      }

      function styleModsButton(activeState) {
        if (!mountedButton) return;

        /*
         * Keep Sandustry's exact native tab geometry, but give the word MODS
         * a continuously moving rainbow gradient. Active state still uses
         * Sandustry's familiar yellow underline.
         */
        ensureRainbowStyle();
        mountedButton.dataset.mrfActive = activeState ? "1" : "0";
        mountedButton.style.borderBottomColor =
          activeState ? "#ffe600" : "transparent";
        mountedButton.style.transition =
          "border-color 90ms linear";
      }

      function renderPanel() {
        if (!panel) return;

        /*
         * Preserve the Mods-tab scroll position across status refreshes.
         * v0.2.1 rebuilt the entire panel after a purchase, which snapped
         * the user back to the top of a long research list.
         */
        const previousScroller =
          panel.firstElementChild;

        const previousScrollTop =
          Number(previousScroller?.scrollTop || 0);

        panel.innerHTML = "";

        const wrap = document.createElement("div");
        wrap.style.cssText =
          "box-sizing:border-box;width:100%;height:100%;overflow:auto;" +
          "position:relative;padding:16px 16px 42px 16px;background:#05080c;color:white;" +
          "border:1px solid rgba(74,126,160,.65);";

        const title = document.createElement("div");
        title.textContent = "MOD RESEARCH";
        title.style.cssText =
          "font-weight:900;font-size:15px;color:#ffe600;" +
          "letter-spacing:.11em;margin-bottom:5px;" +
          "text-shadow:0 0 6px rgba(255,230,0,.75),0 0 14px rgba(255,230,0,.25);";
        wrap.appendChild(title);

        const note = document.createElement("div");
        note.textContent =
          "Compatible Workshop research registered through Mod Research Framework.";
        note.style.cssText =
          "font-size:11px;color:#aeb8c6;margin-bottom:15px;";
        wrap.appendChild(note);

        let shown = 0;

        for (const category of getCategories()) {
          const items = getNodes(category.id);
          if (!items.length) continue;
          shown += items.length;

          const section = document.createElement("section");
          section.style.cssText =
            "margin-bottom:12px;padding:10px 12px;" +
            "background:rgba(12,20,31,.88);" +
            "border:1px solid rgba(55,101,132,.45);" +
            "border-left:3px solid #ffe600;";

          const heading = document.createElement("div");
          heading.textContent = `${category.name.toUpperCase()}  (${items.length})`;
          heading.style.cssText =
            "font-size:12px;font-weight:900;color:#ffe600;" +
            "margin-bottom:7px;letter-spacing:.04em;" +
            "text-shadow:0 0 5px rgba(255,230,0,.45);";
          section.appendChild(heading);

          for (const item of items) {
            const definition =
              item.definition ||
              sandkit.engine.api.tech.getDefinition(item.id) ||
              {};

            const purchased =
              isResearchComplete(item.id);

            const prereqIds =
              getPrerequisiteIds(
                definition,
                item
              );

            const prereqNames =
              prereqIds.map(
                getPrerequisiteLabel
              );

            const prereqsReady =
              prerequisitesMet(
                definition,
                item
              );

            const card =
              document.createElement("div");

            card.style.cssText =
              "display:grid;" +
              "grid-template-columns:minmax(240px,1fr) 200px 145px;" +
              "gap:14px;align-items:center;" +
              "padding:12px 10px;" +
              "border-top:1px solid rgba(255,255,255,.08);" +
              "background:rgba(0,0,0,.12);";

            const left =
              document.createElement("div");

            const name =
              document.createElement("div");

            name.textContent =
              item.name;

            name.style.cssText =
              "font-size:12px;font-weight:800;color:#f4f7fb;" +
              "text-shadow:0 0 4px rgba(100,180,255,.18);";

            const description =
              document.createElement("div");

            description.textContent =
              item.description ||
              definition.description ||
              "";

            description.style.cssText =
              "margin-top:4px;font-size:10px;color:#8e9bab;" +
              "line-height:1.35;";

            const author =
              document.createElement("div");

            author.textContent =
              item.modId;

            author.style.cssText =
              "margin-top:4px;font-size:9px;color:#627386;";

            left.append(
              name,
              description,
              author
            );

            const middle =
              document.createElement("div");

            const prerequisite =
              document.createElement("div");

            prerequisite.textContent =
              prereqNames.length
                ? `Vanilla prerequisite: ${prereqNames.join(", ")}`
                : "Vanilla prerequisite: None";

            prerequisite.style.cssText =
              "font-size:10px;" +
              `color:${prereqsReady ? "#76d68c" : "#e7b35b"};`;

            const cost =
              document.createElement("div");

            cost.textContent =
              `Cost: ${formatResearchCost(definition)}`;

            cost.style.cssText =
              "margin-top:5px;font-size:11px;font-weight:800;" +
              "color:#ffe600;text-shadow:0 0 4px rgba(255,230,0,.3);";

            middle.append(
              prerequisite,
              cost
            );

            const action =
              document.createElement("button");

            action.type =
              "button";

            if (purchased) {
              action.textContent =
                "RESEARCHED";

              action.disabled =
                true;

              action.style.cssText =
                "padding:8px 10px;border:1px solid #347a49;" +
                "background:#132819;color:#76d68c;" +
                "font-size:10px;font-weight:900;cursor:default;";
            } else if (!prereqsReady) {
              action.textContent =
                "LOCKED";

              const missingPrerequisite =
                prereqIds.find(
                  id => !isResearchComplete(id)
                );

              action.title =
                prereqNames.length
                  ? `Requires ${prereqNames.join(", ")}. Click to locate missing vanilla research.`
                  : "Prerequisite not met";

              action.style.cssText =
                "padding:8px 10px;border:1px solid #8a6b21;" +
                "background:#241f13;color:#e7b35b;" +
                "font-size:10px;font-weight:900;cursor:pointer;" +
                "text-shadow:0 0 4px rgba(231,179,91,.25);";

              action.addEventListener(
                "click",
                () => {
                  if (missingPrerequisite == null) {
                    return;
                  }

                  restoreNative();

                  const buttons =
                    Array.from(
                      document.querySelectorAll("button")
                    );

                  const techTreeButton =
                    buttons.find(
                      button =>
                        (button.textContent || "")
                          .trim()
                          .toLowerCase() ===
                        "tech tree"
                    );

                  techTreeButton?.click();

                  const missingLabel =
                    getPrerequisiteLabel(
                      missingPrerequisite
                    );

                  setTimeout(
                    () =>
                      highlightVanillaPrerequisite(
                        missingPrerequisite,
                        missingLabel
                      ),
                    120
                  );
                }
              );
            } else {
              action.textContent =
                "RESEARCH";

              action.style.cssText =
                "padding:8px 10px;border:1px solid #ffe600;" +
                "background:#171700;color:#ffe600;" +
                "font-size:10px;font-weight:900;cursor:pointer;" +
                "text-shadow:0 0 5px rgba(255,230,0,.35);";

              action.addEventListener(
                "click",
                () => {
                  const bought =
                    purchaseModResearch(item);

                  if (bought) {
                    renderPanel();

                    try {
                      sandkit.engine.api.ui.update(
                        sandkit.state,
                        "hotbar"
                      );
                    } catch (_) {}
                  } else {
                    action.textContent =
                      "CAN'T BUY";

                    setTimeout(
                      () => renderPanel(),
                      700
                    );
                  }
                }
              );
            }

            card.append(
              left,
              middle,
              action
            );

            section.appendChild(
              card
            );
          }

          wrap.appendChild(section);
        }

        if (!shown) {
          const empty = document.createElement("div");
          empty.textContent =
            lastNativeScanCount < 0
              ? "Native tech discovery API unavailable. Check framework patch status."
              : `No compatible mod research has registered yet. Mod definitions scanned: ${lastNativeScanCount} • tagged: ${lastTaggedScanCount}`;
          empty.style.cssText =
            "padding:34px;text-align:center;color:#94a3b8;" +
            "border:1px dashed #475569;";
          wrap.appendChild(empty);
        }

        panel.appendChild(wrap);

        /*
         * Footer belongs to the panel viewport, not the scrolling content.
         * Keeping it outside `wrap` makes it stay pinned bottom-right while
         * the research list scrolls underneath it.
         */
        const footer = document.createElement("div");
        footer.textContent =
          `Mod Research Framework v${FRAMEWORK_VERSION}  •  by BigTexas`;
        footer.style.cssText =
          "position:absolute;right:12px;bottom:10px;z-index:30;" +
          "padding:3px 6px;border-radius:3px;" +
          "background:rgba(4,10,16,.72);" +
          "font-size:10px;font-weight:700;letter-spacing:.04em;" +
          "color:#7f8b99;pointer-events:none;user-select:none;" +
          "text-shadow:0 0 4px rgba(90,160,255,.15);";
        panel.appendChild(footer);

        if (previousScrollTop > 0) {
          requestAnimationFrame(() => {
            wrap.scrollTop =
              previousScrollTop;
          });
        }
      }

      function restoreNative() {
        active = false;

        if (panel) panel.style.display = "none";
        if (nativeContent) nativeContent.style.display = "";

        styleModsButton(false);
      }

      function activateMods(tabs) {
        const found = findViewport(tabs);

        if (!nativeContent || !nativeContent.isConnected) {
          nativeContent = found.viewport;
        }

        if (!panel || !panel.isConnected) {
          panel = document.createElement("div");
          panel.dataset.modResearchFrameworkPanel = "1";

          if (nativeContent?.parentElement) {
            /*
             * Insert exactly where the native tree viewport lives so the
             * Mods page occupies the same box, not a lower/smaller panel.
             */
            panel.style.cssText =
              "box-sizing:border-box;width:100%;height:100%;min-height:0;overflow:hidden;";
            nativeContent.parentElement.insertBefore(panel, nativeContent.nextSibling);
          } else {
            panel.style.cssText =
              "box-sizing:border-box;width:100%;min-height:420px;overflow:hidden;";
            found.shell?.appendChild(panel);
          }
        }

        active = true;

        if (nativeContent) nativeContent.style.display = "none";
        panel.style.display = "";

        /*
         * Mirror the native viewport dimensions if React gave the tree a
         * fixed-size box.
         */
        if (nativeContent) {
          const r = nativeContent.getBoundingClientRect();
          if (r.width > 0) panel.style.width = `${r.width}px`;
          if (r.height > 0) panel.style.height = `${r.height}px`;
        }

        styleModsButton(true);
        renderPanel();
      }

      function install() {
        const ui = findResearchUi();
        if (!ui) {
          restoreNative();
          return;
        }

        if (!mountedButton || !mountedButton.isConnected) {
          /*
           * Clone a real native tab button rather than hand-styling one.
           * This fixes the old alpha tab appearing smaller and lower.
           */
          mountedButton = ui.anchor.cloneNode(false);
          mountedButton.type = "button";
          mountedButton.textContent = "Mods";
          mountedButton.dataset.modResearchFrameworkTab = "1";
          mountedButton.removeAttribute("aria-selected");

          styleModsButton(false);

          mountedButton.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            activateMods(ui.tabs);
          });

          /*
           * Put Mods directly after Conservatory using the same parent row.
           */
          const after = ui.conservatoryButton || ui.techButton;
          after.insertAdjacentElement("afterend", mountedButton);

          for (const nativeButton of [ui.techButton, ui.conservatoryButton]) {
            if (!nativeButton) continue;
            nativeButton.addEventListener("click", restoreNative);
          }
        }

      }

      const disposePanelRefresh = onChange(() => {
        /*
         * Refresh only because framework data changed, not because arbitrary DOM
         * changed. This keeps registration live without creating an observer loop.
         */
        if (active && panel?.isConnected) {
          renderPanel();
        }
      });

      /*
       * IMPORTANT:
       * Do not render the Mods panel from the MutationObserver path.
       * renderPanel() itself mutates the DOM. In v0.1.2 that caused:
       *
       * observer -> install -> renderPanel -> observer -> install -> ...
       *
       * which pegged the main thread as soon as Mods was clicked.
       */
      function scheduleInstall() {
        if (installScheduled) return;
        installScheduled = true;

        requestAnimationFrame(() => {
          installScheduled = false;
          install();
        });
      }

      const observer = new MutationObserver(records => {
        /*
         * Ignore mutations generated entirely inside our own panel.
         * Those are expected whenever the framework refreshes its index.
         */
        const externalMutation = records.some(record => {
          const target = record.target;
          return !(panel && (target === panel || panel.contains(target)));
        });

        if (externalMutation) {
          scheduleInstall();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      /*
       * A slow safety poll is enough for window open/close edge cases.
       * It no longer redraws the Mods page.
       */
      const timer = setInterval(install, 1000);
      install();

      return () => {
        observer.disconnect();
        clearInterval(timer);
        disposePanelRefresh();
        restoreNative();
        mountedButton?.remove();
        panel?.remove();
      };
    }, []);

    return null;
  }
  try {
    api.ui.inject("mod-research-framework-controller", ModsTabController);
  } catch (error) {
    console.warn("[Mod Research Framework] Mods tab controller could not mount:", error);
  }

  console.log(
    `[Mod Research Framework v${FRAMEWORK_VERSION}] API v${API_VERSION} ready. ` +
    "No native patches."
  );
})();