(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['history-positions'] = template({"1":function(container,depth0,helpers,partials,data) {
    return " active";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <tr class=\"history-item cursor-pointer\" data-symbol=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":39,"column":65},"end":{"line":39,"column":75}}}) : helper)))
    + "\" data-closed-pnl=\""
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":39,"column":94},"end":{"line":39,"column":119}}}))
    + "\" data-updated-time=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"updatedTime") || (depth0 != null ? lookupProperty(depth0,"updatedTime") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"updatedTime","hash":{},"data":data,"loc":{"start":{"line":39,"column":140},"end":{"line":39,"column":155}}}) : helper)))
    + "\" data-entry-price=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"avgEntryPrice") || (depth0 != null ? lookupProperty(depth0,"avgEntryPrice") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"avgEntryPrice","hash":{},"data":data,"loc":{"start":{"line":39,"column":175},"end":{"line":39,"column":192}}}) : helper)))
    + "\" data-exit-price=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"avgExitPrice") || (depth0 != null ? lookupProperty(depth0,"avgExitPrice") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"avgExitPrice","hash":{},"data":data,"loc":{"start":{"line":39,"column":211},"end":{"line":39,"column":227}}}) : helper)))
    + "\" data-side=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":39,"column":246},"end":{"line":39,"column":261}}}),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(6, data, 0),"data":data,"loc":{"start":{"line":39,"column":240},"end":{"line":39,"column":285}}})) != null ? stack1 : "")
    + "\">\n              <td>"
    + alias4((lookupProperty(helpers,"formatDate")||(depth0 && lookupProperty(depth0,"formatDate"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"updatedTime") : depth0),{"name":"formatDate","hash":{},"data":data,"loc":{"start":{"line":40,"column":18},"end":{"line":40,"column":44}}}))
    + "</td>\n              <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":41,"column":18},"end":{"line":41,"column":28}}}) : helper)))
    + "</td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":42,"column":31},"end":{"line":42,"column":46}}}),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.program(10, data, 0),"data":data,"loc":{"start":{"line":42,"column":25},"end":{"line":42,"column":86}}})) != null ? stack1 : "")
    + "\">\n                "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":43,"column":22},"end":{"line":43,"column":37}}}),{"name":"if","hash":{},"fn":container.program(12, data, 0),"inverse":container.program(14, data, 0),"data":data,"loc":{"start":{"line":43,"column":16},"end":{"line":43,"column":63}}})) != null ? stack1 : "")
    + "\n              </td>\n              <td>\n                "
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"cumExitValue") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":46,"column":16},"end":{"line":46,"column":44}}}))
    + "\n              </td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":48,"column":31},"end":{"line":48,"column":47}}}),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(8, data, 0),"data":data,"loc":{"start":{"line":48,"column":25},"end":{"line":48,"column":87}}})) != null ? stack1 : "")
    + "\">\n                "
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":49,"column":16},"end":{"line":49,"column":41}}}))
    + "\n              </td>\n              <td>"
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"avgEntryPrice") : depth0),4,{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":51,"column":18},"end":{"line":51,"column":49}}}))
    + "$</td>\n              <td>"
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"avgExitPrice") : depth0),4,{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":52,"column":18},"end":{"line":52,"column":48}}}))
    + "$</td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":53,"column":31},"end":{"line":53,"column":47}}}),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(8, data, 0),"data":data,"loc":{"start":{"line":53,"column":25},"end":{"line":53,"column":87}}})) != null ? stack1 : "")
    + "\">\n                "
    + alias4((lookupProperty(helpers,"changepercent")||(depth0 && lookupProperty(depth0,"changepercent"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"avgExitPrice") : depth0),(depth0 != null ? lookupProperty(depth0,"avgEntryPrice") : depth0),{"name":"changepercent","hash":{},"data":data,"loc":{"start":{"line":54,"column":16},"end":{"line":54,"column":60}}}))
    + "%\n              </td>\n            </tr>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return "Sell";
},"6":function(container,depth0,helpers,partials,data) {
    return "Buy";
},"8":function(container,depth0,helpers,partials,data) {
    return "text-danger";
},"10":function(container,depth0,helpers,partials,data) {
    return "text-success";
},"12":function(container,depth0,helpers,partials,data) {
    return "Short";
},"14":function(container,depth0,helpers,partials,data) {
    return "Long";
},"16":function(container,depth0,helpers,partials,data) {
    return "            <tr>\n              <td colspan=\"12\" class=\"text-center\">No history positions found</td>\n            </tr>\n";
},"18":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button class=\"btn btn-primary history-item load-more"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"all") : depth0),{"name":"if","hash":{},"fn":container.program(19, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":71,"column":57},"end":{"line":71,"column":79}}})) != null ? stack1 : "")
    + "\" data-cursor=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cursor") || (depth0 != null ? lookupProperty(depth0,"cursor") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"cursor","hash":{},"data":data,"loc":{"start":{"line":71,"column":94},"end":{"line":71,"column":104}}}) : helper)))
    + "\">\n      Load More History Positions\n    </button>\n";
},"19":function(container,depth0,helpers,partials,data) {
    return " all";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"nav nav-pills mb-2\">\n  <li class=\"nav-item\">\n    <a class=\"nav-link order-item get-orders\" aria-current=\"page\" href=\"#\">Orders</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link position-item get-positions\" href=\"#\">Positions</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link history-item load-more"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"all") : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":9,"column":45},"end":{"line":9,"column":78}}})) != null ? stack1 : "")
    + "\" href=\"#\">History</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link history-item load-more all"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"all") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":12,"column":49},"end":{"line":12,"column":74}}})) != null ? stack1 : "")
    + "\" href=\"#\">All</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link win-item load-more\" href=\"#\">W/R</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link win-item load-more all\" href=\"#\">W/R All</a>\n  </li>\n</ul>\n<div class=\"row\">\n  <div class=\"col-12\">\n    <div class=\"table-responsive\">\n      <table class=\"table table-striped table-hover\">\n        <thead class=\"table-dark\">\n          <tr>\n            <th>Date</th>\n            <th>Symbol</th>\n            <th>Side</th>\n            <th>Size</th>\n            <th>P&L</th>\n            <th>Entry Price</th>\n            <th>Exit Price</th>\n            <th>Percent change</th>\n          </tr>\n        </thead>\n        <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"positions") : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(16, data, 0),"data":data,"loc":{"start":{"line":38,"column":10},"end":{"line":61,"column":19}}})) != null ? stack1 : "")
    + "        </tbody>\n      </table>\n    </div>\n  </div>\n</div>\n\n<div class=\"row my-2\">\n  <div class=\"col-12 text-center\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"cursor") : depth0),{"name":"if","hash":{},"fn":container.program(18, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":70,"column":4},"end":{"line":74,"column":11}}})) != null ? stack1 : "")
    + "  </div>\n</div>\n";
},"useData":true});
})();