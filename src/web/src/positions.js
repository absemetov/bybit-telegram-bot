(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['positions'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <tr class=\"position-item cursor-pointer\" data-symbol=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":39,"column":66},"end":{"line":39,"column":76}}}) : helper)))
    + "\">\n              <td>"
    + alias4((lookupProperty(helpers,"formatDate")||(depth0 && lookupProperty(depth0,"formatDate"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"updatedTime") : depth0),{"name":"formatDate","hash":{},"data":data,"loc":{"start":{"line":40,"column":18},"end":{"line":40,"column":44}}}))
    + "</td>\n              <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":41,"column":18},"end":{"line":41,"column":28}}}) : helper)))
    + "</td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":42,"column":31},"end":{"line":42,"column":46}}}),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":42,"column":25},"end":{"line":42,"column":86}}})) != null ? stack1 : "")
    + "\">\n                "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":43,"column":22},"end":{"line":43,"column":37}}}),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data,"loc":{"start":{"line":43,"column":16},"end":{"line":43,"column":63}}})) != null ? stack1 : "")
    + "\n              </td>\n              <td>\n                "
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"positionValue") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":46,"column":16},"end":{"line":46,"column":45}}}))
    + "$\n              </td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"unrealisedPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":48,"column":31},"end":{"line":48,"column":51}}}),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":48,"column":25},"end":{"line":48,"column":91}}})) != null ? stack1 : "")
    + "\">\n                "
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"unrealisedPnl") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":49,"column":16},"end":{"line":49,"column":45}}}))
    + "$\n              </td>\n              <td>\n                "
    + alias4((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"avgPrice") : depth0),4,{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":52,"column":16},"end":{"line":52,"column":42}}}))
    + "$\n              </td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"unrealisedPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":54,"column":31},"end":{"line":54,"column":51}}}),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":54,"column":25},"end":{"line":54,"column":91}}})) != null ? stack1 : "")
    + "\">\n                "
    + alias4((lookupProperty(helpers,"changepercent")||(depth0 && lookupProperty(depth0,"changepercent"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"markPrice") : depth0),(depth0 != null ? lookupProperty(depth0,"avgPrice") : depth0),{"name":"changepercent","hash":{},"data":data,"loc":{"start":{"line":55,"column":16},"end":{"line":55,"column":52}}}))
    + "%\n              </td>\n              <td>\n                <button type=\"button\" class=\"btn btn-sm btn-light cancel-position\" data-side=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"side") || (depth0 != null ? lookupProperty(depth0,"side") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"side","hash":{},"data":data,"loc":{"start":{"line":58,"column":94},"end":{"line":58,"column":102}}}) : helper)))
    + "\" data-qty=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"size") || (depth0 != null ? lookupProperty(depth0,"size") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"size","hash":{},"data":data,"loc":{"start":{"line":58,"column":114},"end":{"line":58,"column":122}}}) : helper)))
    + "\">🗑</button>\n              </td>\n            </tr>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "text-success";
},"4":function(container,depth0,helpers,partials,data) {
    return "text-danger";
},"6":function(container,depth0,helpers,partials,data) {
    return "Long";
},"8":function(container,depth0,helpers,partials,data) {
    return "Short";
},"10":function(container,depth0,helpers,partials,data) {
    return "            <tr>\n              <td colspan=\"12\" class=\"text-center\">No positions found</td>\n            </tr>\n";
},"12":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button class=\"btn btn-primary position-item get-positions\" data-cursor=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cursor") || (depth0 != null ? lookupProperty(depth0,"cursor") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cursor","hash":{},"data":data,"loc":{"start":{"line":75,"column":77},"end":{"line":75,"column":87}}}) : helper)))
    + "\">\n      Load More Positions\n    </button>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"nav nav-pills mb-2\">\n  <li class=\"nav-item\">\n    <a class=\"nav-link order-item get-orders\" aria-current=\"page\" href=\"#\">Orders</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link active position-item get-positions\" href=\"#\">Positions</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link history-item load-more\" href=\"#\">History</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link history-item load-more all\" href=\"#\">All</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link win-item load-more\" href=\"#\">W/R</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link win-item load-more all\" href=\"#\">W/R All</a>\n  </li>\n</ul>\n<div class=\"row\">\n  <div class=\"col-12\">\n    <div class=\"table-responsive\">\n      <table class=\"table table-striped table-hover\">\n        <thead class=\"table-dark\">\n          <tr>\n            <th>Date</th>\n            <th>Symbol</th>\n            <th>Side</th>\n            <th>Size</th>\n            <th>unrealisedPnl</th>\n            <th>avgPrice</th>\n            <th>Changes</th>\n            <th>Del</th>\n          </tr>\n        </thead>\n        <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"positions") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(10, data, 0),"data":data,"loc":{"start":{"line":38,"column":10},"end":{"line":65,"column":19}}})) != null ? stack1 : "")
    + "        </tbody>\n      </table>\n    </div>\n  </div>\n</div>\n\n<div class=\"row my-2\">\n  <div class=\"col-12 text-center\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"cursor") : depth0),{"name":"if","hash":{},"fn":container.program(12, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":74,"column":4},"end":{"line":78,"column":11}}})) != null ? stack1 : "")
    + "  </div>\n</div>\n";
},"useData":true});
})();