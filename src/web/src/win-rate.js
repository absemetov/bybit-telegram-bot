(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['win-rate'] = template({"1":function(container,depth0,helpers,partials,data) {
    return " active";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <tr class=\"win-item cursor-pointer\" data-symbol=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":40,"column":61},"end":{"line":40,"column":71}}}) : helper)))
    + "\" data-closed-pnl=\""
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":40,"column":90},"end":{"line":40,"column":115}}}))
    + "\" data-updated-time=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"updatedTime") || (depth0 != null ? lookupProperty(depth0,"updatedTime") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"updatedTime","hash":{},"data":data,"loc":{"start":{"line":40,"column":136},"end":{"line":40,"column":151}}}) : helper)))
    + "\" data-entry-price=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"avgEntryPrice") || (depth0 != null ? lookupProperty(depth0,"avgEntryPrice") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"avgEntryPrice","hash":{},"data":data,"loc":{"start":{"line":40,"column":171},"end":{"line":40,"column":188}}}) : helper)))
    + "\" data-exit-price=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"avgExitPrice") || (depth0 != null ? lookupProperty(depth0,"avgExitPrice") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"avgExitPrice","hash":{},"data":data,"loc":{"start":{"line":40,"column":207},"end":{"line":40,"column":223}}}) : helper)))
    + "\" data-side=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":40,"column":242},"end":{"line":40,"column":257}}}),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(6, data, 0),"data":data,"loc":{"start":{"line":40,"column":236},"end":{"line":40,"column":281}}})) != null ? stack1 : "")
    + "\">\n              <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"dateKey") || (depth0 != null ? lookupProperty(depth0,"dateKey") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"dateKey","hash":{},"data":data,"loc":{"start":{"line":41,"column":18},"end":{"line":41,"column":29}}}) : helper)))
    + "</td>\n              <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":42,"column":18},"end":{"line":42,"column":28}}}) : helper)))
    + "</td>\n              <td class=\"text-danger\">\n                "
    + alias4(((helper = (helper = lookupProperty(helpers,"loss") || (depth0 != null ? lookupProperty(depth0,"loss") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"loss","hash":{},"data":data,"loc":{"start":{"line":44,"column":16},"end":{"line":44,"column":24}}}) : helper)))
    + "\n              </td>\n              <td class=\"text-success\">\n                "
    + alias4(((helper = (helper = lookupProperty(helpers,"profitable") || (depth0 != null ? lookupProperty(depth0,"profitable") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"profitable","hash":{},"data":data,"loc":{"start":{"line":47,"column":16},"end":{"line":47,"column":30}}}) : helper)))
    + "\n              </td>\n              <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"totalTrades") || (depth0 != null ? lookupProperty(depth0,"totalTrades") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"totalTrades","hash":{},"data":data,"loc":{"start":{"line":49,"column":18},"end":{"line":49,"column":33}}}) : helper)))
    + "</td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"totalPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":50,"column":31},"end":{"line":50,"column":46}}}),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.program(10, data, 0),"data":data,"loc":{"start":{"line":50,"column":25},"end":{"line":50,"column":86}}})) != null ? stack1 : "")
    + "\">"
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"lossPrcnt") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":50,"column":88},"end":{"line":50,"column":113}}}))
    + "</td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"totalPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":51,"column":31},"end":{"line":51,"column":46}}}),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(8, data, 0),"data":data,"loc":{"start":{"line":51,"column":25},"end":{"line":51,"column":86}}})) != null ? stack1 : "")
    + "\">"
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"profPrcnt") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":51,"column":88},"end":{"line":51,"column":113}}}))
    + "</td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"totalPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":52,"column":31},"end":{"line":52,"column":46}}}),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(8, data, 0),"data":data,"loc":{"start":{"line":52,"column":25},"end":{"line":52,"column":86}}})) != null ? stack1 : "")
    + "\">\n                "
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"totalPnl") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":53,"column":16},"end":{"line":53,"column":40}}}))
    + "\n              </td>\n              <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"strictWinRate") || (depth0 != null ? lookupProperty(depth0,"strictWinRate") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"strictWinRate","hash":{},"data":data,"loc":{"start":{"line":55,"column":18},"end":{"line":55,"column":35}}}) : helper)))
    + "</td>\n            </tr>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return "Sell";
},"6":function(container,depth0,helpers,partials,data) {
    return "Buy";
},"8":function(container,depth0,helpers,partials,data) {
    return "text-danger";
},"10":function(container,depth0,helpers,partials,data) {
    return "text-success";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"nav nav-pills mb-2\">\n  <li class=\"nav-item\">\n    <a class=\"nav-link order-item get-orders\" aria-current=\"page\" href=\"#\">Orders</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link position-item get-positions\" href=\"#\">Positions</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link history-item load-more\" href=\"#\">History</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link history-item load-more all\" href=\"#\">All</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link win-item load-more"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"all") : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":15,"column":41},"end":{"line":15,"column":74}}})) != null ? stack1 : "")
    + "\" href=\"#\">W/R</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link win-item load-more all"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"all") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":45},"end":{"line":18,"column":70}}})) != null ? stack1 : "")
    + "\" href=\"#\">W/R All</a>\n  </li>\n</ul>\n<div class=\"row\">\n  <div class=\"col-12\">\n    <div class=\"table-responsive\">\n      <table class=\"table table-striped table-hover\">\n        <thead class=\"table-dark\">\n          <tr>\n            <th>Date</th>\n            <th>Symbol</th>\n            <th>loss</th>\n            <th>profitable</th>\n            <th>totalTrades</th>\n            <th>lossPrcnt</th>\n            <th>profPrcnt</th>\n            <th>totalPnl</th>\n            <th>WinRate</th>\n          </tr>\n        </thead>\n        <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"winRate") : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":39,"column":10},"end":{"line":57,"column":19}}})) != null ? stack1 : "")
    + "        </tbody>\n      </table>\n    </div>\n  </div>\n</div>\n";
},"useData":true});
})();