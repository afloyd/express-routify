var fileMagik = require('file-magik'),
	express = require('express');

/**
 * Performs automagic routing!
 * @param opts
 * 		.routesPath				{String}	The routes directory (default: 'routes')
 * 		.recursive				{Boolean}	Recurse through entire routes directory (default: true)
 * 		.routeOpts				{Object}	Data to pass to route handler. If array will use function.apply to "spread" arguments (default: {})
 * 		.mountPath				{String}	The root path to mount the routes. Useful for multi-applications, or APIs (default: '/')
 * 		.sortRoutes				{Boolean)	Whether to "sort" the returned routes, or keep original order. Note, object key ordering isn't guaranteed even when sorting due to the nature of JavaScript Objects
 * 		.getRoutes				{Boolean}	Whether or not to perform route inspection/return (default: true)
 * 		.convertDashedNames		{Boolean}	Convert dashed route handler names to camelCase for routing (default: true)
 * @type {expressRoutify}
 */
var expressRoutify = module.exports = function expressRoutify(app, opts) {
	if (!app) throw new Error('app not specified!');
	opts = opts || {}; //optional
	opts.routesPath = opts.routesPath || 'routes'; //optional
	opts.recursive = typeof opts.recursive !== 'undefined' ? opts.recursive : true; //optional
	opts.routeOpts = opts.routeOpts || {}; //optional
	opts.mountPath = opts.mountPath || '/';
	opts.sortRoutes = typeof opts.sortRoutes !== 'undefined' ? opts.sortRoutes : true;
	opts.getRoutes = typeof opts.getRoutes !== 'undefined' ? opts.getRoutes : true;

	var routePathMap = require('file-magik').mapPathsToObject(
		{
			path : opts.routesPath,
			excludeFiles : opts.excludeFiles,
			namespaceSubdirectories : opts.recursive
		}
	);

	var routeObj = {};
	routify(app, opts.mountPath, routePathMap, opts, routeObj);
	if (opts.sortRoutes) {
		return sortRoutes(routeObj);
	}
	return routeObj;
};

function routify(app, mountPath, routePathMap, opts, routeObj) {
	// Sort to make sure `_` names get processed last. Otherwise route params could get confused with "higher level"
	// 		routes in same folder. Object.keys doesn't necessarily return items "in order".
	// TODO: Make order of params configuration option?
	var routeNames = Object.keys(routePathMap).sort(function (a, b) {
		if (a[0] === '_') { return 1; }
		return 0;
	});
	for (var i = 0, iLen = routeNames.length; i < iLen; i++) {
		var name = routeNames[i],
			propertyValue = routePathMap[name];

		var name = name[0] !== '_' ? name : ':' + name.substring(1);

		if (typeof propertyValue !== 'string') {//handle sub-routes
			if (opts.recursive) {
				//routeObj[name] = {};
				routify(app, mountPath + '/' + name, propertyValue, opts, routeObj);
			}

			continue;
		}

		var fileExports = require(propertyValue),
			routeSuffix = name.toLowerCase() === 'index' ? '' : name,
			router = express.Router({ mergeParams: true }),
			routePath = mountPath + '/' + routeSuffix;
		routePath = routePath.replace(/\/\//gi, '/');
		if (!Array.isArray(opts.routeOpts)) {
			var routing = fileExports(router, routePath, opts.routeOpts);
			if (!routing) {
				routing = expressRoutify.getVerbs(routePath, router)
			}
			app.use(routePath, router);
			arrangeRoutes(routing, routeObj);
			continue;
		}

		//allows passing parameters that are later named arguments
		var routing = fileExports.apply(undefined, [router, routePath].concat(opts.routeOpts));
		if (!routing) {
			routing = this.getVerbs(routePath, router)
		}
		app.use(routePath, router);
		arrangeRoutes(routing, routeObj);
	}
}

function arrangeRoutes(routing, routeObj) {
	if (routing) {
		var urlIdxs = Object.keys(routing);
		for (var j = 0, jlen = urlIdxs.length; j < jlen; j++) {
			var routingObj = routing[j],
				url = routingObj.url;
			//handle setting or adding to url
			var routeObjUrl = routeObj[url];
			if (!routeObjUrl) {
				routeObj[url] = routingObj;
				continue;
			}

			var routingObjVerbIdxs = Object.keys(routingObj);
			for (var k = 0, klen = routingObjVerbIdxs.length; k < klen; k++) {
				var verbName = routingObjVerbIdxs[k],
					verbData = routingObj[verbName];
				if (verbName === 'url') continue;
				if (!routeObjUrl[verbName]) {
					routeObjUrl[verbName] = verbData;
					continue;
				}
				if (Array.isArray(routeObjUrl[verbName])) {
					routeObjUrl[verbName].push(verbData);
					continue;
				}

				routeObjUrl[verbName] = [routeObjUrl[verbName], verbData];
			}
		}
	}
}

function sortRoutes(routeObj) {
	var urlIdxs = Object.keys(routeObj);
	urlIdxs.sort(function (a,b) {
		if (a < b) return 1;
		if (b > b) return -1;
		return 0;
	});
	var sortedRoutes = {};
	for(var i = urlIdxs.length; i--;) {
		var url = urlIdxs[i];
		sortedRoutes[url] = routeObj[url];
	}
	return sortedRoutes;
}

expressRoutify.getVerbs = require('./lib/get-verbs');