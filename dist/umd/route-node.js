(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.RouteNode = factory());
}(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };

    var makeOptions = function (opts) {
        if (opts === void 0) { opts = {}; }
        return ({
            arrayFormat: opts.arrayFormat || 'none',
            booleanFormat: opts.booleanFormat || 'none',
            nullFormat: opts.nullFormat || 'default'
        });
    };
    var encodeValue = function (value) { return encodeURIComponent(value); };
    var decodeValue = function (value) { return decodeURIComponent(value); };
    var encodeBoolean = function (name, value, opts) {
        if (opts.booleanFormat === 'empty-true' && value) {
            return name;
        }
        var encodedValue;
        if (opts.booleanFormat === 'unicode') {
            encodedValue = value ? '✓' : '✗';
        }
        else {
            encodedValue = value.toString();
        }
        return name + "=" + encodedValue;
    };
    var encodeNull = function (name, opts) {
        if (opts.nullFormat === 'hidden') {
            return '';
        }
        if (opts.nullFormat === 'string') {
            return name + "=null";
        }
        return name;
    };
    var getNameEncoder = function (opts) {
        if (opts.arrayFormat === 'index') {
            return function (name, index) { return name + "[" + index + "]"; };
        }
        if (opts.arrayFormat === 'brackets') {
            return function (name) { return name + "[]"; };
        }
        return function (name) { return name; };
    };
    var encodeArray = function (name, arr, opts) {
        var encodeName = getNameEncoder(opts);
        return arr
            .map(function (val, index) { return encodeName(name, index) + "=" + encodeValue(val); })
            .join('&');
    };
    var encode = function (name, value, opts) {
        if (value === null) {
            return encodeNull(name, opts);
        }
        if (typeof value === 'boolean') {
            return encodeBoolean(name, value, opts);
        }
        if (Array.isArray(value)) {
            return encodeArray(name, value, opts);
        }
        return name + "=" + encodeValue(value);
    };
    var decode = function (value, opts) {
        if (value === undefined) {
            return opts.booleanFormat === 'empty-true' ? true : null;
        }
        if (opts.booleanFormat === 'string') {
            if (value === 'true') {
                return true;
            }
            if (value === 'false') {
                return false;
            }
        }
        else if (opts.booleanFormat === 'unicode') {
            if (decodeValue(value) === '✓') {
                return true;
            }
            if (decodeValue(value) === '✗') {
                return false;
            }
        }
        else if (opts.nullFormat === 'string') {
            if (value === 'null') {
                return null;
            }
        }
        return decodeValue(value);
    };

    var getSearch = function (path) {
        var pos = path.indexOf('?');
        if (pos === -1) {
            return path;
        }
        return path.slice(pos + 1);
    };
    var isSerialisable = function (val) { return val !== undefined; };
    var parseName = function (name) {
        var bracketPosition = name.indexOf('[');
        var hasBrackets = bracketPosition !== -1;
        return {
            hasBrackets: hasBrackets,
            name: hasBrackets ? name.slice(0, bracketPosition) : name
        };
    };

    /**
     * Parse a querystring and return an object of parameters
     */
    var parse = function (path, opts) {
        var options = makeOptions(opts);
        return getSearch(path)
            .split('&')
            .reduce(function (params, param) {
            var _a = param.split('='), rawName = _a[0], value = _a[1];
            var _b = parseName(rawName), hasBrackets = _b.hasBrackets, name = _b.name;
            var currentValue = params[name];
            var decodedValue = decode(value, options);
            if (currentValue === undefined) {
                params[name] = hasBrackets ? [decodedValue] : decodedValue;
            }
            else {
                params[name] = [].concat(currentValue, decodedValue);
            }
            return params;
        }, {});
    };
    /**
     * Build a querystring from an object of parameters
     */
    var build = function (params, opts) {
        var options = makeOptions(opts);
        return Object.keys(params)
            .filter(function (paramName) { return isSerialisable(params[paramName]); })
            .map(function (paramName) { return encode(paramName, params[paramName], options); })
            .filter(Boolean)
            .join('&');
    };
    /**
     * Remove a list of parameters from a querystring
     */
    var omit = function (path, paramsToOmit, opts) {
        var options = makeOptions(opts);
        var searchPart = getSearch(path);
        if (searchPart === '') {
            return {
                querystring: '',
                removedParams: {}
            };
        }
        var _a = path.split('&').reduce(function (_a, chunk) {
            var left = _a[0], right = _a[1];
            var rawName = chunk.split('=')[0];
            var name = parseName(rawName).name;
            return paramsToOmit.indexOf(name) === -1
                ? [left.concat(chunk), right]
                : [left, right.concat(chunk)];
        }, [[], []]), kept = _a[0], removed = _a[1];
        return {
            querystring: kept.join('&'),
            removedParams: parse(removed.join('&'), options)
        };
    };

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign$1 = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };

    var defaultOrConstrained = function (match) {
        return '(' +
            (match ? match.replace(/(^<|>$)/g, '') : "[a-zA-Z0-9-_.~%':|=+\\*@]+") +
            ')';
    };
    var rules = [
        {
            name: 'url-parameter',
            pattern: /^:([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})(<(.+?)>)?/,
            regex: function (match) {
                return new RegExp(defaultOrConstrained(match[2]));
            }
        },
        {
            name: 'url-parameter-splat',
            pattern: /^\*([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})/,
            regex: /([^?]*)/
        },
        {
            name: 'url-parameter-matrix',
            pattern: /^;([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})(<(.+?)>)?/,
            regex: function (match) {
                return new RegExp(';' + match[1] + '=' + defaultOrConstrained(match[2]));
            }
        },
        {
            name: 'query-parameter',
            pattern: /^(?:\?|&)(?::)?([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})/
        },
        {
            name: 'delimiter',
            pattern: /^(\/|\?)/,
            regex: function (match) { return new RegExp('\\' + match[0]); }
        },
        {
            name: 'sub-delimiter',
            pattern: /^(!|&|-|_|\.|;)/,
            regex: function (match) { return new RegExp(match[0]); }
        },
        {
            name: 'fragment',
            pattern: /^([0-9a-zA-Z]+)/,
            regex: function (match) { return new RegExp(match[0]); }
        }
    ];

    var tokenise = function (str, tokens) {
        if (tokens === void 0) { tokens = []; }
        // Look for a matching rule
        var matched = rules.some(function (rule) {
            var match = str.match(rule.pattern);
            if (!match) {
                return false;
            }
            tokens.push({
                type: rule.name,
                match: match[0],
                val: match.slice(1, 2),
                otherVal: match.slice(2),
                regex: rule.regex instanceof Function ? rule.regex(match) : rule.regex
            });
            if (match[0].length < str.length) {
                tokens = tokenise(str.substr(match[0].length), tokens);
            }
            return true;
        });
        // If no rules matched, throw an error (possible malformed path)
        if (!matched) {
            throw new Error("Could not parse path '" + str + "'");
        }
        return tokens;
    };

    var identity = function (_) { return _; };
    var exists = function (val) { return val !== undefined && val !== null; };
    var optTrailingSlash = function (source, strictTrailingSlash) {
        if (strictTrailingSlash) {
            return source;
        }
        if (source === '\\/') {
            return source;
        }
        return source.replace(/\\\/$/, '') + '(?:\\/)?';
    };
    var upToDelimiter = function (source, delimiter) {
        if (!delimiter) {
            return source;
        }
        return /(\/)$/.test(source) ? source : source + '(\\/|\\?|\\.|;|$)';
    };
    var appendQueryParam = function (params, param, val) {
        if (val === void 0) { val = ''; }
        var existingVal = params[param];
        if (existingVal === undefined) {
            params[param] = val;
        }
        else {
            params[param] = Array.isArray(existingVal)
                ? existingVal.concat(val)
                : [existingVal, val];
        }
        return params;
    };
    var Path = /** @class */ (function () {
        function Path(path) {
            if (!path) {
                throw new Error('Missing path in Path constructor');
            }
            this.path = path;
            this.tokens = tokenise(path);
            this.hasUrlParams =
                this.tokens.filter(function (t) { return /^url-parameter/.test(t.type); }).length > 0;
            this.hasSpatParam =
                this.tokens.filter(function (t) { return /splat$/.test(t.type); }).length > 0;
            this.hasMatrixParams =
                this.tokens.filter(function (t) { return /matrix$/.test(t.type); }).length > 0;
            this.hasQueryParams =
                this.tokens.filter(function (t) { return /^query-parameter/.test(t.type); }).length > 0;
            // Extract named parameters from tokens
            this.spatParams = this.getParams('url-parameter-splat');
            this.urlParams = this.getParams(/^url-parameter/);
            // Query params
            this.queryParams = this.getParams('query-parameter');
            // All params
            this.params = this.urlParams.concat(this.queryParams);
            // Check if hasQueryParams
            // Regular expressions for url part only (full and partial match)
            this.source = this.tokens
                .filter(function (t) { return t.regex !== undefined; })
                .map(function (r) { return r.regex.source; })
                .join('');
        }
        Path.createPath = function (path) {
            return new Path(path);
        };
        Path.prototype.isQueryParam = function (name) {
            return this.queryParams.indexOf(name) !== -1;
        };
        Path.prototype.test = function (path, opts) {
            var _this = this;
            var options = __assign$1({ strictTrailingSlash: false, queryParams: {} }, opts);
            // trailingSlash: falsy => non optional, truthy => optional
            var source = optTrailingSlash(this.source, options.strictTrailingSlash);
            // Check if exact match
            var match = this.urlTest(path, source + (this.hasQueryParams ? '(\\?.*$|$)' : '$'), opts);
            // If no match, or no query params, no need to go further
            if (!match || !this.hasQueryParams) {
                return match;
            }
            // Extract query params
            var queryParams = parse(path, options.queryParams);
            var unexpectedQueryParams = Object.keys(queryParams).filter(function (p) { return !_this.isQueryParam(p); });
            if (unexpectedQueryParams.length === 0) {
                // Extend url match
                Object.keys(queryParams).forEach(function (p) { return (match[p] = queryParams[p]); });
                return match;
            }
            return null;
        };
        Path.prototype.partialTest = function (path, opts) {
            var _this = this;
            var options = __assign$1({ delimited: true, queryParams: {} }, opts);
            // Check if partial match (start of given path matches regex)
            // trailingSlash: falsy => non optional, truthy => optional
            var source = upToDelimiter(this.source, options.delimited);
            var match = this.urlTest(path, source, options);
            if (!match) {
                return match;
            }
            if (!this.hasQueryParams) {
                return match;
            }
            var queryParams = parse(path, options.queryParams);
            Object.keys(queryParams)
                .filter(function (p) { return _this.isQueryParam(p); })
                .forEach(function (p) { return appendQueryParam(match, p, queryParams[p]); });
            return match;
        };
        Path.prototype.build = function (params, opts) {
            var _this = this;
            if (params === void 0) { params = {}; }
            var options = __assign$1({ ignoreConstraints: false, ignoreSearch: false, queryParams: {} }, opts);
            var encodedUrlParams = Object.keys(params)
                .filter(function (p) { return !_this.isQueryParam(p); })
                .reduce(function (acc, key) {
                if (!exists(params[key])) {
                    return acc;
                }
                var val = params[key];
                var encode = _this.isQueryParam(key) ? identity : encodeURI;
                if (typeof val === 'boolean') {
                    acc[key] = val;
                }
                else if (Array.isArray(val)) {
                    acc[key] = val.map(encode);
                }
                else {
                    acc[key] = encode(val);
                }
                return acc;
            }, {});
            // Check all params are provided (not search parameters which are optional)
            if (this.urlParams.some(function (p) { return !exists(params[p]); })) {
                var missingParameters = this.urlParams.filter(function (p) { return !exists(params[p]); });
                throw new Error("Cannot build path: '" +
                    this.path +
                    "' requires missing parameters { " +
                    missingParameters.join(', ') +
                    ' }');
            }
            // Check constraints
            if (!options.ignoreConstraints) {
                var constraintsPassed = this.tokens
                    .filter(function (t) {
                    return /^url-parameter/.test(t.type) && !/-splat$/.test(t.type);
                })
                    .every(function (t) {
                    return new RegExp('^' + defaultOrConstrained(t.otherVal[0]) + '$').test(encodedUrlParams[t.val]);
                });
                if (!constraintsPassed) {
                    throw new Error("Some parameters of '" + this.path + "' are of invalid format");
                }
            }
            var base = this.tokens
                .filter(function (t) { return /^query-parameter/.test(t.type) === false; })
                .map(function (t) {
                if (t.type === 'url-parameter-matrix') {
                    return ";" + t.val + "=" + encodedUrlParams[t.val[0]];
                }
                return /^url-parameter/.test(t.type)
                    ? encodedUrlParams[t.val[0]]
                    : t.match;
            })
                .join('');
            if (options.ignoreSearch) {
                return base;
            }
            var searchParams = this.queryParams
                .filter(function (p) { return Object.keys(params).indexOf(p) !== -1; })
                .reduce(function (sparams, paramName) {
                sparams[paramName] = params[paramName];
                return sparams;
            }, {});
            var searchPart = build(searchParams, options.queryParams);
            return searchPart ? base + '?' + searchPart : base;
        };
        Path.prototype.getParams = function (type) {
            var predicate = type instanceof RegExp
                ? function (t) { return type.test(t.type); }
                : function (t) { return t.type === type; };
            return this.tokens.filter(predicate).map(function (t) { return t.val[0]; });
        };
        Path.prototype.urlTest = function (path, source, _a) {
            var _this = this;
            var _b = (_a === void 0 ? {} : _a).caseSensitive, caseSensitive = _b === void 0 ? false : _b;
            var regex = new RegExp('^' + source, caseSensitive ? '' : 'i');
            var match = path.match(regex);
            if (!match) {
                return null;
            }
            else if (!this.urlParams.length) {
                return {};
            }
            // Reduce named params to key-value pairs
            return match
                .slice(1, this.urlParams.length + 1)
                .reduce(function (params, m, i) {
                params[_this.urlParams[i]] = decodeURIComponent(m);
                return params;
            }, {});
        };
        return Path;
    }());

    var getMetaFromSegments = function (segments) {
        var accName = '';
        return segments.reduce(function (meta, segment) {
            var urlParams = segment.parser.urlParams.reduce(function (params, p) {
                params[p] = 'url';
                return params;
            }, {});
            var allParams = segment.parser.queryParams.reduce(function (params, p) {
                params[p] = 'query';
                return params;
            }, urlParams);
            if (segment.name !== undefined) {
                accName = accName ? accName + '.' + segment.name : segment.name;
                meta[accName] = allParams;
            }
            return meta;
        }, {});
    };
    var buildStateFromMatch = function (match) {
        if (!match || !match.segments || !match.segments.length) {
            return null;
        }
        var name = match.segments
            .map(function (segment) { return segment.name; })
            .filter(function (name) { return name; })
            .join('.');
        var params = match.params;
        return {
            name: name,
            params: params,
            meta: getMetaFromSegments(match.segments)
        };
    };
    var buildPathFromSegments = function (segments, params, options) {
        if (params === void 0) { params = {}; }
        if (options === void 0) { options = {}; }
        if (!segments) {
            return null;
        }
        var _a = options.queryParamsMode, queryParamsMode = _a === void 0 ? 'default' : _a, _b = options.trailingSlashMode;
        var searchParams = [];
        var nonSearchParams = [];
        for (var _i = 0, segments_1 = segments; _i < segments_1.length; _i++) {
            var segment = segments_1[_i];
            var parser = segment.parser;
            searchParams.push.apply(searchParams, parser.queryParams);
            nonSearchParams.push.apply(nonSearchParams, parser.urlParams);
            nonSearchParams.push.apply(nonSearchParams, parser.spatParams);
        }
        if (queryParamsMode === 'loose') {
            var extraParams = Object.keys(params).reduce(function (acc, p) {
                return searchParams.indexOf(p) === -1 &&
                    nonSearchParams.indexOf(p) === -1
                    ? acc.concat(p)
                    : acc;
            }, []);
            searchParams.push.apply(searchParams, extraParams);
        }
        var searchParamsObject = searchParams.reduce(function (acc, paramName) {
            if (Object.keys(params).indexOf(paramName) !== -1) {
                acc[paramName] = params[paramName];
            }
            return acc;
        }, {});
        var searchPart = build(searchParamsObject, options.queryParams);
        var path = segments
            .reduce(function (path, segment) {
            var segmentPath = segment.parser.build(params, {
                ignoreSearch: true,
                queryParams: options.queryParams
            });
            return segment.absolute ? segmentPath : path + segmentPath;
        }, '')
            .replace(/\/\/{1,}/g, '/');
        var finalPath = path;
        if (options.trailingSlashMode === 'always') {
            finalPath = /\/$/.test(path) ? path : path + "/";
        }
        else if (options.trailingSlashMode === 'never' && path !== '/') {
            finalPath = /\/$/.test(path) ? path.slice(0, -1) : path;
        }
        return finalPath + (searchPart ? '?' + searchPart : '');
    };
    var getPathFromSegments = function (segments) {
        return segments ? segments.map(function (segment) { return segment.path; }).join('') : null;
    };

    var getPath = function (path) { return path.split('?')[0]; };
    var getSearch$1 = function (path) { return path.split('?')[1] || ''; };
    var matchChildren = function (nodes, pathSegment, currentMatch, options, consumedBefore) {
        if (options === void 0) { options = {}; }
        var _a = options.queryParamsMode, queryParamsMode = _a === void 0 ? 'default' : _a, _b = options.strictTrailingSlash, strictTrailingSlash = _b === void 0 ? false : _b, _c = options.strongMatching, strongMatching = _c === void 0 ? true : _c, _d = options.caseSensitive, caseSensitive = _d === void 0 ? false : _d;
        var isRoot = nodes.length === 1 && nodes[0].name === '';
        var _loop_1 = function (child) {
            // Partially match path
            var match;
            var remainingPath = void 0;
            var segment = pathSegment;
            if (consumedBefore === '/' && child.path === '/') {
                // when we encounter repeating slashes we add the slash
                // back to the URL to make it de facto pathless
                segment = '/' + pathSegment;
            }
            if (!child.children.length) {
                match = child.parser.test(segment, {
                    caseSensitive: caseSensitive,
                    strictTrailingSlash: strictTrailingSlash,
                    queryParams: options.queryParams
                });
            }
            if (!match) {
                match = child.parser.partialTest(segment, {
                    delimited: strongMatching,
                    caseSensitive: caseSensitive,
                    queryParams: options.queryParams
                });
            }
            if (match) {
                // Remove consumed segment from path
                var consumedPath = child.parser.build(match, {
                    ignoreSearch: true
                });
                if (!strictTrailingSlash && !child.children.length) {
                    consumedPath = consumedPath.replace(/\/$/, '');
                }
                remainingPath = segment.replace(new RegExp('^' + consumedPath, 'i'), '');
                if (!strictTrailingSlash && !child.children.length) {
                    remainingPath = remainingPath.replace(/^\/\?/, '?');
                }
                var querystring = omit(getSearch$1(segment.replace(consumedPath, '')), child.parser.queryParams, options.queryParams).querystring;
                remainingPath =
                    getPath(remainingPath) + (querystring ? "?" + querystring : '');
                if (!strictTrailingSlash &&
                    !isRoot &&
                    remainingPath === '/' &&
                    !/\/$/.test(consumedPath)) {
                    remainingPath = '';
                }
                currentMatch.segments.push(child);
                Object.keys(match).forEach(function (param) { return (currentMatch.params[param] = match[param]); });
                if (!isRoot && !remainingPath.length) {
                    return { value: currentMatch };
                }
                if (!isRoot &&
                    queryParamsMode !== 'strict' &&
                    remainingPath.indexOf('?') === 0) {
                    // unmatched queryParams in non strict mode
                    var remainingQueryParams_1 = parse(remainingPath.slice(1), options.queryParams);
                    Object.keys(remainingQueryParams_1).forEach(function (name) {
                        return (currentMatch.params[name] = remainingQueryParams_1[name]);
                    });
                    return { value: currentMatch };
                }
                // Continue matching on non absolute children
                var children = child.getNonAbsoluteChildren();
                // If no children to match against but unmatched path left
                if (!children.length) {
                    return { value: null };
                }
                return { value: matchChildren(children, remainingPath, currentMatch, options, consumedPath) };
            }
        };
        // for (child of node.children) {
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var child = nodes_1[_i];
            var state_1 = _loop_1(child);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return null;
    };

    var sortChildren = (function (originalChildren) { return function (left, right) {
        var leftPath = left.path
            .replace(/<.*?>/g, '')
            .split('?')[0]
            .replace(/(.+)\/$/, '$1');
        var rightPath = right.path
            .replace(/<.*?>/g, '')
            .split('?')[0]
            .replace(/(.+)\/$/, '$1');
        // '/' last
        if (leftPath === '/') {
            return 1;
        }
        if (rightPath === '/') {
            return -1;
        }
        // Spat params last
        if (left.parser.hasSpatParam) {
            return 1;
        }
        if (right.parser.hasSpatParam) {
            return -1;
        }
        // No spat, number of segments (less segments last)
        var leftSegments = (leftPath.match(/\//g) || []).length;
        var rightSegments = (rightPath.match(/\//g) || []).length;
        if (leftSegments < rightSegments) {
            return 1;
        }
        if (leftSegments > rightSegments) {
            return -1;
        }
        // Same number of segments, number of URL params ascending
        var leftParamsCount = left.parser.urlParams.length;
        var rightParamsCount = right.parser.urlParams.length;
        if (leftParamsCount < rightParamsCount) {
            return -1;
        }
        if (leftParamsCount > rightParamsCount) {
            return 1;
        }
        // Same number of segments and params, last segment length descending
        var leftParamLength = (leftPath.split('/').slice(-1)[0] || '').length;
        var rightParamLength = (rightPath.split('/').slice(-1)[0] || '').length;
        if (leftParamLength < rightParamLength) {
            return 1;
        }
        if (leftParamLength > rightParamLength) {
            return -1;
        }
        // Same last segment length, preserve definition order. Note that we
        // cannot just return 0, as sort is not guaranteed to be a stable sort.
        return originalChildren.indexOf(left) - originalChildren.indexOf(right);
    }; });

    var defaultBuildOptions = {
        queryParamsMode: 'default',
        trailingSlashMode: 'default'
    };
    var defaultMatchOptions = __assign({}, defaultBuildOptions, { strongMatching: true });
    var RouteNode = /** @class */ (function () {
        function RouteNode(name, path, childRoutes, cb, parent) {
            if (name === void 0) { name = ''; }
            if (path === void 0) { path = ''; }
            if (childRoutes === void 0) { childRoutes = []; }
            this.name = name;
            this.absolute = /^~/.test(path);
            this.path = this.absolute ? path.slice(1) : path;
            this.parser = this.path ? new Path(this.path) : null;
            this.children = [];
            this.parent = parent;
            this.checkParents();
            this.add(childRoutes, cb);
            return this;
        }
        RouteNode.prototype.getParentSegments = function (segments) {
            if (segments === void 0) { segments = []; }
            return this.parent && this.parent.parser
                ? this.parent.getParentSegments(segments.concat(this.parent))
                : segments.reverse();
        };
        RouteNode.prototype.setParent = function (parent) {
            this.parent = parent;
            this.checkParents();
        };
        RouteNode.prototype.setPath = function (path) {
            if (path === void 0) { path = ''; }
            this.path = path;
            this.parser = path ? new Path(path) : null;
        };
        RouteNode.prototype.add = function (route, cb) {
            var _this = this;
            if (route === undefined || route === null) {
                return;
            }
            if (route instanceof Array) {
                route.forEach(function (r) { return _this.add(r, cb); });
                return;
            }
            if (!(route instanceof RouteNode) && !(route instanceof Object)) {
                throw new Error('RouteNode.add() expects routes to be an Object or an instance of RouteNode.');
            }
            else if (route instanceof RouteNode) {
                route.setParent(this);
                this.addRouteNode(route);
            }
            else {
                if (!route.name || !route.path) {
                    throw new Error('RouteNode.add() expects routes to have a name and a path defined.');
                }
                var routeNode = new RouteNode(route.name, route.path, route.children, cb, this);
                var fullName = routeNode
                    .getParentSegments([routeNode])
                    .map(function (_) { return _.name; })
                    .join('.');
                if (cb) {
                    cb(__assign({}, route, { name: fullName }));
                }
                this.addRouteNode(routeNode);
            }
            return this;
        };
        RouteNode.prototype.addNode = function (name, path) {
            this.add(new RouteNode(name, path));
            return this;
        };
        RouteNode.prototype.getPath = function (routeName) {
            return getPathFromSegments(this.getSegmentsByName(routeName));
        };
        RouteNode.prototype.getNonAbsoluteChildren = function () {
            return this.children.filter(function (child) { return !child.absolute; });
        };
        RouteNode.prototype.buildPath = function (routeName, params, options) {
            if (params === void 0) { params = {}; }
            if (options === void 0) { options = {}; }
            var path = buildPathFromSegments(this.getSegmentsByName(routeName), params, options);
            return path;
        };
        RouteNode.prototype.buildState = function (name, params) {
            if (params === void 0) { params = {}; }
            var segments = this.getSegmentsByName(name);
            if (!segments || !segments.length) {
                return null;
            }
            return {
                name: name,
                params: params,
                meta: getMetaFromSegments(segments)
            };
        };
        RouteNode.prototype.matchPath = function (path, options) {
            if (options === void 0) { options = {}; }
            if (path === '' && !options.strictTrailingSlash) {
                path = '/';
            }
            var match = this.getSegmentsMatchingPath(path, options);
            if (match) {
                var matchedSegments = match.segments;
                if (matchedSegments[0].absolute) {
                    var firstSegmentParams = matchedSegments[0].getParentSegments();
                    matchedSegments.reverse();
                    matchedSegments.push.apply(matchedSegments, firstSegmentParams);
                    matchedSegments.reverse();
                }
                var lastSegment = matchedSegments[matchedSegments.length - 1];
                var lastSegmentSlashChild = lastSegment.findSlashChild();
                if (lastSegmentSlashChild) {
                    matchedSegments.push(lastSegmentSlashChild);
                }
            }
            return buildStateFromMatch(match);
        };
        RouteNode.prototype.addRouteNode = function (route, cb) {
            var names = route.name.split('.');
            if (names.length === 1) {
                // Check duplicated routes
                if (this.children.map(function (child) { return child.name; }).indexOf(route.name) !==
                    -1) {
                    throw new Error("Alias \"" + route.name + "\" is already defined in route node");
                }
                // Check duplicated paths
                if (this.children.map(function (child) { return child.path; }).indexOf(route.path) !==
                    -1) {
                    throw new Error("Path \"" + route.path + "\" is already defined in route node");
                }
                this.children.push(route);
                // Push greedy spats to the bottom of the pile
                var originalChildren = this.children.slice(0);
                this.children.sort(sortChildren(originalChildren));
            }
            else {
                // Locate parent node
                var segments = this.getSegmentsByName(names.slice(0, -1).join('.'));
                if (segments) {
                    route.name = names[names.length - 1];
                    segments[segments.length - 1].add(route);
                }
                else {
                    throw new Error("Could not add route named '" + route.name + "', parent is missing.");
                }
            }
            return this;
        };
        RouteNode.prototype.checkParents = function () {
            if (this.absolute && this.hasParentsParams()) {
                throw new Error('[RouteNode] A RouteNode with an abolute path cannot have parents with route parameters');
            }
        };
        RouteNode.prototype.hasParentsParams = function () {
            if (this.parent && this.parent.parser) {
                var parser = this.parent.parser;
                var hasParams = parser.hasUrlParams ||
                    parser.hasSpatParam ||
                    parser.hasMatrixParams ||
                    parser.hasQueryParams;
                return hasParams || this.parent.hasParentsParams();
            }
            return false;
        };
        RouteNode.prototype.findAbsoluteChildren = function () {
            return this.children.reduce(function (absoluteChildren, child) {
                return absoluteChildren
                    .concat(child.absolute ? child : [])
                    .concat(child.findAbsoluteChildren());
            }, []);
        };
        RouteNode.prototype.findSlashChild = function () {
            var slashChildren = this.getNonAbsoluteChildren().filter(function (child) { return child.parser && /^\/(\?|$)/.test(child.parser.path); });
            return slashChildren[0];
        };
        RouteNode.prototype.getSegmentsByName = function (routeName) {
            var findSegmentByName = function (name, routes) {
                var filteredRoutes = routes.filter(function (r) { return r.name === name; });
                return filteredRoutes.length ? filteredRoutes[0] : undefined;
            };
            var segments = [];
            var routes = this.parser ? [this] : this.children;
            var names = (this.parser ? [''] : []).concat(routeName.split('.'));
            var matched = names.every(function (name) {
                var segment = findSegmentByName(name, routes);
                if (segment) {
                    routes = segment.children;
                    segments.push(segment);
                    return true;
                }
                return false;
            });
            return matched ? segments : null;
        };
        RouteNode.prototype.getSegmentsMatchingPath = function (path, options) {
            var topLevelNodes = this.parser ? [this] : this.children;
            var startingNodes = topLevelNodes.reduce(function (nodes, node) { return nodes.concat(node, node.findAbsoluteChildren()); }, []);
            var currentMatch = {
                segments: [],
                params: {}
            };
            var finalMatch = matchChildren(startingNodes, path, currentMatch, options);
            if (finalMatch &&
                finalMatch.segments.length === 1 &&
                finalMatch.segments[0].name === '') {
                return null;
            }
            return finalMatch;
        };
        return RouteNode;
    }());

    return RouteNode;

})));
