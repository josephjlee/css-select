"use strict";
/*
    pseudo selectors

    ---

    they are available in two forms:
    * filters called when the selector
      is compiled and return a function
      that needs to return next()
    * pseudos get called on execution
      they need to return a boolean
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var nth_check_1 = __importDefault(require("nth-check"));
var boolbase_1 = require("boolbase");
var attributes_1 = require("./attributes");
var checkAttrib = attributes_1.rules.equals;
function getAttribFunc(name, value) {
    var data = {
        type: "attribute",
        action: "equals",
        ignoreCase: false,
        name: name,
        value: value
    };
    return function attribFunc(next, _rule, options) {
        return checkAttrib(next, data, options);
    };
}
function getChildFunc(next, adapter) {
    return function (elem) { return !!adapter.getParent(elem) && next(elem); };
}
exports.filters = {
    contains: function (next, text, options) {
        var adapter = options.adapter;
        return function contains(elem) {
            return next(elem) && adapter.getText(elem).includes(text);
        };
    },
    icontains: function (next, text, options) {
        var itext = text.toLowerCase();
        var adapter = options.adapter;
        return function icontains(elem) {
            return (next(elem) &&
                adapter
                    .getText(elem)
                    .toLowerCase()
                    .includes(itext));
        };
    },
    //location specific methods
    "nth-child": function (next, rule, options) {
        var func = nth_check_1.default(rule);
        var adapter = options.adapter;
        if (func === boolbase_1.falseFunc)
            return boolbase_1.falseFunc;
        if (func === boolbase_1.trueFunc)
            return getChildFunc(next, adapter);
        return function nthChild(elem) {
            var siblings = adapter.getSiblings(elem);
            var pos = 0;
            for (var i = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem)
                        break;
                    else
                        pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    "nth-last-child": function (next, rule, options) {
        var func = nth_check_1.default(rule);
        var adapter = options.adapter;
        if (func === boolbase_1.falseFunc)
            return boolbase_1.falseFunc;
        if (func === boolbase_1.trueFunc)
            return getChildFunc(next, adapter);
        return function nthLastChild(elem) {
            var siblings = adapter.getSiblings(elem);
            var pos = 0;
            for (var i = siblings.length - 1; i >= 0; i--) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem)
                        break;
                    else
                        pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    "nth-of-type": function (next, rule, options) {
        var func = nth_check_1.default(rule);
        var adapter = options.adapter;
        if (func === boolbase_1.falseFunc)
            return boolbase_1.falseFunc;
        if (func === boolbase_1.trueFunc)
            return getChildFunc(next, adapter);
        return function nthOfType(elem) {
            var siblings = adapter.getSiblings(elem);
            var pos = 0;
            for (var i = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem)
                        break;
                    if (adapter.getName(siblings[i]) === adapter.getName(elem))
                        pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    "nth-last-of-type": function (next, rule, options) {
        var func = nth_check_1.default(rule);
        var adapter = options.adapter;
        if (func === boolbase_1.falseFunc)
            return boolbase_1.falseFunc;
        if (func === boolbase_1.trueFunc)
            return getChildFunc(next, adapter);
        return function nthLastOfType(elem) {
            var siblings = adapter.getSiblings(elem);
            var pos = 0;
            for (var i = siblings.length - 1; i >= 0; i--) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem)
                        break;
                    if (adapter.getName(siblings[i]) === adapter.getName(elem))
                        pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    //TODO determine the actual root element
    root: function (next, _rule, _a) {
        var adapter = _a.adapter;
        return function (elem) { return !adapter.getParent(elem) && next(elem); };
    },
    scope: function (next, rule, options, context) {
        var adapter = options.adapter;
        if (!context || context.length === 0) {
            //equivalent to :root
            return exports.filters.root(next, rule, options);
        }
        function equals(a, b) {
            if (typeof adapter.equals === "function")
                return adapter.equals(a, b);
            return a === b;
        }
        if (context.length === 1) {
            //NOTE: can't be unpacked, as :has uses this for side-effects
            return function (elem) { return equals(context[0], elem) && next(elem); };
        }
        return function (elem) { return context.includes(elem) && next(elem); };
    },
    //jQuery extensions (others follow as pseudos)
    checkbox: getAttribFunc("type", "checkbox"),
    file: getAttribFunc("type", "file"),
    password: getAttribFunc("type", "password"),
    radio: getAttribFunc("type", "radio"),
    reset: getAttribFunc("type", "reset"),
    image: getAttribFunc("type", "image"),
    submit: getAttribFunc("type", "submit"),
    // Added later on
    matches: function (_next, _token, _options, _context) {
        throw new Error("Unexpected state");
    },
    not: function (_next, _token, _options, _context) {
        throw new Error("Unexpected state");
    },
    has: function (_next, _token, _options) {
        throw new Error("Unexpected state");
    }
};
//helper methods
function getFirstElement(elems, adapter) {
    for (var i = 0; elems && i < elems.length; i++) {
        if (adapter.isTag(elems[i]))
            return elems[i];
    }
    return null;
}
//while filters are precompiled, pseudos get called when they are needed
exports.pseudos = {
    empty: function (elem, adapter) {
        return !adapter.getChildren(elem).some(function (elem) {
            // FIXME: `getText` call is potentially expensive.
            return adapter.isTag(elem) || adapter.getText(elem) !== "";
        });
    },
    "first-child": function (elem, adapter) {
        return getFirstElement(adapter.getSiblings(elem), adapter) === elem;
    },
    "last-child": function (elem, adapter) {
        var siblings = adapter.getSiblings(elem);
        for (var i = siblings.length - 1; i >= 0; i--) {
            if (siblings[i] === elem)
                return true;
            if (adapter.isTag(siblings[i]))
                break;
        }
        return false;
    },
    "first-of-type": function (elem, adapter) {
        var siblings = adapter.getSiblings(elem);
        for (var i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem)
                    return true;
                if (adapter.getName(siblings[i]) === adapter.getName(elem)) {
                    break;
                }
            }
        }
        return false;
    },
    "last-of-type": function (elem, adapter) {
        var siblings = adapter.getSiblings(elem);
        for (var i = siblings.length - 1; i >= 0; i--) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem)
                    return true;
                if (adapter.getName(siblings[i]) === adapter.getName(elem)) {
                    break;
                }
            }
        }
        return false;
    },
    "only-of-type": function (elem, adapter) {
        var siblings = adapter.getSiblings(elem);
        for (var i = 0, j = siblings.length; i < j; i++) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem)
                    continue;
                if (adapter.getName(siblings[i]) === adapter.getName(elem)) {
                    return false;
                }
            }
        }
        return true;
    },
    "only-child": function (elem, adapter) {
        var siblings = adapter.getSiblings(elem);
        for (var i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i]) && siblings[i] !== elem)
                return false;
        }
        return true;
    },
    //:matches(a, area, link)[href]
    link: function (elem, adapter) {
        return adapter.hasAttrib(elem, "href");
    },
    visited: boolbase_1.falseFunc,
    //TODO: :any-link once the name is finalized (as an alias of :link)
    //forms
    //to consider: :target
    //:matches([selected], select:not([multiple]):not(> option[selected]) > option:first-of-type)
    selected: function (elem, adapter) {
        if (adapter.hasAttrib(elem, "selected"))
            return true;
        else if (adapter.getName(elem) !== "option")
            return false;
        //the first <option> in a <select> is also selected
        var parent = adapter.getParent(elem);
        if (!parent ||
            adapter.getName(parent) !== "select" ||
            adapter.hasAttrib(parent, "multiple")) {
            return false;
        }
        var siblings = adapter.getChildren(parent);
        var sawElem = false;
        for (var i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem) {
                    sawElem = true;
                }
                else if (!sawElem) {
                    return false;
                }
                else if (adapter.hasAttrib(siblings[i], "selected")) {
                    return false;
                }
            }
        }
        return sawElem;
    },
    //https://html.spec.whatwg.org/multipage/scripting.html#disabled-elements
    //:matches(
    //  :matches(button, input, select, textarea, menuitem, optgroup, option)[disabled],
    //  optgroup[disabled] > option),
    // fieldset[disabled] * //TODO not child of first <legend>
    //)
    disabled: function (elem, adapter) {
        return adapter.hasAttrib(elem, "disabled");
    },
    enabled: function (elem, adapter) {
        return !adapter.hasAttrib(elem, "disabled");
    },
    //:matches(:matches(:radio, :checkbox)[checked], :selected) (TODO menuitem)
    checked: function (elem, adapter) {
        return (adapter.hasAttrib(elem, "checked") ||
            exports.pseudos.selected(elem, adapter));
    },
    //:matches(input, select, textarea)[required]
    required: function (elem, adapter) {
        return adapter.hasAttrib(elem, "required");
    },
    //:matches(input, select, textarea):not([required])
    optional: function (elem, adapter) {
        return !adapter.hasAttrib(elem, "required");
    },
    //jQuery extensions
    //:not(:empty)
    parent: function (elem, adapter) {
        return !exports.pseudos.empty(elem, adapter);
    },
    //:matches(h1, h2, h3, h4, h5, h6)
    header: namePseudo(["h1", "h2", "h3", "h4", "h5", "h6"]),
    //:matches(button, input[type=button])
    button: function (elem, adapter) {
        var name = adapter.getName(elem);
        return (name === "button" ||
            (name === "input" &&
                adapter.getAttributeValue(elem, "type") === "button"));
    },
    //:matches(input, textarea, select, button)
    input: namePseudo(["input", "textarea", "select", "button"]),
    //input:matches(:not([type!='']), [type='text' i])
    text: function (elem, adapter) {
        var attr;
        return (adapter.getName(elem) === "input" &&
            (!(attr = adapter.getAttributeValue(elem, "type")) ||
                attr.toLowerCase() === "text"));
    }
};
function namePseudo(names) {
    if (typeof Set !== "undefined") {
        var nameSet_1 = new Set(names);
        return function (elem, adapter) {
            return nameSet_1.has(adapter.getName(elem));
        };
    }
    return function (elem, adapter) {
        return names.includes(adapter.getName(elem));
    };
}
function verifyArgs(func, name, subselect) {
    if (subselect === null) {
        if (func.length > 2 && name !== "scope") {
            throw new Error("pseudo-selector :" + name + " requires an argument");
        }
    }
    else {
        if (func.length === 2) {
            throw new Error("pseudo-selector :" + name + " doesn't have any arguments");
        }
    }
}
//FIXME this feels hacky
var reCSS3 = /^(?:(?:nth|last|first|only)-(?:child|of-type)|root|empty|(?:en|dis)abled|checked|not)$/;
function compile(next, data, options, context) {
    var name = data.name;
    var subselect = data.data;
    var adapter = options.adapter;
    if (options && options.strict && !reCSS3.test(name)) {
        throw new Error(":" + name + " isn't part of CSS3");
    }
    // @ts-ignore
    var filter = exports.filters[name];
    // @ts-ignore
    var pseudo = exports.pseudos[name];
    if (typeof filter === "function") {
        return filter(next, subselect, options, context);
    }
    else if (typeof pseudo === "function") {
        verifyArgs(pseudo, name, subselect);
        return pseudo === boolbase_1.falseFunc
            ? boolbase_1.falseFunc
            : next === boolbase_1.trueFunc
                ? function (elem) { return pseudo(elem, adapter, subselect); }
                : function (elem) { return pseudo(elem, adapter, subselect) && next(elem); };
    }
    else {
        throw new Error("unmatched pseudo-class :" + name);
    }
}
exports.compile = compile;
