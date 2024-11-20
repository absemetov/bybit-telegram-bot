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
// hjhj
export default Router;
// export const parseActionData = (action) => {
//   const subscriptionRegex = /viewsubscriptions_(prev|next)_(.+)/;
//   const alertRegex = /viewalerts_(prev|next)_(.+)_(.+)/;
//   const showAlertRegex = /viewalert_(.+)_(.+)/;

//   let match = action.match(subscriptionRegex);
//   if (match) {
//     return {
//       direction: match[1],
//       lastVisibleId: match[2],
//     };
//   }

//   match = action.match(alertRegex);
//   if (match) {
//     return {
//       direction: match[1],
//       symbol: match[2],
//       lastVisibleId: match[3],
//     };
//   }

//   match = action.match(showAlertRegex);
//   if (match) {
//     return {
//       symbol: match[1],
//       alertId: match[2],
//     };
//   }

//   return null;
// };
