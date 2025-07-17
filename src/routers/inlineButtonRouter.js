import Router from "../actions/Router.js";
import {
  viewTickers,
  viewTickersPaginate,
  showTicker,
  editTicker,
  editTickerBool,
  deleteTicker,
} from "../actions/tickerActions.js";
import {
  showAllScans,
  showScanEditPage,
  editScanField,
} from "../actions/scanActions.js";
const inlineButtonRouter = (ctx) => {
  const routes = new Router(ctx);
  // show coins
  routes.action("show-tickers/:tab", async (ctx, params) => {
    await viewTickers(ctx, params);
  });
  // paginate coins
  routes.action(
    "show-tickers/:direction/:lastVisibleId/:tab",
    async (ctx, params) => {
      await viewTickersPaginate(ctx, params);
    },
  );
  // show coin page
  routes.action("show-ticker/:symbol{/:clear}", async (ctx, params) => {
    await showTicker(ctx, params);
  });
  // edit ticker text field
  routes.action(
    "edit-ticker/:symbol/:field{/:value}{/:redirect}",
    async (ctx, params) => await editTicker(ctx, params),
  );
  // edit ticker boolean field
  routes.action(
    "edit-ticker-bool/:symbol/:field{/:value}{/:redirect}",
    async (ctx, params) => await editTickerBool(ctx, params),
  );
  // delete ticker
  routes.action("delete-ticker/:symbol", async (ctx, params) => {
    await deleteTicker(ctx, params);
  });
  // delete tg msg
  routes.action("delete/msg", async (ctx) => {
    await ctx.deleteMessage();
  });
  //cron settings
  routes.action("cron", async (ctx) => {
    await showAllScans(ctx, true);
  });
  routes.action("cron/:interval", async (ctx, params) => {
    await showScanEditPage(ctx, params);
  });
  routes.action(
    "cron/:interval/edit/:field{/:value}{/:redirect}",
    async (ctx, params) => {
      await editScanField(ctx, params);
    },
  );
};

export default inlineButtonRouter;
