(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['coins-list'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"list-group-item cursor-pointer coin-item"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"active") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":54},"end":{"line":3,"column":99}}})) != null ? stack1 : "")
    + "\" data-symbol=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":3,"column":114},"end":{"line":3,"column":124}}}) : helper)))
    + "\">\n    <div class=\"d-flex justify-content-between align-items-center\">\n        <div class=\"d-flex align-items-center\">\n          <span class=\"coin-symbol\">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"trading") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":36},"end":{"line":6,"column":60}}})) != null ? stack1 : "")
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"symbol") || (depth0 != null ? lookupProperty(depth0,"symbol") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"symbol","hash":{},"data":data,"loc":{"start":{"line":6,"column":61},"end":{"line":6,"column":71}}}) : helper)))
    + " "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"openLong") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data,"loc":{"start":{"line":6,"column":72},"end":{"line":6,"column":107}}})) != null ? stack1 : "")
    + "</span>\n        </div>\n        <div class=\"text-end\">\n            <span class=\"coin-price\"></span>\n            (<span class=\"coin-change\"></span>)\n            <div class=\"btn-group\" role=\"group\" aria-label=\"Basic example\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"exists") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(23, data, 0),"data":data,"loc":{"start":{"line":12,"column":14},"end":{"line":20,"column":21}}})) != null ? stack1 : "")
    + "            </div>\n        </div>\n    </div>\n  </div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return " list-group-item-primary";
},"4":function(container,depth0,helpers,partials,data) {
    return "🟢";
},"6":function(container,depth0,helpers,partials,data) {
    return "↗️";
},"8":function(container,depth0,helpers,partials,data) {
    return "↘️";
},"10":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                <button type=\"button\" class=\"btn btn-sm btn-light star-btn\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"star") : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":13,"column":75},"end":{"line":13,"column":111}}})) != null ? stack1 : "")
    + ">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"star") : depth0),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.program(15, data, 0),"data":data,"loc":{"start":{"line":13,"column":112},"end":{"line":13,"column":143}}})) != null ? stack1 : "")
    + "</button>\n                <button type=\"button\" class=\"btn btn-sm btn-light alert-btn\""
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"alert") : depth0),{"name":"if","hash":{},"fn":container.program(17, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":14,"column":76},"end":{"line":14,"column":114}}})) != null ? stack1 : "")
    + ">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"alert") : depth0),{"name":"if","hash":{},"fn":container.program(19, data, 0),"inverse":container.program(21, data, 0),"data":data,"loc":{"start":{"line":14,"column":115},"end":{"line":14,"column":147}}})) != null ? stack1 : "")
    + "</button>\n                <button type=\"button\" class=\"btn btn-sm btn-light add-btn\" data-add=\"true\">🗑</button>\n";
},"11":function(container,depth0,helpers,partials,data) {
    return " data-star=\"true\"";
},"13":function(container,depth0,helpers,partials,data) {
    return "❤️";
},"15":function(container,depth0,helpers,partials,data) {
    return "🖤";
},"17":function(container,depth0,helpers,partials,data) {
    return " data-alert=\"true\"";
},"19":function(container,depth0,helpers,partials,data) {
    return "🔔";
},"21":function(container,depth0,helpers,partials,data) {
    return "🔕";
},"23":function(container,depth0,helpers,partials,data) {
    return "                <button type=\"button\" class=\"btn btn-sm btn-light star-btn d-none\"></button>\n                <button type=\"button\" class=\"btn btn-sm btn-light alert-btn d-none\"></button>\n                <button type=\"button\" class=\"btn btn-sm btn-light add-btn\" data-add=\"false\">➕</button>\n";
},"25":function(container,depth0,helpers,partials,data) {
    return " d-none";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<ul class=\"list-group\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"coins") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":2},"end":{"line":25,"column":11}}})) != null ? stack1 : "")
    + "</ul>\n<nav aria-label=\"Page navigation example\">\n  <ul class=\"pagination mt-4 pagination-container\">\n    <li class=\"page-item"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"cursorPrev") : depth0),{"name":"if","hash":{},"fn":container.program(25, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":29,"column":24},"end":{"line":29,"column":56}}})) != null ? stack1 : "")
    + "\">\n        <a href=\"#\" class=\"page-link prev-btn\">⏪ Prev Page</a>\n    </li>\n    <li class=\"page-item "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"cursorNext") : depth0),{"name":"if","hash":{},"fn":container.program(25, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":32,"column":25},"end":{"line":32,"column":57}}})) != null ? stack1 : "")
    + "\">\n        <a href=\"#\" class=\"page-link next-btn\">Next Page ⏩</a>\n    </li>\n  </ul>\n</nav>";
},"useData":true});
})();