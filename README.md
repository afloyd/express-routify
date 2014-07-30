#express-routify
===============

Automagik mapping of routes for express (v4). Uses folder structure to build routes. Also automatically works with parameterized routes by adding '_' before the parameter name as the directory name where it should mount

##Example usage (https://github.com/afloyd/express-routify-example):
###Basic folder structure
```
\app.js
\routes\index.js
\routes\routes.js
\routes\user\index.js
\routes\user\_userid\index.js
\routes\user\_userid\profilePhoto.js
```

##Description
With the given file structure above (and the routes below) you would get the following:
```
  GET     /
  GET     /routes
  GET     /user
  POST    /user
  POST    /user/:userId
  DELETE  /user/:userId
  GET     /user/:userId/profilePhoto  
```

Note `/user/:userId/profilePhoto` is camel cased but file name is not, this is default behavior. If you wish to preserve the original naming style, pass in the option `convertDashedNames: false` when instantiating express-routify


There's another little bonus to using this module... It will automatically analyze/return your routes and verbs used! In addition, if you attach any properties to your route function, then they will be included. For example, if you want your route definition to let users know it accepts `firstname`, `lastName`, and `email` simple do something like:
 ```
 module.exports = function (router, mountPath, opts) {
 	router.route('/')
 		.get(getUser);
 };
 function getUser(req, res, next) {
    res.json({photoUrl: '/photo/userId-' + res.locals.userId + '.jpg'});
 })
 getUser.prototype.body = {
    email: 'String',
    firstName: 'String',
    lastName: 'String'
 };
 ```
Now you can then easily expose via a /routes path all available routing paths... Useful for super simple mapping of an API!



Another cool feature is being able to pass data like a constructor into your routing files! When instantiating express-routify, the `routeOpts` object is passed into every route file. The exports signature for the routing file should look something like:

`module.exports = function (router, mountPath, opts) {...}`

`router`: The express.Router() object with the app mounting path already specific. You can add further sub-routing from here if you desire... Although there's no need when using this module ;)

`mountPath`: This is the (relative) path the router was mounted to on the app

`opts`: This is a customizeable param paseed in through the `routeOpts` during initialization. If `routeOpts` is an array then it will be passed into the router through function.apply. So if you prefer to have named arguments you can use that style.


###Options
```
.routesPath				{String}	The routes directory (default: 'routes')

.recursive				{Boolean}	Recurse through entire routes directory (default: true)

.routeOpts				{Object}	Data to pass to route handler. If array will use function.apply to "spread" arguments (default: {})
.mountPath				{String}	The root path to mount the routes. Useful for multi-applications, or APIs (default: '/')

.sortRoutes				{Boolean)	Whether to "sort" the returned routes, or keep original order. Note, object key ordering isn't guaranteed even when sorting due to the nature of JavaScript Objects
.getRoutes				{Boolean}	Whether or not to perform route inspection/return (default: true)

.convertDashedNames		{Boolean}	Convert dashed route handler names to camelCase for routing (default: true)
```

###Notes
This module does not use any "expensive" method (like creating errors to analyze stack trace) for determining file structure, it just progressivly appends more folder names as it digs deeper into the hierarchy... And no hackery of private methods of express, just using the native express API with `express.Router()` All that just to say it works pretty fast!

With all good things there's usually some caveat, and this is no exception... I've noticed that creation of the router params (`:someParam` in route) needs to be done on the express `app` object instead of on the given `router` passed into the routing file. In the example I've passed in the `app` object through the `routeOpts` property, so that any routing params that need to be added can be... 

There's probably many more features that can (and probably will) be added. If you can think of any yourself write 'em up and issue a pull request. And I'm sure there's probably bugs, because I wrote all this really quickly one day. If you find any please submit an issue. :)





###File data --
####\app.js
```
var app = require('express')();
/*usual express initialization config
  .
  .
*/

var lib = require('./lib'); //just a plain object {}
lib.routes = require('express-routify')(app, {
	routeOpts : {lib: lib, app: app}
	//,excludeFiles : [],       //can be either string file names, or regex expressions matched again full file path
	//,mountPath: '/'  //default -- useful for APIs where you can prepend a version numer (ie '/v0.1') ;)
	//,routesPath : 'routes'  //default
	//,recursive : true //default
});
```
####\routes\index.js
```
module.exports = function (router, mountPath, opts) {
	/* GET home page. */
	router.route('/')
		.get(function(req, res) {
			res.render('index', { title: 'Express' });
	});
};
```
####\routes\routes.js
```
module.exports = function (router, mountPath, opts) {
	router.route('/')
		.get(function getRoutes(req, res, next) {
			console.log('routes', require('util').inspect(opts.lib.routes, 0, null, true));
			res.json({routes: opts.lib.routes});
		});
};
```
####\user\index.js
```
module.exports = function (router, mountPath, opts) {
	router.route('/')
		.get(function (req, res, next) {
			res.render('user', {
				name: 'foo',
				email: 'foo@bar.com'
			});
		})
		.post(function (req, res, next) {
			res.json({
				id: Math.round(Math.random()*1000), //just something to randomize the data returned
				name: req.body.name,
				email: req.body.email
			});
		});
};
```
####\user\_user\index.js
```
module.exports = function (router, mountPath, opts) {
	router.route('/')
		.get(function (req, res, next) {
			res.render('user', {
				name: 'foo',
				email: 'foo@bar.com'
			});
		})
		.post(function (req, res, next) {
			res.json({
				id: Math.round(Math.random()*1000), //just something to randomize the data returned
				name: req.body.name,
				email: req.body.email
			});
		});
};
```
####\user\_user\profile-photo
```
module.exports = function (router, mountPath, opts) {
	router.route('/')
		.get(function (req, res, next) {
			res.json({photoUrl: '/photo/userId-' + res.locals.userId + '.jpg'});
		})
};
```

#####License:

The MIT License (MIT)

Copyright (c) 2014 Austin Floyd (texsc98@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
