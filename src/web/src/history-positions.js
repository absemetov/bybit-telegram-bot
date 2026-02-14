(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['history-positions'] = template({"1":function(container,depth0,helpers,partials,data) {
    return " active";
},"3":function(container,depth0,helpers,partials,data) {
    return " table-success";
},"5":function(container,depth0,helpers,partials,data) {
    return " table-danger";
},"7":function(container,depth0,helpers,partials,data) {
    return "+";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <tr class=\"history-item cursor-pointer"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":63,"column":56},"end":{"line":63,"column":72}}}),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"data":data,"loc":{"start":{"line":63,"column":50},"end":{"line":63,"column":116}}})) != null ? stack1 : "")
    + "\" data-symbol=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":63,"column":131},"end":{"line":63,"column":141}}}) : helper)))
    + "\" data-closed-pnl=\""
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":63,"column":160},"end":{"line":63,"column":185}}}))
    + "\" data-updated-time=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"updatedTime") || (depth0 != null ? lookupProperty(depth0,"updatedTime") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"updatedTime","hash":{},"data":data,"loc":{"start":{"line":63,"column":206},"end":{"line":63,"column":221}}}) : helper)))
    + "\" data-entry-price=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"avgEntryPrice") || (depth0 != null ? lookupProperty(depth0,"avgEntryPrice") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"avgEntryPrice","hash":{},"data":data,"loc":{"start":{"line":63,"column":241},"end":{"line":63,"column":258}}}) : helper)))
    + "\" data-exit-price=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"avgExitPrice") || (depth0 != null ? lookupProperty(depth0,"avgExitPrice") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"avgExitPrice","hash":{},"data":data,"loc":{"start":{"line":63,"column":277},"end":{"line":63,"column":293}}}) : helper)))
    + "\" data-side=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":63,"column":312},"end":{"line":63,"column":327}}}),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"data":data,"loc":{"start":{"line":63,"column":306},"end":{"line":63,"column":351}}})) != null ? stack1 : "")
    + "\">\n              <td>"
    + alias4((lookupProperty(helpers,"inc")||(depth0 && lookupProperty(depth0,"inc"))||alias2).call(alias1,(data && lookupProperty(data,"index")),{"name":"inc","hash":{},"data":data,"loc":{"start":{"line":64,"column":18},"end":{"line":64,"column":32}}}))
    + ") "
    + alias4((lookupProperty(helpers,"formatDate")||(depth0 && lookupProperty(depth0,"formatDate"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"updatedTime") : depth0),{"name":"formatDate","hash":{},"data":data,"loc":{"start":{"line":64,"column":34},"end":{"line":64,"column":60}}}))
    + "</td>\n              <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":65,"column":18},"end":{"line":65,"column":28}}}) : helper)))
    + "</td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":66,"column":31},"end":{"line":66,"column":46}}}),{"name":"if","hash":{},"fn":container.program(14, data, 0),"inverse":container.program(16, data, 0),"data":data,"loc":{"start":{"line":66,"column":25},"end":{"line":66,"column":86}}})) != null ? stack1 : "")
    + "\">\n                "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":67,"column":22},"end":{"line":67,"column":37}}}),{"name":"if","hash":{},"fn":container.program(18, data, 0),"inverse":container.program(20, data, 0),"data":data,"loc":{"start":{"line":67,"column":16},"end":{"line":67,"column":63}}})) != null ? stack1 : "")
    + "\n              </td>\n              <td>\n                "
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"cumExitValue") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":70,"column":16},"end":{"line":70,"column":44}}}))
    + "\n              </td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":72,"column":31},"end":{"line":72,"column":47}}}),{"name":"if","hash":{},"fn":container.program(16, data, 0),"inverse":container.program(14, data, 0),"data":data,"loc":{"start":{"line":72,"column":25},"end":{"line":72,"column":87}}})) != null ? stack1 : "")
    + "\">\n                "
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":73,"column":16},"end":{"line":73,"column":41}}}))
    + "\n              </td>\n              <td>"
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"avgEntryPrice") : depth0),4,{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":75,"column":18},"end":{"line":75,"column":49}}}))
    + "$</td>\n              <td>"
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"avgExitPrice") : depth0),4,{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":76,"column":18},"end":{"line":76,"column":48}}}))
    + "$</td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":77,"column":31},"end":{"line":77,"column":47}}}),{"name":"if","hash":{},"fn":container.program(16, data, 0),"inverse":container.program(14, data, 0),"data":data,"loc":{"start":{"line":77,"column":25},"end":{"line":77,"column":87}}})) != null ? stack1 : "")
    + "\">\n                "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":78,"column":22},"end":{"line":78,"column":38}}}),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(22, data, 0),"data":data,"loc":{"start":{"line":78,"column":16},"end":{"line":78,"column":57}}})) != null ? stack1 : "")
    + alias4((lookupProperty(helpers,"changePercent")||(depth0 && lookupProperty(depth0,"changePercent"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"avgExitPrice") : depth0),(depth0 != null ? lookupProperty(depth0,"avgEntryPrice") : depth0),{"name":"changePercent","hash":{},"data":data,"loc":{"start":{"line":78,"column":57},"end":{"line":78,"column":101}}}))
    + "%\n              </td>\n            </tr>\n";
},"10":function(container,depth0,helpers,partials,data) {
    return "Sell";
},"12":function(container,depth0,helpers,partials,data) {
    return "Buy";
},"14":function(container,depth0,helpers,partials,data) {
    return "text-danger";
},"16":function(container,depth0,helpers,partials,data) {
    return "text-success";
},"18":function(container,depth0,helpers,partials,data) {
    return "Short";
},"20":function(container,depth0,helpers,partials,data) {
    return "Long";
},"22":function(container,depth0,helpers,partials,data) {
    return "-";
},"24":function(container,depth0,helpers,partials,data) {
    return "            <tr>\n              <td colspan=\"12\" class=\"text-center\">No history positions found</td>\n            </tr>\n";
},"26":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button class=\"btn btn-primary history-item load-more"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"allCoins") : depth0),{"name":"if","hash":{},"fn":container.program(27, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":95,"column":57},"end":{"line":95,"column":84}}})) != null ? stack1 : "")
    + "\" data-cursor=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cursor") || (depth0 != null ? lookupProperty(depth0,"cursor") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"cursor","hash":{},"data":data,"loc":{"start":{"line":95,"column":99},"end":{"line":95,"column":109}}}) : helper)))
    + "\">\n      Load More History Positions\n    </button>\n";
},"27":function(container,depth0,helpers,partials,data) {
    return " all";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, alias4="function", lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"nav nav-pills mb-2\">\n  <li class=\"nav-item\">\n    <a class=\"nav-link order-item get-orders\" aria-current=\"page\" href=\"#\">Orders</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link position-item get-positions\" href=\"#\">Positions</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link history-item load-more"
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"allCoins") : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":9,"column":45},"end":{"line":9,"column":83}}})) != null ? stack1 : "")
    + "\" href=\"#\">History</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link history-item load-more all"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"allCoins") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":12,"column":49},"end":{"line":12,"column":79}}})) != null ? stack1 : "")
    + "\" href=\"#\">All</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link win-item load-more\" href=\"#\">W/R</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link win-item load-more all\" href=\"#\">W/R All</a>\n  </li>\n</ul>\n<div class=\"row\">\n  <div class=\"col-12\">\n    <div class=\"table-responsive\">\n      <table class=\"table table-hover\">\n        <thead class=\"table-dark\">\n          <tr>\n            <th>Pnl, $ (%)</th>\n            <th>winRate, %</th>\n            <th>profitableTrades, (%) </th>\n            <th>lossTrades, (%)</th>\n          </tr>\n        </thead>\n        <tbody>\n            <tr class=\"cursor-pointer"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"totalData") : depth0)) != null ? lookupProperty(stack1,"pnl") : stack1),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":34,"column":43},"end":{"line":34,"column":63}}}),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"data":data,"loc":{"start":{"line":34,"column":37},"end":{"line":34,"column":107}}})) != null ? stack1 : "")
    + "\">\n              <td>"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"totalData") : depth0)) != null ? lookupProperty(stack1,"pnl") : stack1),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":35,"column":24},"end":{"line":35,"column":44}}}),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":35,"column":18},"end":{"line":35,"column":54}}})) != null ? stack1 : "")
    + alias3((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"totalData") : depth0)) != null ? lookupProperty(stack1,"pnl") : stack1),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":35,"column":54},"end":{"line":35,"column":83}}}))
    + "$ ("
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"totalData") : depth0)) != null ? lookupProperty(stack1,"totalPrcnt") : stack1),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":35,"column":92},"end":{"line":35,"column":119}}}),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":35,"column":86},"end":{"line":35,"column":129}}})) != null ? stack1 : "")
    + alias3((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"totalData") : depth0)) != null ? lookupProperty(stack1,"totalPrcnt") : stack1),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":35,"column":129},"end":{"line":35,"column":165}}}))
    + "%)</td>\n              <td>\n                "
    + alias3(((helper = (helper = lookupProperty(helpers,"winRate") || (depth0 != null ? lookupProperty(depth0,"winRate") : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"winRate","hash":{},"data":data,"loc":{"start":{"line":37,"column":16},"end":{"line":37,"column":27}}}) : helper)))
    + "%\n              </td>\n              <td>\n                +"
    + alias3(((helper = (helper = lookupProperty(helpers,"profitableTrades") || (depth0 != null ? lookupProperty(depth0,"profitableTrades") : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"profitableTrades","hash":{},"data":data,"loc":{"start":{"line":40,"column":17},"end":{"line":40,"column":37}}}) : helper)))
    + " (+"
    + alias3((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"totalData") : depth0)) != null ? lookupProperty(stack1,"profPrcnt") : stack1),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":40,"column":40},"end":{"line":40,"column":75}}}))
    + "%)</td>\n              </td>\n              <td>\n                -"
    + alias3(((helper = (helper = lookupProperty(helpers,"lossTrades") || (depth0 != null ? lookupProperty(depth0,"lossTrades") : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"lossTrades","hash":{},"data":data,"loc":{"start":{"line":43,"column":17},"end":{"line":43,"column":31}}}) : helper)))
    + " (-"
    + alias3((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,((stack1 = (depth0 != null ? lookupProperty(depth0,"totalData") : depth0)) != null ? lookupProperty(stack1,"lossPrcnt") : stack1),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":43,"column":34},"end":{"line":43,"column":69}}}))
    + "%)</td>\n              </td>\n            </tr>\n        </tbody>\n      </table>\n      <table class=\"table table-hover\">\n        <thead class=\"table-dark\">\n          <tr>\n            <th>Date</th>\n            <th>Symbol</th>\n            <th>Side</th>\n            <th>Size</th>\n            <th>P&L</th>\n            <th>Entry Price</th>\n            <th>Exit Price</th>\n            <th>Percent change</th>\n          </tr>\n        </thead>\n        <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"positions") : depth0),{"name":"each","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(24, data, 0),"data":data,"loc":{"start":{"line":62,"column":10},"end":{"line":85,"column":19}}})) != null ? stack1 : "")
    + "        </tbody>\n      </table>\n    </div>\n  </div>\n</div>\n\n<div class=\"row my-2\">\n  <div class=\"col-12 text-center\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"cursor") : depth0),{"name":"if","hash":{},"fn":container.program(26, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":94,"column":4},"end":{"line":98,"column":11}}})) != null ? stack1 : "")
    + "  </div>\n</div>\n";
},"useData":true});
})();