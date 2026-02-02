(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['coins-list'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"list-group-item cursor-pointer coin-item"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"active") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":17,"column":56},"end":{"line":17,"column":109}}})) != null ? stack1 : "")
    + "\" data-symbol=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":17,"column":124},"end":{"line":17,"column":134}}}) : helper)))
    + "\">\n      <div class=\"d-flex w-100 justify-content-between\">\n        <h6>\n          <span class=\"coin-symbol\">\n            "
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":21,"column":12},"end":{"line":21,"column":22}}}) : helper)))
    + " \n          </span>\n          <span class=\"coin-price\"></span>\n          (<span class=\"coin-change\"></span>)\n          <span class=\"coin-levels\"></span><br/>\n          <small>"
    + alias4((lookupProperty(helpers,"algoIcon")||(depth0 && lookupProperty(depth0,"algoIcon"))||alias2).call(alias1,depth0,{"name":"algoIcon","hash":{},"data":data,"loc":{"start":{"line":26,"column":17},"end":{"line":26,"column":34}}}))
    + "</small>\n        </h6>\n        <div class=\"btn-group\" role=\"group\" aria-label=\"Basic example\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"exists") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(19, data, 0),"data":data,"loc":{"start":{"line":29,"column":10},"end":{"line":37,"column":17}}})) != null ? stack1 : "")
    + "        </div>\n      </div>\n    </div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return " list-group-item-primary";
},"4":function(container,depth0,helpers,partials,data) {
    return "";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <button type=\"button\" class=\"btn btn-sm btn-light star-btn\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"star") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":30,"column":71},"end":{"line":30,"column":107}}})) != null ? stack1 : "")
    + ">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"star") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(11, data, 0),"data":data,"loc":{"start":{"line":30,"column":108},"end":{"line":30,"column":139}}})) != null ? stack1 : "")
    + "</button>\n            <button type=\"button\" class=\"btn btn-sm btn-light alert-btn\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"alert") : depth0),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":31,"column":72},"end":{"line":31,"column":110}}})) != null ? stack1 : "")
    + ">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"alert") : depth0),{"name":"if","hash":{},"fn":container.program(15, data, 0),"inverse":container.program(17, data, 0),"data":data,"loc":{"start":{"line":31,"column":111},"end":{"line":31,"column":143}}})) != null ? stack1 : "")
    + "</button>\n            <button type=\"button\" class=\"btn btn-sm btn-light add-btn\" data-add=\"true\">🗑</button>\n";
},"7":function(container,depth0,helpers,partials,data) {
    return " data-star=\"true\"";
},"9":function(container,depth0,helpers,partials,data) {
    return "❤️";
},"11":function(container,depth0,helpers,partials,data) {
    return "🖤";
},"13":function(container,depth0,helpers,partials,data) {
    return " data-alert=\"true\"";
},"15":function(container,depth0,helpers,partials,data) {
    return "🔔";
},"17":function(container,depth0,helpers,partials,data) {
    return "🔕";
},"19":function(container,depth0,helpers,partials,data) {
    return "            <button type=\"button\" class=\"btn btn-sm btn-light star-btn d-none\"></button>\n            <button type=\"button\" class=\"btn btn-sm btn-light alert-btn d-none\"></button>\n            <button type=\"button\" class=\"btn btn-sm btn-light add-btn\" data-add=\"false\">➕</button>\n";
},"21":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <li class=\"page-item "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"cursorNext") : depth0),{"name":"if","hash":{},"fn":container.program(22, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":46,"column":25},"end":{"line":46,"column":57}}})) != null ? stack1 : "")
    + "\">\n        <a href=\"#\" class=\"page-link next-btn-bybit\">Next Page ⏩</a>\n    </li>\n";
},"22":function(container,depth0,helpers,partials,data) {
    return " d-none";
},"24":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <li class=\"page-item"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"cursorPrev") : depth0),{"name":"if","hash":{},"fn":container.program(22, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":50,"column":24},"end":{"line":50,"column":56}}})) != null ? stack1 : "")
    + "\">\n        <a href=\"#\" class=\"page-link prev-btn\">⏪ Prev Page</a>\n    </li>\n    <li class=\"page-item "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"cursorNext") : depth0),{"name":"if","hash":{},"fn":container.program(22, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":53,"column":25},"end":{"line":53,"column":57}}})) != null ? stack1 : "")
    + "\">\n        <a href=\"#\" class=\"page-link next-btn\">Next Page ⏩</a>\n    </li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"list-group mb-1\">\n  <div class=\"list-group-item cursor-pointer coin-item d-none\" id=\"load-coin\">\n    <div class=\"d-flex w-100 justify-content-between\">\n      <h6>\n        <span class=\"coin-symbol\"></span>\n      </h6>\n      <div class=\"btn-group\" role=\"group\" aria-label=\"Basic example\">\n        <button type=\"button\" class=\"btn btn-sm btn-light star-btn d-none\"></button>\n        <button type=\"button\" class=\"btn btn-sm btn-light alert-btn d-none\"></button>\n        <button type=\"button\" class=\"btn btn-sm btn-light add-btn\" data-add=\"false\">➕</button>\n      </div>\n    </div>\n  </div>\n</ul>\n<ul class=\"list-group\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"coins") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":16,"column":2},"end":{"line":41,"column":11}}})) != null ? stack1 : "")
    + "</ul>\n<nav aria-label=\"Page navigation example\">\n  <ul class=\"pagination mt-4 pagination-container\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"bybit") : depth0),{"name":"if","hash":{},"fn":container.program(21, data, 0),"inverse":container.program(24, data, 0),"data":data,"loc":{"start":{"line":45,"column":4},"end":{"line":56,"column":11}}})) != null ? stack1 : "")
    + "  </ul>\n</nav>\n";
},"useData":true});
})();