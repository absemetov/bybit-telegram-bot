import { match } from "path-to-regexp";
class Router {
  constructor(ctx) {
    this.ctx = ctx;
  }
  action(path, fn) {
    const test = match(path);
    const check = test(this.ctx.callbackQuery.data);
    if (check) {
      fn(this.ctx, check.params);
    }
  }
}
export default Router;
