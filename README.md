OneJS is a command-line utility for converting CommonJS packages to single, stand-alone JavaScript
files that can be run on web browsers.

# MOTIVATION

* **Reusability** OneJS lets developers code JavaScript for one platform and run everywhere, without requiring any additional effort.
* **Elegant Modularization** Modules and packages specs of CommonJS are what web apps exactly needs: a very well designed way to structure JavaScript code.
* **NPM** OneJS moves the revolution of NPM one step forward and makes it available for client-side projects!
* **No Spaghetti Code** No awkward headers, no framework-specific definitions.
* **Reliable code generation** OneJS doesn't change your source code. It generates a container that emulates a simple NodeJS environment.
* **Unobtrusive Code** OneJS puts all the content into an isolated JS object.

![](http://oi41.tinypic.com/aw2us3.jpg)

### Examples
* See the example project included in this repository
* MultiplayerChess.com ([Source Code](https://github.com/azer/multiplayerchess.com/tree/master/frontend) - [Output](http://multiplayerchess.com/mpc.js) )
* [ExpressJS built by OneJS](https://gist.github.com/2415048)
* [OneJS built by OneJS](https://gist.github.com/2998719)

# INSTALL
```bash
$ npm install one
```

# MANUAL

## First Steps

OneJS walks the modules and dependencies defined by package.json files. To create your bundle, just go a project directory and type `onejs build` command:

```
$ onejs build package.json bundle.js
```

**Experimenting the Bundle Script**

The output OneJS generates can be used by NodeJS, too. It's the easiest way of making sure if the output works or not.

```
> var exampleProject = require('./bundle');
> exampleProject.main() // calls main module, returns its exports
> exampleProject.require('./b') // each package object has a require method available for external calls
```

In the case what you need is to try it in web browsers, onejs has a "server" option that'll publish the source code at `localhost:1338` let you debug the output with Firebug Lite easily;

```
$ ../bin/onejs server example-project/package.json
```

**Requiring Global Variables**

OneJS doesn't change the way we access global variables. However, we may want to use require statements to access global variables (such as document, jQuery etc..) for purposes like dependency injection or documentation. Following example demonstrates the usage of `--tie` option that lets us require global variables;

```javascript
var $   = require('jquery'),
    dom = require('dom'),
    pi  = require('pi');

$(dom).ready(function(){
  console.log( pi == Math.PI ); // true
});
```

```bash
$ onejs build package.json --tie pi=Math.PI,jquery=jQuery,dom=document
```

**Excluding Specific Dependencies**

There are some cases we prefer to not have some dependency packages in the build. The `--exclude` option leads OneJS ignore the specified packages;

```bash
$ onejs build package.json --exclude underscore,request
```

If the case is to remove a duplication from the build, it would be a good idea to combine `--tie` and `--exclude` together;

```bash
$ onejs build package.json --exclude underscore --tie underscore=window._
```

### Command-Line API
```
usage: onejs [action] [manifest] [options]

Transforms NodeJS packages into single, stand-alone JavaScript files that can be run at other platforms. See the documentation at http://github.com/azer/onejs for more information.

actions:
  build      <manifest> <target>          Generate a stand-alone JavaScript file from specified package. Write output to <target> if given any.
  server     <manifest> <port> <host>     Publish generated JavaScript file on web. Uses 127.0.0.1:1338 by default.

options:
  --debug                                 Disable module caching.

  --tie <package name>=<global object>    Create package links to specified global variables. e.g; --tie dom=window.document,jquery=jQuery
  --exclude <package name>                Do not contain specified dependencies. e.g: --exclude underscore,request
  --plain                                 Builds the package within a minimalistic template for the packages with single module and no dependencies.

  --quiet                                 Make console output less verbose.
  --verbose                               Tell what's going on by being verbose.
  --version                               Show version and exit.
  --help                                  Show help.
```

### NodeJS API
```javascript
var one = require('one');

var manifest = 'path/to/manifest.json',
    target   = 'path/to/bundle.js',
    options  = {
      debug: true // see available options section below
    };

one.build(manifest, options, function(error, bundle){
  if(error) throw error;

  one.save(target, bundle, function(error){
    if(error) throw error;

    console.log('path/to/package.json built and saved to path/to/bundle.js successfully!');
  });
});
```

**Applying Filters**

Filtering filenames might be a useful option for specific cases such as splitting build to different pieces. Here is an example usage;

```javascript
var one = require('one');

one.modules.filters.push(function(filename){
    return filename.substring(0, 7) != 'lib/foo';
});
```

# Troubleshooting

* The most common issue is to lack some dependencies. In that case, make sure that the missing dependency is located under `node_modules/` properly.
* Enabling verbose mode might be helpful: `onejs build package.json --verbose`
* See the content of `projectName.map` object if it contains the missing dependency

# TESTING

Run `npm test` for running all test modules. And run `make test module=?` for specific test modules;

```bash
> make test module=build
```
