OpenShift 3 Static Assets
=========================
The static assets for OpenShift v3.  This includes the web management console.

Contributing
------------

#### Getting started
1. Install [Nodejs](http://nodejs.org/) and npm
2. `npm install -g grunt-cli bower`  - may need to be run with sudo
3. From the assets directory run `npm install` to install all the dev dependencies
4. Run `grunt serve` to launch the console and start watching for asset changes

#### Before opening a pull request
1. Run the test suite with `grunt test`
2. Rebase and squash changes to a single commit