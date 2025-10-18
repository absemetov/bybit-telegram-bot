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
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"active") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":3,"column":56},"end":{"line":3,"column":152}}})) != null ? stack1 : "")
    + "\" data-symbol=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":3,"column":167},"end":{"line":3,"column":177}}}) : helper)))
    + "\" data-read=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"read") || (depth0 != null ? lookupProperty(depth0,"read") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"read","hash":{},"data":data,"loc":{"start":{"line":3,"column":190},"end":{"line":3,"column":198}}}) : helper)))
    + "\">\n      <div class=\"d-flex w-100 justify-content-between\">\n        <h6>\n          <span class=\"coin-symbol\">\n            "
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":7,"column":12},"end":{"line":7,"column":22}}}) : helper)))
    + " "
    + alias4((lookupProperty(helpers,"algoIcon")||(depth0 && lookupProperty(depth0,"algoIcon"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"tradingType") : depth0),(depth0 != null ? lookupProperty(depth0,"enterTf") : depth0),(depth0 != null ? lookupProperty(depth0,"candlesCount") : depth0),{"name":"algoIcon","hash":{},"data":data,"loc":{"start":{"line":7,"column":23},"end":{"line":7,"column":68}}}))
    + "\n          </span>\n          <span class=\"coin-price\"></span>\n          (<span class=\"coin-change\"></span>)\n        </h6>\n        <div class=\"btn-group\" role=\"group\" aria-label=\"Basic example\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"exists") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(20, data, 0),"data":data,"loc":{"start":{"line":13,"column":10},"end":{"line":21,"column":17}}})) != null ? stack1 : "")
    + "        </div>\n      </div>\n      <div class=\"d-flex w-100 justify-content-between\">\n        <small>"
    + alias4(((helper = (helper = lookupProperty(helpers,"msg") || (depth0 != null ? lookupProperty(depth0,"msg") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"msg","hash":{},"data":data,"loc":{"start":{"line":25,"column":15},"end":{"line":25,"column":22}}}) : helper)))
    + "</small>\n        <small><b>"
    + alias4((lookupProperty(helpers,"fromNow")||(depth0 && lookupProperty(depth0,"fromNow"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"updatedAt") : depth0),{"name":"fromNow","hash":{},"data":data,"loc":{"start":{"line":26,"column":18},"end":{"line":26,"column":39}}}))
    + "</b></small>\n      </div>\n    </div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return " list-group-item-primary";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"read") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":102},"end":{"line":3,"column":145}}})) != null ? stack1 : "");
},"5":function(container,depth0,helpers,partials,data) {
    return " list-group-item-success";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <button type=\"button\" class=\"btn btn-sm btn-light star-btn\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"star") : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":14,"column":71},"end":{"line":14,"column":107}}})) != null ? stack1 : "")
    + ">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"star") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"data":data,"loc":{"start":{"line":14,"column":108},"end":{"line":14,"column":139}}})) != null ? stack1 : "")
    + "</button>\n            <button type=\"button\" class=\"btn btn-sm btn-light alert-btn\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"alert") : depth0),{"name":"if","hash":{},"fn":container.program(14, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":15,"column":72},"end":{"line":15,"column":110}}})) != null ? stack1 : "")
    + ">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"alert") : depth0),{"name":"if","hash":{},"fn":container.program(16, data, 0),"inverse":container.program(18, data, 0),"data":data,"loc":{"start":{"line":15,"column":111},"end":{"line":15,"column":143}}})) != null ? stack1 : "")
    + "</button>\n            <button type=\"button\" class=\"btn btn-sm btn-light add-btn\" data-add=\"true\">🗑</button>\n";
},"8":function(container,depth0,helpers,partials,data) {
    return " data-star=\"true\"";
},"10":function(container,depth0,helpers,partials,data) {
    return "❤️";
},"12":function(container,depth0,helpers,partials,data) {
    return "🖤";
},"14":function(container,depth0,helpers,partials,data) {
    return " data-alert=\"true\"";
},"16":function(container,depth0,helpers,partials,data) {
    return "🔔";
},"18":function(container,depth0,helpers,partials,data) {
    return "🔕";
},"20":function(container,depth0,helpers,partials,data) {
    return "            <button type=\"button\" class=\"btn btn-sm btn-light star-btn d-none\"></button>\n            <button type=\"button\" class=\"btn btn-sm btn-light alert-btn d-none\"></button>\n            <button type=\"button\" class=\"btn btn-sm btn-light add-btn\" data-add=\"false\">➕</button>\n";
},"22":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <li class=\"page-item "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"cursorNext") : depth0),{"name":"if","hash":{},"fn":container.program(23, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":34,"column":25},"end":{"line":34,"column":57}}})) != null ? stack1 : "")
    + "\">\n        <a href=\"#\" class=\"page-link next-btn-bybit\">Next Page ⏩</a>\n    </li>\n";
},"23":function(container,depth0,helpers,partials,data) {
    return " d-none";
},"25":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <li class=\"page-item"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"cursorPrev") : depth0),{"name":"if","hash":{},"fn":container.program(23, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":38,"column":24},"end":{"line":38,"column":56}}})) != null ? stack1 : "")
    + "\">\n        <a href=\"#\" class=\"page-link prev-btn\">⏪ Prev Page</a>\n    </li>\n    <li class=\"page-item "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"cursorNext") : depth0),{"name":"if","hash":{},"fn":container.program(23, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":41,"column":25},"end":{"line":41,"column":57}}})) != null ? stack1 : "")
    + "\">\n        <a href=\"#\" class=\"page-link next-btn\">Next Page ⏩</a>\n    </li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"list-group\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"coins") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":2},"end":{"line":29,"column":11}}})) != null ? stack1 : "")
    + "</ul>\n<nav aria-label=\"Page navigation example\">\n  <ul class=\"pagination mt-4 pagination-container\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"bybit") : depth0),{"name":"if","hash":{},"fn":container.program(22, data, 0),"inverse":container.program(25, data, 0),"data":data,"loc":{"start":{"line":33,"column":4},"end":{"line":44,"column":11}}})) != null ? stack1 : "")
    + "  </ul>\n</nav>\n";
},"useData":true});
})();