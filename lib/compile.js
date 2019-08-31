"use strict";
/*
    Compiles a selector to an executable function
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var css_what_1 = require("css-what");
var boolbase_1 = require("boolbase");
var sort_1 = __importDefault(require("./sort"));
var procedure_1 = __importDefault(require("./procedure"));
var general_1 = __importDefault(require("./general"));
var pseudos_1 = require("./pseudos");
function compile(selector, options, context) {
    var next = compileUnsafe(selector, options, context);
    return wrap(next, options);
}
exports.compile = compile;
exports.Pseudos = { filters: pseudos_1.filters, pseudos: pseudos_1.pseudos };
function wrap(next, options) {
    var adapter = options.adapter;
    return function base(elem) {
        return adapter.isTag(elem) && next(elem);
    };
}
function compileUnsafe(selector, options, context) {
    var token = css_what_1.parse(selector, options);
    return compileToken(token, options, context);
}
exports.compileUnsafe = compileUnsafe;
function includesScopePseudo(t) {
    return (t.type === "pseudo" &&
        (t.name === "scope" ||
            (Array.isArray(t.data) &&
                t.data.some(function (data) { return data.some(includesScopePseudo); }))));
}
var DESCENDANT_TOKEN = { type: "descendant" };
// @ts-ignore
var FLEXIBLE_DESCENDANT_TOKEN = { type: "_flexibleDescendant" };
var SCOPE_TOKEN = { type: "pseudo", name: "scope", data: null };
var PLACEHOLDER_ELEMENT = {};
//CSS 4 Spec (Draft): 3.3.1. Absolutizing a Scope-relative Selector
//http://www.w3.org/TR/selectors4/#absolutizing
function absolutize(token, options, context) {
    var adapter = options.adapter;
    //TODO better check if context is document
    var hasContext = !!context &&
        !!context.length &&
        context.every(function (e) { return e === PLACEHOLDER_ELEMENT || !!adapter.getParent(e); });
    token.forEach(function (t) {
        if (t.length > 0 && isTraversal(t[0]) && t[0].type !== "descendant") {
            //don't return in else branch
        }
        else if (hasContext && !t.some(includesScopePseudo)) {
            t.unshift(DESCENDANT_TOKEN);
        }
        else {
            return;
        }
        t.unshift(SCOPE_TOKEN);
    });
}
function compileToken(token, options, context) {
    token = token.filter(function (t) { return t.length > 0; });
    token.forEach(sort_1.default);
    var isArrayContext = Array.isArray(context);
    context = (options && options.context) || context;
    if (context && !isArrayContext)
        context = [context];
    absolutize(token, options, context);
    var shouldTestNextSiblings = false;
    var query = token
        .map(function (rules) {
        if (rules.length >= 2) {
            var first = rules[0], second = rules[1];
            if (first.type !== "pseudo" || first.name !== "scope") {
                // ignore
            }
            else if (isArrayContext && second.type === "descendant") {
                rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
            }
            else if (second.type === "adjacent" ||
                second.type === "sibling") {
                shouldTestNextSiblings = true;
            }
        }
        return compileRules(rules, options, context);
    })
        .reduce(reduceRules, boolbase_1.falseFunc);
    // @ts-ignore
    query.shouldTestNextSiblings = shouldTestNextSiblings;
    return query;
}
exports.compileToken = compileToken;
function isTraversal(t) {
    return procedure_1.default[t.type] < 0;
}
function compileRules(rules, options, context) {
    return rules.reduce(function (previous, rule) {
        return previous === boolbase_1.falseFunc
            ? boolbase_1.falseFunc
            : general_1.default[rule.type](previous, 
            // @ts-ignore
            rule, options, context);
    }, (options && options.rootFunc) || boolbase_1.trueFunc);
}
function reduceRules(a, b) {
    if (b === boolbase_1.falseFunc || a === boolbase_1.trueFunc) {
        return a;
    }
    if (a === boolbase_1.falseFunc || b === boolbase_1.trueFunc) {
        return b;
    }
    return function combine(elem) {
        return a(elem) || b(elem);
    };
}
function containsTraversal(t) {
    return t.some(isTraversal);
}
//:not, :has and :matches have to compile selectors
//doing this in src/pseudos.ts would lead to circular dependencies,
//so we add them here
pseudos_1.filters.not = function (next, token, options, context) {
    var opts = {
        xmlMode: !!options.xmlMode,
        strict: !!options.strict,
        adapter: options.adapter
    };
    if (opts.strict) {
        if (token.length > 1 || token.some(containsTraversal)) {
            throw new Error("complex selectors in :not aren't allowed in strict mode");
        }
    }
    var func = compileToken(token, opts, context);
    if (func === boolbase_1.falseFunc)
        return next;
    if (func === boolbase_1.trueFunc)
        return boolbase_1.falseFunc;
    return function not(elem) {
        return !func(elem) && next(elem);
    };
};
pseudos_1.filters.has = function (next, token, options) {
    var adapter = options.adapter;
    var opts = {
        xmlMode: !!(options && options.xmlMode),
        strict: !!(options && options.strict),
        adapter: adapter
    };
    //FIXME: Uses an array as a pointer to the current element (side effects)
    var context = token.some(containsTraversal)
        ? [PLACEHOLDER_ELEMENT]
        : undefined;
    var func = compileToken(token, opts, context);
    if (func === boolbase_1.falseFunc)
        return boolbase_1.falseFunc;
    if (func === boolbase_1.trueFunc) {
        return function hasChild(elem) {
            return adapter.getChildren(elem).some(adapter.isTag) && next(elem);
        };
    }
    func = wrap(func, options);
    if (context) {
        return function has(elem) {
            return (next(elem) &&
                ((context[0] = elem),
                    adapter.existsOne(func, adapter.getChildren(elem))));
        };
    }
    return function has(elem) {
        return next(elem) && adapter.existsOne(func, adapter.getChildren(elem));
    };
};
pseudos_1.filters.matches = function (next, token, options, context) {
    var opts = {
        xmlMode: !!options.xmlMode,
        strict: !!options.strict,
        rootFunc: next,
        adapter: options.adapter
    };
    return compileToken(token, opts, context);
};
