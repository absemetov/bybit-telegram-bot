(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['orders'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <tr class=\"order-item cursor-pointer\" data-symbol=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":37,"column":63},"end":{"line":37,"column":73}}}) : helper)))
    + "\">\n              <td>"
    + alias4((lookupProperty(helpers,"formatDate")||(depth0 && lookupProperty(depth0,"formatDate"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"createdTime") : depth0),{"name":"formatDate","hash":{},"data":data,"loc":{"start":{"line":38,"column":18},"end":{"line":38,"column":44}}}))
    + "</td>\n              <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":39,"column":18},"end":{"line":39,"column":28}}}) : helper)))
    + "</td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":40,"column":31},"end":{"line":40,"column":46}}}),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":40,"column":25},"end":{"line":40,"column":86}}})) != null ? stack1 : "")
    + "\">\n                "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":41,"column":22},"end":{"line":41,"column":37}}}),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data,"loc":{"start":{"line":41,"column":16},"end":{"line":41,"column":63}}})) != null ? stack1 : "")
    + " "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"price") : depth0),"0",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":41,"column":70},"end":{"line":41,"column":84}}}),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":41,"column":64},"end":{"line":41,"column":98}}})) != null ? stack1 : "")
    + "\n              </td>\n              <td>"
    + alias4((lookupProperty(helpers,"multiply")||(depth0 && lookupProperty(depth0,"multiply"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"qty") : depth0),(depth0 != null ? lookupProperty(depth0,"price") : depth0),{"name":"multiply","hash":{},"data":data,"loc":{"start":{"line":43,"column":18},"end":{"line":43,"column":40}}}))
    + "$</td>\n              <td>\n                "
    + alias4(((helper = (helper = lookupProperty(helpers,"price") || (depth0 != null ? lookupProperty(depth0,"price") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"price","hash":{},"data":data,"loc":{"start":{"line":45,"column":16},"end":{"line":45,"column":25}}}) : helper)))
    + "$\n              </td>\n              <td>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"price") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":48,"column":22},"end":{"line":48,"column":34}}}),{"name":"if","hash":{},"fn":container.program(12, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":48,"column":16},"end":{"line":51,"column":23}}})) != null ? stack1 : "")
    + "              </td>\n            </tr>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "text-success";
},"4":function(container,depth0,helpers,partials,data) {
    return "text-danger";
},"6":function(container,depth0,helpers,partials,data) {
    return "Long";
},"8":function(container,depth0,helpers,partials,data) {
    return "Short";
},"10":function(container,depth0,helpers,partials,data) {
    return "TP/SL";
},"12":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                  <button type=\"button\" class=\"btn btn-sm btn-light cancel-order\" data-order-id=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"orderId") || (depth0 != null ? lookupProperty(depth0,"orderId") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"orderId","hash":{},"data":data,"loc":{"start":{"line":49,"column":97},"end":{"line":49,"column":108}}}) : helper)))
    + "\" data-price=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"price") || (depth0 != null ? lookupProperty(depth0,"price") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"price","hash":{},"data":data,"loc":{"start":{"line":49,"column":122},"end":{"line":49,"column":131}}}) : helper)))
    + "\" data-side=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"side") || (depth0 != null ? lookupProperty(depth0,"side") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"side","hash":{},"data":data,"loc":{"start":{"line":49,"column":144},"end":{"line":49,"column":152}}}) : helper)))
    + "\">🗑</button>\n                  <button type=\"button\" class=\"btn btn-sm btn-light cancel-all-orders\">Del ALL</button>\n";
},"14":function(container,depth0,helpers,partials,data) {
    return "            <tr>\n              <td colspan=\"12\" class=\"text-center\">No orders found</td>\n            </tr>\n";
},"16":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button class=\"btn btn-primary order-item get-orders\" data-cursor=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cursor") || (depth0 != null ? lookupProperty(depth0,"cursor") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cursor","hash":{},"data":data,"loc":{"start":{"line":68,"column":71},"end":{"line":68,"column":81}}}) : helper)))
    + "\">\n      Load More Orders\n    </button>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"nav nav-pills mb-2\">\n  <li class=\"nav-item\">\n    <a class=\"nav-link active order-item get-orders\" aria-current=\"page\" href=\"#\">Orders</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link position-item get-positions\" href=\"#\">Positions</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link history-item load-more\" href=\"#\">History</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link history-item load-more all\" href=\"#\">All</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link win-item load-more\" href=\"#\">W/R</a>\n  </li>\n  <li class=\"nav-item\">\n    <a class=\"nav-link win-item load-more all\" href=\"#\">W/R All</a>\n  </li>\n</ul>\n<div class=\"row\">\n  <div class=\"col-12\">\n    <div class=\"table-responsive\">\n      <table class=\"table table-striped table-hover\">\n        <thead class=\"table-dark\">\n          <tr>\n            <th>Date</th>\n            <th>Symbol</th>\n            <th>Side</th>\n            <th>Size</th>\n            <th>price</th>\n            <th>Del</th>\n          </tr>\n        </thead>\n        <tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"orders") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(14, data, 0),"data":data,"loc":{"start":{"line":36,"column":10},"end":{"line":58,"column":19}}})) != null ? stack1 : "")
    + "        </tbody>\n      </table>\n    </div>\n  </div>\n</div>\n\n<div class=\"row my-2\">\n  <div class=\"col-12 text-center\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"cursor") : depth0),{"name":"if","hash":{},"fn":container.program(16, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":67,"column":4},"end":{"line":71,"column":11}}})) != null ? stack1 : "")
    + "  </div>\n</div>\n";
},"useData":true});
})();