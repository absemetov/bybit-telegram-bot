import Router from "../actions/Router.js";
import {
  viewTickers,
  viewTickersPaginate,
  showTicker,
  editTicker,
  deleteTicker,
} from "../actions/tickerActions.js";
const inlineButtonRouter = (ctx) => {
  const routes = new Router(ctx);
  // show coins
  routes.action("show-tickers{/:favorites}", async (ctx, params) => {
    await viewTickers(ctx, params);
  });
  // paginate coins
  routes.action(
    "show-tickers/:direction/:lastVisibleId/:favorites",
    async (ctx, params) => {
      await viewTickersPaginate(ctx, params);
    },
  );
  // show coin page
  routes.action("show-ticker/:symbol{/:clear}", async (ctx, params) => {
    await showTicker(ctx, params);
  });
  // edit ticker
  routes.action("edit-ticker/:symbol/:field{/:value}", async (ctx, params) => {
    await editTicker(ctx, params);
  });
  // delete ticker
  routes.action("delete-ticker/:symbol", async (ctx, params) => {
    await deleteTicker(ctx, params);
  });
  // delete ticker
  routes.action("delete/msg", async (ctx) => {
    await ctx.deleteMessage();
  });
};

export default inlineButtonRouter;
