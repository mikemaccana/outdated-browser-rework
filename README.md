# Outdated Browser Rework

Detects outdated browsers and advises users to upgrade to a new version. Handles mobile devices!

This is a fork of [Burocratik](http://www.burocratik.com)'s Outdated Browser, adding a number of new features including:

 - Explicit browser version support
 - Mobile browser support
 - Edge support
 - Substantial size reduction
 - More translations
 - Unminified code

And more (see below for the full list).

One of the challenges with making this type of module is that the JS and CSS **can't use any current tech** - the 'get a new browser' message must display on older browsers - so yes, this is hard. This module is tested all the way back to IE6.

This module does not need jQuery.

## Demo

Outdated Browser Rework was created by, for, an is used in production at, [EV HTTPS provider CertSimple](https://certsimple.com). You can see it working there.

## Usage

In modern times we normally concatenate and combine different JS files using `npm` and `browserify`, but it's best to bundle this particular package by itself, since other scripts may expect things like `console` and `function.bind()` to exist and won't work on old browsers - if you bundle this with other software, and an old browser tried to use the bundle, the JS will probably fail before outdated-browser has a chance to do any work.

### JS

### In your template

In `<head>`, before any other `script` tags:

	<script src="/js/dist/oldbrowser.js"></script>

### In `oldbrowser.js`

Start `outdated-browser-rework` and call it with your preferred options:

	var outdatedBrowserRework = require("outdated-browser-rework");

	outdatedBrowserRework();

If you like, specify options, eg:

	outdatedBrowserRework({
		browserSupport: {
			'Chrome': 57, // Includes Chrome for mobile devices
			'Edge': 39,
			'Safari': 10,
			'Mobile Safari': 10,
			'Firefox': 50,
			// You could specify a version here if you still support IE in 2017.
			// You could also instead seriously consider what you're doing with your time and budget
			'IE': false
		},
		requireChromeOnAndroid: true
	})

The particular versions used in this example are the defaults, by the way!

See below for more options.

Browsers that are __older__ than the versions supplied, or who use a browser where support is `false`,  will see a message, depending on their platform:

 - On desktop browsers, users will be directed to [outdatedbrowser.com](http://outdatedbrowser.com)
 - on iOS devices, users will be asked to visit the Settings app and upgrade their OS.
 - On Android devices, users will be directed to Chrome in Google Play.

#### Options

 - __browserSupport__:Object - A matrix of browsers and their major versions - see above for demo. Anything less will be unsupported. `false` means all versions are unsupported.
 - __requiredCssProperty__:String - A CSS property that must be supported.
 - __requireChromeOnAndroid__:Boolean - Ask Android users to install Chrome.

## SCSS

If you're using [sass-npm](https://www.npmjs.com/package/sass-npm) you can just import the npm module, and it will load `index.scss`:

	@import "outdated-browser-rework.scss";

Otherwise compile the sass and put it somewhere. Then load that via a `link` tag inside `<head>`:

	<link rel="stylesheet" href="/css/outdated-browser.css">

## HTML

Add the required HTML at the end of your document:

	<div id="outdated"></div>

Yes, [IDs suck](http://2ality.com/2012/08/ids-are-global.html) but old browsers don't support gettting elements by class name.

## For gulp users

Add the following underneath your existing `js` task:

		gulp
			.src('./public/js/src/oldbrowser.js')
			.pipe(browserify({
				debug : ! gulp.env.production
			}))
			.pipe(gulp.dest('./public/js/dist'))

Doing this will mean that `dist/oldbrowser.js` will only include `outdated-browser-rework` and its dependency `user-agent-parser`, without anything else to get in the way.

## Outdated Browser Rework Version 2 notes 
 
 - Edge versions now specified directly (rather than via EdgeHTML)
 - Better documentation
 - New translations
 - New `false` option to disable browser support.
 - IE default to `false` - ie, display a message telling users to get a new browser on any version of IE. You can still specify `6` to `11` if, for some reason, you still support IE in 2017. 
 - CSS file is included
 - Update `ua-parser-js` to fix parsing some more esoteric UAs 

## Differences from Bürocratik's Outdated Browser 1.1.0

 - Add explicit browser support via the __browserSupport__ option
 - Add mobile support. Users on iOS and Android will be directed to the Apple App Store and Google Play respectively.
 - Add new __requireChromeOnAndroid__ option
 - Be an NPM module
 - Use SASS (specifically SCSS)
 - No AJAX, languages are only 8K and removing the AJAX library has made the code substantially shorter.

And some code fixes:

 - Pass eslint
 - Remove HTML entities. It's 2015, we have unicode now.
 - Included Vanilla JS onload option - that way you can keep using jQuery 2 and not have to revert to 1.x just to show messages to old browsers.
 - Simplify some variable and function names

There's still some TODOs from the original code:

 - Try and eliminate IDs (they're JS globals, so EUW)
 - Move all styling into SCSS (need to test if this breaks old IEs)
 - Re-do Farsi (RTL) support from original Outdated Browser

## Author

This rework is made by Mike MacCana.
The original Outdated Browser is made with love at [Bürocratik](http://burocratik.com)
