const assert = require("assert");
const decircularize = require("../../decircularize");
const helper = require("../../tools/helper.js");
const CSSselect = helper.CSSselect;
const path = require("path");
const docPath = path.join(__dirname, "index.html");
let document = null;

//in this module, the only use-case is to compare arrays of
function deepEqual(a, b, msg) {
    try {
        assert.deepEqual(decircularize(a), decircularize(b), msg);
    } catch (e) {
        e.actual = JSON.stringify(a.map(getId), 0, 2);
        e.expected = JSON.stringify(b.map(getId), 0, 2);
        throw e;
    }

    function getId(n) {
        return n && n.attribs.id;
    }
}

function loadDoc() {
    return (document = helper.getDocument(docPath));
}

module.exports = {
    q,
    t,
    loadDoc,
    createWithFriesXML
};

/**
 * Returns an array of elements with the given IDs
 * @example q("main", "foo", "bar")
 * @result [<div id="main">, <span id="foo">, <input id="bar">]
 */
function q() {
    const r = [];
    let i = 0;

    for (; i < arguments.length; i++) {
        r.push(document.getElementById(arguments[i]));
    }
    return r;
}

/**
 * Asserts that a select matches the given IDs
 * @param {String} a - Assertion name
 * @param {String} b - Sizzle selector
 * @param {String} c - Array of ids to construct what is expected
 * @example t("Check for something", "//[a]", ["foo", "baar"]);
 * @result returns true if "//[a]" return two elements with the IDs 'foo' and 'baar'
 */
function t(a, b, c) {
    const f = CSSselect.selectAll(b, document);
    let s = "";
    let i = 0;

    for (; i < f.length; i++) {
        s += `${s && ","}"${f[i].id}"`;
    }

    deepEqual(f, q.apply(q, c), a + " (" + b + ")");
}

const xmlDoc = helper.getDOMFromPath(path.join(__dirname, "fries.xml"), {
    xmlMode: true
});
const filtered = xmlDoc.filter(t => t.type === "tag");
xmlDoc.lastChild = filtered[filtered.length - 1];

function createWithFriesXML() {
    return xmlDoc;
}
