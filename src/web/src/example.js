(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['history-positions'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, alias4="function", lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <tr data-closed-pnl=\""
    + alias3((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":18,"column":33},"end":{"line":18,"column":58}}}))
    + "\" data-updated-time=\""
    + alias3(((helper = (helper = lookupProperty(helpers,"updatedTime") || (depth0 != null ? lookupProperty(depth0,"updatedTime") : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"updatedTime","hash":{},"data":data,"loc":{"start":{"line":18,"column":79},"end":{"line":18,"column":94}}}) : helper)))
    + "\" data-entry-price=\""
    + alias3(((helper = (helper = lookupProperty(helpers,"avgEntryPrice") || (depth0 != null ? lookupProperty(depth0,"avgEntryPrice") : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"avgEntryPrice","hash":{},"data":data,"loc":{"start":{"line":18,"column":114},"end":{"line":18,"column":131}}}) : helper)))
    + "\" data-exit-price=\""
    + alias3(((helper = (helper = lookupProperty(helpers,"avgExitPrice") || (depth0 != null ? lookupProperty(depth0,"avgExitPrice") : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"avgExitPrice","hash":{},"data":data,"loc":{"start":{"line":18,"column":150},"end":{"line":18,"column":166}}}) : helper)))
    + "\" data-side=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":18,"column":185},"end":{"line":18,"column":200}}}),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":18,"column":179},"end":{"line":18,"column":224}}})) != null ? stack1 : "")
    + "\" class=\"item-row\">\n              <td>"
    + alias3(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":19,"column":18},"end":{"line":19,"column":28}}}) : helper)))
    + "</td>\n              <td>\n                <span class=\"badge "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":21,"column":41},"end":{"line":21,"column":56}}}),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data,"loc":{"start":{"line":21,"column":35},"end":{"line":21,"column":92}}})) != null ? stack1 : "")
    + "\">\n                  "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"eq")||(depth0 && lookupProperty(depth0,"eq"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"side") : depth0),"Buy",{"name":"eq","hash":{},"data":data,"loc":{"start":{"line":22,"column":24},"end":{"line":22,"column":39}}}),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"data":data,"loc":{"start":{"line":22,"column":18},"end":{"line":22,"column":65}}})) != null ? stack1 : "")
    + "\n                </span>\n              </td>\n              <td>\n                "
    + alias3((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"cumExitValue") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":26,"column":16},"end":{"line":26,"column":44}}}))
    + "$\n              </td>\n              <td class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"gt")||(depth0 && lookupProperty(depth0,"gt"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),0,{"name":"gt","hash":{},"data":data,"loc":{"start":{"line":28,"column":31},"end":{"line":28,"column":47}}}),{"name":"if","hash":{},"fn":container.program(14, data, 0),"inverse":container.program(16, data, 0),"data":data,"loc":{"start":{"line":28,"column":25},"end":{"line":28,"column":87}}})) != null ? stack1 : "")
    + "\">\n                "
    + alias3((lookupProperty(helpers,"formatPrice")||(depth0 && lookupProperty(depth0,"formatPrice"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"closedPnl") : depth0),{"name":"formatPrice","hash":{},"data":data,"loc":{"start":{"line":29,"column":16},"end":{"line":29,"column":41}}}))
    + "$\n              </td>\n              <td>"
    + alias3(((helper = (helper = lookupProperty(helpers,"avgEntryPrice") || (depth0 != null ? lookupProperty(depth0,"avgEntryPrice") : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"avgEntryPrice","hash":{},"data":data,"loc":{"start":{"line":31,"column":18},"end":{"line":31,"column":35}}}) : helper)))
    + "$</td>\n              <td>"
    + alias3(((helper = (helper = lookupProperty(helpers,"avgExitPrice") || (depth0 != null ? lookupProperty(depth0,"avgExitPrice") : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"avgExitPrice","hash":{},"data":data,"loc":{"start":{"line":32,"column":18},"end":{"line":32,"column":34}}}) : helper)))
    + "$</td>\n              <td>"
    + alias3((lookupProperty(helpers,"formatDate")||(depth0 && lookupProperty(depth0,"formatDate"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"updatedTime") : depth0),{"name":"formatDate","hash":{},"data":data,"loc":{"start":{"line":33,"column":18},"end":{"line":33,"column":44}}}))
    + "</td>\n            </tr>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "Sell";
},"4":function(container,depth0,helpers,partials,data) {
    return "Buy";
},"6":function(container,depth0,helpers,partials,data) {
    return "bg-danger";
},"8":function(container,depth0,helpers,partials,data) {
    return "bg-success";
},"10":function(container,depth0,helpers,partials,data) {
    return "Short";
},"12":function(container,depth0,helpers,partials,data) {
    return "Long";
},"14":function(container,depth0,helpers,partials,data) {
    return "text-success";
},"16":function(container,depth0,helpers,partials,data) {
    return "text-danger";
},"18":function(container,depth0,helpers,partials,data) {
    return "            <tr>\n              <td colspan=\"6\" class=\"text-center\">No positions found</td>\n            </tr>\n";
},"20":function(container,depth0,helpers,partials,data) {
    return "disabled";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"row\">\n  <div class=\"col-12\">\n    <div class=\"table-responsive\">\n      <table class=\"table table-striped table-hover\">\n        <thead class=\"table-dark\">\n          <tr>\n            <th>Symbol</th>\n            <th>Side</th>\n            <th>Size</th>\n            <th>P&L</th>\n            <th>Entry Price</th>\n            <th>Exit Price</th>\n            <th>Date</th>\n          </tr>\n        </thead>\n        <tbody id=\"positions-body\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"positions") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(18, data, 0),"data":data,"loc":{"start":{"line":17,"column":10},"end":{"line":39,"column":19}}})) != null ? stack1 : "")
    + "        </tbody>\n      </table>\n    </div>\n  </div>\n</div>\n\n<div class=\"row mt-4\">\n  <div class=\"col-12 text-center\">\n    <button id=\"load-more\" class=\"btn btn-primary\" "
    + ((stack1 = lookupProperty(helpers,"unless").call(alias1,(depth0 != null ? lookupProperty(depth0,"cursor") : depth0),{"name":"unless","hash":{},"fn":container.program(20, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":48,"column":51},"end":{"line":48,"column":88}}})) != null ? stack1 : "")
    + ">\n      Load More Positions\n    </button>\n  </div>\n</div>";
},"useData":true});
})();