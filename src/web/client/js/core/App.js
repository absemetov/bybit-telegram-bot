import { State } from "./State.js";
export class App {
  constructor() {
    this.state = new State();
    this.modules = new Map();
    this.events = new Map();
    window.app = this;
  }
  on(event, fn) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(fn);
  }
  emit(event, data) {
    this.events.get(event)?.forEach((fn) => fn(data));
  }
  module(name, Class) {
    const m = new Class(this);
    this.modules.set(name, m);
    return m;
  }
  get(name) {
    return this.modules.get(name);
  }
  async init() {
    console.log("[App] Start");
    for (const m of this.modules.values()) if (m.init) await m.init();
    this.emit("ready");
    console.log("[App] Ready");
  }
}
