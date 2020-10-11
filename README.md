# Outdated Browser Rework

Detects outdated browsers and advises users to upgrade to a new version. Handles mobile devices!

This is a fork of [Burocratik](http://www.burocratik.com)'s Outdated Browser, adding a number of new features including:

- Explicit browser version support
- Mobile browser support
- Edge support
- Substantial size reduction
- More translations
- Custom upgrade messages
- Unminified code
- Removed adware (Burocratik sold their site to a VPN company)

And more (see below for the full list).

One of the challenges with making this type of module is that the JS and CSS **can't use any current tech** - the 'get a new browser' message must display on older browsers - so yes, this is hard. We have to use ES3, an ancient version of JavaScript. We can't even use the nice '×' close character (we have to use the letter 'x') since that character doesn't display on some older browsers! **This module is tested all the way back to IE6.**

This module does not need jQuery.

## Demo

There's a [demo page here where all browsers are unsupported](https://mikemaccana.github.io/outdated-browser-rework/) - this allows you to see the effect!.

## Usage (with browserify)

### JS

### In your template

In `<head>`, before any other `script` tags:

```html
<script src="/js/dist/oldbrowser.js"></script>
```

### In `oldbrowser.js`

Start `outdated-browser-rework` and call it with your preferred options:

```js
var outdatedBrowserRework = require("outdated-browser-rework");
outdatedBrowserRework();
```

If you like, specify options, eg:

```js
outdatedBrowserRework({
	browserSupport: {
		Chrome: 57, // Includes Chrome for mobile devices
		Edge: 39,
		Safari: 10,
		"Mobile Safari": 10,
		Firefox: 50,
		Opera: 50,
		Vivaldi: 1,
		// You could specify minor version too for those browsers that need it.
		Yandex: { major: 17, minor: 10 },
		// You could specify a version here if you still support IE in 2017.
		// You could also instead seriously consider what you're doing with your time and budget
		IE: false
	},
	requireChromeOnAndroid: false,
	isUnknownBrowserOK: false,
	messages: {
		en: {
			outOfDate: "Your browser is out of date!",
			unsupported: "Your browser is not supported!",
			update: {
				web: "Update your browser to view this website correctly. ",
				googlePlay: "Please install Chrome from Google Play",
				appStore: "Please update iOS from the Settings App"
			},
			// You can set the URL to null if you do not want a clickable link or provide
			// your own markup in the `update.web` message.
			url: "http://browser-update.org/",
			callToAction: "Update my browser now",
			close: "Close"
		}
	}
});
```

The particular versions used in this example are the defaults, by the way!

See below for more options.

Browsers that are **older** than the versions supplied, or who use a browser where support is `false`, will see a message, depending on their platform:

- On desktop browsers, users will be directed to [browser-update.org/](https://browser-update.org/)
- on iOS devices, users will be asked to visit the Settings app and upgrade their OS.
- On Android devices, users will be directed to Chrome in Google Play.

## Usage (without browserify)

### In your template

In `<head>`, before any other `script` tags:

```html
<script src="/js/dist/outdated-browser-rework.min.js"></script>
<script>
	outdatedBrowserRework();
</script>
```

See above for the default options.

#### Options

- **browserSupport**: Object - A matrix of browsers and their versions - see above for demo. Anything less will be unsupported. `false` means all versions are unsupported.
- **requiredCssProperty**: String - A CSS property that must be supported.
- **messages**: Object - Customize upgrade messages for your purposes. See the above default options for an example.
- **language**: String - A language string to be used for the messages in the notification. Default is `en`. See `languages.json` for supported languages. Can be used instead of **messages** if preferred.
- **requireChromeOnAndroid**: Boolean - Ask Android users to install Chrome. Default is `false`.
- **isUnknownBrowserOK**: Boolean. Whether unknown browsers are considered to be out of date or not. The default is `false`, ie. unknown browsers are considered to be out of date. Consider setting `true` and using `requiredCssProperty` to catch missing features.

## SCSS

If you're using [sass-npm](https://www.npmjs.com/package/sass-npm) you can just import the npm module, and it will load `index.scss`:

```scss
@import "outdated-browser-rework.scss";
```

Otherwise compile the sass and put it somewhere. Then load that via a `link` tag inside `<head>`:

```html
<link rel="stylesheet" href="/css/outdated-browser.css" />
```

## HTML

Add the required HTML at the end of your document:

```html
<div id="outdated"></div>
```

Yes, [IDs suck](http://2ality.com/2012/08/ids-are-global.html) but old browsers don't support getting elements by class name.

You should also always use HTML <!DOCTYPE> declaration to tell legacy browsers that you're using full standards mode. Without this it's possible that your page gets loaded in the quirks mode and it will not work with this package.   
For more information, see: https://developer.mozilla.org/en-US/docs/Web/HTML/Quirks_Mode_and_Standards_Mode

## Bundling the JavaScript

In modern times we normally concatenate and combine different JS modules using [browserify](http://browserify.org/) or [webpack](https://webpack.js.org/): **it's best to bundle outdated-browser-rework by itself**. Since other scripts may expect things like `console` and `function.bind()` to exist, they won't work on old browsers - if you bundle this with other software, the JS will probably fail before outdated-browser has a chance to do any work.

### For gulp users

Add the following underneath your existing `js` task:

```js
gulp
	.src("./public/js/src/oldbrowser.js")
	.pipe(
		browserify({
			debug: !gulp.env.production
		})
	)
	.pipe(gulp.dest("./public/js/dist"));
```

Doing this will mean that `dist/oldbrowser.js` will only include `outdated-browser-rework` and its dependency `user-agent-parser`, without anything else to get in the way.

### For Webpack users

First of all, to bundle `outdated-browser-rework` by itself, create a new entry point in your webpack config file. You'll also need to install `style-loader` and `css-loader` in order to import the package's CSS. Your webpack configuration should look something like this:

```js
const path = require("path");

module.exports = {
	entry: {
		main: path.join(__dirname, "src/index.js"),
		"outdated-browser-rework": path.join(
			__dirname,
			"src/outdated-browser-rework.js"
		)
	},
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ["style-loader", "css-loader"]
			}
		]
	}
};
```

Secondly, make use of `outdated-browser-rework` in `src/outdated-browser-rework.js`:

```js
import outdatedBrowser from "outdated-browser-rework";
import "outdated-browser-rework/dist/style.css";

outdatedBrowser();
```

Finally, add the generated JS file in your HTML:

```html
<!DOCTYPE html>
<html>
	<head>
		<title>Webpack example</title>
	</head>
	<body>
		<div id="outdated"></div>
		<script src="outdated-browser-rework.js"></script>
		<script src="main.js"></script>
	</body>
</html>
```

## Outdated Browser Rework Version 2 notes

- Add `isUnknownBrowserOK` option to determine how to handle unknown browsers.
- Add `messages` to override the default out of date messages.
- Custom message for unsupported browsers vs out of date versions of browsers
- Edge versions are now specified directly (rather than using EdgeHTML versions). For example, you now specify Edge `16` rather than `41`.
- Better documentation
- New translations
- Custom upgrade messages
- New `false` option to disable browser support.
- IE now defaults to `false` - ie, display a message telling users to get a new browser on any version of IE. You can still specify `6` to `11` if, for some reason, you still support IE in 2018. Tip: you should not support IE in 2018.
- CSS file is included
- Update `ua-parser-js` to fix parsing some more esoteric UAs

## Differences from Bürocratik's Outdated Browser 1.1.0

- Add explicit browser support via the **browserSupport** option
- Add mobile support. Users on iOS and Android will be directed to the Apple App Store and Google Play respectively.
- Add new **requireChromeOnAndroid** option
- Be an NPM module
- Use SASS (specifically SCSS)
- No AJAX, languages are only 8K and removing the AJAX library has made the code substantially shorter.
- Added support for custom upgrade messages

And some code fixes:

- Pass eslint
- vanilla JS (no jQuery!)
- Simplify some variable and function names

There's still some TODOs from the original code:

- Try and eliminate IDs (they're JS globals, so EUW)
- Move all styling into SCSS (need to test if this breaks old IEs)
- Re-do Farsi (RTL) support from original Outdated Browser

## Author

This rework is made by Mike MacCana and a whole bunch of amazing open source contributors!

The original Outdated Browser is made with love at [Bürocratik](http://burocratik.com)
