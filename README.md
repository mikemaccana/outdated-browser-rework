# Outdated Browser Rework

Detects outdated browsers and advises users to upgrade to a new version. Handles mobile devices!

This is a fork of [Burocratik](http://www.burocratik.com)'s excellent Outdated Browser, adding a number of new features.

## Usage

### JS

	var outdatedBrowserRework = require("outdated-browser-rework");

	outdatedBrowserRework();

If you like, specify options, eg:

	outdatedBrowserRework({
		browserSupport: {
			'Chrome': 37, // Includes Chrome for mobile devices
			'IE': 10,
			'Safari': 7,
			'Mobile Safari': 7,
			'Firefox':	32
		}
	});

Browsers that are __older__ than the versions supplied will see a message, depending on their platform:

 - On desktop browsers, users will be directed to [outdatedbrowser.com](http://outdatedbrowser.com)
 - on iOS devices, users will be asked to visit the Settings app and upgrade their OS.
 - On Android devices, users will be directed to Chrome in Google Play.

This module does not need jQuery.

#### Options

 - __browserSupport__:Object - A matrix of browsers and their major versions - see above for demo. Anything less will be unsupported.
 - __requiredCssProperty__:String - A CSS property that must be supported.
 - __requireChromeOnAndroid__:Boolean - Ask Android users to install Chrome.

### SCSS

	@import "vendor/outdated-browser-rework.scss";

## Differences from Outdated Browser 1.1.0

 - Add explicit browser support via the __browserSupport__ option
 - Add mobile support. Users on iOS and Android will be directed to the Apple App Store and Google Play respectively.
 - Add new __requireChromeOnAndroid__ option
 - Be an NPM module
 - Use SASS (specifically SCSS)
 - No AJAX, languages are only 8K and removing the AJAX library has made the code substantially shorter.

And some code fixes:

 - Pass jshint
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
