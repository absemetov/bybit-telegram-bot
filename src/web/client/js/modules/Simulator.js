import { Templates } from "@js/generated/templates.js";

export class Simulator {
  constructor(app) {
    this.symbol = null;
    this.templates = {
      simulatorSettings: Templates["modals/simulator-settings"],
      optimizerSettings: Templates["modals/optimizer-settings"],
      optimizerResults: Templates["modals/optimizer-results"],
    };
    this.app = app;
    this.isRunning = false;
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2);
    this.fees = 0.2;
    //settings
    this.defaultSettings = {
      startDate: twoMonthsAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
      deposit: 5000,
      balance: 5000,
      size: 5000,
      speed: 1000,
      part: 0,
      tp: 3,
      sl: -1,
      candlesCount: 6,
      touchCount: 3,
      tolerance: 0.15,
      triggersCount: 6,
      autoLong: false,
      autoShort: false,
      autoTp: false,
      autoPart: false,
      sound: false,
      result: null,
      breakeven: 0,
      trailing: 0,
      candlesPart: 5,
    };
    this.longPosition = {
      size: 0,
    };
    this.shortPosition = {
      size: 0,
    };
    this.stats = {
      profitableTrades: 0,
      lossTrades: 0,
      pnl: 0,
      lossPrcnt: 0,
      profPrcnt: 0,
      loss: 0,
      prof: 0,
    };
    //this.historicalCandles = [];
    this.candleIndex = 0;
    this.trades = [];
    this._stopOptimization = false;
    this.longTriggers = {};
    this.shortTriggers = {};
    this.longSilentTriggers = {};
    this.shortSilentTriggers = {};
  }
  //save to LS
  saveField(key, value) {
    try {
      const saved = this.loadSettings() || {};
      saved[key] = value;
      localStorage.setItem(
        `sim_settings_${this.app.state.get("symbol")}`,
        JSON.stringify(saved),
      );
    } catch (e) {
      console.warn(`[Simulator] Could not save field "${key}"`, e);
    }
  }
  saveSettings(settings) {
    try {
      localStorage.setItem(
        `sim_settings_${this.app.state.get("symbol")}`,
        JSON.stringify(settings),
      );
    } catch (e) {
      console.warn("[Simulator] Could not save settings to localStorage", e);
    }
  }
  // load from localStorage
  loadSettings() {
    try {
      const saved = localStorage.getItem(
        `sim_settings_${this.app.state.get("symbol")}`,
      );
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("[Simulator] Could not load settings from localStorage", e);
      return null;
    }
  }
  //Opt save settings
  _loadOptimizerSettings() {
    try {
      const saved = localStorage.getItem("optimizer_settings");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  _saveOptimizerSettings(settings) {
    try {
      localStorage.setItem("optimizer_settings", JSON.stringify(settings));
    } catch (e) {
      console.warn("[UI] Could not save optimizer settings", e);
    }
  }
  // Обновлённый getDefaultConfig – сначала пытается загрузить сохранённые
  getDefaultConfig() {
    const saved = this.loadSettings();
    if (saved) {
      return {
        startDate: saved.startDate ?? this.defaultSettings.startDate,
        endDate: saved.endDate ?? this.defaultSettings.endDate,
        deposit: saved.deposit ?? this.defaultSettings.deposit,
        balance: saved.balance ?? this.defaultSettings.balance,
        size: saved.size ?? this.defaultSettings.size,
        speed: saved.speed ?? this.defaultSettings.speed,
        part: saved.part ?? this.defaultSettings.part,
        tp: saved.tp ?? this.defaultSettings.tp,
        sl: saved.sl ?? this.defaultSettings.sl,
        candlesCount: saved.candlesCount ?? this.defaultSettings.candlesCount,
        touchCount: saved.touchCount ?? this.defaultSettings.touchCount,
        tolerance: saved.tolerance ?? this.defaultSettings.tolerance,
        triggersCount: saved.triggersCount ?? this.defaultSettings.triggersCount,
        candlesPart: saved.candlesPart ?? this.defaultSettings.candlesPart,
        autoLong: saved.autoLong ?? this.defaultSettings.autoLong,
        autoShort: saved.autoShort ?? this.defaultSettings.autoShort,
        autoTp: saved.autoTp ?? this.defaultSettings.autoTp,
        autoPart: saved.autoPart ?? this.defaultSettings.autoPart,
        sound: saved.sound ?? this.defaultSettings.sound,
        result: saved.result ?? this.defaultSettings.result,
        breakeven: saved.breakeven ?? this.defaultSettings.breakeven,
        trailing: saved.trailing ?? this.defaultSettings.trailing,
      };
    }

    return this.defaultSettings;
  }
  init() {
    this.app.on("symbolChanged", () => this.updateSimilatorPanel());
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      if (e.code === "KeyO") {
        e.preventDefault();
        this.showSimulatorSettingsModal();
      }
      if (this.app.state.get("chartMode") == "live") return;
      if (e.code === "KeyA") {
        e.preventDefault();
        this.closeAllPositions();
      }
      if (e.code === "KeyS") {
        e.preventDefault();
        this.setTriggers("Long");
      }
      if (e.code === "KeyD") {
        e.preventDefault();
        this.setTriggers("Short");
      }
      if (e.code === "Space") {
        e.preventDefault();
        this.toggle();
      }
      if (e.code === "ArrowRight") {
        e.preventDefault();
        this.tick();
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        this.removeLastCandle();
      }
    });
  }
  //start simulator open form
  showSimulatorSettingsModal() {
    this.app.get("modal").show({
      title: this.app.get("i18n").t("sim_settings"),
      body: this.templates.simulatorSettings(this.getDefaultConfig()),
      size: "md",
      actions: {
        buttons: [
          {
            text: this.app.get("i18n").t("cancel"),
            class: "btn-secondary",
            dismiss: true,
          },
          {
            text: "Opti",
            class: "btn-primary",
            action: "optimize",
          },
          {
            text: "Silent sim",
            class: "btn-primary",
            action: "silent",
          },
          {
            text: this.app.get("i18n").t("start"),
            class: "btn-primary",
            action: "submit",
          },
        ],
        onAction: async (action) => {
          const symbol = this.app.state.get("symbol");
          this.symbol = symbol;
          const form = document.querySelector("#simulatorForm");
          const data = new FormData(form);
          const isValid = form.checkValidity();
          if (isValid) {
            this.defaultSettings = {
              startDate: data.get("startDate"),
              endDate: data.get("endDate"),
              deposit: parseFloat(data.get("deposit")),
              balance: parseFloat(data.get("deposit")),
              size: parseFloat(data.get("size")),
              speed: parseInt(data.get("speed")),
              tp: parseFloat(data.get("tp")),
              part: parseFloat(data.get("part")),
              sl: parseFloat(data.get("sl")),
              candlesCount: parseFloat(data.get("candlesCount")),
              triggersCount: parseFloat(data.get("triggersCount")),
              touchCount: parseFloat(data.get("touchCount")),
              tolerance: parseFloat(data.get("tolerance")),
              candlesPart: parseFloat(data.get("candlesPart")),
              autoLong: !!data.get("autoLong"),
              autoShort: !!data.get("autoShort"),
              autoTp: !!data.get("autoTp"),
              autoPart: !!data.get("autoPart"),
              sound: !!data.get("sound"),
              breakeven: parseFloat(data.get("breakeven")),
              trailing: parseFloat(data.get("trailing")),
              result: null,
            };
            this.saveSettings(this.defaultSettings);
            //load candles
            await this.getCandles();
            if (action === "submit") {
              this.app.get("modal").hide();
              this.startSimulator();
              this.start();
            }
            if (action === "silent") {
              this.startSimulator();
              this.app.get("chart").setChartData(this.app.get("chart").candles);
              this.updateSimilatorPanel();
              this.app.get("chart").markerSeries.setMarkers([]);
              this.runSilentSimulation();
              this.app.get("stats").renderSimulatorTab();
            }
            if (action === "optimize") {
              this.showOptimizerModal();
            }
          } else {
            form.reportValidity();
          }
        },
      },
    });
    // Навешиваем динамический пересчёт
    const form = document.querySelector("#simulatorForm");
    if (!form) return;
    const balanceInput = form.querySelector('[name="deposit"]');
    const posInput = form.querySelector('[name="size"]');
    const slInput = form.querySelector('[name="sl"]');
    const attemptsDisplay = document.getElementById("calculatedAttempts");
    const updateCalculations = () => {
      const balance = parseFloat(balanceInput.value);
      const pos = parseFloat(posInput.value);
      const sl = parseFloat(slInput.value);
      let isValid = true;
      if (isNaN(pos) || pos <= 0) isValid = false;
      if (isNaN(sl) || sl < -100 || sl > 0) isValid = false;
      if (isValid) {
        const risk = pos * ((Math.abs(sl) + this.fees) / 100);
        const attempts = Math.max(1, Math.floor(balance / risk));
        attemptsDisplay.textContent = `${this.app.get("i18n").t("attempts")}: ${attempts},
          ${this.app.get("i18n").t("loss")}1: $${risk.toFixed(2)}`;
      } else {
        attemptsDisplay.textContent = "—";
      }
    };
    balanceInput.addEventListener("input", updateCalculations);
    posInput.addEventListener("input", updateCalculations);
    slInput.addEventListener("input", updateCalculations);
    updateCalculations();
  }
  setTriggers(side, auto) {
    this.app.get("chart").visibleLevels(true);
    const support = this.app
      .get("chart")
      .levelsLines["support"].options().price;
    const resistance = this.app
      .get("chart")
      .levelsLines["resistance"].options().price;
    if (auto) {
      const supportColor = this.app
        .get("chart")
        .levelsLines["support"].options().color;
      const resistanceColor = this.app
        .get("chart")
        .levelsLines["resistance"].options().color;
      if (side === "Long" && supportColor === "green") {
        this.setLongTriggers(support);
      }
      if (side === "Short" && resistanceColor === "red") {  
        this.setShortTriggers(resistance);
      }
      return;
    }
    if (side === "Long") {
      this.setLongTriggers(support);
    } else {  
      this.setShortTriggers(resistance);
    }
  }
  //get Candles
  async getCandles() {
    const { startDate, endDate } = this.getDefaultConfig();
    const symbol = this.app.state.get("symbol");
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    try {
      this.app.get("chart").candles = await this.app
        .get("chart")
        .getCandles(
          symbol,
          this.app.state.get("timeframe"),
          startTime,
          endTime,
        );
    } catch (err) {
      console.error("[Simulator]", err);
      alert("Ошибка загрузки");
    }
  }
  updateLevels(candles) {
    const candlesCount = this.getDefaultConfig().candlesCount || 10;
    const touchCount = this.getDefaultConfig().touchCount || 3;
    const candlesPart = this.getDefaultConfig().candlesPart || 3;
    this.app.get("chart").updateIndicators(candles, candlesCount, touchCount, candlesPart);
  }
  startSimulator() {
    if (this.isRunning) this.stop();
    this.closeAllPositions();
    this.app.state.set("chartMode", "simulator");
    this.candleIndex = 0;
    this.app.get("chart").visibleTriggers(false);
    this.app.get("chart").visiblePositions(false);
    this.app.get("chart").visibleLevels(true);
    this.trades = [];
    this.longPosition = {
      size: 0,
    };
    this.shortPosition = {
      size: 0,
    };
    this.stats = {
      profitableTrades: 0,
      lossTrades: 0,
      pnl: 0,
      lossPrcnt: 0,
      profPrcnt: 0,
      loss: 0,
      prof: 0,
    };
    this.saveField("result", null);
    this.updateLevels(this.app.get("chart").candles);
  }
  //render panel
  updateSimilatorPanel() {
    const panels = document.querySelectorAll(".simulator-panel");
    if (!panels.length) return;
    const { balance } = this.getDefaultConfig();
    panels.forEach((panel) => {
      panel.innerHTML = `
        <div class="btn-group btn-group-sm d-flex flex-wrap">
          ${
            this.app.state.get("chartMode") == "simulator"
              ? `
            <div class="d-flex align-items-center mx-2 mt-2 fw-bold">
              <h5>${balance.toFixed(1)}$</h5>
            </div>
            <div class="d-flex flex-wrap align-items-center gap-2">
              <button class="btn btn-sm" data-action="openSimulatorSettings" title="${this.app.get("i18n").t("retest")}">🔄</button>
            ${
              this.isRunning
                ? `<button class="btn btn-sm" data-action="stopSimulator" title="${this.app.get("i18n").t("pause")}">⏸</button>`
                : `<button class="btn btn-sm" data-action="startSimulator" title="${this.app.get("i18n").t("resume")}">⏯</button>`
            }
            <button class="btn btn-sm" data-action="resetSimulator" title="${this.app.get("i18n").t("reset")}">⏹</button>
            <button class="btn btn-sm btn-success" data-action="openSimulatorLong">Long</button>
            <button class="btn btn-sm btn-danger" data-action="openSimulatorShort">Short</button>
            <button class="btn btn-sm" data-action="closeAll">CloseAll</button>
          </div>
          <div class="btn-group btn-group-sm d-flex flex-wrap">
            <button class="btn btn-sm" data-action="deleteCandleSimulator" title="${this.app.get("i18n").t("prev")}">⏪</button>
            <button class="btn btn-sm" data-action="tickSimulator" title="${this.app.get("i18n").t("next")}">⏩</button>`
              : `<button class="btn btn-sm" data-action="openSimulatorSettings">▶️ ${this.app.get("i18n").t("start")}</button>
            </div>`
          }
        </div>`;
    });
  }
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.app.get("chart").markerSeries.setMarkers([]);
      this.intervalId = setInterval(
        () => this.tick(),
        this.getDefaultConfig().speed,
      );
      this.app.emit("simulator:started");
      this.app.get("sound").play("start");
    }
  }
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.updateSimilatorPanel();
    this.app.emit("simulator:stopped");
    this.app.get("sound").play("stop");
  }
  toggle() {
    this.isRunning ? this.stop() : this.start();
  }
  //close Simulator
  close() {
    if (!confirm(this.app.get("i18n").t("sim_confirm_close"))) return;
    this.stop();
    //this.historicalCandles = [];
    this.candleIndex = 0;
    this.trades = [];
    this.app.state.set("chartMode", "live");
    this.updateSimilatorPanel();
    this.app
      .get("chart")
      .load(this.app.state.get("symbol"), this.app.state.get("timeframe"));
    this.app.get("chart").visibleTriggers(true);
    this.app.get("chart").visiblePositions(true);
    this.app.get("chart").visibleLevels(true);
    this.app.emit("simulator:reset");
  }

  tick() {
    if (this.getDefaultConfig().balance < 0) {
      this.saveField(
        "result",
        `Liquidation ${this.getDefaultConfig().balance.toFixed(1)} < 0`,
      );
      this.showSimulatorSettingsModal();
      this.stop();
      return;
    }
    if (this.candleIndex >= this.app.get("chart").candles.length) {
      this.stop();
      this.saveField(
        "result",
        `${this.app.get("i18n").t("sim_result")} P&L: ${this.stats.pnl.toFixed(2)} USDT`,
      );
      this.showSimulatorSettingsModal();
      return;
    }
    const candle = this.app.get("chart").candles[this.candleIndex];
    if (this.candleIndex === 0) {
      this.app.get("chart").setChartData([candle]);
    } else {
      this.app.get("chart").candlestickSeries.update(candle);
      this.app.get("chart").volumeSeries.update({
        time: candle.time,
        value: candle.volume,
        color: candle.close > candle.open ? "#26A69A" : "#EF5350",
      });
    }
    if (this.getDefaultConfig().sound) this.app.get("sound").play("tick");
    //update Levels
    this.candleIndex++;
    const { autoLong, autoShort } = this.getDefaultConfig();
    const candles = this.app.get("chart").candles.slice(0, this.candleIndex);
    this.updateLevels(candles);
    if (autoLong) this.setTriggers("Long", true);
    if (autoShort) this.setTriggers("Short", true);
    this._checkPositions(candle);
  }
  //delete last candle
  removeLastCandle() {
    if (this.candleIndex > 0) {
      this.candleIndex--;
      if (this.getDefaultConfig().sound) this.app.get("sound").play("tick");
    }
    const visibleCandles = this.app.get("chart").candles.slice(0, this.candleIndex);
    this.app.get("chart").setChartData(visibleCandles);
    //update Levels
    this.updateLevels(visibleCandles);
  }
  //positions
  closeAllPositions() {
    for (const line of [
      ...Object.values(this.longTriggers),
      ...Object.values(this.shortTriggers),
      ...Object.values(this.app.get("chart").longLines),
      ...Object.values(this.app.get("chart").shortLines),
    ]) {
      line.applyOptions({
        lineVisible: false,
        axisLabelVisible: false,
      });
    }
    this.longPosition.size = 0;
    this.shortPosition.size = 0;
  }
  //first set Triggers
  setLongTriggers(support) {
    const { tolerance, triggersCount } = this.getDefaultConfig();
    //first delete old price lines
    Object.values(this.longTriggers).forEach((item) => {
      this.app.get("chart").candlestickSeries.removePriceLine(item);
    });
    this.longTriggers = {};
    this.longTriggers["enter1"] = this.app.get("chart").candlestickSeries.createPriceLine({
      price: support * (1 + (tolerance * 2) / 100),
      color: "black",
      lineWidth: 2,
      lineStyle: 1,
      lineVisible: true,
      axisLabelVisible: true,
    });
    this.longTriggers["enter2"] = this.app.get("chart").candlestickSeries.createPriceLine({
      price: support * (1 + tolerance / 100),
      color: "black",
      lineWidth: 2,
      lineStyle: 1,
      lineVisible: true,
      axisLabelVisible: true,
    });
    this.longTriggers["enter3"] = this.app.get("chart").candlestickSeries.createPriceLine({
      price: support,
      color: "black",
      lineWidth: 2,
      lineStyle: 1,
      lineVisible: true,
      axisLabelVisible: true,
    });
    let index = 1;
    for (let i = 4; i <= triggersCount; i++) {
      this.longTriggers[`enter${i}`] = this.app.get("chart").candlestickSeries.createPriceLine({
        price: support * (1 - (tolerance * index++) / 100),
        color: "black",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: true,
        axisLabelVisible: true,
      });
    }
  }
  setLongParams(entryPrice) {
    const { tp = 2, sl = -0.5, part = 0 } = this.getDefaultConfig();
    this.app.get("chart").longLines["enter"].applyOptions({
      color: "black",
      price: entryPrice,
      lineVisible: true,
      title: "Long",
      axisLabelVisible: true,
    });
    this.app.get("chart").longLines["sl"].applyOptions({
      color: "black",
      price: entryPrice * (1 - Math.abs(sl) / 100),
      lineVisible: true,
      title: `Long SL${sl}%`,
      axisLabelVisible: true,
    });
    if (part > 0) {
      this.app.get("chart").longLines["part"].applyOptions({
        color: "black",
        price: entryPrice * (1 + part / 100),
        lineVisible: true,
        title: `Long Part ${part}%`,
        axisLabelVisible: true,
      });
    }
    this.app.get("chart").longLines["tp"].applyOptions({
      color: "black",
      price: entryPrice * (1 + tp / 100),
      lineVisible: true,
      title: `Long TP ${tp}%`,
      axisLabelVisible: true,
    });
  }
  //Silent simulator
  setLongTriggerSilent(entryPrice, config) {
    const { tolerance, triggersCount } = config;
    //first delete old price lines
    this.longSilentTriggers = {};
    this.longSilentTriggers["enter1"] = {
      color: "black",
      price: entryPrice * (1 + (tolerance * 2) / 100),
    };
    this.longSilentTriggers["enter2"] = {
      color: "black",
      price: entryPrice * (1 + tolerance / 100),
    };
    this.longSilentTriggers["enter3"] = {
      color: "black",
      price: entryPrice,
    };
    let index = 1;
    for (let i = 4; i <= triggersCount; i++) {
      this.longSilentTriggers[`enter${i}`] = {
        color: "black",
        price: entryPrice * (1 - tolerance * index++ / 100),
      };
    }
  }
  setLongParamsSilent(entryPrice, config) {
    const { tp = 2, sl = -0.5, part = 0 } = config;
    this.longPosition["sl"] = {
      color: "black",
      price: entryPrice * (1 - Math.abs(sl) / 100),
    };
    if (part > 0) {
      this.longPosition["part"] = {
        color: "black",
        price: entryPrice * (1 + part / 100),
      };
    }
    this.longPosition["tp"] = {
      color: "black",
      price: entryPrice * (1 + tp / 100),
    };
  }
  setShortTriggers(resistance) {
    const { tolerance, triggersCount } = this.getDefaultConfig();
    //first delete old price lines
    Object.values(this.shortTriggers).forEach((item) => {
      this.app.get("chart").candlestickSeries.removePriceLine(item);
    });
    this.shortTriggers = {};
    this.shortTriggers["enter1"] = this.app.get("chart").candlestickSeries.createPriceLine({
      price: resistance * (1 - (tolerance * 2) / 100),
      color: "black",
      lineWidth: 2,
      lineStyle: 1,
      lineVisible: true,
      axisLabelVisible: true,
    });
    this.shortTriggers["enter2"] = this.app.get("chart").candlestickSeries.createPriceLine({
      price: resistance * (1 - tolerance / 100),
      color: "black",
      lineWidth: 2,
      lineStyle: 1,
      lineVisible: true,
      axisLabelVisible: true,
    });
    this.shortTriggers["enter3"] = this.app.get("chart").candlestickSeries.createPriceLine({
      price: resistance,
      color: "black",
      lineWidth: 2,
      lineStyle: 1,
      lineVisible: true,
      axisLabelVisible: true,
    });
    let index = 1;
    for (let i = 4; i <= triggersCount; i++) {
      this.shortTriggers[`enter${i}`] = this.app.get("chart").candlestickSeries.createPriceLine({
        price: resistance * (1 + tolerance * index++ / 100),
        color: "black",
        lineWidth: 2,
        lineStyle: 1,
        lineVisible: true,
        axisLabelVisible: true,
      });
    }
  }
  setShortParams(entryPrice) {
    //if (this.shortPosition.size > 0) return;
    const { tp = 2, sl = -0.5, part = 0 } = this.getDefaultConfig();
    this.app.get("chart").shortLines["enter"].applyOptions({
      color: "black",
      price: entryPrice,
      lineVisible: true,
      title: "Short",
      axisLabelVisible: true,
    });
    this.app.get("chart").shortLines["sl"].applyOptions({
      color: "black",
      price: entryPrice * (1 + Math.abs(sl) / 100),
      lineVisible: true,
      title: `Short SL${sl}%`,
      axisLabelVisible: true,
    });
    if (part > 0) {
      this.app.get("chart").shortLines["part"].applyOptions({
        color: "black",
        price: entryPrice * (1 - part / 100),
        lineVisible: true,
        title: `Short Part ${part}%`,
        axisLabelVisible: true,
      });
    }
    this.app.get("chart").shortLines["tp"].applyOptions({
      color: "black",
      price: entryPrice * (1 - tp / 100),
      lineVisible: true,
      title: `Short TP${tp}%`,
      axisLabelVisible: true,
    });
  }
  setShortTriggerSilent(entryPrice, config) {
    const { tolerance, triggersCount } = config;
    //first delete old price lines
    this.shortSilentTriggers = {};
    this.shortSilentTriggers["enter1"] = {
      color: "black",
      price: entryPrice * (1 - (tolerance * 2) / 100),
    };
    this.shortSilentTriggers["enter2"] = {
      color: "black",
      price: entryPrice * (1 - tolerance / 100),
    };
    this.shortSilentTriggers["enter3"] = {
      color: "black",
      price: entryPrice,
    };
    let index = 1;
    for (let i = 4; i <= triggersCount; i++) {
      this.shortSilentTriggers[`enter${i}`] = {
        color: "black",
        price: entryPrice * (1 + tolerance * index++ / 100),
      };
    }
  }
  setShortParamsSilent(entryPrice, config) {
    const { tp = 2, sl = -0.5, part = 0 } = config;
    this.shortPosition["sl"] = {
      color: "black",
      price: entryPrice * (1 + Math.abs(sl) / 100),
    };
    if (part > 0) {
      this.shortPosition["part"] = {
        color: "black",
        price: entryPrice * (1 - part / 100),
      };
    }
    this.shortPosition["tp"] = {
      color: "black",
      price: entryPrice * (1 - tp / 100),
    };
  }
  //calc Stats
  calcStats(trade) {
    this.stats.pnl += trade.closedPnl;
    const changePrcnt =
      ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) *
      100 *
      (trade.side === "Buy" ? -1 : 1);
    if (trade.closedPnl > 0) {
      this.stats.profitableTrades += 1;
      this.stats.profPrcnt += changePrcnt;
      this.stats.prof += trade.closedPnl;
    } else {
      this.stats.lossTrades += 1;
      this.stats.lossPrcnt += changePrcnt;
      this.stats.loss += trade.closedPnl;
    }
  }
  //calc positions
  _checkPositions(candle) {
    //candle colors
    const candleUp = candle.close > candle.open;
    //levels
    const { autoTp, autoPart, breakeven, trailing, triggersCount } = this.getDefaultConfig();
    const support = this.app
      .get("chart")
      .levelsLines["support"].options().price;
    const resistance = this.app
      .get("chart")
      .levelsLines["resistance"].options().price;
    const colorS =
      this.app.get("chart").levelsLines["support"].options().color === "green";
    const colorR =
      this.app.get("chart").levelsLines["resistance"].options().color === "red";
    //calc pnl
    this.longPosition.markPrice = candle.low;
    this.shortPosition.markPrice = candle.high;
    //LONG
    for (const [name, line] of Object.entries(this.longTriggers)) {
      const price = line.options().price;
      const color = line.options().color;
      const visible = line.options().lineVisible;
      //open position
      if (
        visible &&
        price <= candle.high &&
        price >= candle.low &&
        color === "black"
      ) {
        //position opened
        if (this.getDefaultConfig().sound) this.app.get("sound").play("open");
        const { size } = this.getDefaultConfig();
        if (this.longPosition.size === 0) {
          line.applyOptions({
            color: "green",
          });
          this.longPosition.size = size / triggersCount;
          this.longPosition.entryPrice = price;
          this.longPosition.createdTime = candle.time * 1000;
        } else {
          if (this.longPosition.size < size) {
            line.applyOptions({
              color: "green",
            });
            this.longPosition.size = this.longPosition.size + size / triggersCount;
            // avg enter price
            const greenTriggers = Object.values(this.longTriggers).filter((t) => t.options().color === "green");
            const sum = greenTriggers.reduce((acc, t) => acc + (t.options().price || 0), 0);
            this.longPosition.entryPrice = sum / greenTriggers.length;
          }
        }
        this.setLongParams(this.longPosition.entryPrice);
      }
    }
    for (const [name, line] of Object.entries(this.app.get("chart").longLines)) {
      //autoTp Part
      if (name === "part" && this.longPosition.size > 0 && colorR && autoPart) {
        const { entryPrice } = this.longPosition;
        if (resistance > entryPrice)
          line.applyOptions({
            price: resistance,
          });
      }
      //autoTp Tp
      if (name === "tp" && this.longPosition.size > 0 && colorR && autoTp) {
        const { entryPrice } = this.longPosition;
        if (resistance > entryPrice)
          line.applyOptions({
            price: resistance,
          });
      }
      const price = line.options().price;
      const color = line.options().color;
      const visible = line.options().lineVisible;
      //breakeven
      if (name === "sl" && this.longPosition.size > 0) {
        const { entryPrice, markPrice } = this.longPosition;
        const pnl = ((markPrice - entryPrice) / entryPrice) * 100;
        if (breakeven !== 0 && pnl > breakeven) {
          const newStopLoss = markPrice * (1 - trailing / 100);
          if (((newStopLoss - price) / price) * 100 > 0.1) {
            line.applyOptions({
              price: newStopLoss,
            });
            this.app.get("chart").longLines["tp"].applyOptions({
              price: markPrice * (1 + (breakeven * 3) / 100),
            });
          }
        }
      }
      //check position
      if (
        visible &&
        this.longPosition.size > 0 &&
        color === "black" &&
        price <= candle.high &&
        price >= candle.low
      ) {
        const { entryPrice, createdTime } = this.longPosition;
        //sl
        if (name === "sl") {
          if (this.getDefaultConfig().sound) this.app.get("sound").play("sl");
          const sl = ((price - entryPrice) / entryPrice) * 100;
          const stopLoss = sl - this.fees;
          const loss = (this.longPosition.size * stopLoss) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + loss);
          line.applyOptions({
            color: "red",
          });
          //trades history
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime,
            side: "Sell",
            size: this.longPosition.size,
            exitPrice: price,
            entryPrice,
            closedPnl: loss,
            trigger: "sl",
          };
          this.trades.push(trade);
          this.calcStats(trade);
          this.longPosition = {
            size: 0,
          };
        }
        if (name === "part" && candleUp) {
          if (this.getDefaultConfig().sound) this.app.get("sound").play("tp");
          const part = ((price - entryPrice) / entryPrice) * 100;
          const partF = part - this.fees;
          this.longPosition.size = this.longPosition.size / 2;
          const take = (this.longPosition.size * partF) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + take);
          line.applyOptions({
            color: "green",
          });
          //trades history
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime,
            side: "Sell",
            size: this.longPosition.size,
            exitPrice: price,
            entryPrice,
            closedPnl: take,
            trigger: "part",
          };
          this.trades.push(trade);
          this.calcStats(trade);
        }
        if (name === "tp" && candleUp) {
          //close position
          if (this.getDefaultConfig().sound) this.app.get("sound").play("tp");
          const tp = ((price - entryPrice) / entryPrice) * 100;
          const tpF = tp - this.fees;
          const take2 = (this.longPosition.size * tpF) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + take2);
          line.applyOptions({
            color: "red",
          });
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime,
            side: "Sell",
            size: this.longPosition.size,
            exitPrice: price,
            entryPrice,
            closedPnl: take2,
            trigger: "tp",
          };
          this.trades.push(trade);
          this.calcStats(trade);
          this.longPosition = {
            size: 0,
          };
        }
      }
    }
    //check Short
    for (const [name, line] of Object.entries(this.shortTriggers)) {
      const price = line.options().price;
      const color = line.options().color;
      const visible = line.options().lineVisible;
      if (
        visible &&
        price <= candle.high &&
        price >= candle.low &&
        color === "black"
      ) {
        //position opened
        if (this.getDefaultConfig().sound) this.app.get("sound").play("open");
        const { size } = this.getDefaultConfig();
        if (this.shortPosition.size === 0) {
          line.applyOptions({
            color: "green",
          });
          this.shortPosition.size = size / triggersCount;
          this.shortPosition.entryPrice = price;
          this.shortPosition.createdTime = candle.time * 1000;
        } else {
          if (this.shortPosition.size < size) {
            line.applyOptions({
              color: "green",
            });
            this.shortPosition.size = this.shortPosition.size + size / triggersCount;
            const greenTriggers = Object.values(this.shortTriggers).filter((t) => t.options().color === "green");
            const sum = greenTriggers.reduce((acc, t) => acc + (t.options().price || 0), 0);
            this.shortPosition.entryPrice =
              (this.shortPosition.entryPrice + price) / 2;
          }
        }
        this.setShortParams(this.shortPosition.entryPrice);
      }
    }
    for (const [name, line] of Object.entries(this.app.get("chart").shortLines)) {
      //autoPart Short
      if (
        name === "part" &&
        this.shortPosition.size > 0 &&
        colorS &&
        autoPart
      ) {
        const { entryPrice } = this.shortPosition;
        if (support < entryPrice)
          line.applyOptions({
            price: support,
          });
      }
      //autoTp
      if (name === "tp" && this.shortPosition.size > 0 && colorS && autoTp) {
        const { entryPrice } = this.shortPosition;
        if (support < entryPrice)
          line.applyOptions({
            price: support,
          });
      }
      const price = line.options().price;
      const color = line.options().color;
      const visible = line.options().lineVisible;
      //breakeven
      if (name === "sl" && this.shortPosition.size > 0) {
        const { entryPrice, markPrice } = this.shortPosition;
        const pnl = ((markPrice - entryPrice) / entryPrice) * 100 * -1;
        if (breakeven !== 0 && pnl > breakeven) {
          const newStopLoss = markPrice * (1 + trailing / 100);
          if (((newStopLoss - price) / price) * 100 < -0.1) {
            line.applyOptions({
              price: newStopLoss,
            });
            this.app.get("chart").shortLines["tp"].applyOptions({
              price: markPrice * (1 - (breakeven * 3) / 100),
            });
          }
        }
      }
      //check positions
      if (
        visible &&
        this.shortPosition.size > 0 &&
        color === "black" &&
        price <= candle.high &&
        price >= candle.low
      ) {
        const { entryPrice, createdTime } = this.shortPosition;
        if (name === "sl") {
          //close position
          if (this.getDefaultConfig().sound) this.app.get("sound").play("sl");
          const sl = ((price - entryPrice) / entryPrice) * 100 * -1;
          const stopLoss = sl - this.fees;
          const loss = (this.shortPosition.size * stopLoss) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + loss);
          line.applyOptions({
            color: "red",
          });
          //trades history
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime,
            side: "Buy",
            size: this.shortPosition.size,
            exitPrice: price,
            entryPrice,
            closedPnl: loss,
            trigger: "sl",
          };
          this.trades.push(trade);
          this.calcStats(trade);
          this.shortPosition = {
            size: 0,
          };
        }
        if (name === "part" && !candleUp) {
          if (this.getDefaultConfig().sound) this.app.get("sound").play("tp");
          const part = ((price - entryPrice) / entryPrice) * 100 * -1;
          const partF = part - this.fees;
          this.shortPosition.size = this.shortPosition.size / 2;
          const take = (this.shortPosition.size * partF) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + take);
          line.applyOptions({
            color: "green",
          });
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime: createdTime,
            side: "Buy",
            size: this.shortPosition.size,
            exitPrice: price,
            entryPrice: entryPrice,
            closedPnl: take,
            trigger: "part",
          };
          this.trades.push(trade);
          this.calcStats(trade);
        }
        if (name === "tp" && !candleUp) {
          //close position
          if (this.getDefaultConfig().sound) this.app.get("sound").play("tp");
          const tp = ((price - entryPrice) / entryPrice) * 100 * -1;
          const tpF = tp - this.fees;
          const take2 = (this.shortPosition.size * tpF) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + take2);
          line.applyOptions({
            color: "red",
          });
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime,
            side: "Buy",
            size: this.shortPosition.size,
            exitPrice: price,
            entryPrice: entryPrice,
            closedPnl: take2,
            trigger: "tp",
          };
          this.trades.push(trade);
          this.calcStats(trade);
          this.shortPosition = {
            size: 0,
          };
        }
      }
    }
    this.updateSimilatorPanel();
    this.app.get("stats").renderSimulatorTab();
  }
  // Вспомогательная рекурсивная функция для генерации комбинаций
  generateCombinations(paramRanges, isValid) {
    const keys = Object.keys(paramRanges);
    const result = [];

    function dfs(index, current) {
      if (index === keys.length) {
        if (isValid(current)) {
          result.push({ ...current });
        }
        return;
      }
      const key = keys[index];
      const values = paramRanges[key];
      for (const value of values) {
        current[key] = value;
        dfs(index + 1, current);
      }
    }

    dfs(0, {});
    return result;
  }
  //Optimizer
  async runOptimization(ranges = {}) {
    if (this.isOptimizing) {
      console.warn("[Simulator] Optimization already in progress.");
      alert("[Simulator] Optimization already in progress");
      return null;
    }
    const { autoLong, autoShort } = this.getDefaultConfig();
    if (!autoLong && !autoShort) {
      alert("[Simulator] Please set autoLong or autoShort");
      return null;
    }
    // Фильтруем нелогичные комбинации: TP должно быть > SL, Part должен быть < TP (если >0),
    // breakeven должен быть > trailing, если оба > 0
    const paramRanges = {};
    if (ranges.tpValues) paramRanges.tp = ranges.tpValues;
    if (ranges.slValues) paramRanges.sl = ranges.slValues;
    if (ranges.partValues) paramRanges.part = ranges.partValues;
    if (ranges.breakValues) paramRanges.breakeven = ranges.breakValues;
    if (ranges.trailingValues) paramRanges.trailing = ranges.trailingValues;
    if (ranges.candlesCount) paramRanges.candlesCount = ranges.candlesCount;
    if (ranges.touchCount) paramRanges.touchCount = ranges.touchCount;

    // Если ни один параметр не выбран, оптимизация бессмысленна
    if (Object.keys(paramRanges).length === 0) {
      alert("Выберите хотя бы один параметр для оптимизации.");
      return null;
    }
    const isValid = (combo) => {
      if (combo.tp <= combo.part) return false;
      if (combo.candlesCount < combo.touchCount) return false;
      if (combo.touchCount < 2) return false;
      if (combo.candlesCount < 2) return false;
      if (combo.trailing === 0) return false;
      if (combo.breakeven === 0 && combo.trailing >= 0) return false;
      return true;
    };

    const validCombos = this.generateCombinations(paramRanges, isValid);
    const totalCombinations = validCombos.length;
    let bestPnlCombo = null,
      bestPnl = -Infinity;
    let bestSharpeCombo = null,
      bestSharpe = -Infinity;
    let bestSortinoCombo = null,
      bestSortino = -Infinity;
    let completed = 0;
    this.isOptimizing = true;
    this._stopOptimization = false;
    this.app.emit("optimization:start", { total: totalCombinations });
    this.app.emit("optimization:progress", {
      completed,
      total: totalCombinations,
    });
    try {
      for (const combo of validCombos) {
        // Проверяем флаг прерывания
        if (this._stopOptimization) {
          console.log("[Simulator] Optimization aborted by user.");
          break;
        }
        const result = this.runSilentSimulation(combo);
        completed++;
        const profitsPercent = result.trades.map((trade) => {
          return (trade.closedPnl / trade.size) * 100 || 0;
        });
        // --- P&L ---
        if (result.pnl > bestPnl) {
          bestPnl = result.pnl;
          const sharpe = this._calcSharpe(profitsPercent);
          const sortino = this._calcSortino(profitsPercent);
          bestPnlCombo = {
            ...combo,
            pnl: result.pnl,
            sharpe,
            sortino,
            tradesCount: result.trades.length,
          };
        }

        // --- Sharpe ---
        const sharpe = this._calcSharpe(profitsPercent);
        if (sharpe > bestSharpe) {
          bestSharpe = sharpe;
          const sortino = this._calcSortino(profitsPercent);
          bestSharpeCombo = {
            ...combo,
            pnl: result.pnl,
            sharpe,
            sortino,
            tradesCount: result.trades.length,
          };
        }
        // --- Sortino ---
        const sortino = this._calcSortino(profitsPercent);
        if (sortino > bestSortino) {
          bestSortino = sortino;
          bestSortinoCombo = {
            ...combo,
            pnl: result.pnl,
            sharpe,
            sortino,
            tradesCount: result.trades.length,
          };
        }
        if (completed % 50 === 0 || completed === totalCombinations) {
          this.app.emit("optimization:progress", {
            completed,
            total: totalCombinations,
          });
        }
        // Даём браузеру шанс обновить интерфейс
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      // Если оптимизация была прервана, не показываем результат
      if (this._stopOptimization) {
        this.app.emit("optimization:aborted");
        this.showOptimizerModal();
        this._stopOptimization = false; // сбрасываем флаг
        return null;
      }
      this._showOptimizationResult(
        bestPnlCombo,
        bestSharpeCombo,
        bestSortinoCombo,
        totalCombinations,
      );
    } finally {
      this.isOptimizing = false;
      this._stopOptimization = false;
    }
  }
  _calcSortino(profits) {
    if (!profits || profits.length === 0) return 0;
    const avg = profits.reduce((sum, p) => sum + p, 0) / profits.length;
    // Downside-отклонения: только отрицательные значения, положительные заменяются нулём
    const downsideVariance =
      profits.reduce((sum, p) => {
        const deviation = p - avg;
        return deviation < 0 ? sum + deviation * deviation : sum;
      }, 0) / profits.length;

    const downsideStdDev = Math.sqrt(downsideVariance);
    if (downsideStdDev === 0) return 0;

    return avg / downsideStdDev;
  }
  //sharpe
  _calcSharpe(profits) {
    if (!profits || profits.length === 0) return 0;

    const avg = profits.reduce((sum, p) => sum + p, 0) / profits.length;

    // Дисперсия (средний квадрат отклонений от среднего)
    const variance =
      profits.reduce((sum, p) => sum + (p - avg) ** 2, 0) / profits.length;
    const stdDev = Math.sqrt(variance);

    // Если стандартное отклонение равно нулю (все сделки с одинаковой прибылью),
    // считаем Шарп равным 0, чтобы избежать деления на ноль.
    if (stdDev === 0) return 0;

    return avg / stdDev;
  }
  //check Silent positions
  _checkPositionsSilent(candle, support, resistance, testConfig) {
    //gren or red candle
    const candleUp = candle.close > candle.open;
    //levels
    const { autoTp, autoPart, breakeven, trailing, size, triggersCount } = testConfig;
    this.longPosition.markPrice = candle.low;
    this.shortPosition.markPrice = candle.high;
    //LONG
    for (const [name, line] of Object.entries(this.longSilentTriggers)) {
      //open position
      const price = line.price;
      const color = line.color;
      if (
        price <= candle.high &&
        price >= candle.low &&
        color === "black"
      ) {
        //position opened
        if (this.longPosition.size === 0) {
          this.longSilentTriggers[name].color = "green";
          this.longPosition.size = size / triggersCount;
          this.longPosition.entryPrice = price;
          this.longPosition.createdTime = candle.time * 1000;
        } else {
          if (this.longPosition.size < size) {
            this.longSilentTriggers[name].color = "green";
            this.longPosition.size = this.longPosition.size + size / triggersCount;
            const greenTriggers = Object.values(this.longSilentTriggers).filter((t) => t.color === "green");
            const sum = greenTriggers.reduce((acc, t) => acc + (t.price || 0), 0);
            this.longPosition.entryPrice = sum / greenTriggers.length;
          }
        }
        this.setLongParamsSilent(this.longPosition.entryPrice, testConfig);
      }
    }
    for (const [name, line] of Object.entries(this.longPosition)) {
      if (!["sl", "tp", "part"].includes(name))
        continue;
      //autoTp Part
      if (
        name === "part" &&
        this.longPosition.size > 0 &&
        resistance &&
        autoPart &&
        this.longPosition[name]
      ) {
        const { entryPrice } = this.longPosition;
        if (resistance > entryPrice) this.longPosition[name].price = resistance;
      }
      //autoTp Tp
      if (name === "tp" && this.longPosition.size > 0 && resistance && autoTp) {
        const { entryPrice } = this.longPosition;
        if (resistance > entryPrice) this.longPosition[name].price = resistance;
      }
      //breakeven
      const price = line.price;
      const color = line.color;
      if (name === "sl" && this.longPosition.size > 0) {
        const { entryPrice, markPrice } = this.longPosition;
        const pnl = ((markPrice - entryPrice) / entryPrice) * 100;
        if (breakeven !== 0 && pnl > breakeven) {
          const newStopLoss = markPrice * (1 - trailing / 100);
          if (((newStopLoss - price) / price) * 100 > 0.1) {
            this.longPosition[name].price = newStopLoss;
            this.longPosition["tp"].price =
              markPrice * (1 + (breakeven * 3) / 100);
          }
        }
      }
      
      //check position
      if (
        this.longPosition.size > 0 &&
        color === "black" &&
        price <= candle.high &&
        price >= candle.low
      ) {
        const { entryPrice, createdTime } = this.longPosition;
        //sl
        if (name === "sl") {
          const sl = ((price - entryPrice) / entryPrice) * 100;
          const stopLoss = sl - this.fees;
          const loss = (this.longPosition.size * stopLoss) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + loss);
          this.longPosition[name].color = "red";
          //trades history
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime,
            side: "Sell",
            size: this.longPosition.size,
            exitPrice: price,
            entryPrice,
            closedPnl: loss,
            trigger: "sl",
          };
          this.trades.push(trade);
          this.calcStats(trade);
          this.longPosition = {
            size: 0,
          };
          //this.longSilentTriggers = {};
        }
        if (name === "part" && candleUp) {
          const part = ((price - entryPrice) / entryPrice) * 100;
          const partF = part - this.fees;
          this.longPosition.size = this.longPosition.size / 2;
          const take = (this.longPosition.size * partF) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + take);
          this.longPosition[name].color = "red";
          //trades history
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime,
            side: "Sell",
            size: this.longPosition.size,
            exitPrice: price,
            entryPrice,
            closedPnl: take,
            trigger: "part",
          };
          this.trades.push(trade);
          this.calcStats(trade);
        }
        if (name === "tp" && candleUp) {
          //close position
          const tp = ((price - entryPrice) / entryPrice) * 100;
          const tpF = tp - this.fees;
          const take2 = (this.longPosition.size * tpF) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + take2);
          this.longPosition[name].color = "red";
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime,
            side: "Sell",
            size: this.longPosition.size,
            exitPrice: price,
            entryPrice,
            closedPnl: take2,
            trigger: "tp",
          };
          this.trades.push(trade);
          this.calcStats(trade);
          this.longPosition = {
            size: 0,
          };
          //this.longSilentTriggers = {};
        }
      }
    }
    //check Short
    for (const [name, line] of Object.entries(this.shortSilentTriggers)) {
      const price = line.price;
      const color = line.color;
      if (
        price <= candle.high &&
        price >= candle.low &&
        color === "black"
      ) {
        //position opened
        if (this.shortPosition.size === 0) {
          this.shortSilentTriggers[name].color = "green";
          this.shortPosition.size = size / triggersCount;
          this.shortPosition.entryPrice = price;
          this.shortPosition.createdTime = candle.time * 1000;
        } else {
          if (this.shortPosition.size < size) {
            this.shortSilentTriggers[name].color = "green";
            this.shortPosition.size = this.shortPosition.size + size / triggersCount;
            const greenTriggers = Object.values(this.shortSilentTriggers).filter((t) => t.color === "green");
            const sum = greenTriggers.reduce((acc, t) => acc + (t.price || 0), 0);
            this.shortPosition.entryPrice = sum / greenTriggers.length;
          }
        }
        this.setShortParamsSilent(this.shortPosition.entryPrice, testConfig);
      }
    }
    for (const [name, line] of Object.entries(this.shortPosition)) {
      //autoTp Short
      if (!["sl", "tp", "part"].includes(name))
        continue;
      if (
        name === "part" &&
        this.shortPosition.size > 0 &&
        support &&
        autoPart &&
        this.shortPosition[name]
      ) {
        const { entryPrice } = this.shortPosition;
        if (support < entryPrice) this.shortPosition[name].price = support;
      }
      //autoTp
      if (name === "tp" && this.shortPosition.size > 0 && support && autoTp) {
        const { entryPrice } = this.shortPosition;
        if (support < entryPrice) this.shortPosition[name].price = support;
      }
      const price = line.price;
      const color = line.color;
      //breakeven
      if (name === "sl" && this.shortPosition.size > 0) {
        const { entryPrice, markPrice } = this.shortPosition;
        const pnl = ((markPrice - entryPrice) / entryPrice) * 100 * -1;
        if (breakeven !== 0 && pnl > breakeven) {
          const newStopLoss = markPrice * (1 + trailing / 100);
          if (((newStopLoss - price) / price) * 100 < -0.1) {
            this.shortPosition[name].price = newStopLoss;
            this.shortPosition["tp"].price =
              markPrice * (1 - (breakeven * 3) / 100);
          }
        }
      }
      //check position
      if (
        this.shortPosition.size > 0 &&
        color === "black" &&
        price <= candle.high &&
        price >= candle.low
      ) {
        const { entryPrice, createdTime } = this.shortPosition;
        if (name === "sl") {
          //close position
          const sl = ((price - entryPrice) / entryPrice) * 100 * -1;
          const stopLoss = sl - this.fees;
          const loss = (this.shortPosition.size * stopLoss) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + loss);
          this.shortPosition[name].color = "red";
          //trades history
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime,
            side: "Buy",
            size: this.shortPosition.size,
            exitPrice: price,
            entryPrice,
            closedPnl: loss,
            trigger: "sl",
          };
          this.trades.push(trade);
          this.calcStats(trade);
          this.shortPosition = {
            size: 0,
          };
          //this.shortSilentTriggers = {};
        }
        if (name === "part" && !candleUp) {
          const part = ((price - entryPrice) / entryPrice) * 100 * -1;
          const partF = part - this.fees;
          this.shortPosition.size = this.shortPosition.size / 2;
          const take = (this.shortPosition.size * partF) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + take);
          this.shortPosition[name].color = "red";
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime: createdTime,
            side: "Buy",
            size: this.shortPosition.size,
            exitPrice: price,
            entryPrice: entryPrice,
            closedPnl: take,
            trigger: "part",
          };
          this.trades.push(trade);
          this.calcStats(trade);
        }
        if (name === "tp" && !candleUp) {
          //close position
          const tp = ((price - entryPrice) / entryPrice) * 100 * -1;
          const tpF = tp - this.fees;
          const take2 = (this.shortPosition.size * tpF) / 100;
          this.saveField("balance", this.getDefaultConfig().balance + take2);
          this.shortPosition[name].color = "red";
          const trade = {
            updatedTime: candle.time * 1000,
            createdTime,
            side: "Buy",
            size: this.shortPosition.size,
            exitPrice: price,
            entryPrice: entryPrice,
            closedPnl: take2,
            trigger: "tp",
          };
          this.trades.push(trade);
          this.calcStats(trade);
          this.shortPosition = {
            size: 0,
          };
          //this.shortSilentTriggers = {};
        }
      }
    }
  }
  //optimizer
  runSilentSimulation(config) {
    if (!this.app.get("chart").candles.length) {
      alert("No candles for test");
      this.stopOptimization();
    }
    const defaults = this.getDefaultConfig();
    const testConfig = {
      ...defaults,
      ...config,
    };
    this.saveField("balance", testConfig.deposit);
    this.trades = [];
    this.longPosition = {
      size: 0,
    };
    this.shortPosition = {
      size: 0,
    };
    this.longSilentTriggers = {};
    this.shortSilentTriggers = {};
    this.stats = {
      profitableTrades: 0,
      lossTrades: 0,
      pnl: 0,
      lossPrcnt: 0,
      profPrcnt: 0,
      loss: 0,
      prof: 0,
    };
    const { candlesCount, touchCount, autoLong, autoShort, candlesPart } = testConfig;
    for (
      let candleIndex = 0;
      candleIndex < this.app.get("chart").candles.length;
      candleIndex++
    ) {
      const candle = this.app.get("chart").candles[candleIndex];
      const candles = this.app.get("chart").candles.slice(0, candleIndex + 1);
      const { support, resistance } = this.app
        .get("indicators")
        .calculateLevels(candles, candlesCount, touchCount, candlesPart);
      //open Long
      if (this.getDefaultConfig().balance < 0) {
        console.log("balance < 0");
        break;
      }
      if (autoLong && support > 0) {
        this.setLongTriggerSilent(support, testConfig);
      }
      //open Short
      if (autoShort && resistance > 0) {
        this.setShortTriggerSilent(resistance, testConfig);
      }
      this._checkPositionsSilent(candle, support, resistance, testConfig);
    }
    return { pnl: this.stats.pnl, trades: this.trades };
  }

  // Открыть модалку настроек оптимизатора
  showOptimizerModal() {
    const modal = this.app.get("modal");
    const saved = this._loadOptimizerSettings();
    modal.show({
      title: "Настройки оптимизатора",
      body: this.templates.optimizerSettings({
        optTP: saved.optTP !== false, // по умолчанию true
        tp_from: saved.tp_from || 1,
        tp_to: saved.tp_to || 5,
        tp_step: saved.tp_step || 0.5,

        optSL: saved.optSL !== false,
        sl_from: saved.sl_from || -1.5,
        sl_to: saved.sl_to || -0.5,
        sl_step: saved.sl_step || 0.5,

        optPart: saved.optPart !== false,
        part_from: saved.part_from || 0,
        part_to: saved.part_to || 2,
        part_step: saved.part_step || 0.5,

        optBreakeven: saved.optBreakeven || false,
        break_from: saved.break_from || 0,
        break_to: saved.break_to || 1,
        break_step: saved.break_step || 0.5,

        trailing_from: saved.trailing_from || 0,
        trailing_to: saved.trailing_to || 1,
        trailing_step: saved.trailing_step || 0.5,

        optCandles: saved.optCandles || false,
        candlesCount: saved.candlesCount || "3,4,5,6,8",

        optTouches: saved.optTouches || false,
        touchCount: saved.touchCount || "3,4,5",
      }),
      size: "lg",
      actions: {
        buttons: [
          { text: "Отмена", class: "btn-secondary", dismiss: true },
          {
            text: "Sim settings",
            class: "btn-primary",
            action: "showSimulatorSettings",
          },
          { text: "Запустить", class: "btn-primary", action: "start" },
        ],
        onAction: async (action) => {
          if (action === "showSimulatorSettings") {
            this.showSimulatorSettingsModal();
          }
          if (action === "start") {
            const form = document.querySelector("#optimizerForm");
            const data = new FormData(form);
            // Собираем настройки для сохранения
            const toSave = {
              optTP: !!data.get("optTP"),
              tp_from: data.get("tp_from"),
              tp_to: data.get("tp_to"),
              tp_step: data.get("tp_step"),

              optSL: !!data.get("optSL"),
              sl_from: data.get("sl_from"),
              sl_to: data.get("sl_to"),
              sl_step: data.get("sl_step"),

              optPart: !!data.get("optPart"),
              part_from: data.get("part_from"),
              part_to: data.get("part_to"),
              part_step: data.get("part_step"),

              optBreakeven: !!data.get("optBreakeven"),
              break_from: data.get("break_from"),
              break_to: data.get("break_to"),
              break_step: data.get("break_step"),

              trailing_from: data.get("trailing_from"),
              trailing_to: data.get("trailing_to"),
              trailing_step: data.get("trailing_step"),

              optCandles: !!data.get("optCandles"),
              candlesCount: data.get("candlesCount"),

              optTouches: !!data.get("optTouches"),
              touchCount: data.get("touchCount"),
            };
            this._saveOptimizerSettings(toSave);
            const ranges = {};
            if (toSave.optTP) {
              ranges.tpValues = this._parseRange(
                toSave.tp_from,
                toSave.tp_to,
                toSave.tp_step,
              );
            }
            if (toSave.optSL) {
              ranges.slValues = this._parseRange(
                toSave.sl_from,
                toSave.sl_to,
                toSave.sl_step,
              );
            }
            if (toSave.optPart) {
              ranges.partValues = this._parseRange(
                toSave.part_from,
                toSave.part_to,
                toSave.part_step,
              );
            }
            if (toSave.optBreakeven) {
              ranges.breakValues = this._parseRange(
                toSave.break_from,
                toSave.break_to,
                toSave.break_step,
              );
              ranges.trailingValues = this._parseRange(
                toSave.trailing_from,
                toSave.trailing_to,
                toSave.trailing_step,
              );
            }
            if (toSave.optCandles) {
              ranges.candlesCount = toSave.candlesCount
                .split(",")
                .map((v) => parseInt(v));
            }
            if (data.get("optTouches")) {
              ranges.touchCount = toSave.touchCount
                .split(",")
                .map((v) => parseInt(v));
            }
            await this.runOptimization(ranges);
          }
        },
      },
    });
  }

  // Вспомогательная функция для создания массива от/до/шаг
  _parseRange(from, to, step) {
    from = parseFloat(from);
    to = parseFloat(to);
    step = parseFloat(step) || 1;
    if (isNaN(from) || isNaN(to)) return [];
    const arr = [];
    for (let v = from; v <= to; v += step) {
      // Избегаем проблем с плавающей точкой: округляем до 2 знаков
      arr.push(Math.round(v * 100) / 100);
    }
    return arr;
  }
  _showOptimizationResult(
    bestPnlCombo,
    bestSharpeCombo,
    bestSortinoCombo,
    totalCombinations,
  ) {
    const modal = this.app.get("modal");
    modal.show({
      title: "Оптимизация завершена",
      body: this.templates.optimizerResults({
        bestPnlCombo,
        bestSharpeCombo,
        bestSortinoCombo,
        totalCombinations,
      }),
      size: "lg",
      actions: {
        buttons: [
          { text: "Закрыть", class: "btn-secondary", dismiss: true },
          {
            text: "Sim settings",
            class: "btn-primary",
            action: "showSimulatorSettings",
          },
          {
            text: "Opti settings",
            class: "btn-primary",
            action: "optimize",
          },
        ],
        onAction: (action) => {
          if (action === "showSimulatorSettings") {
            this.showSimulatorSettingsModal();
          }
          if (action === "optimize") {
            this.showOptimizerModal();
          }
          if (action === "applyBestPnl") {
            const defaults = this.getDefaultConfig();
            const saveConfig = {
              ...defaults,
              ...bestPnlCombo,
            };
            this.saveSettings(saveConfig);
            this.showSimulatorSettingsModal();
          }
          if (action === "applyBestSharpe") {
            const defaults = this.getDefaultConfig();
            const saveConfig = {
              ...defaults,
              ...bestSharpeCombo,
            };
            this.saveSettings(saveConfig);
            this.showSimulatorSettingsModal();
          }
          if (action === "applyBestSortino") {
            const defaults = this.getDefaultConfig();
            const saveConfig = {
              ...defaults,
              ...bestSortinoCombo,
            };
            this.saveSettings(saveConfig);
            this.showSimulatorSettingsModal();
          }
        },
      },
    });
  }
  stopOptimization() {
    this._stopOptimization = true;
  }
}
