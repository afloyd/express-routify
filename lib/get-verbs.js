module.exports = function getVerbs(mountPath, router) {
	if (!router) { throw Error('router not defined!'); }
	return digVerbs(mountPath, [], router);
};

function digVerbs(mountPath, obj, router) {
	router.stack.forEach(function (stackItem) {
		var path = mountPath;

		//Ignore router params
		if (!stackItem.route) {return;}

		if (stackItem.route.path.length > 1) {
			path += stackItem.route.path;
		}

		var route = {url:mountPath};
		obj.push(route);

		stackItem.route.stack.forEach(function (verbRoute) {
			var method = {url:path};
			if (verbRoute.handle) {
				if (verbRoute.handle.prototype.body) {
					method.body = verbRoute.handle.prototype.body;
				}
				if (verbRoute.handle.prototype.query) {
					method.query = verbRoute.handle.prototype.query;
				}
			}

			var verb = route[verbRoute.method];
			if (!verb) {
				return route[verbRoute.method] = method;
			} else {
				verb = [verb];
			}
			verb.push(method);
		});
	});
	return obj;
}