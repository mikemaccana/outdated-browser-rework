(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.outdatedBrowserRework = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var DEFAULTS = {
	Chrome: 57, // Includes Chrome for mobile devices
	Edge: 39,
	Safari: 10,
	"Mobile Safari": 10,
	Opera: 50,
	Firefox: 50,
	Vivaldi: 1,
	IE: false
}

var EDGEHTML_VS_EDGE_VERSIONS = {
	12: 0.1,
	13: 21,
	14: 31,
	15: 39,
	16: 41,
	17: 42,
	18: 44
}

var updateDefaults = function (defaults, updatedValues) {
	for (var key in updatedValues) {
		defaults[key] = updatedValues[key]
	}

	return defaults
}

module.exports = function (parsedUserAgent, options) {
	// Set default options
	var browserSupport = options.browserSupport ? updateDefaults(DEFAULTS, options.browserSupport) : DEFAULTS
	var requiredCssProperty = options.requiredCssProperty || false

	var parseMinorVersion = function (version) {
		return version.replace(/[^\d.]/g, '').split(".")[1];
	}

	var isAndroidButNotChrome
	if (options.requireChromeOnAndroid) {
		isAndroidButNotChrome = isAndroid && parsedUserAgent.browser.name !== "Chrome"
	}

	var isBrowserUnsupported = function () {
		var browserName = parsedUserAgent.browser.name
		var isUnsupported = false
		if (!(browserName in browserSupport)) {
			if (!options.isUnknownBrowserOK) {
				isUnsupported = true
			}
		} else if (!browserSupport[browserName]) {
			isUnsupported = true
		}
		return isUnsupported;
	}

	var isBrowserUnsupportedResult = isBrowserUnsupported();
	var isBrowserOutOfDate = function () {
		var browserName = parsedUserAgent.browser.name;
		var browserVersion = parsedUserAgent.browser.version;
		var browserMajorVersion = parsedUserAgent.browser.major;
		var osName = parsedUserAgent.os.name;
		var osVersion = parsedUserAgent.os.version;

		// Edge legacy needed a version mapping, Edge on Chromium doesn't
		if (browserName === "Edge" && browserMajorVersion <= 18) {
			browserMajorVersion = EDGEHTML_VS_EDGE_VERSIONS[browserMajorVersion];
		}

		// Firefox Mobile on iOS is essentially Mobile Safari so needs to be handled that way
		// See: https://github.com/mikemaccana/outdated-browser-rework/issues/98#issuecomment-597721173
		if (browserName === 'Firefox' && osName === 'iOS') {
			browserName = 'Mobile Safari';
			browserVersion = osVersion;
			browserMajorVersion = osVersion.substring(0, osVersion.indexOf('.'));
		}

		debugger;

		var isOutOfDate = false
		if (isBrowserUnsupportedResult) {
			isOutOfDate = true;
		} else if (browserName in browserSupport) {
			var minVersion = browserSupport[browserName]
			if (typeof minVersion == 'object') {
				var minMajorVersion = minVersion.major
				var minMinorVersion = minVersion.minor

				if (browserMajorVersion < minMajorVersion) {
					isOutOfDate = true
				} else if (browserMajorVersion == minMajorVersion) {
					var browserMinorVersion = parseMinorVersion(browserVersion)

					if (browserMinorVersion < minMinorVersion) {
						isOutOfDate = true
					}
				}
			} else if (browserMajorVersion < minVersion) {
				isOutOfDate = true
			}
		}
		return isOutOfDate
	}

	// Returns true if a browser supports a css3 property
	var isPropertySupported = function (property) {
		if (!property) {
			return true
		}
		var div = document.createElement("div")
		var vendorPrefixes = ["khtml", "ms", "o", "moz", "webkit"]
		var count = vendorPrefixes.length

		// Note: HTMLElement.style.hasOwnProperty seems broken in Edge
		if (property in div.style) {
			return true
		}

		property = property.replace(/^[a-z]/, function (val) {
			return val.toUpperCase()
		})

		while (count--) {
			var prefixedProperty = vendorPrefixes[count] + property
			// See comment re: HTMLElement.style.hasOwnProperty above
			if (prefixedProperty in div.style) {
				return true
			}
		}
		return false
	}

	// Return results
	return {
		isAndroidButNotChrome: isAndroidButNotChrome,
		isBrowserOutOfDate: isBrowserOutOfDate(),
		isBrowserUnsupported: isBrowserUnsupportedResult,
		isPropertySupported: isPropertySupported(requiredCssProperty)
	};
}

},{}],2:[function(require,module,exports){
/* Highly dumbed down version of https://github.com/unclechu/node-deep-extend */

/**
 * Extening object that entered in first argument.
 *
 * Returns extended object or false if have no target object or incorrect type.
 *
 * If you wish to clone source object (without modify it), just use empty new
 * object as first argument, like this:
 *   deepExtend({}, yourObj_1, [yourObj_N]);
 */
module.exports = function deepExtend(/*obj_1, [obj_2], [obj_N]*/) {
	if (arguments.length < 1 || typeof arguments[0] !== "object") {
		return false
	}

	if (arguments.length < 2) {
		return arguments[0]
	}

	var target = arguments[0]

	for (var i = 1; i < arguments.length; i++) {
		var obj = arguments[i]

		for (var key in obj) {
			var src = target[key]
			var val = obj[key]

			if (typeof val !== "object" || val === null) {
				target[key] = val

				// just clone arrays (and recursive clone objects inside)
			} else if (typeof src !== "object" || src === null) {
				target[key] = deepExtend({}, val)

				// source value and new value is objects both, extending...
			} else {
				target[key] = deepExtend(src, val)
			}
		}
	}

	return target
}

},{}],3:[function(require,module,exports){
var evaluateBrowser = require("./evaluateBrowser")
var languageMessages = require("./languages.json")
var deepExtend = require("./extend")
var UserAgentParser = require("ua-parser-js")

var COLORS = {
	salmon: "#f25648",
	white: "white"
}

module.exports = function(options) {
	var main = function() {
		// Despite the docs, UA needs to be provided to constructor explicitly:
		// https://github.com/faisalman/ua-parser-js/issues/90
		var parsedUserAgent = new UserAgentParser(navigator.userAgent).getResult()

		// Variable definition (before ajax)
		var outdatedUI = document.getElementById("outdated")

		// Set default options
		options = options || {}

		var browserLocale = window.navigator.language || window.navigator.userLanguage // Everyone else, IE
		// CSS property to check for. You may also like 'borderSpacing', 'boxShadow', 'transform', 'borderImage';
		var backgroundColor = options.backgroundColor || COLORS.salmon
		var textColor = options.textColor || COLORS.white
		var fullscreen = options.fullscreen || false
		var language = options.language || browserLocale.slice(0, 2) // Language code

		var updateSource = "web" // Other possible values are 'googlePlay' or 'appStore'. Determines where we tell users to go for upgrades.

		// Chrome mobile is still Chrome (unlike Safari which is 'Mobile Safari')
		var isAndroid = parsedUserAgent.os.name === "Android"
		if (isAndroid) {
			updateSource = "googlePlay"
		} else if  (parsedUserAgent.os.name === "iOS") {
			updateSource = "appStore"
		}

		var isBrowserUnsupported = false // set later after browser evaluation

		var done = true

		var changeOpacity = function (opacityValue) {
			outdatedUI.style.opacity = opacityValue / 100
			outdatedUI.style.filter = "alpha(opacity=" + opacityValue + ")"
		}
	
		var fadeIn = function (opacityValue) {
			changeOpacity(opacityValue)
			if (opacityValue === 1) {
				outdatedUI.style.display = "table"
			}
			if (opacityValue === 100) {
				done = true
			}
		}
	
		var makeFadeInFunction = function (opacityValue) {
			return function () {
				fadeIn(opacityValue)
			}
		}
	
		// Style element explicitly - TODO: investigate and delete if not needed
		var startStylesAndEvents = function () {
			var buttonClose = document.getElementById("buttonCloseUpdateBrowser")
			var buttonUpdate = document.getElementById("buttonUpdateBrowser")
	
			//check settings attributes
			outdatedUI.style.backgroundColor = backgroundColor
			//way too hard to put !important on IE6
			outdatedUI.style.color = textColor
			outdatedUI.children[0].children[0].style.color = textColor
			outdatedUI.children[0].children[1].style.color = textColor
	
			// Update button is desktop only
			if (buttonUpdate) {
				buttonUpdate.style.color = textColor
				if (buttonUpdate.style.borderColor) {
					buttonUpdate.style.borderColor = textColor
				}
	
				// Override the update button color to match the background color
				buttonUpdate.onmouseover = function () {
					this.style.color = backgroundColor
					this.style.backgroundColor = textColor
				}
	
				buttonUpdate.onmouseout = function () {
					this.style.color = textColor
					this.style.backgroundColor = backgroundColor
				}
			}
	
			buttonClose.style.color = textColor
	
			buttonClose.onmousedown = function () {
				outdatedUI.style.display = "none"
				return false
			}
		}
	
		var getMessage = function (lang) {
			var defaultMessages = languageMessages[lang] || languageMessages.en
			var customMessages = options.messages && options.messages[lang]
			var messages = deepExtend({}, defaultMessages, customMessages)
	
			var updateMessages = {
				web:
					"<p>" +
					messages.update.web +
					(messages.url ? (
						'<a id="buttonUpdateBrowser" rel="nofollow" href="' +
						messages.url +
						'">' +
						messages.callToAction +
						"</a>"
					) : '') +
					"</p>",
				googlePlay:
					"<p>" +
					messages.update.googlePlay +
					'<a id="buttonUpdateBrowser" rel="nofollow" href="https://play.google.com/store/apps/details?id=com.android.chrome">' +
					messages.callToAction +
					"</a></p>",
				appStore: "<p>" + messages.update[updateSource] + "</p>"
			}
	
			var updateMessage = updateMessages[updateSource]
	
			var browserSupportMessage = messages.outOfDate;
			if (isBrowserUnsupported && messages.unsupported) {
				browserSupportMessage = messages.unsupported;
			}
	
			return (
				'<div class="vertical-center"><h6>' +
				browserSupportMessage +
				"</h6>" +
				updateMessage +
				'<p class="last"><a href="#" id="buttonCloseUpdateBrowser" title="' +
				messages.close +
				'">&times;</a></p></div>'
			)
		}

		var result = evaluateBrowser(parsedUserAgent, options);
		if (result.isAndroidButNotChrome || result.isBrowserOutOfDate || !result.isPropertySupported) {
			// This is an outdated browser and the banner needs to show

			// Set this flag with the result for `getMessage`
			isBrowserUnsupported = result.isBrowserUnsupported

			if (done && outdatedUI.style.opacity !== "1") {
				done = false
	
				for (var opacity = 1; opacity <= 100; opacity++) {
					setTimeout(makeFadeInFunction(opacity), opacity * 8)
				}
			}
	
			var insertContentHere = document.getElementById("outdated")
			if (fullscreen) {
				insertContentHere.classList.add("fullscreen")
			}
			insertContentHere.innerHTML = getMessage(language)
			startStylesAndEvents()
		}
	}

	// Load main when DOM ready.
	var oldOnload = window.onload
	if (typeof window.onload !== "function") {
		window.onload = main
	} else {
		window.onload = function() {
			if (oldOnload) {
				oldOnload()
			}
			main()
		}
	}
}

},{"./evaluateBrowser":1,"./extend":2,"./languages.json":4,"ua-parser-js":5}],4:[function(require,module,exports){
module.exports={
	"br": {
		"outOfDate": "O seu navegador est&aacute; desatualizado!",
		"update": {
			"web": "Atualize o seu navegador para ter uma melhor experi&ecirc;ncia e visualiza&ccedil;&atilde;o deste site. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Atualize o seu navegador agora",
		"close": "Fechar"
	},
	"ca": {
		"outOfDate": "El vostre navegador no està actualitzat!",
		"update": {
			"web": "Actualitzeu el vostre navegador per veure correctament aquest lloc web. ",
			"googlePlay": "Instal·leu Chrome des de Google Play",
			"appStore": "Actualitzeu iOS des de l'aplicació Configuració"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Actualitzar el meu navegador ara",
		"close": "Tancar"
	},
	"cn": {
		"outOfDate": "您的浏览器已过时",
		"update": {
			"web": "要正常浏览本网站请升级您的浏览器。",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "现在升级",
		"close": "关闭"
	},
	"cz": {
		"outOfDate": "Váš prohlížeč je zastaralý!",
		"update": {
			"web": "Pro správné zobrazení těchto stránek aktualizujte svůj prohlížeč. ",
			"googlePlay": "Nainstalujte si Chrome z Google Play",
			"appStore": "Aktualizujte si systém iOS"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Aktualizovat nyní svůj prohlížeč",
		"close": "Zavřít"
	},
	"da": {
		"outOfDate": "Din browser er forældet!",
		"update": {
			"web": "Opdatér din browser for at få vist denne hjemmeside korrekt. ",
			"googlePlay": "Installér venligst Chrome fra Google Play",
			"appStore": "Opdatér venligst iOS"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Opdatér din browser nu",
		"close": "Luk"
	},
	"de": {
		"outOfDate": "Ihr Browser ist veraltet!",
		"update": {
			"web": "Bitte aktualisieren Sie Ihren Browser, um diese Website korrekt darzustellen. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Den Browser jetzt aktualisieren ",
		"close": "Schließen"
	},
	"ee": {
		"outOfDate": "Sinu veebilehitseja on vananenud!",
		"update": {
			"web": "Palun uuenda oma veebilehitsejat, et näha lehekülge korrektselt. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Uuenda oma veebilehitsejat kohe",
		"close": "Sulge"
	},
	"en": {
		"outOfDate": "Your browser is out-of-date!",
		"update": {
			"web": "Update your browser to view this website correctly. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Update my browser now",
		"close": "Close"
	},
	"es": {
		"outOfDate": "¡Tu navegador está anticuado!",
		"update": {
			"web": "Actualiza tu navegador para ver esta página correctamente. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Actualizar mi navegador ahora",
		"close": "Cerrar"
	},
	"fa": {
		"rightToLeft": true,
		"outOfDate": "مرورگر شما منسوخ شده است!",
		"update": {
			"web": "جهت مشاهده صحیح این وبسایت، مرورگرتان را بروز رسانی نمایید. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "همین حالا مرورگرم را بروز کن",
		"close": "Close"
	},
	"fi": {
		"outOfDate": "Selaimesi on vanhentunut!",
		"update": {
			"web": "Lataa ajantasainen selain n&auml;hd&auml;ksesi t&auml;m&auml;n sivun oikein. ",
			"googlePlay": "Asenna uusin Chrome Google Play -kaupasta",
			"appStore": "Päivitä iOS puhelimesi asetuksista"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "P&auml;ivit&auml; selaimeni nyt ",
		"close": "Sulje"
	},
	"fr": {
		"outOfDate": "Votre navigateur n'est plus compatible !",
		"update": {
			"web": "Mettez à jour votre navigateur pour afficher correctement ce site Web. ",
			"googlePlay": "Merci d'installer Chrome depuis le Google Play Store",
			"appStore": "Merci de mettre à jour iOS depuis l'application Réglages"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Mettre à jour maintenant ",
		"close": "Fermer"
	},
	"hu": {
		"outOfDate": "A böngészője elavult!",
		"update": {
			"web": "Firssítse vagy cserélje le a böngészőjét. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "A böngészőm frissítése ",
		"close": "Close"
	},
	"id": {
		"outOfDate": "Browser yang Anda gunakan sudah ketinggalan zaman!",
		"update": {
			"web": "Perbaharuilah browser Anda agar bisa menjelajahi website ini dengan nyaman. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Perbaharui browser sekarang ",
		"close": "Close"
	},
	"it": {
		"outOfDate": "Il tuo browser non &egrave; aggiornato!",
		"update": {
			"web": "Aggiornalo per vedere questo sito correttamente. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Aggiorna ora",
		"close": "Chiudi"
	},
	"lt": {
		"outOfDate": "Jūsų naršyklės versija yra pasenusi!",
		"update": {
			"web": "Atnaujinkite savo naršyklę, kad galėtumėte peržiūrėti šią svetainę tinkamai. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Atnaujinti naršyklę ",
		"close": "Close"
	},
	"nl": {
		"outOfDate": "Je gebruikt een oude browser!",
		"update": {
			"web": "Update je browser om deze website correct te bekijken. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Update mijn browser nu ",
		"close": "Sluiten"
	},
	"pl": {
		"outOfDate": "Twoja przeglądarka jest przestarzała!",
		"update": {
			"web": "Zaktualizuj swoją przeglądarkę, aby poprawnie wyświetlić tę stronę. ",
			"googlePlay": "Proszę zainstalować przeglądarkę Chrome ze sklepu Google Play",
			"appStore": "Proszę zaktualizować iOS z Ustawień"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Zaktualizuj przeglądarkę już teraz",
		"close": "Zamknij"
	},
	"pt": {
		"outOfDate": "O seu browser est&aacute; desatualizado!",
		"update": {
			"web": "Atualize o seu browser para ter uma melhor experi&ecirc;ncia e visualiza&ccedil;&atilde;o deste site. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Atualize o seu browser agora",
		"close": "Fechar"
	},
	"ro": {
		"outOfDate": "Browserul este învechit!",
		"update": {
			"web": "Actualizați browserul pentru a vizualiza corect acest site. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Actualizați browserul acum!",
		"close": "Close"
	},
	"ru": {
		"outOfDate": "Ваш браузер устарел!",
		"update": {
			"web": "Обновите ваш браузер для правильного отображения этого сайта. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Обновить мой браузер ",
		"close": "Закрыть"
	},
	"si": {
		"outOfDate": "Vaš brskalnik je zastarel!",
		"update": {
			"web": "Za pravilen prikaz spletne strani posodobite vaš brskalnik. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Posodobi brskalnik ",
		"close": "Zapri"
	},
	"sv": {
		"outOfDate": "Din webbläsare stödjs ej längre!",
		"update": {
			"web": "Uppdatera din webbläsare för att webbplatsen ska visas korrekt. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Uppdatera min webbläsare nu",
		"close": "Stäng"
	},
	"ua": {
		"outOfDate": "Ваш браузер застарів!",
		"update": {
			"web": "Оновіть ваш браузер для правильного відображення цього сайта. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Оновити мій браузер ",
		"close": "Закрити"
	}
}

},{}],5:[function(require,module,exports){
/*!
 * UAParser.js v0.7.21
 * Lightweight JavaScript-based User-Agent string parser
 * https://github.com/faisalman/ua-parser-js
 *
 * Copyright © 2012-2019 Faisal Salman <f@faisalman.com>
 * Licensed under MIT License
 */

(function (window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var LIBVERSION  = '0.7.21',
        EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        STR_TYPE    = 'string',
        MAJOR       = 'major', // deprecated
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet',
        SMARTTV     = 'smarttv',
        WEARABLE    = 'wearable',
        EMBEDDED    = 'embedded';


    ///////////
    // Helper
    //////////


    var util = {
        extend : function (regexes, extensions) {
            var mergedRegexes = {};
            for (var i in regexes) {
                if (extensions[i] && extensions[i].length % 2 === 0) {
                    mergedRegexes[i] = extensions[i].concat(regexes[i]);
                } else {
                    mergedRegexes[i] = regexes[i];
                }
            }
            return mergedRegexes;
        },
        has : function (str1, str2) {
          if (typeof str1 === "string") {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
          } else {
            return false;
          }
        },
        lowerize : function (str) {
            return str.toLowerCase();
        },
        major : function (version) {
            return typeof(version) === STR_TYPE ? version.replace(/[^\d\.]/g,'').split(".")[0] : undefined;
        },
        trim : function (str) {
          return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function (ua, arrays) {

            var i = 0, j, k, p, q, matches, match;

            // loop through all regexes maps
            while (i < arrays.length && !matches) {

                var regex = arrays[i],       // even sequence (0,2,4,..)
                    props = arrays[i + 1];   // odd sequence (1,3,5,..)
                j = k = 0;

                // try matching uastring with regexes
                while (j < regex.length && !matches) {

                    matches = regex[j++].exec(ua);

                    if (!!matches) {
                        for (p = 0; p < props.length; p++) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof q === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof q[1] == FUNC_TYPE) {
                                        // assign modified match
                                        this[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        this[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        this[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                        this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                this[q] = match ? match : undefined;
                            }
                        }
                    }
                }
                i += 2;
            }
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                    for (var j = 0; j < map[i].length; j++) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            amazon : {
                model : {
                    'Fire Phone' : ['SD', 'KF']
                }
            },
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    '8.1'       : 'NT 6.3',
                    '10'        : ['NT 6.4', 'NT 10.0'],
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/([\w\.-]+)/i,                                       // Opera Mini
            /(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,                      // Opera Mobi/Tablet
            /(opera).+version\/([\w\.]+)/i,                                     // Opera > 9.80
            /(opera)[\/\s]+([\w\.]+)/i                                          // Opera < 9.80
            ], [NAME, VERSION], [

            /(opios)[\/\s]+([\w\.]+)/i                                          // Opera mini on iphone >= 8.0
            ], [[NAME, 'Opera Mini'], VERSION], [

            /\s(opr)\/([\w\.]+)/i                                               // Opera Webkit
            ], [[NAME, 'Opera'], VERSION], [

            // Mixed
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]*)/i,
                                                                                // Lunascape/Maxthon/Netfront/Jasmine/Blazer
            // Trident based
            /(avant\s|iemobile|slim)(?:browser)?[\/\s]?([\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser
            /(bidubrowser|baidubrowser)[\/\s]?([\w\.]+)/i,                      // Baidu Browser
            /(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)\/([\w\.]*)/i,                                             // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon)\/([\w\.-]+)/i
                                                                                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser/QupZilla/Falkon
            ], [NAME, VERSION], [

            /(konqueror)\/([\w\.]+)/i                                           // Konqueror
            ], [[NAME, 'Konqueror'], VERSION], [

            /(trident).+rv[:\s]([\w\.]+).+like\sgecko/i                         // IE11
            ], [[NAME, 'IE'], VERSION], [

            /(edge|edgios|edga|edg)\/((\d+)?[\w\.]+)/i                          // Microsoft Edge
            ], [[NAME, 'Edge'], VERSION], [

            /(yabrowser)\/([\w\.]+)/i                                           // Yandex
            ], [[NAME, 'Yandex'], VERSION], [

            /(Avast)\/([\w\.]+)/i                                               // Avast Secure Browser
            ], [[NAME, 'Avast Secure Browser'], VERSION], [

            /(AVG)\/([\w\.]+)/i                                                 // AVG Secure Browser
            ], [[NAME, 'AVG Secure Browser'], VERSION], [

            /(puffin)\/([\w\.]+)/i                                              // Puffin
            ], [[NAME, 'Puffin'], VERSION], [

            /(focus)\/([\w\.]+)/i                                               // Firefox Focus
            ], [[NAME, 'Firefox Focus'], VERSION], [

            /(opt)\/([\w\.]+)/i                                                 // Opera Touch
            ], [[NAME, 'Opera Touch'], VERSION], [

            /((?:[\s\/])uc?\s?browser|(?:juc.+)ucweb)[\/\s]?([\w\.]+)/i         // UCBrowser
            ], [[NAME, 'UCBrowser'], VERSION], [

            /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
            ], [[NAME, /_/g, ' '], VERSION], [

            /(windowswechat qbcore)\/([\w\.]+)/i                                // WeChat Desktop for Windows Built-in Browser
            ], [[NAME, 'WeChat(Win) Desktop'], VERSION], [

            /(micromessenger)\/([\w\.]+)/i                                      // WeChat
            ], [[NAME, 'WeChat'], VERSION], [

            /(brave)\/([\w\.]+)/i                                               // Brave browser
            ], [[NAME, 'Brave'], VERSION], [

            /(qqbrowserlite)\/([\w\.]+)/i                                       // QQBrowserLite
            ], [NAME, VERSION], [

            /(QQ)\/([\d\.]+)/i                                                  // QQ, aka ShouQ
            ], [NAME, VERSION], [

            /m?(qqbrowser)[\/\s]?([\w\.]+)/i                                    // QQBrowser
            ], [NAME, VERSION], [

            /(baiduboxapp)[\/\s]?([\w\.]+)/i                                    // Baidu App
            ], [NAME, VERSION], [

            /(2345Explorer)[\/\s]?([\w\.]+)/i                                   // 2345 Browser
            ], [NAME, VERSION], [

            /(MetaSr)[\/\s]?([\w\.]+)/i                                         // SouGouBrowser
            ], [NAME], [

            /(LBBROWSER)/i                                                      // LieBao Browser
            ], [NAME], [

            /xiaomi\/miuibrowser\/([\w\.]+)/i                                   // MIUI Browser
            ], [VERSION, [NAME, 'MIUI Browser']], [

            /;fbav\/([\w\.]+);/i                                                // Facebook App for iOS & Android
            ], [VERSION, [NAME, 'Facebook']], [

            /safari\s(line)\/([\w\.]+)/i,                                       // Line App for iOS
            /android.+(line)\/([\w\.]+)\/iab/i                                  // Line App for Android
            ], [NAME, VERSION], [

            /headlesschrome(?:\/([\w\.]+)|\s)/i                                 // Chrome Headless
            ], [VERSION, [NAME, 'Chrome Headless']], [

            /\swv\).+(chrome)\/([\w\.]+)/i                                      // Chrome WebView
            ], [[NAME, /(.+)/, '$1 WebView'], VERSION], [

            /((?:oculus|samsung)browser)\/([\w\.]+)/i
            ], [[NAME, /(.+(?:g|us))(.+)/, '$1 $2'], VERSION], [                // Oculus / Samsung Browser

            /android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)*/i        // Android Browser
            ], [VERSION, [NAME, 'Android Browser']], [

            /(sailfishbrowser)\/([\w\.]+)/i                                     // Sailfish Browser
            ], [[NAME, 'Sailfish Browser'], VERSION], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i
                                                                                // Chrome/OmniWeb/Arora/Tizen/Nokia
            ], [NAME, VERSION], [

            /(dolfin)\/([\w\.]+)/i                                              // Dolphin
            ], [[NAME, 'Dolphin'], VERSION], [

            /(qihu|qhbrowser|qihoobrowser|360browser)/i                         // 360
            ], [[NAME, '360 Browser']], [

            /((?:android.+)crmo|crios)\/([\w\.]+)/i                             // Chrome for Android/iOS
            ], [[NAME, 'Chrome'], VERSION], [

            /(coast)\/([\w\.]+)/i                                               // Opera Coast
            ], [[NAME, 'Opera Coast'], VERSION], [

            /fxios\/([\w\.-]+)/i                                                // Firefox for iOS
            ], [VERSION, [NAME, 'Firefox']], [

            /version\/([\w\.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
            ], [VERSION, [NAME, 'Mobile Safari']], [

            /version\/([\w\.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
            ], [VERSION, NAME], [

            /webkit.+?(gsa)\/([\w\.]+).+?(mobile\s?safari|safari)(\/[\w\.]+)/i  // Google Search Appliance on iOS
            ], [[NAME, 'GSA'], VERSION], [

            /webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i                     // Safari < 3.0
            ], [NAME, [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(webkit|khtml)\/([\w\.]+)/i
            ], [NAME, VERSION], [

            // Gecko based
            /(navigator|netscape)\/([\w\.-]+)/i                                 // Netscape
            ], [[NAME, 'Netscape'], VERSION], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
                                                                                // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([\w\.-]+)$/i,

                                                                                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,                          // Mozilla

            // Other
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
                                                                                // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
            /(links)\s\(([\w\.]+)/i,                                            // Links
            /(gobrowser)\/?([\w\.]*)/i,                                         // GoBrowser
            /(ice\s?browser)\/v?([\w\._]+)/i,                                   // ICE Browser
            /(mosaic)[\/\s]([\w\.]+)/i                                          // Mosaic
            ], [NAME, VERSION]
        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
            ], [[ARCHITECTURE, 'amd64']], [

            /(ia32(?=;))/i                                                      // IA32 (quicktime)
            ], [[ARCHITECTURE, util.lowerize]], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
            ], [[ARCHITECTURE, 'ia32']], [

            // PocketPC mistakenly identified as PowerPC
            /windows\s(ce|mobile);\sppc;/i
            ], [[ARCHITECTURE, 'arm']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
            ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
            ], [[ARCHITECTURE, 'sparc']], [

            /((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+[;l]))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                                // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
            ], [[ARCHITECTURE, util.lowerize]]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\),;-]+(rim|apple)/i                        // iPad/PlayBook
            ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, TABLET]], [

            /(apple\s{0,1}tv)/i                                                 // Apple TV
            ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple'], [TYPE, SMARTTV]], [

            /(archos)\s(gamepad2?)/i,                                           // Archos
            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(hp).+(tablet)/i,                                                  // HP Tablet
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(kf[A-z]+)\sbuild\/.+silk\//i                                      // Kindle Fire HD
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [
            /(sd|kf)[0349hijorstuw]+\sbuild\/.+silk\//i                         // Fire Phone
            ], [[MODEL, mapper.str, maps.device.amazon.model], [VENDOR, 'Amazon'], [TYPE, MOBILE]], [
            /android.+aft([bms])\sbuild/i                                       // Fire TV
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, SMARTTV]], [

            /\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
            ], [MODEL, VENDOR, [TYPE, MOBILE]], [
            /\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[\s_-]?([\w-]*)/i,
                                                                                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\(bb10;\s(\w+)/i                                                   // BlackBerry 10
            ], [MODEL, [VENDOR, 'BlackBerry'], [TYPE, MOBILE]], [
                                                                                // Asus Tablets
            /android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone|p00c)/i
            ], [MODEL, [VENDOR, 'Asus'], [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])\sbuild\//i,                                  // Sony
            /(sony)?(?:sgp.+)\sbuild\//i
            ], [[VENDOR, 'Sony'], [MODEL, 'Xperia Tablet'], [TYPE, TABLET]], [
            /android.+\s([c-g]\d{4}|so[-l]\w+)(?=\sbuild\/|\).+chrome\/(?![1-6]{0,1}\d\.))/i
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /\s(ouya)\s/i,                                                      // Ouya
            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
            ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /android.+;\s(shield)\sbuild/i                                      // Nvidia
            ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [

            /(playstation\s[34portablevi]+)/i                                   // Playstation
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
            ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(htc)[;_\s-]+([\w\s]+(?=\)|\sbuild)|\w+)/i,                        // HTC
            /(zte)-(\w*)/i,                                                     // ZTE
            /(alcatel|geeksphone|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]*)/i
                                                                                // Alcatel/GeeksPhone/Nexian/Panasonic/Sony
            ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

            /(nexus\s9)/i                                                       // HTC Nexus 9
            ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [

            /d\/huawei([\w\s-]+)[;\)]/i,
            /(nexus\s6p|vog-l29|ane-lx1|eml-l29)/i                              // Huawei
            ], [MODEL, [VENDOR, 'Huawei'], [TYPE, MOBILE]], [

            /android.+(bah2?-a?[lw]\d{2})/i                                     // Huawei MediaPad
            ], [MODEL, [VENDOR, 'Huawei'], [TYPE, TABLET]], [

            /(microsoft);\s(lumia[\s\w]+)/i                                     // Microsoft Lumia
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /[\s\(;](xbox(?:\sone)?)[\s\);]/i                                   // Microsoft Xbox
            ], [MODEL, [VENDOR, 'Microsoft'], [TYPE, CONSOLE]], [
            /(kin\.[onetw]{3})/i                                                // Microsoft Kin
            ], [[MODEL, /\./g, ' '], [VENDOR, 'Microsoft'], [TYPE, MOBILE]], [

                                                                                // Motorola
            /\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?:?(\s4g)?)[\w\s]+build\//i,
            /mot[\s-]?(\w*)/i,
            /(XT\d{3,4}) build\//i,
            /(nexus\s6)/i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, MOBILE]], [
            /android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, TABLET]], [

            /hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i            // HbbTV devices
            ], [[VENDOR, util.trim], [MODEL, util.trim], [TYPE, SMARTTV]], [

            /hbbtv.+maple;(\d+)/i
            ], [[MODEL, /^/, 'SmartTV'], [VENDOR, 'Samsung'], [TYPE, SMARTTV]], [

            /\(dtv[\);].+(aquos)/i                                              // Sharp
            ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i,
            /((SM-T\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /smart-tv.+(samsung)/i
            ], [VENDOR, [TYPE, SMARTTV], MODEL], [
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)/i,
            /sec-((sgh\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [

            /sie-(\w*)/i                                                        // Siemens
            ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]*)/i
            ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android[x\d\.\s;]+\s([ab][1-7]\-?[0178a]\d\d?)/i                   // Acer
            ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

            /android.+([vl]k\-?\d{3})\s+build/i                                 // LG Tablet
            ], [MODEL, [VENDOR, 'LG'], [TYPE, TABLET]], [
            /android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
            ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /(lg) netcast\.tv/i                                                 // LG SmartTV
            ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
            /(nexus\s[45])/i,                                                   // LG
            /lg[e;\s\/-]+(\w*)/i,
            /android.+lg(\-?[\d\w]+)\s+build/i
            ], [MODEL, [VENDOR, 'LG'], [TYPE, MOBILE]], [

            /(lenovo)\s?(s(?:5000|6000)(?:[\w-]+)|tab(?:[\s\w]+))/i             // Lenovo tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [
            /android.+(ideatab[a-z0-9\-\s]+)/i                                  // Lenovo
            ], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [
            /(lenovo)[_\s-]?([\w-]+)/i
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /linux;.+((jolla));/i                                               // Jolla
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /((pebble))app\/[\d\.]+\s/i                                         // Pebble
            ], [VENDOR, MODEL, [TYPE, WEARABLE]], [

            /android.+;\s(oppo)\s?([\w\s]+)\sbuild/i                            // OPPO
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /crkey/i                                                            // Google Chromecast
            ], [[MODEL, 'Chromecast'], [VENDOR, 'Google'], [TYPE, SMARTTV]], [

            /android.+;\s(glass)\s\d/i                                          // Google Glass
            ], [MODEL, [VENDOR, 'Google'], [TYPE, WEARABLE]], [

            /android.+;\s(pixel c)[\s)]/i                                       // Google Pixel C
            ], [MODEL, [VENDOR, 'Google'], [TYPE, TABLET]], [

            /android.+;\s(pixel( [23])?( xl)?)[\s)]/i                              // Google Pixel
            ], [MODEL, [VENDOR, 'Google'], [TYPE, MOBILE]], [

            /android.+;\s(\w+)\s+build\/hm\1/i,                                 // Xiaomi Hongmi 'numeric' models
            /android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,               // Xiaomi Hongmi
            /android.+(mi[\s\-_]*(?:a\d|one|one[\s_]plus|note lte)?[\s_]*(?:\d?\w?)[\s_]*(?:plus)?)\s+build/i,    
                                                                                // Xiaomi Mi
            /android.+(redmi[\s\-_]*(?:note)?(?:[\s_]*[\w\s]+))\s+build/i       // Redmi Phones
            ], [[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, MOBILE]], [
            /android.+(mi[\s\-_]*(?:pad)(?:[\s_]*[\w\s]+))\s+build/i            // Mi Pad tablets
            ],[[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, TABLET]], [
            /android.+;\s(m[1-5]\snote)\sbuild/i                                // Meizu
            ], [MODEL, [VENDOR, 'Meizu'], [TYPE, MOBILE]], [
            /(mz)-([\w-]{2,})/i
            ], [[VENDOR, 'Meizu'], MODEL, [TYPE, MOBILE]], [

            /android.+a000(1)\s+build/i,                                        // OnePlus
            /android.+oneplus\s(a\d{4})[\s)]/i
            ], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(RCT[\d\w]+)\s+build/i                            // RCA Tablets
            ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [

            /android.+[;\/\s]+(Venue[\d\s]{2,7})\s+build/i                      // Dell Venue Tablets
            ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Q[T|M][\d\w]+)\s+build/i                         // Verizon Tablet
            ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [

            /android.+[;\/]\s+(Barnes[&\s]+Noble\s+|BN[RT])(V?.*)\s+build/i     // Barnes & Noble Tablet
            ], [[VENDOR, 'Barnes & Noble'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s+(TM\d{3}.*\b)\s+build/i                           // Barnes & Noble Tablet
            ], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [

            /android.+;\s(k88)\sbuild/i                                         // ZTE K Series Tablet
            ], [MODEL, [VENDOR, 'ZTE'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(gen\d{3})\s+build.*49h/i                         // Swiss GEN Mobile
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(zur\d{3})\s+build/i                              // Swiss ZUR Tablet
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((Zeki)?TB.*\b)\s+build/i                         // Zeki Tablets
            ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [

            /(android).+[;\/]\s+([YR]\d{2})\s+build/i,
            /android.+[;\/]\s+(Dragon[\-\s]+Touch\s+|DT)(\w{5})\sbuild/i        // Dragon Touch Tablet
            ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(NS-?\w{0,9})\sbuild/i                            // Insignia Tablets
            ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((NX|Next)-?\w{0,9})\s+build/i                    // NextBook Tablets
            ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Xtreme\_)?(V(1[045]|2[015]|30|40|60|7[05]|90))\s+build/i
            ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [                    // Voice Xtreme Phones

            /android.+[;\/]\s*(LVTEL\-)?(V1[12])\s+build/i                     // LvTel Phones
            ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [

            /android.+;\s(PH-1)\s/i
            ], [MODEL, [VENDOR, 'Essential'], [TYPE, MOBILE]], [                // Essential PH-1

            /android.+[;\/]\s*(V(100MD|700NA|7011|917G).*\b)\s+build/i          // Envizen Tablets
            ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Le[\s\-]+Pan)[\s\-]+(\w{1,9})\s+build/i          // Le Pan Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trio[\s\-]*.*)\s+build/i                         // MachSpeed Tablets
            ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trinity)[\-\s]*(T\d{3})\s+build/i                // Trinity Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*TU_(1491)\s+build/i                               // Rotor Tablets
            ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [

            /android.+(KS(.+))\s+build/i                                        // Amazon Kindle Tablets
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [

            /android.+(Gigaset)[\s\-]+(Q\w{1,9})\s+build/i                      // Gigaset Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /\s(tablet|tab)[;\/]/i,                                             // Unidentifiable Tablet
            /\s(mobile)(?:[;\/]|\ssafari)/i                                     // Unidentifiable Mobile
            ], [[TYPE, util.lowerize], VENDOR, MODEL], [

            /[\s\/\(](smart-?tv)[;\)]/i                                         // SmartTV
            ], [[TYPE, SMARTTV]], [

            /(android[\w\.\s\-]{0,9});.+build/i                                 // Generic Android Device
            ], [MODEL, [VENDOR, 'Generic']]
        ],

        engine : [[

            /windows.+\sedge\/([\w\.]+)/i                                       // EdgeHTML
            ], [VERSION, [NAME, 'EdgeHTML']], [

            /webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i                         // Blink
            ], [VERSION, [NAME, 'Blink']], [

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i,     
                                                                                // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m/Goanna
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
            ], [NAME, VERSION], [

            /rv\:([\w\.]{1,9}).+(gecko)/i                                       // Gecko
            ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
            ], [NAME, VERSION], [
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*)[\s\/]?([\d\.\s\w]*)/i,                   // Windows Phone
            /(windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
            ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]*)/i,                                     // Blackberry
            /(tizen|kaios)[\/\s]([\w\.]+)/i,                                    // Tizen/KaiOS
            /(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|sailfish|contiki)[\/\s-]?([\w\.]*)/i
                                                                                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo/Contiki/Sailfish OS
            ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]*)/i                  // Symbian
            ], [[NAME, 'Symbian'], VERSION], [
            /\((series40);/i                                                    // Series 40
            ], [NAME], [
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
            ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids34portablevu]+)/i,                   // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w*)/i,                                            // Mint
            /(mageia|vectorlinux)[;\s]/i,                                       // Mageia/VectorLinux
            /(joli|[kxln]?ubuntu|debian|suse|opensuse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?(?!chrom)([\w\.-]*)/i,
                                                                                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus
            /(hurd|linux)\s?([\w\.]*)/i,                                        // Hurd/Linux
            /(gnu)\s?([\w\.]*)/i                                                // GNU
            ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
            ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.\d]*)/i                                            // Solaris
            ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]*)/i                    // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ], [NAME, VERSION],[

            /(haiku)\s(\w+)/i                                                   // Haiku
            ], [NAME, VERSION],[

            /cfnetwork\/.+darwin/i,
            /ip[honead]{2,4}(?:.*os\s([\w]+)\slike\smac|;\sopera)/i             // iOS
            ], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [

            /(mac\sos\sx)\s?([\w\s\.]*)/i,
            /(macintosh|mac(?=_powerpc)\s)/i                                    // Mac OS
            ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [

            // Other
            /((?:open)?solaris)[\/\s-]?([\w\.]*)/i,                             // Solaris
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.])*/i,                                // AIX
            /(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms|fuchsia)/i,
                                                                                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS/OpenVMS/Fuchsia
            /(unix)\s?([\w\.]*)/i                                               // UNIX
            ], [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////
    var UAParser = function (uastring, extensions) {

        if (typeof uastring === 'object') {
            extensions = uastring;
            uastring = undefined;
        }

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring, extensions).getResult();
        }

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
        var rgxmap = extensions ? util.extend(regexes, extensions) : regexes;

        this.getBrowser = function () {
            var browser = { name: undefined, version: undefined };
            mapper.rgx.call(browser, ua, rgxmap.browser);
            browser.major = util.major(browser.version); // deprecated
            return browser;
        };
        this.getCPU = function () {
            var cpu = { architecture: undefined };
            mapper.rgx.call(cpu, ua, rgxmap.cpu);
            return cpu;
        };
        this.getDevice = function () {
            var device = { vendor: undefined, model: undefined, type: undefined };
            mapper.rgx.call(device, ua, rgxmap.device);
            return device;
        };
        this.getEngine = function () {
            var engine = { name: undefined, version: undefined };
            mapper.rgx.call(engine, ua, rgxmap.engine);
            return engine;
        };
        this.getOS = function () {
            var os = { name: undefined, version: undefined };
            mapper.rgx.call(os, ua, rgxmap.os);
            return os;
        };
        this.getResult = function () {
            return {
                ua      : this.getUA(),
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            return this;
        };
        return this;
    };

    UAParser.VERSION = LIBVERSION;
    UAParser.BROWSER = {
        NAME    : NAME,
        MAJOR   : MAJOR, // deprecated
        VERSION : VERSION
    };
    UAParser.CPU = {
        ARCHITECTURE : ARCHITECTURE
    };
    UAParser.DEVICE = {
        MODEL   : MODEL,
        VENDOR  : VENDOR,
        TYPE    : TYPE,
        CONSOLE : CONSOLE,
        MOBILE  : MOBILE,
        SMARTTV : SMARTTV,
        TABLET  : TABLET,
        WEARABLE: WEARABLE,
        EMBEDDED: EMBEDDED
    };
    UAParser.ENGINE = {
        NAME    : NAME,
        VERSION : VERSION
    };
    UAParser.OS = {
        NAME    : NAME,
        VERSION : VERSION
    };

    ///////////
    // Export
    //////////


    // check js environment
    if (typeof(exports) !== UNDEF_TYPE) {
        // nodejs env
        if (typeof module !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
        }
        exports.UAParser = UAParser;
    } else {
        // requirejs env (optional)
        if (typeof(define) === 'function' && define.amd) {
            define(function () {
                return UAParser;
            });
        } else if (window) {
            // browser env
            window.UAParser = UAParser;
        }
    }

    // jQuery/Zepto specific (optional)
    // Note:
    //   In AMD env the global scope should be kept clean, but jQuery is an exception.
    //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
    //   and we should catch that.
    var $ = window && (window.jQuery || window.Zepto);
    if ($ && !$.ua) {
        var parser = new UAParser();
        $.ua = parser.getResult();
        $.ua.get = function () {
            return parser.getUA();
        };
        $.ua.set = function (uastring) {
            parser.setUA(uastring);
            var result = parser.getResult();
            for (var prop in result) {
                $.ua[prop] = result[prop];
            }
        };
    }

})(typeof window === 'object' ? window : this);

},{}]},{},[3])(3)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJldmFsdWF0ZUJyb3dzZXIuanMiLCJleHRlbmQuanMiLCJpbmRleC5qcyIsImxhbmd1YWdlcy5qc29uIiwibm9kZV9tb2R1bGVzL3VhLXBhcnNlci1qcy9zcmMvdWEtcGFyc2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsInZhciBERUZBVUxUUyA9IHtcblx0Q2hyb21lOiA1NywgLy8gSW5jbHVkZXMgQ2hyb21lIGZvciBtb2JpbGUgZGV2aWNlc1xuXHRFZGdlOiAzOSxcblx0U2FmYXJpOiAxMCxcblx0XCJNb2JpbGUgU2FmYXJpXCI6IDEwLFxuXHRPcGVyYTogNTAsXG5cdEZpcmVmb3g6IDUwLFxuXHRWaXZhbGRpOiAxLFxuXHRJRTogZmFsc2Vcbn1cblxudmFyIEVER0VIVE1MX1ZTX0VER0VfVkVSU0lPTlMgPSB7XG5cdDEyOiAwLjEsXG5cdDEzOiAyMSxcblx0MTQ6IDMxLFxuXHQxNTogMzksXG5cdDE2OiA0MSxcblx0MTc6IDQyLFxuXHQxODogNDRcbn1cblxudmFyIHVwZGF0ZURlZmF1bHRzID0gZnVuY3Rpb24gKGRlZmF1bHRzLCB1cGRhdGVkVmFsdWVzKSB7XG5cdGZvciAodmFyIGtleSBpbiB1cGRhdGVkVmFsdWVzKSB7XG5cdFx0ZGVmYXVsdHNba2V5XSA9IHVwZGF0ZWRWYWx1ZXNba2V5XVxuXHR9XG5cblx0cmV0dXJuIGRlZmF1bHRzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBhcnNlZFVzZXJBZ2VudCwgb3B0aW9ucykge1xuXHQvLyBTZXQgZGVmYXVsdCBvcHRpb25zXG5cdHZhciBicm93c2VyU3VwcG9ydCA9IG9wdGlvbnMuYnJvd3NlclN1cHBvcnQgPyB1cGRhdGVEZWZhdWx0cyhERUZBVUxUUywgb3B0aW9ucy5icm93c2VyU3VwcG9ydCkgOiBERUZBVUxUU1xuXHR2YXIgcmVxdWlyZWRDc3NQcm9wZXJ0eSA9IG9wdGlvbnMucmVxdWlyZWRDc3NQcm9wZXJ0eSB8fCBmYWxzZVxuXG5cdHZhciBwYXJzZU1pbm9yVmVyc2lvbiA9IGZ1bmN0aW9uICh2ZXJzaW9uKSB7XG5cdFx0cmV0dXJuIHZlcnNpb24ucmVwbGFjZSgvW15cXGQuXS9nLCAnJykuc3BsaXQoXCIuXCIpWzFdO1xuXHR9XG5cblx0dmFyIGlzQW5kcm9pZEJ1dE5vdENocm9tZVxuXHRpZiAob3B0aW9ucy5yZXF1aXJlQ2hyb21lT25BbmRyb2lkKSB7XG5cdFx0aXNBbmRyb2lkQnV0Tm90Q2hyb21lID0gaXNBbmRyb2lkICYmIHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm5hbWUgIT09IFwiQ2hyb21lXCJcblx0fVxuXG5cdHZhciBpc0Jyb3dzZXJVbnN1cHBvcnRlZCA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgYnJvd3Nlck5hbWUgPSBwYXJzZWRVc2VyQWdlbnQuYnJvd3Nlci5uYW1lXG5cdFx0dmFyIGlzVW5zdXBwb3J0ZWQgPSBmYWxzZVxuXHRcdGlmICghKGJyb3dzZXJOYW1lIGluIGJyb3dzZXJTdXBwb3J0KSkge1xuXHRcdFx0aWYgKCFvcHRpb25zLmlzVW5rbm93bkJyb3dzZXJPSykge1xuXHRcdFx0XHRpc1Vuc3VwcG9ydGVkID0gdHJ1ZVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoIWJyb3dzZXJTdXBwb3J0W2Jyb3dzZXJOYW1lXSkge1xuXHRcdFx0aXNVbnN1cHBvcnRlZCA9IHRydWVcblx0XHR9XG5cdFx0cmV0dXJuIGlzVW5zdXBwb3J0ZWQ7XG5cdH1cblxuXHR2YXIgaXNCcm93c2VyVW5zdXBwb3J0ZWRSZXN1bHQgPSBpc0Jyb3dzZXJVbnN1cHBvcnRlZCgpO1xuXHR2YXIgaXNCcm93c2VyT3V0T2ZEYXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBicm93c2VyTmFtZSA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm5hbWU7XG5cdFx0dmFyIGJyb3dzZXJWZXJzaW9uID0gcGFyc2VkVXNlckFnZW50LmJyb3dzZXIudmVyc2lvbjtcblx0XHR2YXIgYnJvd3Nlck1ham9yVmVyc2lvbiA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm1ham9yO1xuXHRcdHZhciBvc05hbWUgPSBwYXJzZWRVc2VyQWdlbnQub3MubmFtZTtcblx0XHR2YXIgb3NWZXJzaW9uID0gcGFyc2VkVXNlckFnZW50Lm9zLnZlcnNpb247XG5cblx0XHQvLyBFZGdlIGxlZ2FjeSBuZWVkZWQgYSB2ZXJzaW9uIG1hcHBpbmcsIEVkZ2Ugb24gQ2hyb21pdW0gZG9lc24ndFxuXHRcdGlmIChicm93c2VyTmFtZSA9PT0gXCJFZGdlXCIgJiYgYnJvd3Nlck1ham9yVmVyc2lvbiA8PSAxOCkge1xuXHRcdFx0YnJvd3Nlck1ham9yVmVyc2lvbiA9IEVER0VIVE1MX1ZTX0VER0VfVkVSU0lPTlNbYnJvd3Nlck1ham9yVmVyc2lvbl07XG5cdFx0fVxuXG5cdFx0Ly8gRmlyZWZveCBNb2JpbGUgb24gaU9TIGlzIGVzc2VudGlhbGx5IE1vYmlsZSBTYWZhcmkgc28gbmVlZHMgdG8gYmUgaGFuZGxlZCB0aGF0IHdheVxuXHRcdC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL21pa2VtYWNjYW5hL291dGRhdGVkLWJyb3dzZXItcmV3b3JrL2lzc3Vlcy85OCNpc3N1ZWNvbW1lbnQtNTk3NzIxMTczXG5cdFx0aWYgKGJyb3dzZXJOYW1lID09PSAnRmlyZWZveCcgJiYgb3NOYW1lID09PSAnaU9TJykge1xuXHRcdFx0YnJvd3Nlck5hbWUgPSAnTW9iaWxlIFNhZmFyaSc7XG5cdFx0XHRicm93c2VyVmVyc2lvbiA9IG9zVmVyc2lvbjtcblx0XHRcdGJyb3dzZXJNYWpvclZlcnNpb24gPSBvc1ZlcnNpb24uc3Vic3RyaW5nKDAsIG9zVmVyc2lvbi5pbmRleE9mKCcuJykpO1xuXHRcdH1cblxuXHRcdGRlYnVnZ2VyO1xuXG5cdFx0dmFyIGlzT3V0T2ZEYXRlID0gZmFsc2Vcblx0XHRpZiAoaXNCcm93c2VyVW5zdXBwb3J0ZWRSZXN1bHQpIHtcblx0XHRcdGlzT3V0T2ZEYXRlID0gdHJ1ZTtcblx0XHR9IGVsc2UgaWYgKGJyb3dzZXJOYW1lIGluIGJyb3dzZXJTdXBwb3J0KSB7XG5cdFx0XHR2YXIgbWluVmVyc2lvbiA9IGJyb3dzZXJTdXBwb3J0W2Jyb3dzZXJOYW1lXVxuXHRcdFx0aWYgKHR5cGVvZiBtaW5WZXJzaW9uID09ICdvYmplY3QnKSB7XG5cdFx0XHRcdHZhciBtaW5NYWpvclZlcnNpb24gPSBtaW5WZXJzaW9uLm1ham9yXG5cdFx0XHRcdHZhciBtaW5NaW5vclZlcnNpb24gPSBtaW5WZXJzaW9uLm1pbm9yXG5cblx0XHRcdFx0aWYgKGJyb3dzZXJNYWpvclZlcnNpb24gPCBtaW5NYWpvclZlcnNpb24pIHtcblx0XHRcdFx0XHRpc091dE9mRGF0ZSA9IHRydWVcblx0XHRcdFx0fSBlbHNlIGlmIChicm93c2VyTWFqb3JWZXJzaW9uID09IG1pbk1ham9yVmVyc2lvbikge1xuXHRcdFx0XHRcdHZhciBicm93c2VyTWlub3JWZXJzaW9uID0gcGFyc2VNaW5vclZlcnNpb24oYnJvd3NlclZlcnNpb24pXG5cblx0XHRcdFx0XHRpZiAoYnJvd3Nlck1pbm9yVmVyc2lvbiA8IG1pbk1pbm9yVmVyc2lvbikge1xuXHRcdFx0XHRcdFx0aXNPdXRPZkRhdGUgPSB0cnVlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGJyb3dzZXJNYWpvclZlcnNpb24gPCBtaW5WZXJzaW9uKSB7XG5cdFx0XHRcdGlzT3V0T2ZEYXRlID0gdHJ1ZVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gaXNPdXRPZkRhdGVcblx0fVxuXG5cdC8vIFJldHVybnMgdHJ1ZSBpZiBhIGJyb3dzZXIgc3VwcG9ydHMgYSBjc3MzIHByb3BlcnR5XG5cdHZhciBpc1Byb3BlcnR5U3VwcG9ydGVkID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG5cdFx0aWYgKCFwcm9wZXJ0eSkge1xuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9XG5cdFx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcblx0XHR2YXIgdmVuZG9yUHJlZml4ZXMgPSBbXCJraHRtbFwiLCBcIm1zXCIsIFwib1wiLCBcIm1velwiLCBcIndlYmtpdFwiXVxuXHRcdHZhciBjb3VudCA9IHZlbmRvclByZWZpeGVzLmxlbmd0aFxuXG5cdFx0Ly8gTm90ZTogSFRNTEVsZW1lbnQuc3R5bGUuaGFzT3duUHJvcGVydHkgc2VlbXMgYnJva2VuIGluIEVkZ2Vcblx0XHRpZiAocHJvcGVydHkgaW4gZGl2LnN0eWxlKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH1cblxuXHRcdHByb3BlcnR5ID0gcHJvcGVydHkucmVwbGFjZSgvXlthLXpdLywgZnVuY3Rpb24gKHZhbCkge1xuXHRcdFx0cmV0dXJuIHZhbC50b1VwcGVyQ2FzZSgpXG5cdFx0fSlcblxuXHRcdHdoaWxlIChjb3VudC0tKSB7XG5cdFx0XHR2YXIgcHJlZml4ZWRQcm9wZXJ0eSA9IHZlbmRvclByZWZpeGVzW2NvdW50XSArIHByb3BlcnR5XG5cdFx0XHQvLyBTZWUgY29tbWVudCByZTogSFRNTEVsZW1lbnQuc3R5bGUuaGFzT3duUHJvcGVydHkgYWJvdmVcblx0XHRcdGlmIChwcmVmaXhlZFByb3BlcnR5IGluIGRpdi5zdHlsZSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2Vcblx0fVxuXG5cdC8vIFJldHVybiByZXN1bHRzXG5cdHJldHVybiB7XG5cdFx0aXNBbmRyb2lkQnV0Tm90Q2hyb21lOiBpc0FuZHJvaWRCdXROb3RDaHJvbWUsXG5cdFx0aXNCcm93c2VyT3V0T2ZEYXRlOiBpc0Jyb3dzZXJPdXRPZkRhdGUoKSxcblx0XHRpc0Jyb3dzZXJVbnN1cHBvcnRlZDogaXNCcm93c2VyVW5zdXBwb3J0ZWRSZXN1bHQsXG5cdFx0aXNQcm9wZXJ0eVN1cHBvcnRlZDogaXNQcm9wZXJ0eVN1cHBvcnRlZChyZXF1aXJlZENzc1Byb3BlcnR5KVxuXHR9O1xufVxuIiwiLyogSGlnaGx5IGR1bWJlZCBkb3duIHZlcnNpb24gb2YgaHR0cHM6Ly9naXRodWIuY29tL3VuY2xlY2h1L25vZGUtZGVlcC1leHRlbmQgKi9cclxuXHJcbi8qKlxyXG4gKiBFeHRlbmluZyBvYmplY3QgdGhhdCBlbnRlcmVkIGluIGZpcnN0IGFyZ3VtZW50LlxyXG4gKlxyXG4gKiBSZXR1cm5zIGV4dGVuZGVkIG9iamVjdCBvciBmYWxzZSBpZiBoYXZlIG5vIHRhcmdldCBvYmplY3Qgb3IgaW5jb3JyZWN0IHR5cGUuXHJcbiAqXHJcbiAqIElmIHlvdSB3aXNoIHRvIGNsb25lIHNvdXJjZSBvYmplY3QgKHdpdGhvdXQgbW9kaWZ5IGl0KSwganVzdCB1c2UgZW1wdHkgbmV3XHJcbiAqIG9iamVjdCBhcyBmaXJzdCBhcmd1bWVudCwgbGlrZSB0aGlzOlxyXG4gKiAgIGRlZXBFeHRlbmQoe30sIHlvdXJPYmpfMSwgW3lvdXJPYmpfTl0pO1xyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWVwRXh0ZW5kKC8qb2JqXzEsIFtvYmpfMl0sIFtvYmpfTl0qLykge1xyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMSB8fCB0eXBlb2YgYXJndW1lbnRzWzBdICE9PSBcIm9iamVjdFwiKSB7XHJcblx0XHRyZXR1cm4gZmFsc2VcclxuXHR9XHJcblxyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikge1xyXG5cdFx0cmV0dXJuIGFyZ3VtZW50c1swXVxyXG5cdH1cclxuXHJcblx0dmFyIHRhcmdldCA9IGFyZ3VtZW50c1swXVxyXG5cclxuXHRmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIG9iaiA9IGFyZ3VtZW50c1tpXVxyXG5cclxuXHRcdGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuXHRcdFx0dmFyIHNyYyA9IHRhcmdldFtrZXldXHJcblx0XHRcdHZhciB2YWwgPSBvYmpba2V5XVxyXG5cclxuXHRcdFx0aWYgKHR5cGVvZiB2YWwgIT09IFwib2JqZWN0XCIgfHwgdmFsID09PSBudWxsKSB7XHJcblx0XHRcdFx0dGFyZ2V0W2tleV0gPSB2YWxcclxuXHJcblx0XHRcdFx0Ly8ganVzdCBjbG9uZSBhcnJheXMgKGFuZCByZWN1cnNpdmUgY2xvbmUgb2JqZWN0cyBpbnNpZGUpXHJcblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIHNyYyAhPT0gXCJvYmplY3RcIiB8fCBzcmMgPT09IG51bGwpIHtcclxuXHRcdFx0XHR0YXJnZXRba2V5XSA9IGRlZXBFeHRlbmQoe30sIHZhbClcclxuXHJcblx0XHRcdFx0Ly8gc291cmNlIHZhbHVlIGFuZCBuZXcgdmFsdWUgaXMgb2JqZWN0cyBib3RoLCBleHRlbmRpbmcuLi5cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0YXJnZXRba2V5XSA9IGRlZXBFeHRlbmQoc3JjLCB2YWwpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiB0YXJnZXRcclxufVxyXG4iLCJ2YXIgZXZhbHVhdGVCcm93c2VyID0gcmVxdWlyZShcIi4vZXZhbHVhdGVCcm93c2VyXCIpXG52YXIgbGFuZ3VhZ2VNZXNzYWdlcyA9IHJlcXVpcmUoXCIuL2xhbmd1YWdlcy5qc29uXCIpXG52YXIgZGVlcEV4dGVuZCA9IHJlcXVpcmUoXCIuL2V4dGVuZFwiKVxudmFyIFVzZXJBZ2VudFBhcnNlciA9IHJlcXVpcmUoXCJ1YS1wYXJzZXItanNcIilcblxudmFyIENPTE9SUyA9IHtcblx0c2FsbW9uOiBcIiNmMjU2NDhcIixcblx0d2hpdGU6IFwid2hpdGVcIlxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0dmFyIG1haW4gPSBmdW5jdGlvbigpIHtcblx0XHQvLyBEZXNwaXRlIHRoZSBkb2NzLCBVQSBuZWVkcyB0byBiZSBwcm92aWRlZCB0byBjb25zdHJ1Y3RvciBleHBsaWNpdGx5OlxuXHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWlzYWxtYW4vdWEtcGFyc2VyLWpzL2lzc3Vlcy85MFxuXHRcdHZhciBwYXJzZWRVc2VyQWdlbnQgPSBuZXcgVXNlckFnZW50UGFyc2VyKG5hdmlnYXRvci51c2VyQWdlbnQpLmdldFJlc3VsdCgpXG5cblx0XHQvLyBWYXJpYWJsZSBkZWZpbml0aW9uIChiZWZvcmUgYWpheClcblx0XHR2YXIgb3V0ZGF0ZWRVSSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3V0ZGF0ZWRcIilcblxuXHRcdC8vIFNldCBkZWZhdWx0IG9wdGlvbnNcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG5cdFx0dmFyIGJyb3dzZXJMb2NhbGUgPSB3aW5kb3cubmF2aWdhdG9yLmxhbmd1YWdlIHx8IHdpbmRvdy5uYXZpZ2F0b3IudXNlckxhbmd1YWdlIC8vIEV2ZXJ5b25lIGVsc2UsIElFXG5cdFx0Ly8gQ1NTIHByb3BlcnR5IHRvIGNoZWNrIGZvci4gWW91IG1heSBhbHNvIGxpa2UgJ2JvcmRlclNwYWNpbmcnLCAnYm94U2hhZG93JywgJ3RyYW5zZm9ybScsICdib3JkZXJJbWFnZSc7XG5cdFx0dmFyIGJhY2tncm91bmRDb2xvciA9IG9wdGlvbnMuYmFja2dyb3VuZENvbG9yIHx8IENPTE9SUy5zYWxtb25cblx0XHR2YXIgdGV4dENvbG9yID0gb3B0aW9ucy50ZXh0Q29sb3IgfHwgQ09MT1JTLndoaXRlXG5cdFx0dmFyIGZ1bGxzY3JlZW4gPSBvcHRpb25zLmZ1bGxzY3JlZW4gfHwgZmFsc2Vcblx0XHR2YXIgbGFuZ3VhZ2UgPSBvcHRpb25zLmxhbmd1YWdlIHx8IGJyb3dzZXJMb2NhbGUuc2xpY2UoMCwgMikgLy8gTGFuZ3VhZ2UgY29kZVxuXG5cdFx0dmFyIHVwZGF0ZVNvdXJjZSA9IFwid2ViXCIgLy8gT3RoZXIgcG9zc2libGUgdmFsdWVzIGFyZSAnZ29vZ2xlUGxheScgb3IgJ2FwcFN0b3JlJy4gRGV0ZXJtaW5lcyB3aGVyZSB3ZSB0ZWxsIHVzZXJzIHRvIGdvIGZvciB1cGdyYWRlcy5cblxuXHRcdC8vIENocm9tZSBtb2JpbGUgaXMgc3RpbGwgQ2hyb21lICh1bmxpa2UgU2FmYXJpIHdoaWNoIGlzICdNb2JpbGUgU2FmYXJpJylcblx0XHR2YXIgaXNBbmRyb2lkID0gcGFyc2VkVXNlckFnZW50Lm9zLm5hbWUgPT09IFwiQW5kcm9pZFwiXG5cdFx0aWYgKGlzQW5kcm9pZCkge1xuXHRcdFx0dXBkYXRlU291cmNlID0gXCJnb29nbGVQbGF5XCJcblx0XHR9IGVsc2UgaWYgIChwYXJzZWRVc2VyQWdlbnQub3MubmFtZSA9PT0gXCJpT1NcIikge1xuXHRcdFx0dXBkYXRlU291cmNlID0gXCJhcHBTdG9yZVwiXG5cdFx0fVxuXG5cdFx0dmFyIGlzQnJvd3NlclVuc3VwcG9ydGVkID0gZmFsc2UgLy8gc2V0IGxhdGVyIGFmdGVyIGJyb3dzZXIgZXZhbHVhdGlvblxuXG5cdFx0dmFyIGRvbmUgPSB0cnVlXG5cblx0XHR2YXIgY2hhbmdlT3BhY2l0eSA9IGZ1bmN0aW9uIChvcGFjaXR5VmFsdWUpIHtcblx0XHRcdG91dGRhdGVkVUkuc3R5bGUub3BhY2l0eSA9IG9wYWNpdHlWYWx1ZSAvIDEwMFxuXHRcdFx0b3V0ZGF0ZWRVSS5zdHlsZS5maWx0ZXIgPSBcImFscGhhKG9wYWNpdHk9XCIgKyBvcGFjaXR5VmFsdWUgKyBcIilcIlxuXHRcdH1cblx0XG5cdFx0dmFyIGZhZGVJbiA9IGZ1bmN0aW9uIChvcGFjaXR5VmFsdWUpIHtcblx0XHRcdGNoYW5nZU9wYWNpdHkob3BhY2l0eVZhbHVlKVxuXHRcdFx0aWYgKG9wYWNpdHlWYWx1ZSA9PT0gMSkge1xuXHRcdFx0XHRvdXRkYXRlZFVJLnN0eWxlLmRpc3BsYXkgPSBcInRhYmxlXCJcblx0XHRcdH1cblx0XHRcdGlmIChvcGFjaXR5VmFsdWUgPT09IDEwMCkge1xuXHRcdFx0XHRkb25lID0gdHJ1ZVxuXHRcdFx0fVxuXHRcdH1cblx0XG5cdFx0dmFyIG1ha2VGYWRlSW5GdW5jdGlvbiA9IGZ1bmN0aW9uIChvcGFjaXR5VmFsdWUpIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGZhZGVJbihvcGFjaXR5VmFsdWUpXG5cdFx0XHR9XG5cdFx0fVxuXHRcblx0XHQvLyBTdHlsZSBlbGVtZW50IGV4cGxpY2l0bHkgLSBUT0RPOiBpbnZlc3RpZ2F0ZSBhbmQgZGVsZXRlIGlmIG5vdCBuZWVkZWRcblx0XHR2YXIgc3RhcnRTdHlsZXNBbmRFdmVudHMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgYnV0dG9uQ2xvc2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJ1dHRvbkNsb3NlVXBkYXRlQnJvd3NlclwiKVxuXHRcdFx0dmFyIGJ1dHRvblVwZGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnV0dG9uVXBkYXRlQnJvd3NlclwiKVxuXHRcblx0XHRcdC8vY2hlY2sgc2V0dGluZ3MgYXR0cmlidXRlc1xuXHRcdFx0b3V0ZGF0ZWRVSS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBiYWNrZ3JvdW5kQ29sb3Jcblx0XHRcdC8vd2F5IHRvbyBoYXJkIHRvIHB1dCAhaW1wb3J0YW50IG9uIElFNlxuXHRcdFx0b3V0ZGF0ZWRVSS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcdFx0b3V0ZGF0ZWRVSS5jaGlsZHJlblswXS5jaGlsZHJlblswXS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcdFx0b3V0ZGF0ZWRVSS5jaGlsZHJlblswXS5jaGlsZHJlblsxXS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcblx0XHRcdC8vIFVwZGF0ZSBidXR0b24gaXMgZGVza3RvcCBvbmx5XG5cdFx0XHRpZiAoYnV0dG9uVXBkYXRlKSB7XG5cdFx0XHRcdGJ1dHRvblVwZGF0ZS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcdFx0XHRpZiAoYnV0dG9uVXBkYXRlLnN0eWxlLmJvcmRlckNvbG9yKSB7XG5cdFx0XHRcdFx0YnV0dG9uVXBkYXRlLnN0eWxlLmJvcmRlckNvbG9yID0gdGV4dENvbG9yXG5cdFx0XHRcdH1cblx0XG5cdFx0XHRcdC8vIE92ZXJyaWRlIHRoZSB1cGRhdGUgYnV0dG9uIGNvbG9yIHRvIG1hdGNoIHRoZSBiYWNrZ3JvdW5kIGNvbG9yXG5cdFx0XHRcdGJ1dHRvblVwZGF0ZS5vbm1vdXNlb3ZlciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHR0aGlzLnN0eWxlLmNvbG9yID0gYmFja2dyb3VuZENvbG9yXG5cdFx0XHRcdFx0dGhpcy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0ZXh0Q29sb3Jcblx0XHRcdFx0fVxuXHRcblx0XHRcdFx0YnV0dG9uVXBkYXRlLm9ubW91c2VvdXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dGhpcy5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcdFx0XHRcdHRoaXMuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gYmFja2dyb3VuZENvbG9yXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XG5cdFx0XHRidXR0b25DbG9zZS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcblx0XHRcdGJ1dHRvbkNsb3NlLm9ubW91c2Vkb3duID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRvdXRkYXRlZFVJLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIlxuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH1cblx0XHR9XG5cdFxuXHRcdHZhciBnZXRNZXNzYWdlID0gZnVuY3Rpb24gKGxhbmcpIHtcblx0XHRcdHZhciBkZWZhdWx0TWVzc2FnZXMgPSBsYW5ndWFnZU1lc3NhZ2VzW2xhbmddIHx8IGxhbmd1YWdlTWVzc2FnZXMuZW5cblx0XHRcdHZhciBjdXN0b21NZXNzYWdlcyA9IG9wdGlvbnMubWVzc2FnZXMgJiYgb3B0aW9ucy5tZXNzYWdlc1tsYW5nXVxuXHRcdFx0dmFyIG1lc3NhZ2VzID0gZGVlcEV4dGVuZCh7fSwgZGVmYXVsdE1lc3NhZ2VzLCBjdXN0b21NZXNzYWdlcylcblx0XG5cdFx0XHR2YXIgdXBkYXRlTWVzc2FnZXMgPSB7XG5cdFx0XHRcdHdlYjpcblx0XHRcdFx0XHRcIjxwPlwiICtcblx0XHRcdFx0XHRtZXNzYWdlcy51cGRhdGUud2ViICtcblx0XHRcdFx0XHQobWVzc2FnZXMudXJsID8gKFxuXHRcdFx0XHRcdFx0JzxhIGlkPVwiYnV0dG9uVXBkYXRlQnJvd3NlclwiIHJlbD1cIm5vZm9sbG93XCIgaHJlZj1cIicgK1xuXHRcdFx0XHRcdFx0bWVzc2FnZXMudXJsICtcblx0XHRcdFx0XHRcdCdcIj4nICtcblx0XHRcdFx0XHRcdG1lc3NhZ2VzLmNhbGxUb0FjdGlvbiArXG5cdFx0XHRcdFx0XHRcIjwvYT5cIlxuXHRcdFx0XHRcdCkgOiAnJykgK1xuXHRcdFx0XHRcdFwiPC9wPlwiLFxuXHRcdFx0XHRnb29nbGVQbGF5OlxuXHRcdFx0XHRcdFwiPHA+XCIgK1xuXHRcdFx0XHRcdG1lc3NhZ2VzLnVwZGF0ZS5nb29nbGVQbGF5ICtcblx0XHRcdFx0XHQnPGEgaWQ9XCJidXR0b25VcGRhdGVCcm93c2VyXCIgcmVsPVwibm9mb2xsb3dcIiBocmVmPVwiaHR0cHM6Ly9wbGF5Lmdvb2dsZS5jb20vc3RvcmUvYXBwcy9kZXRhaWxzP2lkPWNvbS5hbmRyb2lkLmNocm9tZVwiPicgK1xuXHRcdFx0XHRcdG1lc3NhZ2VzLmNhbGxUb0FjdGlvbiArXG5cdFx0XHRcdFx0XCI8L2E+PC9wPlwiLFxuXHRcdFx0XHRhcHBTdG9yZTogXCI8cD5cIiArIG1lc3NhZ2VzLnVwZGF0ZVt1cGRhdGVTb3VyY2VdICsgXCI8L3A+XCJcblx0XHRcdH1cblx0XG5cdFx0XHR2YXIgdXBkYXRlTWVzc2FnZSA9IHVwZGF0ZU1lc3NhZ2VzW3VwZGF0ZVNvdXJjZV1cblx0XG5cdFx0XHR2YXIgYnJvd3NlclN1cHBvcnRNZXNzYWdlID0gbWVzc2FnZXMub3V0T2ZEYXRlO1xuXHRcdFx0aWYgKGlzQnJvd3NlclVuc3VwcG9ydGVkICYmIG1lc3NhZ2VzLnVuc3VwcG9ydGVkKSB7XG5cdFx0XHRcdGJyb3dzZXJTdXBwb3J0TWVzc2FnZSA9IG1lc3NhZ2VzLnVuc3VwcG9ydGVkO1xuXHRcdFx0fVxuXHRcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdCc8ZGl2IGNsYXNzPVwidmVydGljYWwtY2VudGVyXCI+PGg2PicgK1xuXHRcdFx0XHRicm93c2VyU3VwcG9ydE1lc3NhZ2UgK1xuXHRcdFx0XHRcIjwvaDY+XCIgK1xuXHRcdFx0XHR1cGRhdGVNZXNzYWdlICtcblx0XHRcdFx0JzxwIGNsYXNzPVwibGFzdFwiPjxhIGhyZWY9XCIjXCIgaWQ9XCJidXR0b25DbG9zZVVwZGF0ZUJyb3dzZXJcIiB0aXRsZT1cIicgK1xuXHRcdFx0XHRtZXNzYWdlcy5jbG9zZSArXG5cdFx0XHRcdCdcIj4mdGltZXM7PC9hPjwvcD48L2Rpdj4nXG5cdFx0XHQpXG5cdFx0fVxuXG5cdFx0dmFyIHJlc3VsdCA9IGV2YWx1YXRlQnJvd3NlcihwYXJzZWRVc2VyQWdlbnQsIG9wdGlvbnMpO1xuXHRcdGlmIChyZXN1bHQuaXNBbmRyb2lkQnV0Tm90Q2hyb21lIHx8IHJlc3VsdC5pc0Jyb3dzZXJPdXRPZkRhdGUgfHwgIXJlc3VsdC5pc1Byb3BlcnR5U3VwcG9ydGVkKSB7XG5cdFx0XHQvLyBUaGlzIGlzIGFuIG91dGRhdGVkIGJyb3dzZXIgYW5kIHRoZSBiYW5uZXIgbmVlZHMgdG8gc2hvd1xuXG5cdFx0XHQvLyBTZXQgdGhpcyBmbGFnIHdpdGggdGhlIHJlc3VsdCBmb3IgYGdldE1lc3NhZ2VgXG5cdFx0XHRpc0Jyb3dzZXJVbnN1cHBvcnRlZCA9IHJlc3VsdC5pc0Jyb3dzZXJVbnN1cHBvcnRlZFxuXG5cdFx0XHRpZiAoZG9uZSAmJiBvdXRkYXRlZFVJLnN0eWxlLm9wYWNpdHkgIT09IFwiMVwiKSB7XG5cdFx0XHRcdGRvbmUgPSBmYWxzZVxuXHRcblx0XHRcdFx0Zm9yICh2YXIgb3BhY2l0eSA9IDE7IG9wYWNpdHkgPD0gMTAwOyBvcGFjaXR5KyspIHtcblx0XHRcdFx0XHRzZXRUaW1lb3V0KG1ha2VGYWRlSW5GdW5jdGlvbihvcGFjaXR5KSwgb3BhY2l0eSAqIDgpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XG5cdFx0XHR2YXIgaW5zZXJ0Q29udGVudEhlcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm91dGRhdGVkXCIpXG5cdFx0XHRpZiAoZnVsbHNjcmVlbikge1xuXHRcdFx0XHRpbnNlcnRDb250ZW50SGVyZS5jbGFzc0xpc3QuYWRkKFwiZnVsbHNjcmVlblwiKVxuXHRcdFx0fVxuXHRcdFx0aW5zZXJ0Q29udGVudEhlcmUuaW5uZXJIVE1MID0gZ2V0TWVzc2FnZShsYW5ndWFnZSlcblx0XHRcdHN0YXJ0U3R5bGVzQW5kRXZlbnRzKClcblx0XHR9XG5cdH1cblxuXHQvLyBMb2FkIG1haW4gd2hlbiBET00gcmVhZHkuXG5cdHZhciBvbGRPbmxvYWQgPSB3aW5kb3cub25sb2FkXG5cdGlmICh0eXBlb2Ygd2luZG93Lm9ubG9hZCAhPT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0d2luZG93Lm9ubG9hZCA9IG1haW5cblx0fSBlbHNlIHtcblx0XHR3aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAob2xkT25sb2FkKSB7XG5cdFx0XHRcdG9sZE9ubG9hZCgpXG5cdFx0XHR9XG5cdFx0XHRtYWluKClcblx0XHR9XG5cdH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzPXtcclxuXHRcImJyXCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiTyBzZXUgbmF2ZWdhZG9yIGVzdCZhYWN1dGU7IGRlc2F0dWFsaXphZG8hXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiQXR1YWxpemUgbyBzZXUgbmF2ZWdhZG9yIHBhcmEgdGVyIHVtYSBtZWxob3IgZXhwZXJpJmVjaXJjO25jaWEgZSB2aXN1YWxpemEmY2NlZGlsOyZhdGlsZGU7byBkZXN0ZSBzaXRlLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIkF0dWFsaXplIG8gc2V1IG5hdmVnYWRvciBhZ29yYVwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIkZlY2hhclwiXHJcblx0fSxcclxuXHRcImNhXCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiRWwgdm9zdHJlIG5hdmVnYWRvciBubyBlc3TDoCBhY3R1YWxpdHphdCFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJBY3R1YWxpdHpldSBlbCB2b3N0cmUgbmF2ZWdhZG9yIHBlciB2ZXVyZSBjb3JyZWN0YW1lbnQgYXF1ZXN0IGxsb2Mgd2ViLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiSW5zdGFswrdsZXUgQ2hyb21lIGRlcyBkZSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiQWN0dWFsaXR6ZXUgaU9TIGRlcyBkZSBsJ2FwbGljYWNpw7MgQ29uZmlndXJhY2nDs1wiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIkFjdHVhbGl0emFyIGVsIG1ldSBuYXZlZ2Fkb3IgYXJhXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiVGFuY2FyXCJcclxuXHR9LFxyXG5cdFwiY25cIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCLmgqjnmoTmtY/op4jlmajlt7Lov4fml7ZcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCLopoHmraPluLjmtY/op4jmnKznvZHnq5nor7fljYfnuqfmgqjnmoTmtY/op4jlmajjgIJcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIueOsOWcqOWNh+e6p1wiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIuWFs+mXrVwiXHJcblx0fSxcclxuXHRcImN6XCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiVsOhxaEgcHJvaGzDrcW+ZcSNIGplIHphc3RhcmFsw70hXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiUHJvIHNwcsOhdm7DqSB6b2JyYXplbsOtIHTEm2NodG8gc3Ryw6FuZWsgYWt0dWFsaXp1anRlIHN2xa9qIHByb2hsw63FvmXEjS4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIk5haW5zdGFsdWp0ZSBzaSBDaHJvbWUgeiBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiQWt0dWFsaXp1anRlIHNpIHN5c3TDqW0gaU9TXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiQWt0dWFsaXpvdmF0IG55bsOtIHN2xa9qIHByb2hsw63FvmXEjVwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIlphdsWZw610XCJcclxuXHR9LFxyXG5cdFwiZGFcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJEaW4gYnJvd3NlciBlciBmb3LDpmxkZXQhXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiT3BkYXTDqXIgZGluIGJyb3dzZXIgZm9yIGF0IGbDpSB2aXN0IGRlbm5lIGhqZW1tZXNpZGUga29ycmVrdC4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIkluc3RhbGzDqXIgdmVubGlnc3QgQ2hyb21lIGZyYSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiT3BkYXTDqXIgdmVubGlnc3QgaU9TXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiT3BkYXTDqXIgZGluIGJyb3dzZXIgbnVcIixcclxuXHRcdFwiY2xvc2VcIjogXCJMdWtcIlxyXG5cdH0sXHJcblx0XCJkZVwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIklociBCcm93c2VyIGlzdCB2ZXJhbHRldCFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJCaXR0ZSBha3R1YWxpc2llcmVuIFNpZSBJaHJlbiBCcm93c2VyLCB1bSBkaWVzZSBXZWJzaXRlIGtvcnJla3QgZGFyenVzdGVsbGVuLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIkRlbiBCcm93c2VyIGpldHp0IGFrdHVhbGlzaWVyZW4gXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiU2NobGllw59lblwiXHJcblx0fSxcclxuXHRcImVlXCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiU2ludSB2ZWViaWxlaGl0c2VqYSBvbiB2YW5hbmVudWQhXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiUGFsdW4gdXVlbmRhIG9tYSB2ZWViaWxlaGl0c2VqYXQsIGV0IG7DpGhhIGxlaGVrw7xsZ2Uga29ycmVrdHNlbHQuIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiVXVlbmRhIG9tYSB2ZWViaWxlaGl0c2VqYXQga29oZVwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIlN1bGdlXCJcclxuXHR9LFxyXG5cdFwiZW5cIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJZb3VyIGJyb3dzZXIgaXMgb3V0LW9mLWRhdGUhXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiVXBkYXRlIHlvdXIgYnJvd3NlciB0byB2aWV3IHRoaXMgd2Vic2l0ZSBjb3JyZWN0bHkuIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiVXBkYXRlIG15IGJyb3dzZXIgbm93XCIsXHJcblx0XHRcImNsb3NlXCI6IFwiQ2xvc2VcIlxyXG5cdH0sXHJcblx0XCJlc1wiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIsKhVHUgbmF2ZWdhZG9yIGVzdMOhIGFudGljdWFkbyFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJBY3R1YWxpemEgdHUgbmF2ZWdhZG9yIHBhcmEgdmVyIGVzdGEgcMOhZ2luYSBjb3JyZWN0YW1lbnRlLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIkFjdHVhbGl6YXIgbWkgbmF2ZWdhZG9yIGFob3JhXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiQ2VycmFyXCJcclxuXHR9LFxyXG5cdFwiZmFcIjoge1xyXG5cdFx0XCJyaWdodFRvTGVmdFwiOiB0cnVlLFxyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCLZhdix2YjYsdqv2LEg2LTZhdinINmF2YbYs9mI2K4g2LTYr9mHINin2LPYqiFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCLYrNmH2Kog2YXYtNin2YfYr9mHINi12K3bjNitINin24zZhiDZiNio2LPYp9uM2KrYjCDZhdix2YjYsdqv2LHYqtin2YYg2LHYpyDYqNix2YjYsiDYsdiz2KfZhtuMINmG2YXYp9uM24zYry4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCLZh9mF24zZhiDYrdin2YTYpyDZhdix2YjYsdqv2LHZhSDYsdinINio2LHZiNiyINqp2YZcIixcclxuXHRcdFwiY2xvc2VcIjogXCJDbG9zZVwiXHJcblx0fSxcclxuXHRcImZpXCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiU2VsYWltZXNpIG9uIHZhbmhlbnR1bnV0IVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIkxhdGFhIGFqYW50YXNhaW5lbiBzZWxhaW4gbiZhdW1sO2hkJmF1bWw7a3Nlc2kgdCZhdW1sO20mYXVtbDtuIHNpdnVuIG9pa2Vpbi4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIkFzZW5uYSB1dXNpbiBDaHJvbWUgR29vZ2xlIFBsYXkgLWthdXBhc3RhXCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQw6Rpdml0w6QgaU9TIHB1aGVsaW1lc2kgYXNldHVrc2lzdGFcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJQJmF1bWw7aXZpdCZhdW1sOyBzZWxhaW1lbmkgbnl0IFwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIlN1bGplXCJcclxuXHR9LFxyXG5cdFwiZnJcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJWb3RyZSBuYXZpZ2F0ZXVyIG4nZXN0IHBsdXMgY29tcGF0aWJsZSAhXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiTWV0dGV6IMOgIGpvdXIgdm90cmUgbmF2aWdhdGV1ciBwb3VyIGFmZmljaGVyIGNvcnJlY3RlbWVudCBjZSBzaXRlIFdlYi4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIk1lcmNpIGQnaW5zdGFsbGVyIENocm9tZSBkZXB1aXMgbGUgR29vZ2xlIFBsYXkgU3RvcmVcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIk1lcmNpIGRlIG1ldHRyZSDDoCBqb3VyIGlPUyBkZXB1aXMgbCdhcHBsaWNhdGlvbiBSw6lnbGFnZXNcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJNZXR0cmUgw6Agam91ciBtYWludGVuYW50IFwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIkZlcm1lclwiXHJcblx0fSxcclxuXHRcImh1XCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiQSBiw7ZuZ8Opc3rFkWplIGVsYXZ1bHQhXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiRmlyc3PDrXRzZSB2YWd5IGNzZXLDqWxqZSBsZSBhIGLDtm5nw6lzesWRasOpdC4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJBIGLDtm5nw6lzesWRbSBmcmlzc8OtdMOpc2UgXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiQ2xvc2VcIlxyXG5cdH0sXHJcblx0XCJpZFwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIkJyb3dzZXIgeWFuZyBBbmRhIGd1bmFrYW4gc3VkYWgga2V0aW5nZ2FsYW4gemFtYW4hXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiUGVyYmFoYXJ1aWxhaCBicm93c2VyIEFuZGEgYWdhciBiaXNhIG1lbmplbGFqYWhpIHdlYnNpdGUgaW5pIGRlbmdhbiBueWFtYW4uIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiUGVyYmFoYXJ1aSBicm93c2VyIHNla2FyYW5nIFwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIkNsb3NlXCJcclxuXHR9LFxyXG5cdFwiaXRcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJJbCB0dW8gYnJvd3NlciBub24gJmVncmF2ZTsgYWdnaW9ybmF0byFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJBZ2dpb3JuYWxvIHBlciB2ZWRlcmUgcXVlc3RvIHNpdG8gY29ycmV0dGFtZW50ZS4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJBZ2dpb3JuYSBvcmFcIixcclxuXHRcdFwiY2xvc2VcIjogXCJDaGl1ZGlcIlxyXG5cdH0sXHJcblx0XCJsdFwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIkrFq3PFsyBuYXLFoXlrbMSXcyB2ZXJzaWphIHlyYSBwYXNlbnVzaSFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJBdG5hdWppbmtpdGUgc2F2byBuYXLFoXlrbMSZLCBrYWQgZ2FsxJd0dW3El3RlIHBlcsW+acWrcsSXdGkgxaFpxIUgc3ZldGFpbsSZIHRpbmthbWFpLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIkF0bmF1amludGkgbmFyxaF5a2zEmSBcIixcclxuXHRcdFwiY2xvc2VcIjogXCJDbG9zZVwiXHJcblx0fSxcclxuXHRcIm5sXCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiSmUgZ2VicnVpa3QgZWVuIG91ZGUgYnJvd3NlciFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJVcGRhdGUgamUgYnJvd3NlciBvbSBkZXplIHdlYnNpdGUgY29ycmVjdCB0ZSBiZWtpamtlbi4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJVcGRhdGUgbWlqbiBicm93c2VyIG51IFwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIlNsdWl0ZW5cIlxyXG5cdH0sXHJcblx0XCJwbFwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIlR3b2phIHByemVnbMSFZGFya2EgamVzdCBwcnplc3RhcnphxYJhIVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIlpha3R1YWxpenVqIHN3b2rEhSBwcnplZ2zEhWRhcmvEmSwgYWJ5IHBvcHJhd25pZSB3ecWbd2lldGxpxIcgdMSZIHN0cm9uxJkuIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQcm9zesSZIHphaW5zdGFsb3dhxIcgcHJ6ZWdsxIVkYXJrxJkgQ2hyb21lIHplIHNrbGVwdSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUHJvc3rEmSB6YWt0dWFsaXpvd2HEhyBpT1MgeiBVc3Rhd2llxYRcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJaYWt0dWFsaXp1aiBwcnplZ2zEhWRhcmvEmSBqdcW8IHRlcmF6XCIsXHJcblx0XHRcImNsb3NlXCI6IFwiWmFta25palwiXHJcblx0fSxcclxuXHRcInB0XCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiTyBzZXUgYnJvd3NlciBlc3QmYWFjdXRlOyBkZXNhdHVhbGl6YWRvIVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIkF0dWFsaXplIG8gc2V1IGJyb3dzZXIgcGFyYSB0ZXIgdW1hIG1lbGhvciBleHBlcmkmZWNpcmM7bmNpYSBlIHZpc3VhbGl6YSZjY2VkaWw7JmF0aWxkZTtvIGRlc3RlIHNpdGUuIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiQXR1YWxpemUgbyBzZXUgYnJvd3NlciBhZ29yYVwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIkZlY2hhclwiXHJcblx0fSxcclxuXHRcInJvXCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiQnJvd3NlcnVsIGVzdGUgw65udmVjaGl0IVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIkFjdHVhbGl6YcibaSBicm93c2VydWwgcGVudHJ1IGEgdml6dWFsaXphIGNvcmVjdCBhY2VzdCBzaXRlLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIkFjdHVhbGl6YcibaSBicm93c2VydWwgYWN1bSFcIixcclxuXHRcdFwiY2xvc2VcIjogXCJDbG9zZVwiXHJcblx0fSxcclxuXHRcInJ1XCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwi0JLQsNGIINCx0YDQsNGD0LfQtdGAINGD0YHRgtCw0YDQtdC7IVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcItCe0LHQvdC+0LLQuNGC0LUg0LLQsNGIINCx0YDQsNGD0LfQtdGAINC00LvRjyDQv9GA0LDQstC40LvRjNC90L7Qs9C+INC+0YLQvtCx0YDQsNC20LXQvdC40Y8g0Y3RgtC+0LPQviDRgdCw0LnRgtCwLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcItCe0LHQvdC+0LLQuNGC0Ywg0LzQvtC5INCx0YDQsNGD0LfQtdGAIFwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcItCX0LDQutGA0YvRgtGMXCJcclxuXHR9LFxyXG5cdFwic2lcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJWYcWhIGJyc2thbG5payBqZSB6YXN0YXJlbCFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJaYSBwcmF2aWxlbiBwcmlrYXogc3BsZXRuZSBzdHJhbmkgcG9zb2RvYml0ZSB2YcWhIGJyc2thbG5pay4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJQb3NvZG9iaSBicnNrYWxuaWsgXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiWmFwcmlcIlxyXG5cdH0sXHJcblx0XCJzdlwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIkRpbiB3ZWJibMOkc2FyZSBzdMO2ZGpzIGVqIGzDpG5ncmUhXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiVXBwZGF0ZXJhIGRpbiB3ZWJibMOkc2FyZSBmw7ZyIGF0dCB3ZWJicGxhdHNlbiBza2EgdmlzYXMga29ycmVrdC4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJVcHBkYXRlcmEgbWluIHdlYmJsw6RzYXJlIG51XCIsXHJcblx0XHRcImNsb3NlXCI6IFwiU3TDpG5nXCJcclxuXHR9LFxyXG5cdFwidWFcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCLQktCw0Ygg0LHRgNCw0YPQt9C10YAg0LfQsNGB0YLQsNGA0ZbQsiFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCLQntC90L7QstGW0YLRjCDQstCw0Ygg0LHRgNCw0YPQt9C10YAg0LTQu9GPINC/0YDQsNCy0LjQu9GM0L3QvtCz0L4g0LLRltC00L7QsdGA0LDQttC10L3QvdGPINGG0YzQvtCz0L4g0YHQsNC50YLQsC4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCLQntC90L7QstC40YLQuCDQvNGW0Lkg0LHRgNCw0YPQt9C10YAgXCIsXHJcblx0XHRcImNsb3NlXCI6IFwi0JfQsNC60YDQuNGC0LhcIlxyXG5cdH1cclxufVxyXG4iLCIvKiFcbiAqIFVBUGFyc2VyLmpzIHYwLjcuMjFcbiAqIExpZ2h0d2VpZ2h0IEphdmFTY3JpcHQtYmFzZWQgVXNlci1BZ2VudCBzdHJpbmcgcGFyc2VyXG4gKiBodHRwczovL2dpdGh1Yi5jb20vZmFpc2FsbWFuL3VhLXBhcnNlci1qc1xuICpcbiAqIENvcHlyaWdodCDCqSAyMDEyLTIwMTkgRmFpc2FsIFNhbG1hbiA8ZkBmYWlzYWxtYW4uY29tPlxuICogTGljZW5zZWQgdW5kZXIgTUlUIExpY2Vuc2VcbiAqL1xuXG4oZnVuY3Rpb24gKHdpbmRvdywgdW5kZWZpbmVkKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLy8vLy8vLy8vLy8vL1xuICAgIC8vIENvbnN0YW50c1xuICAgIC8vLy8vLy8vLy8vLy9cblxuXG4gICAgdmFyIExJQlZFUlNJT04gID0gJzAuNy4yMScsXG4gICAgICAgIEVNUFRZICAgICAgID0gJycsXG4gICAgICAgIFVOS05PV04gICAgID0gJz8nLFxuICAgICAgICBGVU5DX1RZUEUgICA9ICdmdW5jdGlvbicsXG4gICAgICAgIFVOREVGX1RZUEUgID0gJ3VuZGVmaW5lZCcsXG4gICAgICAgIE9CSl9UWVBFICAgID0gJ29iamVjdCcsXG4gICAgICAgIFNUUl9UWVBFICAgID0gJ3N0cmluZycsXG4gICAgICAgIE1BSk9SICAgICAgID0gJ21ham9yJywgLy8gZGVwcmVjYXRlZFxuICAgICAgICBNT0RFTCAgICAgICA9ICdtb2RlbCcsXG4gICAgICAgIE5BTUUgICAgICAgID0gJ25hbWUnLFxuICAgICAgICBUWVBFICAgICAgICA9ICd0eXBlJyxcbiAgICAgICAgVkVORE9SICAgICAgPSAndmVuZG9yJyxcbiAgICAgICAgVkVSU0lPTiAgICAgPSAndmVyc2lvbicsXG4gICAgICAgIEFSQ0hJVEVDVFVSRT0gJ2FyY2hpdGVjdHVyZScsXG4gICAgICAgIENPTlNPTEUgICAgID0gJ2NvbnNvbGUnLFxuICAgICAgICBNT0JJTEUgICAgICA9ICdtb2JpbGUnLFxuICAgICAgICBUQUJMRVQgICAgICA9ICd0YWJsZXQnLFxuICAgICAgICBTTUFSVFRWICAgICA9ICdzbWFydHR2JyxcbiAgICAgICAgV0VBUkFCTEUgICAgPSAnd2VhcmFibGUnLFxuICAgICAgICBFTUJFRERFRCAgICA9ICdlbWJlZGRlZCc7XG5cblxuICAgIC8vLy8vLy8vLy8vXG4gICAgLy8gSGVscGVyXG4gICAgLy8vLy8vLy8vL1xuXG5cbiAgICB2YXIgdXRpbCA9IHtcbiAgICAgICAgZXh0ZW5kIDogZnVuY3Rpb24gKHJlZ2V4ZXMsIGV4dGVuc2lvbnMpIHtcbiAgICAgICAgICAgIHZhciBtZXJnZWRSZWdleGVzID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBpIGluIHJlZ2V4ZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXh0ZW5zaW9uc1tpXSAmJiBleHRlbnNpb25zW2ldLmxlbmd0aCAlIDIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbWVyZ2VkUmVnZXhlc1tpXSA9IGV4dGVuc2lvbnNbaV0uY29uY2F0KHJlZ2V4ZXNbaV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1lcmdlZFJlZ2V4ZXNbaV0gPSByZWdleGVzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtZXJnZWRSZWdleGVzO1xuICAgICAgICB9LFxuICAgICAgICBoYXMgOiBmdW5jdGlvbiAoc3RyMSwgc3RyMikge1xuICAgICAgICAgIGlmICh0eXBlb2Ygc3RyMSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmV0dXJuIHN0cjIudG9Mb3dlckNhc2UoKS5pbmRleE9mKHN0cjEudG9Mb3dlckNhc2UoKSkgIT09IC0xO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBsb3dlcml6ZSA6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfSxcbiAgICAgICAgbWFqb3IgOiBmdW5jdGlvbiAodmVyc2lvbikge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZih2ZXJzaW9uKSA9PT0gU1RSX1RZUEUgPyB2ZXJzaW9uLnJlcGxhY2UoL1teXFxkXFwuXS9nLCcnKS5zcGxpdChcIi5cIilbMF0gOiB1bmRlZmluZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIHRyaW0gOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eW1xcc1xcdUZFRkZcXHhBMF0rfFtcXHNcXHVGRUZGXFx4QTBdKyQvZywgJycpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gTWFwIGhlbHBlclxuICAgIC8vLy8vLy8vLy8vLy8vXG5cblxuICAgIHZhciBtYXBwZXIgPSB7XG5cbiAgICAgICAgcmd4IDogZnVuY3Rpb24gKHVhLCBhcnJheXMpIHtcblxuICAgICAgICAgICAgdmFyIGkgPSAwLCBqLCBrLCBwLCBxLCBtYXRjaGVzLCBtYXRjaDtcblxuICAgICAgICAgICAgLy8gbG9vcCB0aHJvdWdoIGFsbCByZWdleGVzIG1hcHNcbiAgICAgICAgICAgIHdoaWxlIChpIDwgYXJyYXlzLmxlbmd0aCAmJiAhbWF0Y2hlcykge1xuXG4gICAgICAgICAgICAgICAgdmFyIHJlZ2V4ID0gYXJyYXlzW2ldLCAgICAgICAvLyBldmVuIHNlcXVlbmNlICgwLDIsNCwuLilcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMgPSBhcnJheXNbaSArIDFdOyAgIC8vIG9kZCBzZXF1ZW5jZSAoMSwzLDUsLi4pXG4gICAgICAgICAgICAgICAgaiA9IGsgPSAwO1xuXG4gICAgICAgICAgICAgICAgLy8gdHJ5IG1hdGNoaW5nIHVhc3RyaW5nIHdpdGggcmVnZXhlc1xuICAgICAgICAgICAgICAgIHdoaWxlIChqIDwgcmVnZXgubGVuZ3RoICYmICFtYXRjaGVzKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcyA9IHJlZ2V4W2orK10uZXhlYyh1YSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEhbWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChwID0gMDsgcCA8IHByb3BzLmxlbmd0aDsgcCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSBtYXRjaGVzWysra107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcSA9IHByb3BzW3BdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGdpdmVuIHByb3BlcnR5IGlzIGFjdHVhbGx5IGFycmF5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBxID09PSBPQkpfVFlQRSAmJiBxLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHEubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcVsxXSA9PSBGVU5DX1RZUEUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhc3NpZ24gbW9kaWZpZWQgbWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3FbMF1dID0gcVsxXS5jYWxsKHRoaXMsIG1hdGNoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXNzaWduIGdpdmVuIHZhbHVlLCBpZ25vcmUgcmVnZXggbWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3FbMF1dID0gcVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChxLmxlbmd0aCA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayB3aGV0aGVyIGZ1bmN0aW9uIG9yIHJlZ2V4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHFbMV0gPT09IEZVTkNfVFlQRSAmJiAhKHFbMV0uZXhlYyAmJiBxWzFdLnRlc3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FsbCBmdW5jdGlvbiAodXN1YWxseSBzdHJpbmcgbWFwcGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcVswXV0gPSBtYXRjaCA/IHFbMV0uY2FsbCh0aGlzLCBtYXRjaCwgcVsyXSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNhbml0aXplIG1hdGNoIHVzaW5nIGdpdmVuIHJlZ2V4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1txWzBdXSA9IG1hdGNoID8gbWF0Y2gucmVwbGFjZShxWzFdLCBxWzJdKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChxLmxlbmd0aCA9PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1txWzBdXSA9IG1hdGNoID8gcVszXS5jYWxsKHRoaXMsIG1hdGNoLnJlcGxhY2UocVsxXSwgcVsyXSkpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1txXSA9IG1hdGNoID8gbWF0Y2ggOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGkgKz0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBzdHIgOiBmdW5jdGlvbiAoc3RyLCBtYXApIHtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBtYXApIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBhcnJheVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWFwW2ldID09PSBPQkpfVFlQRSAmJiBtYXBbaV0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1hcFtpXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHV0aWwuaGFzKG1hcFtpXVtqXSwgc3RyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoaSA9PT0gVU5LTk9XTikgPyB1bmRlZmluZWQgOiBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh1dGlsLmhhcyhtYXBbaV0sIHN0cikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChpID09PSBVTktOT1dOKSA/IHVuZGVmaW5lZCA6IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIC8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIFN0cmluZyBtYXBcbiAgICAvLy8vLy8vLy8vLy8vL1xuXG5cbiAgICB2YXIgbWFwcyA9IHtcblxuICAgICAgICBicm93c2VyIDoge1xuICAgICAgICAgICAgb2xkc2FmYXJpIDoge1xuICAgICAgICAgICAgICAgIHZlcnNpb24gOiB7XG4gICAgICAgICAgICAgICAgICAgICcxLjAnICAgOiAnLzgnLFxuICAgICAgICAgICAgICAgICAgICAnMS4yJyAgIDogJy8xJyxcbiAgICAgICAgICAgICAgICAgICAgJzEuMycgICA6ICcvMycsXG4gICAgICAgICAgICAgICAgICAgICcyLjAnICAgOiAnLzQxMicsXG4gICAgICAgICAgICAgICAgICAgICcyLjAuMicgOiAnLzQxNicsXG4gICAgICAgICAgICAgICAgICAgICcyLjAuMycgOiAnLzQxNycsXG4gICAgICAgICAgICAgICAgICAgICcyLjAuNCcgOiAnLzQxOScsXG4gICAgICAgICAgICAgICAgICAgICc/JyAgICAgOiAnLydcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGV2aWNlIDoge1xuICAgICAgICAgICAgYW1hem9uIDoge1xuICAgICAgICAgICAgICAgIG1vZGVsIDoge1xuICAgICAgICAgICAgICAgICAgICAnRmlyZSBQaG9uZScgOiBbJ1NEJywgJ0tGJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3ByaW50IDoge1xuICAgICAgICAgICAgICAgIG1vZGVsIDoge1xuICAgICAgICAgICAgICAgICAgICAnRXZvIFNoaWZ0IDRHJyA6ICc3MzczS1QnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB2ZW5kb3IgOiB7XG4gICAgICAgICAgICAgICAgICAgICdIVEMnICAgICAgIDogJ0FQQScsXG4gICAgICAgICAgICAgICAgICAgICdTcHJpbnQnICAgIDogJ1NwcmludCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb3MgOiB7XG4gICAgICAgICAgICB3aW5kb3dzIDoge1xuICAgICAgICAgICAgICAgIHZlcnNpb24gOiB7XG4gICAgICAgICAgICAgICAgICAgICdNRScgICAgICAgIDogJzQuOTAnLFxuICAgICAgICAgICAgICAgICAgICAnTlQgMy4xMScgICA6ICdOVDMuNTEnLFxuICAgICAgICAgICAgICAgICAgICAnTlQgNC4wJyAgICA6ICdOVDQuMCcsXG4gICAgICAgICAgICAgICAgICAgICcyMDAwJyAgICAgIDogJ05UIDUuMCcsXG4gICAgICAgICAgICAgICAgICAgICdYUCcgICAgICAgIDogWydOVCA1LjEnLCAnTlQgNS4yJ10sXG4gICAgICAgICAgICAgICAgICAgICdWaXN0YScgICAgIDogJ05UIDYuMCcsXG4gICAgICAgICAgICAgICAgICAgICc3JyAgICAgICAgIDogJ05UIDYuMScsXG4gICAgICAgICAgICAgICAgICAgICc4JyAgICAgICAgIDogJ05UIDYuMicsXG4gICAgICAgICAgICAgICAgICAgICc4LjEnICAgICAgIDogJ05UIDYuMycsXG4gICAgICAgICAgICAgICAgICAgICcxMCcgICAgICAgIDogWydOVCA2LjQnLCAnTlQgMTAuMCddLFxuICAgICAgICAgICAgICAgICAgICAnUlQnICAgICAgICA6ICdBUk0nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBSZWdleCBtYXBcbiAgICAvLy8vLy8vLy8vLy8vXG5cblxuICAgIHZhciByZWdleGVzID0ge1xuXG4gICAgICAgIGJyb3dzZXIgOiBbW1xuXG4gICAgICAgICAgICAvLyBQcmVzdG8gYmFzZWRcbiAgICAgICAgICAgIC8ob3BlcmFcXHNtaW5pKVxcLyhbXFx3XFwuLV0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIE1pbmlcbiAgICAgICAgICAgIC8ob3BlcmFcXHNbbW9iaWxldGFiXSspLit2ZXJzaW9uXFwvKFtcXHdcXC4tXSspL2ksICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIE1vYmkvVGFibGV0XG4gICAgICAgICAgICAvKG9wZXJhKS4rdmVyc2lvblxcLyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhID4gOS44MFxuICAgICAgICAgICAgLyhvcGVyYSlbXFwvXFxzXSsoW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgPCA5LjgwXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhvcGlvcylbXFwvXFxzXSsoW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgbWluaSBvbiBpcGhvbmUgPj0gOC4wXG4gICAgICAgICAgICBdLCBbW05BTUUsICdPcGVyYSBNaW5pJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC9cXHMob3ByKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIFdlYmtpdFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnT3BlcmEnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLy8gTWl4ZWRcbiAgICAgICAgICAgIC8oa2luZGxlKVxcLyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gS2luZGxlXG4gICAgICAgICAgICAvKGx1bmFzY2FwZXxtYXh0aG9ufG5ldGZyb250fGphc21pbmV8YmxhemVyKVtcXC9cXHNdPyhbXFx3XFwuXSopL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEx1bmFzY2FwZS9NYXh0aG9uL05ldGZyb250L0phc21pbmUvQmxhemVyXG4gICAgICAgICAgICAvLyBUcmlkZW50IGJhc2VkXG4gICAgICAgICAgICAvKGF2YW50XFxzfGllbW9iaWxlfHNsaW0pKD86YnJvd3Nlcik/W1xcL1xcc10/KFtcXHdcXC5dKikvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXZhbnQvSUVNb2JpbGUvU2xpbUJyb3dzZXJcbiAgICAgICAgICAgIC8oYmlkdWJyb3dzZXJ8YmFpZHVicm93c2VyKVtcXC9cXHNdPyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgIC8vIEJhaWR1IEJyb3dzZXJcbiAgICAgICAgICAgIC8oPzptc3xcXCgpKGllKVxccyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludGVybmV0IEV4cGxvcmVyXG5cbiAgICAgICAgICAgIC8vIFdlYmtpdC9LSFRNTCBiYXNlZFxuICAgICAgICAgICAgLyhyZWtvbnEpXFwvKFtcXHdcXC5dKikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZWtvbnFcbiAgICAgICAgICAgIC8oY2hyb21pdW18ZmxvY2t8cm9ja21lbHR8bWlkb3JpfGVwaXBoYW55fHNpbGt8c2t5ZmlyZXxvdmlicm93c2VyfGJvbHR8aXJvbnx2aXZhbGRpfGlyaWRpdW18cGhhbnRvbWpzfGJvd3NlcnxxdWFya3xxdXB6aWxsYXxmYWxrb24pXFwvKFtcXHdcXC4tXSspL2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hyb21pdW0vRmxvY2svUm9ja01lbHQvTWlkb3JpL0VwaXBoYW55L1NpbGsvU2t5ZmlyZS9Cb2x0L0lyb24vSXJpZGl1bS9QaGFudG9tSlMvQm93c2VyL1F1cFppbGxhL0ZhbGtvblxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oa29ucXVlcm9yKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gS29ucXVlcm9yXG4gICAgICAgICAgICBdLCBbW05BTUUsICdLb25xdWVyb3InXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyh0cmlkZW50KS4rcnZbOlxcc10oW1xcd1xcLl0rKS4rbGlrZVxcc2dlY2tvL2kgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUUxMVxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnSUUnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhlZGdlfGVkZ2lvc3xlZGdhfGVkZylcXC8oKFxcZCspP1tcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWljcm9zb2Z0IEVkZ2VcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0VkZ2UnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyh5YWJyb3dzZXIpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBZYW5kZXhcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1lhbmRleCddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKEF2YXN0KVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2YXN0IFNlY3VyZSBCcm93c2VyXG4gICAgICAgICAgICBdLCBbW05BTUUsICdBdmFzdCBTZWN1cmUgQnJvd3NlciddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKEFWRylcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFWRyBTZWN1cmUgQnJvd3NlclxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnQVZHIFNlY3VyZSBCcm93c2VyJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8ocHVmZmluKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHVmZmluXG4gICAgICAgICAgICBdLCBbW05BTUUsICdQdWZmaW4nXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhmb2N1cylcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJlZm94IEZvY3VzXG4gICAgICAgICAgICBdLCBbW05BTUUsICdGaXJlZm94IEZvY3VzJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8ob3B0KVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgVG91Y2hcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ09wZXJhIFRvdWNoJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oKD86W1xcc1xcL10pdWM/XFxzP2Jyb3dzZXJ8KD86anVjLispdWN3ZWIpW1xcL1xcc10/KFtcXHdcXC5dKykvaSAgICAgICAgIC8vIFVDQnJvd3NlclxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnVUNCcm93c2VyJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oY29tb2RvX2RyYWdvbilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tb2RvIERyYWdvblxuICAgICAgICAgICAgXSwgW1tOQU1FLCAvXy9nLCAnICddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKHdpbmRvd3N3ZWNoYXQgcWJjb3JlKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlQ2hhdCBEZXNrdG9wIGZvciBXaW5kb3dzIEJ1aWx0LWluIEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1dlQ2hhdChXaW4pIERlc2t0b3AnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhtaWNyb21lc3NlbmdlcilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZUNoYXRcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1dlQ2hhdCddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGJyYXZlKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyYXZlIGJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0JyYXZlJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8ocXFicm93c2VybGl0ZSlcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUVFCcm93c2VyTGl0ZVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oUVEpXFwvKFtcXGRcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUVEsIGFrYSBTaG91UVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC9tPyhxcWJyb3dzZXIpW1xcL1xcc10/KFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFFRQnJvd3NlclxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oYmFpZHVib3hhcHApW1xcL1xcc10/KFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJhaWR1IEFwcFxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oMjM0NUV4cGxvcmVyKVtcXC9cXHNdPyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDIzNDUgQnJvd3NlclxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oTWV0YVNyKVtcXC9cXHNdPyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNvdUdvdUJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtOQU1FXSwgW1xuXG4gICAgICAgICAgICAvKExCQlJPV1NFUikvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpZUJhbyBCcm93c2VyXG4gICAgICAgICAgICBdLCBbTkFNRV0sIFtcblxuICAgICAgICAgICAgL3hpYW9taVxcL21pdWlicm93c2VyXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTUlVSSBCcm93c2VyXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdNSVVJIEJyb3dzZXInXV0sIFtcblxuICAgICAgICAgICAgLztmYmF2XFwvKFtcXHdcXC5dKyk7L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGYWNlYm9vayBBcHAgZm9yIGlPUyAmIEFuZHJvaWRcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBbTkFNRSwgJ0ZhY2Vib29rJ11dLCBbXG5cbiAgICAgICAgICAgIC9zYWZhcmlcXHMobGluZSlcXC8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpbmUgQXBwIGZvciBpT1NcbiAgICAgICAgICAgIC9hbmRyb2lkLisobGluZSlcXC8oW1xcd1xcLl0rKVxcL2lhYi9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpbmUgQXBwIGZvciBBbmRyb2lkXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgL2hlYWRsZXNzY2hyb21lKD86XFwvKFtcXHdcXC5dKyl8XFxzKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hyb21lIEhlYWRsZXNzXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdDaHJvbWUgSGVhZGxlc3MnXV0sIFtcblxuICAgICAgICAgICAgL1xcc3d2XFwpLisoY2hyb21lKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9tZSBXZWJWaWV3XG4gICAgICAgICAgICBdLCBbW05BTUUsIC8oLispLywgJyQxIFdlYlZpZXcnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLygoPzpvY3VsdXN8c2Ftc3VuZylicm93c2VyKVxcLyhbXFx3XFwuXSspL2lcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgLyguKyg/Omd8dXMpKSguKykvLCAnJDEgJDInXSwgVkVSU0lPTl0sIFsgICAgICAgICAgICAgICAgLy8gT2N1bHVzIC8gU2Ftc3VuZyBCcm93c2VyXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLit2ZXJzaW9uXFwvKFtcXHdcXC5dKylcXHMrKD86bW9iaWxlXFxzP3NhZmFyaXxzYWZhcmkpKi9pICAgICAgICAvLyBBbmRyb2lkIEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBbTkFNRSwgJ0FuZHJvaWQgQnJvd3NlciddXSwgW1xuXG4gICAgICAgICAgICAvKHNhaWxmaXNoYnJvd3NlcilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNhaWxmaXNoIEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1NhaWxmaXNoIEJyb3dzZXInXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhjaHJvbWV8b21uaXdlYnxhcm9yYXxbdGl6ZW5va2FdezV9XFxzP2Jyb3dzZXIpXFwvdj8oW1xcd1xcLl0rKS9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9tZS9PbW5pV2ViL0Fyb3JhL1RpemVuL05va2lhXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhkb2xmaW4pXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEb2xwaGluXG4gICAgICAgICAgICBdLCBbW05BTUUsICdEb2xwaGluJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8ocWlodXxxaGJyb3dzZXJ8cWlob29icm93c2VyfDM2MGJyb3dzZXIpL2kgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMzYwXG4gICAgICAgICAgICBdLCBbW05BTUUsICczNjAgQnJvd3NlciddXSwgW1xuXG4gICAgICAgICAgICAvKCg/OmFuZHJvaWQuKyljcm1vfGNyaW9zKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9tZSBmb3IgQW5kcm9pZC9pT1NcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0Nocm9tZSddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGNvYXN0KVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIENvYXN0XG4gICAgICAgICAgICBdLCBbW05BTUUsICdPcGVyYSBDb2FzdCddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvZnhpb3NcXC8oW1xcd1xcLi1dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggZm9yIGlPU1xuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnRmlyZWZveCddXSwgW1xuXG4gICAgICAgICAgICAvdmVyc2lvblxcLyhbXFx3XFwuXSspLis/bW9iaWxlXFwvXFx3K1xccyhzYWZhcmkpL2kgICAgICAgICAgICAgICAgICAgICAgIC8vIE1vYmlsZSBTYWZhcmlcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBbTkFNRSwgJ01vYmlsZSBTYWZhcmknXV0sIFtcblxuICAgICAgICAgICAgL3ZlcnNpb25cXC8oW1xcd1xcLl0rKS4rPyhtb2JpbGVcXHM/c2FmYXJpfHNhZmFyaSkvaSAgICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpICYgU2FmYXJpIE1vYmlsZVxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIE5BTUVdLCBbXG5cbiAgICAgICAgICAgIC93ZWJraXQuKz8oZ3NhKVxcLyhbXFx3XFwuXSspLis/KG1vYmlsZVxccz9zYWZhcml8c2FmYXJpKShcXC9bXFx3XFwuXSspL2kgIC8vIEdvb2dsZSBTZWFyY2ggQXBwbGlhbmNlIG9uIGlPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnR1NBJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC93ZWJraXQuKz8obW9iaWxlXFxzP3NhZmFyaXxzYWZhcmkpKFxcL1tcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgIC8vIFNhZmFyaSA8IDMuMFxuICAgICAgICAgICAgXSwgW05BTUUsIFtWRVJTSU9OLCBtYXBwZXIuc3RyLCBtYXBzLmJyb3dzZXIub2xkc2FmYXJpLnZlcnNpb25dXSwgW1xuXG4gICAgICAgICAgICAvKHdlYmtpdHxraHRtbClcXC8oW1xcd1xcLl0rKS9pXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLy8gR2Vja28gYmFzZWRcbiAgICAgICAgICAgIC8obmF2aWdhdG9yfG5ldHNjYXBlKVxcLyhbXFx3XFwuLV0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTmV0c2NhcGVcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ05ldHNjYXBlJ10sIFZFUlNJT05dLCBbXG4gICAgICAgICAgICAvKHN3aWZ0Zm94KS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN3aWZ0Zm94XG4gICAgICAgICAgICAvKGljZWRyYWdvbnxpY2V3ZWFzZWx8Y2FtaW5vfGNoaW1lcmF8ZmVubmVjfG1hZW1vXFxzYnJvd3NlcnxtaW5pbW98Y29ua2Vyb3IpW1xcL1xcc10/KFtcXHdcXC5cXCtdKykvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWNlRHJhZ29uL0ljZXdlYXNlbC9DYW1pbm8vQ2hpbWVyYS9GZW5uZWMvTWFlbW8vTWluaW1vL0Nvbmtlcm9yXG4gICAgICAgICAgICAvKGZpcmVmb3h8c2VhbW9ua2V5fGstbWVsZW9ufGljZWNhdHxpY2VhcGV8ZmlyZWJpcmR8cGhvZW5peHxwYWxlbW9vbnxiYXNpbGlza3x3YXRlcmZveClcXC8oW1xcd1xcLi1dKykkL2ksXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZWZveC9TZWFNb25rZXkvSy1NZWxlb24vSWNlQ2F0L0ljZUFwZS9GaXJlYmlyZC9QaG9lbml4XG4gICAgICAgICAgICAvKG1vemlsbGEpXFwvKFtcXHdcXC5dKykuK3J2XFw6LitnZWNrb1xcL1xcZCsvaSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1vemlsbGFcblxuICAgICAgICAgICAgLy8gT3RoZXJcbiAgICAgICAgICAgIC8ocG9sYXJpc3xseW54fGRpbGxvfGljYWJ8ZG9yaXN8YW1heWF8dzNtfG5ldHN1cmZ8c2xlaXBuaXIpW1xcL1xcc10/KFtcXHdcXC5dKykvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUG9sYXJpcy9MeW54L0RpbGxvL2lDYWIvRG9yaXMvQW1heWEvdzNtL05ldFN1cmYvU2xlaXBuaXJcbiAgICAgICAgICAgIC8obGlua3MpXFxzXFwoKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpbmtzXG4gICAgICAgICAgICAvKGdvYnJvd3NlcilcXC8/KFtcXHdcXC5dKikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdvQnJvd3NlclxuICAgICAgICAgICAgLyhpY2VcXHM/YnJvd3NlcilcXC92PyhbXFx3XFwuX10rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUNFIEJyb3dzZXJcbiAgICAgICAgICAgIC8obW9zYWljKVtcXC9cXHNdKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1vc2FpY1xuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dXG4gICAgICAgIF0sXG5cbiAgICAgICAgY3B1IDogW1tcblxuICAgICAgICAgICAgLyg/OihhbWR8eCg/Oig/Ojg2fDY0KVtfLV0pP3x3b3d8d2luKTY0KVs7XFwpXS9pICAgICAgICAgICAgICAgICAgICAgLy8gQU1ENjRcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCAnYW1kNjQnXV0sIFtcblxuICAgICAgICAgICAgLyhpYTMyKD89OykpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJQTMyIChxdWlja3RpbWUpXG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgdXRpbC5sb3dlcml6ZV1dLCBbXG5cbiAgICAgICAgICAgIC8oKD86aVszNDZdfHgpODYpWztcXCldL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElBMzJcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCAnaWEzMiddXSwgW1xuXG4gICAgICAgICAgICAvLyBQb2NrZXRQQyBtaXN0YWtlbmx5IGlkZW50aWZpZWQgYXMgUG93ZXJQQ1xuICAgICAgICAgICAgL3dpbmRvd3NcXHMoY2V8bW9iaWxlKTtcXHNwcGM7L2lcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCAnYXJtJ11dLCBbXG5cbiAgICAgICAgICAgIC8oKD86cHBjfHBvd2VycGMpKD86NjQpPykoPzpcXHNtYWN8O3xcXCkpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3dlclBDXG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgL293ZXIvLCAnJywgdXRpbC5sb3dlcml6ZV1dLCBbXG5cbiAgICAgICAgICAgIC8oc3VuNFxcdylbO1xcKV0vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTUEFSQ1xuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsICdzcGFyYyddXSwgW1xuXG4gICAgICAgICAgICAvKCg/OmF2cjMyfGlhNjQoPz07KSl8NjhrKD89XFwpKXxhcm0oPzo2NHwoPz12XFxkK1s7bF0pKXwoPz1hdG1lbFxccylhdnJ8KD86aXJpeHxtaXBzfHNwYXJjKSg/OjY0KT8oPz07KXxwYS1yaXNjKS9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElBNjQsIDY4SywgQVJNLzY0LCBBVlIvMzIsIElSSVgvNjQsIE1JUFMvNjQsIFNQQVJDLzY0LCBQQS1SSVNDXG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgdXRpbC5sb3dlcml6ZV1dXG4gICAgICAgIF0sXG5cbiAgICAgICAgZGV2aWNlIDogW1tcblxuICAgICAgICAgICAgL1xcKChpcGFkfHBsYXlib29rKTtbXFx3XFxzXFwpLDstXSsocmltfGFwcGxlKS9pICAgICAgICAgICAgICAgICAgICAgICAgLy8gaVBhZC9QbGF5Qm9va1xuICAgICAgICAgICAgXSwgW01PREVMLCBWRU5ET1IsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYXBwbGVjb3JlbWVkaWFcXC9bXFx3XFwuXSsgXFwoKGlwYWQpLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpUGFkXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdBcHBsZSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgLyhhcHBsZVxcc3swLDF9dHYpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXBwbGUgVFZcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsICdBcHBsZSBUViddLCBbVkVORE9SLCAnQXBwbGUnXSwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuXG4gICAgICAgICAgICAvKGFyY2hvcylcXHMoZ2FtZXBhZDI/KS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBcmNob3NcbiAgICAgICAgICAgIC8oaHApLisodG91Y2hwYWQpL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFAgVG91Y2hQYWRcbiAgICAgICAgICAgIC8oaHApLisodGFibGV0KS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFAgVGFibGV0XG4gICAgICAgICAgICAvKGtpbmRsZSlcXC8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtpbmRsZVxuICAgICAgICAgICAgL1xccyhub29rKVtcXHdcXHNdK2J1aWxkXFwvKFxcdyspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vb2tcbiAgICAgICAgICAgIC8oZGVsbClcXHMoc3RyZWFba3ByXFxzXFxkXSpbXFxka29dKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlbGwgU3RyZWFrXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC8oa2ZbQS16XSspXFxzYnVpbGRcXC8uK3NpbGtcXC8vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gS2luZGxlIEZpcmUgSERcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FtYXpvbiddLCBbVFlQRSwgVEFCTEVUXV0sIFtcbiAgICAgICAgICAgIC8oc2R8a2YpWzAzNDloaWpvcnN0dXddK1xcc2J1aWxkXFwvLitzaWxrXFwvL2kgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZSBQaG9uZVxuICAgICAgICAgICAgXSwgW1tNT0RFTCwgbWFwcGVyLnN0ciwgbWFwcy5kZXZpY2UuYW1hem9uLm1vZGVsXSwgW1ZFTkRPUiwgJ0FtYXpvbiddLCBbVFlQRSwgTU9CSUxFXV0sIFtcbiAgICAgICAgICAgIC9hbmRyb2lkLithZnQoW2Jtc10pXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmUgVFZcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FtYXpvbiddLCBbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC9cXCgoaXBbaG9uZWR8XFxzXFx3Kl0rKTsuKyhhcHBsZSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaVBvZC9pUGhvbmVcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgVkVORE9SLCBbVFlQRSwgTU9CSUxFXV0sIFtcbiAgICAgICAgICAgIC9cXCgoaXBbaG9uZWR8XFxzXFx3Kl0rKTsvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaVBvZC9pUGhvbmVcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FwcGxlJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKGJsYWNrYmVycnkpW1xccy1dPyhcXHcrKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmxhY2tCZXJyeVxuICAgICAgICAgICAgLyhibGFja2JlcnJ5fGJlbnF8cGFsbSg/PVxcLSl8c29ueWVyaWNzc29ufGFjZXJ8YXN1c3xkZWxsfG1laXp1fG1vdG9yb2xhfHBvbHl0cm9uKVtcXHNfLV0/KFtcXHctXSopL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJlblEvUGFsbS9Tb255LUVyaWNzc29uL0FjZXIvQXN1cy9EZWxsL01laXp1L01vdG9yb2xhL1BvbHl0cm9uXG4gICAgICAgICAgICAvKGhwKVxccyhbXFx3XFxzXStcXHcpL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIUCBpUEFRXG4gICAgICAgICAgICAvKGFzdXMpLT8oXFx3KykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3VzXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvXFwoYmIxMDtcXHMoXFx3KykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJsYWNrQmVycnkgMTBcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0JsYWNrQmVycnknXSwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFzdXMgVGFibGV0c1xuICAgICAgICAgICAgL2FuZHJvaWQuKyh0cmFuc2ZvW3ByaW1lXFxzXXs0LDEwfVxcc1xcdyt8ZWVlcGN8c2xpZGVyXFxzXFx3K3xuZXh1cyA3fHBhZGZvbmV8cDAwYykvaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQXN1cyddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgLyhzb255KVxccyh0YWJsZXRcXHNbcHNdKVxcc2J1aWxkXFwvL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNvbnlcbiAgICAgICAgICAgIC8oc29ueSk/KD86c2dwLispXFxzYnVpbGRcXC8vaVxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdTb255J10sIFtNT0RFTCwgJ1hwZXJpYSBUYWJsZXQnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rXFxzKFtjLWddXFxkezR9fHNvWy1sXVxcdyspKD89XFxzYnVpbGRcXC98XFwpLitjaHJvbWVcXC8oPyFbMS02XXswLDF9XFxkXFwuKSkvaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnU29ueSddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL1xccyhvdXlhKVxccy9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE91eWFcbiAgICAgICAgICAgIC8obmludGVuZG8pXFxzKFt3aWRzM3VdKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5pbnRlbmRvXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIENPTlNPTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhzaGllbGQpXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTnZpZGlhXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdOdmlkaWEnXSwgW1RZUEUsIENPTlNPTEVdXSwgW1xuXG4gICAgICAgICAgICAvKHBsYXlzdGF0aW9uXFxzWzM0cG9ydGFibGV2aV0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQbGF5c3RhdGlvblxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnU29ueSddLCBbVFlQRSwgQ09OU09MRV1dLCBbXG5cbiAgICAgICAgICAgIC8oc3ByaW50XFxzKFxcdyspKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTcHJpbnQgUGhvbmVzXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgbWFwcGVyLnN0ciwgbWFwcy5kZXZpY2Uuc3ByaW50LnZlbmRvcl0sIFtNT0RFTCwgbWFwcGVyLnN0ciwgbWFwcy5kZXZpY2Uuc3ByaW50Lm1vZGVsXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8oaHRjKVs7X1xccy1dKyhbXFx3XFxzXSsoPz1cXCl8XFxzYnVpbGQpfFxcdyspL2ksICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFRDXG4gICAgICAgICAgICAvKHp0ZSktKFxcdyopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBaVEVcbiAgICAgICAgICAgIC8oYWxjYXRlbHxnZWVrc3Bob25lfG5leGlhbnxwYW5hc29uaWN8KD89O1xccylzb255KVtfXFxzLV0/KFtcXHctXSopL2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxjYXRlbC9HZWVrc1Bob25lL05leGlhbi9QYW5hc29uaWMvU29ueVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgW01PREVMLCAvXy9nLCAnICddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgLyhuZXh1c1xcczkpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFRDIE5leHVzIDlcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0hUQyddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2RcXC9odWF3ZWkoW1xcd1xccy1dKylbO1xcKV0vaSxcbiAgICAgICAgICAgIC8obmV4dXNcXHM2cHx2b2ctbDI5fGFuZS1seDF8ZW1sLWwyOSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEh1YXdlaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnSHVhd2VpJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rKGJhaDI/LWE/W2x3XVxcZHsyfSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIdWF3ZWkgTWVkaWFQYWRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0h1YXdlaSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgLyhtaWNyb3NvZnQpO1xccyhsdW1pYVtcXHNcXHddKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNaWNyb3NvZnQgTHVtaWFcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL1tcXHNcXCg7XSh4Ym94KD86XFxzb25lKT8pW1xcc1xcKTtdL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1pY3Jvc29mdCBYYm94XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNaWNyb3NvZnQnXSwgW1RZUEUsIENPTlNPTEVdXSwgW1xuICAgICAgICAgICAgLyhraW5cXC5bb25ldHddezN9KS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWljcm9zb2Z0IEtpblxuICAgICAgICAgICAgXSwgW1tNT0RFTCwgL1xcLi9nLCAnICddLCBbVkVORE9SLCAnTWljcm9zb2Z0J10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1vdG9yb2xhXG4gICAgICAgICAgICAvXFxzKG1pbGVzdG9uZXxkcm9pZCg/OlsyLTR4XXxcXHMoPzpiaW9uaWN8eDJ8cHJvfHJhenIpKT86PyhcXHM0Zyk/KVtcXHdcXHNdK2J1aWxkXFwvL2ksXG4gICAgICAgICAgICAvbW90W1xccy1dPyhcXHcqKS9pLFxuICAgICAgICAgICAgLyhYVFxcZHszLDR9KSBidWlsZFxcLy9pLFxuICAgICAgICAgICAgLyhuZXh1c1xcczYpL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ01vdG9yb2xhJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWQuK1xccyhtejYwXFxkfHhvb21bXFxzMl17MCwyfSlcXHNidWlsZFxcLy9pXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNb3Rvcm9sYSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2hiYnR2XFwvXFxkK1xcLlxcZCtcXC5cXGQrXFxzK1xcKFtcXHdcXHNdKjtcXHMqKFxcd1teO10qKTsoW147XSopL2kgICAgICAgICAgICAvLyBIYmJUViBkZXZpY2VzXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgdXRpbC50cmltXSwgW01PREVMLCB1dGlsLnRyaW1dLCBbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC9oYmJ0di4rbWFwbGU7KFxcZCspL2lcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsIC9eLywgJ1NtYXJ0VFYnXSwgW1ZFTkRPUiwgJ1NhbXN1bmcnXSwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuXG4gICAgICAgICAgICAvXFwoZHR2W1xcKTtdLisoYXF1b3MpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2hhcnBcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1NoYXJwJ10sIFtUWVBFLCBTTUFSVFRWXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKygoc2NoLWlbODldMFxcZHxzaHctbTM4MHN8Z3QtcFxcZHs0fXxndC1uXFxkK3xzZ2gtdDhbNTZdOXxuZXh1cyAxMCkpL2ksXG4gICAgICAgICAgICAvKChTTS1UXFx3KykpL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnU2Ftc3VuZyddLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbICAgICAgICAgICAgICAgICAgLy8gU2Ftc3VuZ1xuICAgICAgICAgICAgL3NtYXJ0LXR2Lisoc2Ftc3VuZykvaVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgW1RZUEUsIFNNQVJUVFZdLCBNT0RFTF0sIFtcbiAgICAgICAgICAgIC8oKHNbY2dwXWgtXFx3K3xndC1cXHcrfGdhbGF4eVxcc25leHVzfHNtLVxcd1tcXHdcXGRdKykpL2ksXG4gICAgICAgICAgICAvKHNhbVtzdW5nXSopW1xccy1dKihcXHcrLT9bXFx3LV0qKS9pLFxuICAgICAgICAgICAgL3NlYy0oKHNnaFxcdyspKS9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ1NhbXN1bmcnXSwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvc2llLShcXHcqKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaWVtZW5zXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdTaWVtZW5zJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKG1hZW1vfG5va2lhKS4qKG45MDB8bHVtaWFcXHNcXGQrKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm9raWFcbiAgICAgICAgICAgIC8obm9raWEpW1xcc18tXT8oW1xcdy1dKikvaVxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdOb2tpYSddLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkW3hcXGRcXC5cXHM7XStcXHMoW2FiXVsxLTddXFwtP1swMTc4YV1cXGRcXGQ/KS9pICAgICAgICAgICAgICAgICAgIC8vIEFjZXJcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FjZXInXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLisoW3ZsXWtcXC0/XFxkezN9KVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTEcgVGFibGV0XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdMRyddLCBbVFlQRSwgVEFCTEVUXV0sIFtcbiAgICAgICAgICAgIC9hbmRyb2lkXFxzM1xcLltcXHNcXHc7LV17MTB9KGxnPyktKFswNmN2OV17Myw0fSkvaSAgICAgICAgICAgICAgICAgICAgIC8vIExHIFRhYmxldFxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdMRyddLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvKGxnKSBuZXRjYXN0XFwudHYvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMRyBTbWFydFRWXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuICAgICAgICAgICAgLyhuZXh1c1xcc1s0NV0pL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTEdcbiAgICAgICAgICAgIC9sZ1tlO1xcc1xcLy1dKyhcXHcqKS9pLFxuICAgICAgICAgICAgL2FuZHJvaWQuK2xnKFxcLT9bXFxkXFx3XSspXFxzK2J1aWxkL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0xHJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKGxlbm92bylcXHM/KHMoPzo1MDAwfDYwMDApKD86W1xcdy1dKyl8dGFiKD86W1xcc1xcd10rKSkvaSAgICAgICAgICAgICAvLyBMZW5vdm8gdGFibGV0c1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWQuKyhpZGVhdGFiW2EtejAtOVxcLVxcc10rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExlbm92b1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTGVub3ZvJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgLyhsZW5vdm8pW19cXHMtXT8oW1xcdy1dKykvaVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvbGludXg7LisoKGpvbGxhKSk7L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEpvbGxhXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8oKHBlYmJsZSkpYXBwXFwvW1xcZFxcLl0rXFxzL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBlYmJsZVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBXRUFSQUJMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKG9wcG8pXFxzPyhbXFx3XFxzXSspXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPUFBPXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9jcmtleS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR29vZ2xlIENocm9tZWNhc3RcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsICdDaHJvbWVjYXN0J10sIFtWRU5ET1IsICdHb29nbGUnXSwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhnbGFzcylcXHNcXGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdvb2dsZSBHbGFzc1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnR29vZ2xlJ10sIFtUWVBFLCBXRUFSQUJMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKHBpeGVsIGMpW1xccyldL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHb29nbGUgUGl4ZWwgQ1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnR29vZ2xlJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhwaXhlbCggWzIzXSk/KCB4bCk/KVtcXHMpXS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR29vZ2xlIFBpeGVsXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdHb29nbGUnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKFxcdyspXFxzK2J1aWxkXFwvaG1cXDEvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBYaWFvbWkgSG9uZ21pICdudW1lcmljJyBtb2RlbHNcbiAgICAgICAgICAgIC9hbmRyb2lkLisoaG1bXFxzXFwtX10qbm90ZT9bXFxzX10qKD86XFxkXFx3KT8pXFxzK2J1aWxkL2ksICAgICAgICAgICAgICAgLy8gWGlhb21pIEhvbmdtaVxuICAgICAgICAgICAgL2FuZHJvaWQuKyhtaVtcXHNcXC1fXSooPzphXFxkfG9uZXxvbmVbXFxzX11wbHVzfG5vdGUgbHRlKT9bXFxzX10qKD86XFxkP1xcdz8pW1xcc19dKig/OnBsdXMpPylcXHMrYnVpbGQvaSwgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFhpYW9taSBNaVxuICAgICAgICAgICAgL2FuZHJvaWQuKyhyZWRtaVtcXHNcXC1fXSooPzpub3RlKT8oPzpbXFxzX10qW1xcd1xcc10rKSlcXHMrYnVpbGQvaSAgICAgICAvLyBSZWRtaSBQaG9uZXNcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsIC9fL2csICcgJ10sIFtWRU5ET1IsICdYaWFvbWknXSwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rKG1pW1xcc1xcLV9dKig/OnBhZCkoPzpbXFxzX10qW1xcd1xcc10rKSlcXHMrYnVpbGQvaSAgICAgICAgICAgIC8vIE1pIFBhZCB0YWJsZXRzXG4gICAgICAgICAgICBdLFtbTU9ERUwsIC9fL2csICcgJ10sIFtWRU5ET1IsICdYaWFvbWknXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhtWzEtNV1cXHNub3RlKVxcc2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1laXp1XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNZWl6dSddLCBbVFlQRSwgTU9CSUxFXV0sIFtcbiAgICAgICAgICAgIC8obXopLShbXFx3LV17Mix9KS9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ01laXp1J10sIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK2EwMDAoMSlcXHMrYnVpbGQvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT25lUGx1c1xuICAgICAgICAgICAgL2FuZHJvaWQuK29uZXBsdXNcXHMoYVxcZHs0fSlbXFxzKV0vaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnT25lUGx1cyddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooUkNUW1xcZFxcd10rKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJDQSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdSQ0EnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL1xcc10rKFZlbnVlW1xcZFxcc117Miw3fSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAvLyBEZWxsIFZlbnVlIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0RlbGwnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFFbVHxNXVtcXGRcXHddKylcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWZXJpem9uIFRhYmxldFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnVmVyaXpvbiddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccysoQmFybmVzWyZcXHNdK05vYmxlXFxzK3xCTltSVF0pKFY/LiopXFxzK2J1aWxkL2kgICAgIC8vIEJhcm5lcyAmIE5vYmxlIFRhYmxldFxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdCYXJuZXMgJiBOb2JsZSddLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMrKFRNXFxkezN9LipcXGIpXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCYXJuZXMgJiBOb2JsZSBUYWJsZXRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ051VmlzaW9uJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhrODgpXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gWlRFIEsgU2VyaWVzIFRhYmxldFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnWlRFJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihnZW5cXGR7M30pXFxzK2J1aWxkLio0OWgvaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTd2lzcyBHRU4gTW9iaWxlXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdTd2lzcyddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooenVyXFxkezN9KVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3dpc3MgWlVSIFRhYmxldFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnU3dpc3MnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKChaZWtpKT9UQi4qXFxiKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFpla2kgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnWmVraSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgLyhhbmRyb2lkKS4rWztcXC9dXFxzKyhbWVJdXFxkezJ9KVxccytidWlsZC9pLFxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccysoRHJhZ29uW1xcLVxcc10rVG91Y2hcXHMrfERUKShcXHd7NX0pXFxzYnVpbGQvaSAgICAgICAgLy8gRHJhZ29uIFRvdWNoIFRhYmxldFxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdEcmFnb24gVG91Y2gnXSwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihOUy0/XFx3ezAsOX0pXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnNpZ25pYSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdJbnNpZ25pYSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooKE5YfE5leHQpLT9cXHd7MCw5fSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgLy8gTmV4dEJvb2sgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTmV4dEJvb2snXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFh0cmVtZVxcXyk/KFYoMVswNDVdfDJbMDE1XXwzMHw0MHw2MHw3WzA1XXw5MCkpXFxzK2J1aWxkL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnVm9pY2UnXSwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgWyAgICAgICAgICAgICAgICAgICAgLy8gVm9pY2UgWHRyZW1lIFBob25lc1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihMVlRFTFxcLSk/KFYxWzEyXSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgIC8vIEx2VGVsIFBob25lc1xuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdMdlRlbCddLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKFBILTEpXFxzL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0Vzc2VudGlhbCddLCBbVFlQRSwgTU9CSUxFXV0sIFsgICAgICAgICAgICAgICAgLy8gRXNzZW50aWFsIFBILTFcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooVigxMDBNRHw3MDBOQXw3MDExfDkxN0cpLipcXGIpXFxzK2J1aWxkL2kgICAgICAgICAgLy8gRW52aXplbiBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdFbnZpemVuJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihMZVtcXHNcXC1dK1BhbilbXFxzXFwtXSsoXFx3ezEsOX0pXFxzK2J1aWxkL2kgICAgICAgICAgLy8gTGUgUGFuIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooVHJpb1tcXHNcXC1dKi4qKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hY2hTcGVlZCBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNYWNoU3BlZWQnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFRyaW5pdHkpW1xcLVxcc10qKFRcXGR7M30pXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgLy8gVHJpbml0eSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqVFVfKDE0OTEpXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUm90b3IgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnUm90b3InXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLisoS1MoLispKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFtYXpvbiBLaW5kbGUgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQW1hem9uJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rKEdpZ2FzZXQpW1xcc1xcLV0rKFFcXHd7MSw5fSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAvLyBHaWdhc2V0IFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL1xccyh0YWJsZXR8dGFiKVs7XFwvXS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVuaWRlbnRpZmlhYmxlIFRhYmxldFxuICAgICAgICAgICAgL1xccyhtb2JpbGUpKD86WztcXC9dfFxcc3NhZmFyaSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVbmlkZW50aWZpYWJsZSBNb2JpbGVcbiAgICAgICAgICAgIF0sIFtbVFlQRSwgdXRpbC5sb3dlcml6ZV0sIFZFTkRPUiwgTU9ERUxdLCBbXG5cbiAgICAgICAgICAgIC9bXFxzXFwvXFwoXShzbWFydC0/dHYpWztcXCldL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNtYXJ0VFZcbiAgICAgICAgICAgIF0sIFtbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC8oYW5kcm9pZFtcXHdcXC5cXHNcXC1dezAsOX0pOy4rYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyaWMgQW5kcm9pZCBEZXZpY2VcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0dlbmVyaWMnXV1cbiAgICAgICAgXSxcblxuICAgICAgICBlbmdpbmUgOiBbW1xuXG4gICAgICAgICAgICAvd2luZG93cy4rXFxzZWRnZVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFZGdlSFRNTFxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnRWRnZUhUTUwnXV0sIFtcblxuICAgICAgICAgICAgL3dlYmtpdFxcLzUzN1xcLjM2LitjaHJvbWVcXC8oPyEyNykoW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJsaW5rXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdCbGluayddXSwgW1xuXG4gICAgICAgICAgICAvKHByZXN0bylcXC8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZXN0b1xuICAgICAgICAgICAgLyh3ZWJraXR8dHJpZGVudHxuZXRmcm9udHxuZXRzdXJmfGFtYXlhfGx5bnh8dzNtfGdvYW5uYSlcXC8oW1xcd1xcLl0rKS9pLCAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlYktpdC9UcmlkZW50L05ldEZyb250L05ldFN1cmYvQW1heWEvTHlueC93M20vR29hbm5hXG4gICAgICAgICAgICAvKGtodG1sfHRhc21hbnxsaW5rcylbXFwvXFxzXVxcKD8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gS0hUTUwvVGFzbWFuL0xpbmtzXG4gICAgICAgICAgICAvKGljYWIpW1xcL1xcc10oWzIzXVxcLltcXGRcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaUNhYlxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC9ydlxcOihbXFx3XFwuXXsxLDl9KS4rKGdlY2tvKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2Vja29cbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBOQU1FXVxuICAgICAgICBdLFxuXG4gICAgICAgIG9zIDogW1tcblxuICAgICAgICAgICAgLy8gV2luZG93cyBiYXNlZFxuICAgICAgICAgICAgL21pY3Jvc29mdFxccyh3aW5kb3dzKVxccyh2aXN0YXx4cCkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdpbmRvd3MgKGlUdW5lcylcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuICAgICAgICAgICAgLyh3aW5kb3dzKVxcc250XFxzNlxcLjI7XFxzKGFybSkvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2luZG93cyBSVFxuICAgICAgICAgICAgLyh3aW5kb3dzXFxzcGhvbmUoPzpcXHNvcykqKVtcXHNcXC9dPyhbXFxkXFwuXFxzXFx3XSopL2ksICAgICAgICAgICAgICAgICAgIC8vIFdpbmRvd3MgUGhvbmVcbiAgICAgICAgICAgIC8od2luZG93c1xcc21vYmlsZXx3aW5kb3dzKVtcXHNcXC9dPyhbbnRjZVxcZFxcLlxcc10rXFx3KS9pXG4gICAgICAgICAgICBdLCBbTkFNRSwgW1ZFUlNJT04sIG1hcHBlci5zdHIsIG1hcHMub3Mud2luZG93cy52ZXJzaW9uXV0sIFtcbiAgICAgICAgICAgIC8od2luKD89M3w5fG4pfHdpblxcczl4XFxzKShbbnRcXGRcXC5dKykvaVxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnV2luZG93cyddLCBbVkVSU0lPTiwgbWFwcGVyLnN0ciwgbWFwcy5vcy53aW5kb3dzLnZlcnNpb25dXSwgW1xuXG4gICAgICAgICAgICAvLyBNb2JpbGUvRW1iZWRkZWQgT1NcbiAgICAgICAgICAgIC9cXCgoYmIpKDEwKTsvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJsYWNrQmVycnkgMTBcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0JsYWNrQmVycnknXSwgVkVSU0lPTl0sIFtcbiAgICAgICAgICAgIC8oYmxhY2tiZXJyeSlcXHcqXFwvPyhbXFx3XFwuXSopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJsYWNrYmVycnlcbiAgICAgICAgICAgIC8odGl6ZW58a2Fpb3MpW1xcL1xcc10oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRpemVuL0thaU9TXG4gICAgICAgICAgICAvKGFuZHJvaWR8d2Vib3N8cGFsbVxcc29zfHFueHxiYWRhfHJpbVxcc3RhYmxldFxcc29zfG1lZWdvfHNhaWxmaXNofGNvbnRpa2kpW1xcL1xccy1dPyhbXFx3XFwuXSopL2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQW5kcm9pZC9XZWJPUy9QYWxtL1FOWC9CYWRhL1JJTS9NZWVHby9Db250aWtpL1NhaWxmaXNoIE9TXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcbiAgICAgICAgICAgIC8oc3ltYmlhblxccz9vc3xzeW1ib3N8czYwKD89OykpW1xcL1xccy1dPyhbXFx3XFwuXSopL2kgICAgICAgICAgICAgICAgICAvLyBTeW1iaWFuXG4gICAgICAgICAgICBdLCBbW05BTUUsICdTeW1iaWFuJ10sIFZFUlNJT05dLCBbXG4gICAgICAgICAgICAvXFwoKHNlcmllczQwKTsvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXJpZXMgNDBcbiAgICAgICAgICAgIF0sIFtOQU1FXSwgW1xuICAgICAgICAgICAgL21vemlsbGEuK1xcKG1vYmlsZTsuK2dlY2tvLitmaXJlZm94L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZWZveCBPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnRmlyZWZveCBPUyddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvLyBDb25zb2xlXG4gICAgICAgICAgICAvKG5pbnRlbmRvfHBsYXlzdGF0aW9uKVxccyhbd2lkczM0cG9ydGFibGV2dV0rKS9pLCAgICAgICAgICAgICAgICAgICAvLyBOaW50ZW5kby9QbGF5c3RhdGlvblxuXG4gICAgICAgICAgICAvLyBHTlUvTGludXggYmFzZWRcbiAgICAgICAgICAgIC8obWludClbXFwvXFxzXFwoXT8oXFx3KikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1pbnRcbiAgICAgICAgICAgIC8obWFnZWlhfHZlY3RvcmxpbnV4KVs7XFxzXS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hZ2VpYS9WZWN0b3JMaW51eFxuICAgICAgICAgICAgLyhqb2xpfFtreGxuXT91YnVudHV8ZGViaWFufHN1c2V8b3BlbnN1c2V8Z2VudG9vfCg/PVxccylhcmNofHNsYWNrd2FyZXxmZWRvcmF8bWFuZHJpdmF8Y2VudG9zfHBjbGludXhvc3xyZWRoYXR8emVud2Fsa3xsaW5wdXMpW1xcL1xccy1dPyg/IWNocm9tKShbXFx3XFwuLV0qKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBKb2xpL1VidW50dS9EZWJpYW4vU1VTRS9HZW50b28vQXJjaC9TbGFja3dhcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmVkb3JhL01hbmRyaXZhL0NlbnRPUy9QQ0xpbnV4T1MvUmVkSGF0L1plbndhbGsvTGlucHVzXG4gICAgICAgICAgICAvKGh1cmR8bGludXgpXFxzPyhbXFx3XFwuXSopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEh1cmQvTGludXhcbiAgICAgICAgICAgIC8oZ251KVxccz8oW1xcd1xcLl0qKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR05VXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhjcm9zKVxcc1tcXHddK1xccyhbXFx3XFwuXStcXHcpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaHJvbWl1bSBPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnQ2hyb21pdW0gT1MnXSwgVkVSU0lPTl0sW1xuXG4gICAgICAgICAgICAvLyBTb2xhcmlzXG4gICAgICAgICAgICAvKHN1bm9zKVxccz8oW1xcd1xcLlxcZF0qKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTb2xhcmlzXG4gICAgICAgICAgICBdLCBbW05BTUUsICdTb2xhcmlzJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8vIEJTRCBiYXNlZFxuICAgICAgICAgICAgL1xccyhbZnJlbnRvcGMtXXswLDR9YnNkfGRyYWdvbmZseSlcXHM/KFtcXHdcXC5dKikvaSAgICAgICAgICAgICAgICAgICAgLy8gRnJlZUJTRC9OZXRCU0QvT3BlbkJTRC9QQy1CU0QvRHJhZ29uRmx5XG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sW1xuXG4gICAgICAgICAgICAvKGhhaWt1KVxccyhcXHcrKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFpa3VcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSxbXG5cbiAgICAgICAgICAgIC9jZm5ldHdvcmtcXC8uK2Rhcndpbi9pLFxuICAgICAgICAgICAgL2lwW2hvbmVhZF17Miw0fSg/Oi4qb3NcXHMoW1xcd10rKVxcc2xpa2VcXHNtYWN8O1xcc29wZXJhKS9pICAgICAgICAgICAgIC8vIGlPU1xuICAgICAgICAgICAgXSwgW1tWRVJTSU9OLCAvXy9nLCAnLiddLCBbTkFNRSwgJ2lPUyddXSwgW1xuXG4gICAgICAgICAgICAvKG1hY1xcc29zXFxzeClcXHM/KFtcXHdcXHNcXC5dKikvaSxcbiAgICAgICAgICAgIC8obWFjaW50b3NofG1hYyg/PV9wb3dlcnBjKVxccykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hYyBPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnTWFjIE9TJ10sIFtWRVJTSU9OLCAvXy9nLCAnLiddXSwgW1xuXG4gICAgICAgICAgICAvLyBPdGhlclxuICAgICAgICAgICAgLygoPzpvcGVuKT9zb2xhcmlzKVtcXC9cXHMtXT8oW1xcd1xcLl0qKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU29sYXJpc1xuICAgICAgICAgICAgLyhhaXgpXFxzKChcXGQpKD89XFwufFxcKXxcXHMpW1xcd1xcLl0pKi9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQUlYXG4gICAgICAgICAgICAvKHBsYW5cXHM5fG1pbml4fGJlb3N8b3NcXC8yfGFtaWdhb3N8bW9ycGhvc3xyaXNjXFxzb3N8b3BlbnZtc3xmdWNoc2lhKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQbGFuOS9NaW5peC9CZU9TL09TMi9BbWlnYU9TL01vcnBoT1MvUklTQ09TL09wZW5WTVMvRnVjaHNpYVxuICAgICAgICAgICAgLyh1bml4KVxccz8oW1xcd1xcLl0qKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVTklYXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl1cbiAgICAgICAgXVxuICAgIH07XG5cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gQ29uc3RydWN0b3JcbiAgICAvLy8vLy8vLy8vLy8vLy8vXG4gICAgdmFyIFVBUGFyc2VyID0gZnVuY3Rpb24gKHVhc3RyaW5nLCBleHRlbnNpb25zKSB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB1YXN0cmluZyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGV4dGVuc2lvbnMgPSB1YXN0cmluZztcbiAgICAgICAgICAgIHVhc3RyaW5nID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFVBUGFyc2VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVQVBhcnNlcih1YXN0cmluZywgZXh0ZW5zaW9ucykuZ2V0UmVzdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdWEgPSB1YXN0cmluZyB8fCAoKHdpbmRvdyAmJiB3aW5kb3cubmF2aWdhdG9yICYmIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KSA/IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50IDogRU1QVFkpO1xuICAgICAgICB2YXIgcmd4bWFwID0gZXh0ZW5zaW9ucyA/IHV0aWwuZXh0ZW5kKHJlZ2V4ZXMsIGV4dGVuc2lvbnMpIDogcmVnZXhlcztcblxuICAgICAgICB0aGlzLmdldEJyb3dzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYnJvd3NlciA9IHsgbmFtZTogdW5kZWZpbmVkLCB2ZXJzaW9uOiB1bmRlZmluZWQgfTtcbiAgICAgICAgICAgIG1hcHBlci5yZ3guY2FsbChicm93c2VyLCB1YSwgcmd4bWFwLmJyb3dzZXIpO1xuICAgICAgICAgICAgYnJvd3Nlci5tYWpvciA9IHV0aWwubWFqb3IoYnJvd3Nlci52ZXJzaW9uKTsgLy8gZGVwcmVjYXRlZFxuICAgICAgICAgICAgcmV0dXJuIGJyb3dzZXI7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0Q1BVID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNwdSA9IHsgYXJjaGl0ZWN0dXJlOiB1bmRlZmluZWQgfTtcbiAgICAgICAgICAgIG1hcHBlci5yZ3guY2FsbChjcHUsIHVhLCByZ3htYXAuY3B1KTtcbiAgICAgICAgICAgIHJldHVybiBjcHU7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0RGV2aWNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGRldmljZSA9IHsgdmVuZG9yOiB1bmRlZmluZWQsIG1vZGVsOiB1bmRlZmluZWQsIHR5cGU6IHVuZGVmaW5lZCB9O1xuICAgICAgICAgICAgbWFwcGVyLnJneC5jYWxsKGRldmljZSwgdWEsIHJneG1hcC5kZXZpY2UpO1xuICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRFbmdpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZW5naW5lID0geyBuYW1lOiB1bmRlZmluZWQsIHZlcnNpb246IHVuZGVmaW5lZCB9O1xuICAgICAgICAgICAgbWFwcGVyLnJneC5jYWxsKGVuZ2luZSwgdWEsIHJneG1hcC5lbmdpbmUpO1xuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRPUyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvcyA9IHsgbmFtZTogdW5kZWZpbmVkLCB2ZXJzaW9uOiB1bmRlZmluZWQgfTtcbiAgICAgICAgICAgIG1hcHBlci5yZ3guY2FsbChvcywgdWEsIHJneG1hcC5vcyk7XG4gICAgICAgICAgICByZXR1cm4gb3M7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0UmVzdWx0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1YSAgICAgIDogdGhpcy5nZXRVQSgpLFxuICAgICAgICAgICAgICAgIGJyb3dzZXIgOiB0aGlzLmdldEJyb3dzZXIoKSxcbiAgICAgICAgICAgICAgICBlbmdpbmUgIDogdGhpcy5nZXRFbmdpbmUoKSxcbiAgICAgICAgICAgICAgICBvcyAgICAgIDogdGhpcy5nZXRPUygpLFxuICAgICAgICAgICAgICAgIGRldmljZSAgOiB0aGlzLmdldERldmljZSgpLFxuICAgICAgICAgICAgICAgIGNwdSAgICAgOiB0aGlzLmdldENQVSgpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldFVBID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHVhO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnNldFVBID0gZnVuY3Rpb24gKHVhc3RyaW5nKSB7XG4gICAgICAgICAgICB1YSA9IHVhc3RyaW5nO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBVQVBhcnNlci5WRVJTSU9OID0gTElCVkVSU0lPTjtcbiAgICBVQVBhcnNlci5CUk9XU0VSID0ge1xuICAgICAgICBOQU1FICAgIDogTkFNRSxcbiAgICAgICAgTUFKT1IgICA6IE1BSk9SLCAvLyBkZXByZWNhdGVkXG4gICAgICAgIFZFUlNJT04gOiBWRVJTSU9OXG4gICAgfTtcbiAgICBVQVBhcnNlci5DUFUgPSB7XG4gICAgICAgIEFSQ0hJVEVDVFVSRSA6IEFSQ0hJVEVDVFVSRVxuICAgIH07XG4gICAgVUFQYXJzZXIuREVWSUNFID0ge1xuICAgICAgICBNT0RFTCAgIDogTU9ERUwsXG4gICAgICAgIFZFTkRPUiAgOiBWRU5ET1IsXG4gICAgICAgIFRZUEUgICAgOiBUWVBFLFxuICAgICAgICBDT05TT0xFIDogQ09OU09MRSxcbiAgICAgICAgTU9CSUxFICA6IE1PQklMRSxcbiAgICAgICAgU01BUlRUViA6IFNNQVJUVFYsXG4gICAgICAgIFRBQkxFVCAgOiBUQUJMRVQsXG4gICAgICAgIFdFQVJBQkxFOiBXRUFSQUJMRSxcbiAgICAgICAgRU1CRURERUQ6IEVNQkVEREVEXG4gICAgfTtcbiAgICBVQVBhcnNlci5FTkdJTkUgPSB7XG4gICAgICAgIE5BTUUgICAgOiBOQU1FLFxuICAgICAgICBWRVJTSU9OIDogVkVSU0lPTlxuICAgIH07XG4gICAgVUFQYXJzZXIuT1MgPSB7XG4gICAgICAgIE5BTUUgICAgOiBOQU1FLFxuICAgICAgICBWRVJTSU9OIDogVkVSU0lPTlxuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vL1xuICAgIC8vIEV4cG9ydFxuICAgIC8vLy8vLy8vLy9cblxuXG4gICAgLy8gY2hlY2sganMgZW52aXJvbm1lbnRcbiAgICBpZiAodHlwZW9mKGV4cG9ydHMpICE9PSBVTkRFRl9UWVBFKSB7XG4gICAgICAgIC8vIG5vZGVqcyBlbnZcbiAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09IFVOREVGX1RZUEUgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IFVBUGFyc2VyO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydHMuVUFQYXJzZXIgPSBVQVBhcnNlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyByZXF1aXJlanMgZW52IChvcHRpb25hbClcbiAgICAgICAgaWYgKHR5cGVvZihkZWZpbmUpID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVBUGFyc2VyO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAod2luZG93KSB7XG4gICAgICAgICAgICAvLyBicm93c2VyIGVudlxuICAgICAgICAgICAgd2luZG93LlVBUGFyc2VyID0gVUFQYXJzZXI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBqUXVlcnkvWmVwdG8gc3BlY2lmaWMgKG9wdGlvbmFsKVxuICAgIC8vIE5vdGU6XG4gICAgLy8gICBJbiBBTUQgZW52IHRoZSBnbG9iYWwgc2NvcGUgc2hvdWxkIGJlIGtlcHQgY2xlYW4sIGJ1dCBqUXVlcnkgaXMgYW4gZXhjZXB0aW9uLlxuICAgIC8vICAgalF1ZXJ5IGFsd2F5cyBleHBvcnRzIHRvIGdsb2JhbCBzY29wZSwgdW5sZXNzIGpRdWVyeS5ub0NvbmZsaWN0KHRydWUpIGlzIHVzZWQsXG4gICAgLy8gICBhbmQgd2Ugc2hvdWxkIGNhdGNoIHRoYXQuXG4gICAgdmFyICQgPSB3aW5kb3cgJiYgKHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvKTtcbiAgICBpZiAoJCAmJiAhJC51YSkge1xuICAgICAgICB2YXIgcGFyc2VyID0gbmV3IFVBUGFyc2VyKCk7XG4gICAgICAgICQudWEgPSBwYXJzZXIuZ2V0UmVzdWx0KCk7XG4gICAgICAgICQudWEuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlci5nZXRVQSgpO1xuICAgICAgICB9O1xuICAgICAgICAkLnVhLnNldCA9IGZ1bmN0aW9uICh1YXN0cmluZykge1xuICAgICAgICAgICAgcGFyc2VyLnNldFVBKHVhc3RyaW5nKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBwYXJzZXIuZ2V0UmVzdWx0KCk7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICQudWFbcHJvcF0gPSByZXN1bHRbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG59KSh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyA/IHdpbmRvdyA6IHRoaXMpO1xuIl19
