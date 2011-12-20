OneJS is a command-line utility for converting CommonJS packages to single, stand-alone JavaScript
files that can be run on other JavaScript platforms such as web browsers, unity, silkjs etc.

# Motivation
* **Reusability** OneJS aims to let developers use JavaScript code on all environments that is able to execute JavaScript properly.
* **Elegant Modularization** OneJS lets web projects benefit from CommonJS, which is an excellent proposal that gives us a reusable, very well designed way to structure our source code.
* **NPM** OneJS lets web projects use a very well designed package manager, NPM!
* **No Sphagetti Code** No awkward headers, no framework specific module definitions that will be deprecated. 
* **Reliable code generation** OneJS doesn't change the source code. It only generates a container environment that behaves like NodeJS.
* **Unobtrusive Code** The source code OneJS generates wraps projects into a single JS object that takes the project name defined in package.json. 

### Examples
* See the example project included in this repository
* See MultiplayerChess.com's source code. Even though it uses an old tool that I stopped developing, it's coded in the CommonJS pattern.

# Install
```bash
$ npm install one
```

* Tip: Pass -g parameter to install it globally. *

# First Steps
FIXME
