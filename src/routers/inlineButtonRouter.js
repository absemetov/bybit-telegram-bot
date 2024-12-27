import Router from "../actions/Router.js";
import {
  createSubs,
  skipSubscriptionMsg,
  deleteSubscription,
  viewSubscriptions,
  viewSubscriptionsPaginate,
  showSubscription,
  editSubsInterval,
} from "../actions/subscriptionActions.js";
import {
  setAlert,
  skipAlertMsg,
  deleteAlert,
  showAlerts,
  showAlert,
  showAlertsPaginate,
  editAlert,
} from "../actions/alertActions.js";
import {
  showAllScans,
  getChunkNumber,
  showScanEditForm,
  editScanField,
} from "../actions/scanActions.js";
import {
  uploadTickersAction,
  viewTickers,
  viewTickersPaginate,
  showTicker,
  editTicker,
  deleteTicker,
} from "../actions/tickerActions.js";
const inlineButtonRouter = (ctx) => {
  // const actionData = parseActionData(ctx.callbackQuery.data);
  // Symbols ==========
  // create new subs done!
  const routes = new Router(ctx);
  routes.action("create_subscription/:symbol", async (ctx, params) => {
    await createSubs(ctx, params);
  });

  // skip_subscription_msg
  routes.action("skip_subscription_msg", async (ctx) => {
    await skipSubscriptionMsg(ctx);
  });
  // show coins
  routes.action("view_subscriptions", async (ctx) => {
    await viewSubscriptions(ctx);
  });
  // paginate coins
  routes.action(
    "viewsubscriptions/:direction/:lastVisibleId",
    async (ctx, params) => {
      await viewSubscriptionsPaginate(ctx, params);
    },
  );
  // show coin page
  routes.action("viewsubscription/:symbol{/:clear}", async (ctx, params) => {
    await showSubscription(ctx, params);
  });
  // edit Subscription
  routes.action("editsubsinterval/:symbol", async (ctx, params) => {
    await editSubsInterval(ctx, params);
  });
  // delete Subs
  routes.action("deletesubscription/:symbol", async (ctx, params) => {
    await deleteSubscription(ctx, params);
  });
  // ALERTS create new alert done!
  routes.action("new_alert/:symbol", async (ctx, params) => {
    await setAlert(ctx, params);
  });
  // skip alert msg
  routes.action("skip_alert_msg", async (ctx) => {
    await skipAlertMsg(ctx);
  });
  // show alerts
  routes.action("showalerts/:symbol", async (ctx, params) => {
    await showAlerts(ctx, params);
  });
  // paginate Alerts
  routes.action(
    "viewalerts/:direction/:symbol/:lastVisibleId",
    async (ctx, params) => {
      await showAlertsPaginate(ctx, params);
    },
  );
  // show alert
  routes.action("viewalert/:symbol/:alertId", async (ctx, params) => {
    await showAlert(ctx, params);
  });
  // edit Alert fields
  routes.action("editalert/:field/:symbol/:alertId", async (ctx, params) => {
    await editAlert(ctx, params);
  });
  // delete a Alert
  routes.action("deletealert/:symbol/:alertId", async (ctx, params) => {
    await deleteAlert(ctx, params);
  });
  // Scan actions
  // show start scan form
  routes.action("scan", async (ctx) => {
    await showAllScans(ctx);
  });
  // scan a chunk
  routes.action("scan/:interval", async (ctx, params) => {
    await getChunkNumber(ctx, params);
  });
  // show scan interval settings
  routes.action("scanform/:interval", async (ctx, params) => {
    await showScanEditForm(ctx, params);
  });
  // edit scan interval settings fields
  routes.action("scan/:interval/edit/:field", async (ctx, params) => {
    await editScanField(ctx, params);
  });
  //New Tickers
  routes.action("upload-tickers", async (ctx) => {
    await uploadTickersAction(ctx);
  });
  // show coins
  routes.action("show-tickers", async (ctx) => {
    await viewTickers(ctx);
  });
  // paginate coins
  routes.action(
    "show-tickers/:direction/:lastVisibleId",
    async (ctx, params) => {
      await viewTickersPaginate(ctx, params);
    },
  );
  // show coin page
  routes.action("show-ticker/:symbol{/:clear}", async (ctx, params) => {
    await showTicker(ctx, params);
  });
  // edit ticker
  routes.action("edit-ticker/:symbol/:field", async (ctx, params) => {
    await editTicker(ctx, params);
  });
  // delete ticker
  routes.action("delete-ticker/:symbol", async (ctx, params) => {
    await deleteTicker(ctx, params);
  });
};

export default inlineButtonRouter;
