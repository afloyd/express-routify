var fileMagik = require('file-magik'),
    express = require('express');

module.exports = function expressRoutify(app, opts) {
    opts = opts || {}; //optional
    opts.routesPath = opts.routesPath || 'routes'; //optional
    opts.recursive = typeof opts.recursive !== 'undefined' ? opts.recursive : true; //optional
    opts.routeOpts = opts.routeOpts || {}; //optional
    opts.mountPath = opts.mountPath || '/';

    var routePathMap = require('file-magik').mapPathsToObject(
        {
            path : opts.routesPath,
            excludeFiles : opts.excludeFiles,
            namespaceSubdirectories : opts.recursive
        }
    );

    var routeObj = {};
    routify(app, opts.mountPath, routePathMap, opts, routeObj);
    return routeObj;
};

function routify(app, mountPath, routePathMap, opts, routeObj) {
    var routeNames = Object.keys(routePathMap);
    for (var i= routeNames.length;i--;) {
        var name = routeNames[i],
            propertyValue = routePathMap[name];

        var name = name[0] !== '_' ? name : ':' + name.substring(1);

        if (typeof propertyValue !== 'string') {//handle sub-routes
            if (opts.recursive) {
                routeObj[name] = {};
                routify(app, mountPath + '/' + name, propertyValue, opts, routeObj[name]);
            }

            continue;
        }

        var fileExports = require(propertyValue),
            routeSuffix = name.toLowerCase() === 'index' ? '' : name,
            router = express.Router(),
            routePath = mountPath + '/' + routeSuffix;
		routePath = routePath.replace(/\/\//gi, '/');
        if (!Array.isArray(opts.routeOpts)) {
            routeObj[name] = fileExports(router, routePath, opts.routeOpts);
            app.use(routePath, router);
            continue;
        }

		//allows passing parameters that are later named arguments
        routeObj[name] = fileExports.apply(undefined, [router, routePath].concat(opts.routeOpts));
        app.use(routePath, router);
    }
}