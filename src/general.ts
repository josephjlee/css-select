import { compile as attribute } from "./attributes";
import { compile as pseudo } from "./pseudos";
import { CompiledQuery, InternalOptions } from "./types";
import { TagSelector, Traversal } from "css-what";

/*
	All available rules
*/
export default {
    "pseudo-element"() {
        throw new Error("Pseudo-elements are not supported by css-select");
    },

    attribute,
    pseudo,

    //tags
    tag(
        next: CompiledQuery,
        data: TagSelector,
        options: InternalOptions
    ): CompiledQuery {
        const name = data.name;
        const adapter = options.adapter;

        return function tag(elem: {}): boolean {
            return adapter.getName(elem) === name && next(elem);
        };
    },

    //traversal
    descendant(
        next: CompiledQuery,
        _data: Traversal,
        options: InternalOptions
    ): CompiledQuery {
        const isFalseCache =
            // eslint-disable-next-line no-undef
            typeof WeakSet !== "undefined" ? new WeakSet() : null;
        const adapter = options.adapter;

        return function descendant(elem: {}): boolean {
            let found = false;

            while (!found && (elem = adapter.getParent(elem))) {
                if (!isFalseCache || !isFalseCache.has(elem)) {
                    found = next(elem);
                    if (!found && isFalseCache) {
                        isFalseCache.add(elem);
                    }
                }
            }

            return found;
        };
    },
    _flexibleDescendant(
        next: CompiledQuery,
        _data: {},
        options: InternalOptions
    ): CompiledQuery {
        const adapter = options.adapter;

        // Include element itself, only used while querying an array
        return function descendant(elem: {}): boolean {
            let found = next(elem);

            while (!found && (elem = adapter.getParent(elem))) {
                found = next(elem);
            }

            return found;
        };
    },
    parent(
        next: CompiledQuery,
        _data: Traversal,
        options: InternalOptions
    ): CompiledQuery {
        if (options && options.strict) {
            throw new Error("Parent selector isn't part of CSS3");
        }

        const adapter = options.adapter;

        return function parent(elem: {}): boolean {
            return adapter.getChildren(elem).some(test);
        };

        function test(elem: {}): boolean {
            return adapter.isTag(elem) && next(elem);
        }
    },
    child(
        next: CompiledQuery,
        _data: Traversal,
        options: InternalOptions
    ): CompiledQuery {
        const adapter = options.adapter;

        return function child(elem: {}): boolean {
            const parent = adapter.getParent(elem);
            return !!parent && next(parent);
        };
    },
    sibling(
        next: CompiledQuery,
        _data: Traversal,
        options: InternalOptions
    ): CompiledQuery {
        const adapter = options.adapter;

        return function sibling(elem: {}): boolean {
            const siblings = adapter.getSiblings(elem);

            for (let i = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    if (next(siblings[i])) return true;
                }
            }

            return false;
        };
    },
    adjacent(
        next: CompiledQuery,
        _data: Traversal,
        options: InternalOptions
    ): CompiledQuery {
        const adapter = options.adapter;

        return function adjacent(elem: {}): boolean {
            const siblings = adapter.getSiblings(elem);
            let lastElement;

            for (let i = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    lastElement = siblings[i];
                }
            }

            return !!lastElement && next(lastElement);
        };
    },
    universal(next: CompiledQuery): CompiledQuery {
        return next;
    }
};
