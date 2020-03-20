(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.outdatedBrowserRework = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
var UserAgentParser = require("ua-parser-js")
var languageMessages = require("./languages.json")
var deepExtend = require("./extend")

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

var COLORS = {
	salmon: "#f25648",
	white: "white"
}

var updateDefaults = function(defaults, updatedValues) {
	for (var key in updatedValues) {
		defaults[key] = updatedValues[key]
	}

	return defaults
}

module.exports = function(options) {
	var main = function() {
		// Despite the docs, UA needs to be provided to constructor explicitly:
		// https://github.com/faisalman/ua-parser-js/issues/90
		var parsedUserAgent = new UserAgentParser(window.navigator.userAgent).getResult()

		// Variable definition (before ajax)
		var outdatedUI = document.getElementById("outdated")

		options = options || {}

		var browserLocale = window.navigator.language || window.navigator.userLanguage // Everyone else, IE

		// Set default options
		var browserSupport = options.browserSupport ? updateDefaults(DEFAULTS, options.browserSupport) : DEFAULTS
		// CSS property to check for. You may also like 'borderSpacing', 'boxShadow', 'transform', 'borderImage';
		var requiredCssProperty = options.requiredCssProperty || false
		var backgroundColor = options.backgroundColor || COLORS.salmon
		var textColor = options.textColor || COLORS.white
		var fullscreen = options.fullscreen || false
		var language = options.language || browserLocale.slice(0, 2) // Language code

		var updateSource = "web" // Other possible values are 'googlePlay' or 'appStore'. Determines where we tell users to go for upgrades.

		// Chrome mobile is still Chrome (unlike Safari which is 'Mobile Safari')
		var isAndroid = parsedUserAgent.os.name === "Android"
		if (isAndroid) {
			updateSource = "googlePlay"
		}

		var isAndroidButNotChrome
		if (options.requireChromeOnAndroid) {
			isAndroidButNotChrome = isAndroid && parsedUserAgent.browser.name !== "Chrome"
		}

		if (parsedUserAgent.os.name === "iOS") {
			updateSource = "appStore"
		}

		var done = true

		var changeOpacity = function(opacityValue) {
			outdatedUI.style.opacity = opacityValue / 100
			outdatedUI.style.filter = "alpha(opacity=" + opacityValue + ")"
		}

		var fadeIn = function(opacityValue) {
			changeOpacity(opacityValue)
			if (opacityValue === 1) {
				outdatedUI.style.display = "table"
			}
			if (opacityValue === 100) {
				done = true
			}
		}

		var parseMinorVersion = function (version) {
			return version.replace(/[^\d.]/g,'').split(".")[1]
		}

		var isBrowserUnsupported = function() {
			var browserName = parsedUserAgent.browser.name
			var isUnsupported = false
			if (!(browserName in browserSupport)) {
				if (!options.isUnknownBrowserOK) {
					isUnsupported = true
				}
			} else if (!browserSupport[browserName]) {
				isUnsupported = true
			}
			return isUnsupported
		}

		var isBrowserOutOfDate = function() {
			var browserName = parsedUserAgent.browser.name
			var browserVersion = parsedUserAgent.browser.version
			var browserMajorVersion = parsedUserAgent.browser.major
			var osName = parsedUserAgent.os.name
			var osVersion = parsedUserAgent.os.version

			// Edge legacy needed a version mapping, Edge on Chromium doesn't
			if (browserName === "Edge" && browserMajorVersion <= 18) {
				browserMajorVersion = EDGEHTML_VS_EDGE_VERSIONS[browserMajorVersion]
			}

			// Firefox Mobile on iOS is essentially Mobile Safari so needs to be handled that way
			// See: https://github.com/mikemaccana/outdated-browser-rework/issues/98#issuecomment-597721173
			if (browserName === 'Firefox' && osName === 'iOS') {
				browserName = 'Mobile Safari'
				browserVersion = osVersion
				browserMajorVersion = osVersion.substring(0, osVersion.indexOf('.'))
			}

			var isOutOfDate = false
			if (isBrowserUnsupported()) {
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
		var isPropertySupported = function(property) {
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

			property = property.replace(/^[a-z]/, function(val) {
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

		var makeFadeInFunction = function(opacityValue) {
			return function() {
				fadeIn(opacityValue)
			}
		}

		// Style element explicitly - TODO: investigate and delete if not needed
		var startStylesAndEvents = function() {
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
				buttonUpdate.onmouseover = function() {
					this.style.color = backgroundColor
					this.style.backgroundColor = textColor
				}

				buttonUpdate.onmouseout = function() {
					this.style.color = textColor
					this.style.backgroundColor = backgroundColor
				}
			}

			buttonClose.style.color = textColor

			buttonClose.onmousedown = function() {
				outdatedUI.style.display = "none"
				return false
			}
		}

		var getmessage = function(lang) {
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
			if (isBrowserUnsupported() && messages.unsupported) {
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

		// Check if browser is supported
		if (isBrowserOutOfDate() || !isPropertySupported(requiredCssProperty) || isAndroidButNotChrome) {
			// This is an outdated browser
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
			insertContentHere.innerHTML = getmessage(language)
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

},{"./extend":1,"./languages.json":3,"ua-parser-js":4}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{}]},{},[2])(2)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleHRlbmQuanMiLCJpbmRleC5qcyIsImxhbmd1YWdlcy5qc29uIiwibm9kZV9tb2R1bGVzL3VhLXBhcnNlci1qcy9zcmMvdWEtcGFyc2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLyogSGlnaGx5IGR1bWJlZCBkb3duIHZlcnNpb24gb2YgaHR0cHM6Ly9naXRodWIuY29tL3VuY2xlY2h1L25vZGUtZGVlcC1leHRlbmQgKi9cclxuXHJcbi8qKlxyXG4gKiBFeHRlbmluZyBvYmplY3QgdGhhdCBlbnRlcmVkIGluIGZpcnN0IGFyZ3VtZW50LlxyXG4gKlxyXG4gKiBSZXR1cm5zIGV4dGVuZGVkIG9iamVjdCBvciBmYWxzZSBpZiBoYXZlIG5vIHRhcmdldCBvYmplY3Qgb3IgaW5jb3JyZWN0IHR5cGUuXHJcbiAqXHJcbiAqIElmIHlvdSB3aXNoIHRvIGNsb25lIHNvdXJjZSBvYmplY3QgKHdpdGhvdXQgbW9kaWZ5IGl0KSwganVzdCB1c2UgZW1wdHkgbmV3XHJcbiAqIG9iamVjdCBhcyBmaXJzdCBhcmd1bWVudCwgbGlrZSB0aGlzOlxyXG4gKiAgIGRlZXBFeHRlbmQoe30sIHlvdXJPYmpfMSwgW3lvdXJPYmpfTl0pO1xyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWVwRXh0ZW5kKC8qb2JqXzEsIFtvYmpfMl0sIFtvYmpfTl0qLykge1xyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMSB8fCB0eXBlb2YgYXJndW1lbnRzWzBdICE9PSBcIm9iamVjdFwiKSB7XHJcblx0XHRyZXR1cm4gZmFsc2VcclxuXHR9XHJcblxyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikge1xyXG5cdFx0cmV0dXJuIGFyZ3VtZW50c1swXVxyXG5cdH1cclxuXHJcblx0dmFyIHRhcmdldCA9IGFyZ3VtZW50c1swXVxyXG5cclxuXHRmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIG9iaiA9IGFyZ3VtZW50c1tpXVxyXG5cclxuXHRcdGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuXHRcdFx0dmFyIHNyYyA9IHRhcmdldFtrZXldXHJcblx0XHRcdHZhciB2YWwgPSBvYmpba2V5XVxyXG5cclxuXHRcdFx0aWYgKHR5cGVvZiB2YWwgIT09IFwib2JqZWN0XCIgfHwgdmFsID09PSBudWxsKSB7XHJcblx0XHRcdFx0dGFyZ2V0W2tleV0gPSB2YWxcclxuXHJcblx0XHRcdFx0Ly8ganVzdCBjbG9uZSBhcnJheXMgKGFuZCByZWN1cnNpdmUgY2xvbmUgb2JqZWN0cyBpbnNpZGUpXHJcblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIHNyYyAhPT0gXCJvYmplY3RcIiB8fCBzcmMgPT09IG51bGwpIHtcclxuXHRcdFx0XHR0YXJnZXRba2V5XSA9IGRlZXBFeHRlbmQoe30sIHZhbClcclxuXHJcblx0XHRcdFx0Ly8gc291cmNlIHZhbHVlIGFuZCBuZXcgdmFsdWUgaXMgb2JqZWN0cyBib3RoLCBleHRlbmRpbmcuLi5cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0YXJnZXRba2V5XSA9IGRlZXBFeHRlbmQoc3JjLCB2YWwpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiB0YXJnZXRcclxufVxyXG4iLCJ2YXIgVXNlckFnZW50UGFyc2VyID0gcmVxdWlyZShcInVhLXBhcnNlci1qc1wiKVxudmFyIGxhbmd1YWdlTWVzc2FnZXMgPSByZXF1aXJlKFwiLi9sYW5ndWFnZXMuanNvblwiKVxudmFyIGRlZXBFeHRlbmQgPSByZXF1aXJlKFwiLi9leHRlbmRcIilcblxudmFyIERFRkFVTFRTID0ge1xuXHRDaHJvbWU6IDU3LCAvLyBJbmNsdWRlcyBDaHJvbWUgZm9yIG1vYmlsZSBkZXZpY2VzXG5cdEVkZ2U6IDM5LFxuXHRTYWZhcmk6IDEwLFxuXHRcIk1vYmlsZSBTYWZhcmlcIjogMTAsXG5cdE9wZXJhOiA1MCxcblx0RmlyZWZveDogNTAsXG5cdFZpdmFsZGk6IDEsXG5cdElFOiBmYWxzZVxufVxuXG52YXIgRURHRUhUTUxfVlNfRURHRV9WRVJTSU9OUyA9IHtcblx0MTI6IDAuMSxcblx0MTM6IDIxLFxuXHQxNDogMzEsXG5cdDE1OiAzOSxcblx0MTY6IDQxLFxuXHQxNzogNDIsXG5cdDE4OiA0NFxufVxuXG52YXIgQ09MT1JTID0ge1xuXHRzYWxtb246IFwiI2YyNTY0OFwiLFxuXHR3aGl0ZTogXCJ3aGl0ZVwiXG59XG5cbnZhciB1cGRhdGVEZWZhdWx0cyA9IGZ1bmN0aW9uKGRlZmF1bHRzLCB1cGRhdGVkVmFsdWVzKSB7XG5cdGZvciAodmFyIGtleSBpbiB1cGRhdGVkVmFsdWVzKSB7XG5cdFx0ZGVmYXVsdHNba2V5XSA9IHVwZGF0ZWRWYWx1ZXNba2V5XVxuXHR9XG5cblx0cmV0dXJuIGRlZmF1bHRzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHR2YXIgbWFpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vIERlc3BpdGUgdGhlIGRvY3MsIFVBIG5lZWRzIHRvIGJlIHByb3ZpZGVkIHRvIGNvbnN0cnVjdG9yIGV4cGxpY2l0bHk6XG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2ZhaXNhbG1hbi91YS1wYXJzZXItanMvaXNzdWVzLzkwXG5cdFx0dmFyIHBhcnNlZFVzZXJBZ2VudCA9IG5ldyBVc2VyQWdlbnRQYXJzZXIod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpLmdldFJlc3VsdCgpXG5cblx0XHQvLyBWYXJpYWJsZSBkZWZpbml0aW9uIChiZWZvcmUgYWpheClcblx0XHR2YXIgb3V0ZGF0ZWRVSSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3V0ZGF0ZWRcIilcblxuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cblx0XHR2YXIgYnJvd3NlckxvY2FsZSA9IHdpbmRvdy5uYXZpZ2F0b3IubGFuZ3VhZ2UgfHwgd2luZG93Lm5hdmlnYXRvci51c2VyTGFuZ3VhZ2UgLy8gRXZlcnlvbmUgZWxzZSwgSUVcblxuXHRcdC8vIFNldCBkZWZhdWx0IG9wdGlvbnNcblx0XHR2YXIgYnJvd3NlclN1cHBvcnQgPSBvcHRpb25zLmJyb3dzZXJTdXBwb3J0ID8gdXBkYXRlRGVmYXVsdHMoREVGQVVMVFMsIG9wdGlvbnMuYnJvd3NlclN1cHBvcnQpIDogREVGQVVMVFNcblx0XHQvLyBDU1MgcHJvcGVydHkgdG8gY2hlY2sgZm9yLiBZb3UgbWF5IGFsc28gbGlrZSAnYm9yZGVyU3BhY2luZycsICdib3hTaGFkb3cnLCAndHJhbnNmb3JtJywgJ2JvcmRlckltYWdlJztcblx0XHR2YXIgcmVxdWlyZWRDc3NQcm9wZXJ0eSA9IG9wdGlvbnMucmVxdWlyZWRDc3NQcm9wZXJ0eSB8fCBmYWxzZVxuXHRcdHZhciBiYWNrZ3JvdW5kQ29sb3IgPSBvcHRpb25zLmJhY2tncm91bmRDb2xvciB8fCBDT0xPUlMuc2FsbW9uXG5cdFx0dmFyIHRleHRDb2xvciA9IG9wdGlvbnMudGV4dENvbG9yIHx8IENPTE9SUy53aGl0ZVxuXHRcdHZhciBmdWxsc2NyZWVuID0gb3B0aW9ucy5mdWxsc2NyZWVuIHx8IGZhbHNlXG5cdFx0dmFyIGxhbmd1YWdlID0gb3B0aW9ucy5sYW5ndWFnZSB8fCBicm93c2VyTG9jYWxlLnNsaWNlKDAsIDIpIC8vIExhbmd1YWdlIGNvZGVcblxuXHRcdHZhciB1cGRhdGVTb3VyY2UgPSBcIndlYlwiIC8vIE90aGVyIHBvc3NpYmxlIHZhbHVlcyBhcmUgJ2dvb2dsZVBsYXknIG9yICdhcHBTdG9yZScuIERldGVybWluZXMgd2hlcmUgd2UgdGVsbCB1c2VycyB0byBnbyBmb3IgdXBncmFkZXMuXG5cblx0XHQvLyBDaHJvbWUgbW9iaWxlIGlzIHN0aWxsIENocm9tZSAodW5saWtlIFNhZmFyaSB3aGljaCBpcyAnTW9iaWxlIFNhZmFyaScpXG5cdFx0dmFyIGlzQW5kcm9pZCA9IHBhcnNlZFVzZXJBZ2VudC5vcy5uYW1lID09PSBcIkFuZHJvaWRcIlxuXHRcdGlmIChpc0FuZHJvaWQpIHtcblx0XHRcdHVwZGF0ZVNvdXJjZSA9IFwiZ29vZ2xlUGxheVwiXG5cdFx0fVxuXG5cdFx0dmFyIGlzQW5kcm9pZEJ1dE5vdENocm9tZVxuXHRcdGlmIChvcHRpb25zLnJlcXVpcmVDaHJvbWVPbkFuZHJvaWQpIHtcblx0XHRcdGlzQW5kcm9pZEJ1dE5vdENocm9tZSA9IGlzQW5kcm9pZCAmJiBwYXJzZWRVc2VyQWdlbnQuYnJvd3Nlci5uYW1lICE9PSBcIkNocm9tZVwiXG5cdFx0fVxuXG5cdFx0aWYgKHBhcnNlZFVzZXJBZ2VudC5vcy5uYW1lID09PSBcImlPU1wiKSB7XG5cdFx0XHR1cGRhdGVTb3VyY2UgPSBcImFwcFN0b3JlXCJcblx0XHR9XG5cblx0XHR2YXIgZG9uZSA9IHRydWVcblxuXHRcdHZhciBjaGFuZ2VPcGFjaXR5ID0gZnVuY3Rpb24ob3BhY2l0eVZhbHVlKSB7XG5cdFx0XHRvdXRkYXRlZFVJLnN0eWxlLm9wYWNpdHkgPSBvcGFjaXR5VmFsdWUgLyAxMDBcblx0XHRcdG91dGRhdGVkVUkuc3R5bGUuZmlsdGVyID0gXCJhbHBoYShvcGFjaXR5PVwiICsgb3BhY2l0eVZhbHVlICsgXCIpXCJcblx0XHR9XG5cblx0XHR2YXIgZmFkZUluID0gZnVuY3Rpb24ob3BhY2l0eVZhbHVlKSB7XG5cdFx0XHRjaGFuZ2VPcGFjaXR5KG9wYWNpdHlWYWx1ZSlcblx0XHRcdGlmIChvcGFjaXR5VmFsdWUgPT09IDEpIHtcblx0XHRcdFx0b3V0ZGF0ZWRVSS5zdHlsZS5kaXNwbGF5ID0gXCJ0YWJsZVwiXG5cdFx0XHR9XG5cdFx0XHRpZiAob3BhY2l0eVZhbHVlID09PSAxMDApIHtcblx0XHRcdFx0ZG9uZSA9IHRydWVcblx0XHRcdH1cblx0XHR9XG5cblx0XHR2YXIgcGFyc2VNaW5vclZlcnNpb24gPSBmdW5jdGlvbiAodmVyc2lvbikge1xuXHRcdFx0cmV0dXJuIHZlcnNpb24ucmVwbGFjZSgvW15cXGQuXS9nLCcnKS5zcGxpdChcIi5cIilbMV1cblx0XHR9XG5cblx0XHR2YXIgaXNCcm93c2VyVW5zdXBwb3J0ZWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBicm93c2VyTmFtZSA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm5hbWVcblx0XHRcdHZhciBpc1Vuc3VwcG9ydGVkID0gZmFsc2Vcblx0XHRcdGlmICghKGJyb3dzZXJOYW1lIGluIGJyb3dzZXJTdXBwb3J0KSkge1xuXHRcdFx0XHRpZiAoIW9wdGlvbnMuaXNVbmtub3duQnJvd3Nlck9LKSB7XG5cdFx0XHRcdFx0aXNVbnN1cHBvcnRlZCA9IHRydWVcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICghYnJvd3NlclN1cHBvcnRbYnJvd3Nlck5hbWVdKSB7XG5cdFx0XHRcdGlzVW5zdXBwb3J0ZWQgPSB0cnVlXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gaXNVbnN1cHBvcnRlZFxuXHRcdH1cblxuXHRcdHZhciBpc0Jyb3dzZXJPdXRPZkRhdGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBicm93c2VyTmFtZSA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm5hbWVcblx0XHRcdHZhciBicm93c2VyVmVyc2lvbiA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLnZlcnNpb25cblx0XHRcdHZhciBicm93c2VyTWFqb3JWZXJzaW9uID0gcGFyc2VkVXNlckFnZW50LmJyb3dzZXIubWFqb3Jcblx0XHRcdHZhciBvc05hbWUgPSBwYXJzZWRVc2VyQWdlbnQub3MubmFtZVxuXHRcdFx0dmFyIG9zVmVyc2lvbiA9IHBhcnNlZFVzZXJBZ2VudC5vcy52ZXJzaW9uXG5cblx0XHRcdC8vIEVkZ2UgbGVnYWN5IG5lZWRlZCBhIHZlcnNpb24gbWFwcGluZywgRWRnZSBvbiBDaHJvbWl1bSBkb2Vzbid0XG5cdFx0XHRpZiAoYnJvd3Nlck5hbWUgPT09IFwiRWRnZVwiICYmIGJyb3dzZXJNYWpvclZlcnNpb24gPD0gMTgpIHtcblx0XHRcdFx0YnJvd3Nlck1ham9yVmVyc2lvbiA9IEVER0VIVE1MX1ZTX0VER0VfVkVSU0lPTlNbYnJvd3Nlck1ham9yVmVyc2lvbl1cblx0XHRcdH1cblxuXHRcdFx0Ly8gRmlyZWZveCBNb2JpbGUgb24gaU9TIGlzIGVzc2VudGlhbGx5IE1vYmlsZSBTYWZhcmkgc28gbmVlZHMgdG8gYmUgaGFuZGxlZCB0aGF0IHdheVxuXHRcdFx0Ly8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbWlrZW1hY2NhbmEvb3V0ZGF0ZWQtYnJvd3Nlci1yZXdvcmsvaXNzdWVzLzk4I2lzc3VlY29tbWVudC01OTc3MjExNzNcblx0XHRcdGlmIChicm93c2VyTmFtZSA9PT0gJ0ZpcmVmb3gnICYmIG9zTmFtZSA9PT0gJ2lPUycpIHtcblx0XHRcdFx0YnJvd3Nlck5hbWUgPSAnTW9iaWxlIFNhZmFyaSdcblx0XHRcdFx0YnJvd3NlclZlcnNpb24gPSBvc1ZlcnNpb25cblx0XHRcdFx0YnJvd3Nlck1ham9yVmVyc2lvbiA9IG9zVmVyc2lvbi5zdWJzdHJpbmcoMCwgb3NWZXJzaW9uLmluZGV4T2YoJy4nKSlcblx0XHRcdH1cblxuXHRcdFx0dmFyIGlzT3V0T2ZEYXRlID0gZmFsc2Vcblx0XHRcdGlmIChpc0Jyb3dzZXJVbnN1cHBvcnRlZCgpKSB7XG5cdFx0XHRcdGlzT3V0T2ZEYXRlID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSBpZiAoYnJvd3Nlck5hbWUgaW4gYnJvd3NlclN1cHBvcnQpIHtcblx0XHRcdFx0dmFyIG1pblZlcnNpb24gPSBicm93c2VyU3VwcG9ydFticm93c2VyTmFtZV1cblx0XHRcdFx0aWYgKHR5cGVvZiBtaW5WZXJzaW9uID09ICdvYmplY3QnKSB7XG5cdFx0XHRcdFx0dmFyIG1pbk1ham9yVmVyc2lvbiA9IG1pblZlcnNpb24ubWFqb3Jcblx0XHRcdFx0XHR2YXIgbWluTWlub3JWZXJzaW9uID0gbWluVmVyc2lvbi5taW5vclxuXG5cdFx0XHRcdFx0aWYgKGJyb3dzZXJNYWpvclZlcnNpb24gPCBtaW5NYWpvclZlcnNpb24pIHtcblx0XHRcdFx0XHRcdGlzT3V0T2ZEYXRlID0gdHJ1ZVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoYnJvd3Nlck1ham9yVmVyc2lvbiA9PSBtaW5NYWpvclZlcnNpb24pIHtcblx0XHRcdFx0XHRcdHZhciBicm93c2VyTWlub3JWZXJzaW9uID0gcGFyc2VNaW5vclZlcnNpb24oYnJvd3NlclZlcnNpb24pXG5cblx0XHRcdFx0XHRcdGlmIChicm93c2VyTWlub3JWZXJzaW9uIDwgbWluTWlub3JWZXJzaW9uKSB7XG5cdFx0XHRcdFx0XHRcdGlzT3V0T2ZEYXRlID0gdHJ1ZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmIChicm93c2VyTWFqb3JWZXJzaW9uIDwgbWluVmVyc2lvbikge1xuXHRcdFx0XHRcdGlzT3V0T2ZEYXRlID0gdHJ1ZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gaXNPdXRPZkRhdGVcblx0XHR9XG5cblx0XHQvLyBSZXR1cm5zIHRydWUgaWYgYSBicm93c2VyIHN1cHBvcnRzIGEgY3NzMyBwcm9wZXJ0eVxuXHRcdHZhciBpc1Byb3BlcnR5U3VwcG9ydGVkID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcblx0XHRcdGlmICghcHJvcGVydHkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdH1cblx0XHRcdHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG5cdFx0XHR2YXIgdmVuZG9yUHJlZml4ZXMgPSBbXCJraHRtbFwiLCBcIm1zXCIsIFwib1wiLCBcIm1velwiLCBcIndlYmtpdFwiXVxuXHRcdFx0dmFyIGNvdW50ID0gdmVuZG9yUHJlZml4ZXMubGVuZ3RoXG5cblx0XHRcdC8vIE5vdGU6IEhUTUxFbGVtZW50LnN0eWxlLmhhc093blByb3BlcnR5IHNlZW1zIGJyb2tlbiBpbiBFZGdlXG5cdFx0XHRpZiAocHJvcGVydHkgaW4gZGl2LnN0eWxlKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0XHR9XG5cblx0XHRcdHByb3BlcnR5ID0gcHJvcGVydHkucmVwbGFjZSgvXlthLXpdLywgZnVuY3Rpb24odmFsKSB7XG5cdFx0XHRcdHJldHVybiB2YWwudG9VcHBlckNhc2UoKVxuXHRcdFx0fSlcblxuXHRcdFx0d2hpbGUgKGNvdW50LS0pIHtcblx0XHRcdFx0dmFyIHByZWZpeGVkUHJvcGVydHkgPSB2ZW5kb3JQcmVmaXhlc1tjb3VudF0gKyBwcm9wZXJ0eVxuXHRcdFx0XHQvLyBTZWUgY29tbWVudCByZTogSFRNTEVsZW1lbnQuc3R5bGUuaGFzT3duUHJvcGVydHkgYWJvdmVcblx0XHRcdFx0aWYgKHByZWZpeGVkUHJvcGVydHkgaW4gZGl2LnN0eWxlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXG5cdFx0dmFyIG1ha2VGYWRlSW5GdW5jdGlvbiA9IGZ1bmN0aW9uKG9wYWNpdHlWYWx1ZSkge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRmYWRlSW4ob3BhY2l0eVZhbHVlKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFN0eWxlIGVsZW1lbnQgZXhwbGljaXRseSAtIFRPRE86IGludmVzdGlnYXRlIGFuZCBkZWxldGUgaWYgbm90IG5lZWRlZFxuXHRcdHZhciBzdGFydFN0eWxlc0FuZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGJ1dHRvbkNsb3NlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJidXR0b25DbG9zZVVwZGF0ZUJyb3dzZXJcIilcblx0XHRcdHZhciBidXR0b25VcGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJ1dHRvblVwZGF0ZUJyb3dzZXJcIilcblxuXHRcdFx0Ly9jaGVjayBzZXR0aW5ncyBhdHRyaWJ1dGVzXG5cdFx0XHRvdXRkYXRlZFVJLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGJhY2tncm91bmRDb2xvclxuXHRcdFx0Ly93YXkgdG9vIGhhcmQgdG8gcHV0ICFpbXBvcnRhbnQgb24gSUU2XG5cdFx0XHRvdXRkYXRlZFVJLnN0eWxlLmNvbG9yID0gdGV4dENvbG9yXG5cdFx0XHRvdXRkYXRlZFVJLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnN0eWxlLmNvbG9yID0gdGV4dENvbG9yXG5cdFx0XHRvdXRkYXRlZFVJLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzFdLnN0eWxlLmNvbG9yID0gdGV4dENvbG9yXG5cblx0XHRcdC8vIFVwZGF0ZSBidXR0b24gaXMgZGVza3RvcCBvbmx5XG5cdFx0XHRpZiAoYnV0dG9uVXBkYXRlKSB7XG5cdFx0XHRcdGJ1dHRvblVwZGF0ZS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcdFx0XHRpZiAoYnV0dG9uVXBkYXRlLnN0eWxlLmJvcmRlckNvbG9yKSB7XG5cdFx0XHRcdFx0YnV0dG9uVXBkYXRlLnN0eWxlLmJvcmRlckNvbG9yID0gdGV4dENvbG9yXG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBPdmVycmlkZSB0aGUgdXBkYXRlIGJ1dHRvbiBjb2xvciB0byBtYXRjaCB0aGUgYmFja2dyb3VuZCBjb2xvclxuXHRcdFx0XHRidXR0b25VcGRhdGUub25tb3VzZW92ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR0aGlzLnN0eWxlLmNvbG9yID0gYmFja2dyb3VuZENvbG9yXG5cdFx0XHRcdFx0dGhpcy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0ZXh0Q29sb3Jcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJ1dHRvblVwZGF0ZS5vbm1vdXNlb3V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGhpcy5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcdFx0XHRcdHRoaXMuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gYmFja2dyb3VuZENvbG9yXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0YnV0dG9uQ2xvc2Uuc3R5bGUuY29sb3IgPSB0ZXh0Q29sb3JcblxuXHRcdFx0YnV0dG9uQ2xvc2Uub25tb3VzZWRvd24gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0b3V0ZGF0ZWRVSS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dmFyIGdldG1lc3NhZ2UgPSBmdW5jdGlvbihsYW5nKSB7XG5cdFx0XHR2YXIgZGVmYXVsdE1lc3NhZ2VzID0gbGFuZ3VhZ2VNZXNzYWdlc1tsYW5nXSB8fCBsYW5ndWFnZU1lc3NhZ2VzLmVuXG5cdFx0XHR2YXIgY3VzdG9tTWVzc2FnZXMgPSBvcHRpb25zLm1lc3NhZ2VzICYmIG9wdGlvbnMubWVzc2FnZXNbbGFuZ11cblx0XHRcdHZhciBtZXNzYWdlcyA9IGRlZXBFeHRlbmQoe30sIGRlZmF1bHRNZXNzYWdlcywgY3VzdG9tTWVzc2FnZXMpXG5cblx0XHRcdHZhciB1cGRhdGVNZXNzYWdlcyA9IHtcblx0XHRcdFx0d2ViOlxuXHRcdFx0XHRcdFwiPHA+XCIgK1xuXHRcdFx0XHRcdG1lc3NhZ2VzLnVwZGF0ZS53ZWIgK1xuXHRcdFx0XHRcdChtZXNzYWdlcy51cmwgPyAoXG5cdFx0XHRcdFx0XHQnPGEgaWQ9XCJidXR0b25VcGRhdGVCcm93c2VyXCIgcmVsPVwibm9mb2xsb3dcIiBocmVmPVwiJyArXG5cdFx0XHRcdFx0XHRtZXNzYWdlcy51cmwgK1xuXHRcdFx0XHRcdFx0J1wiPicgK1xuXHRcdFx0XHRcdFx0bWVzc2FnZXMuY2FsbFRvQWN0aW9uICtcblx0XHRcdFx0XHRcdFwiPC9hPlwiXG5cdFx0XHRcdFx0KSA6ICcnKSArXG5cdFx0XHRcdFx0XCI8L3A+XCIsXG5cdFx0XHRcdGdvb2dsZVBsYXk6XG5cdFx0XHRcdFx0XCI8cD5cIiArXG5cdFx0XHRcdFx0bWVzc2FnZXMudXBkYXRlLmdvb2dsZVBsYXkgK1xuXHRcdFx0XHRcdCc8YSBpZD1cImJ1dHRvblVwZGF0ZUJyb3dzZXJcIiByZWw9XCJub2ZvbGxvd1wiIGhyZWY9XCJodHRwczovL3BsYXkuZ29vZ2xlLmNvbS9zdG9yZS9hcHBzL2RldGFpbHM/aWQ9Y29tLmFuZHJvaWQuY2hyb21lXCI+JyArXG5cdFx0XHRcdFx0bWVzc2FnZXMuY2FsbFRvQWN0aW9uICtcblx0XHRcdFx0XHRcIjwvYT48L3A+XCIsXG5cdFx0XHRcdGFwcFN0b3JlOiBcIjxwPlwiICsgbWVzc2FnZXMudXBkYXRlW3VwZGF0ZVNvdXJjZV0gKyBcIjwvcD5cIlxuXHRcdFx0fVxuXG5cdFx0XHR2YXIgdXBkYXRlTWVzc2FnZSA9IHVwZGF0ZU1lc3NhZ2VzW3VwZGF0ZVNvdXJjZV1cblxuXHRcdFx0dmFyIGJyb3dzZXJTdXBwb3J0TWVzc2FnZSA9IG1lc3NhZ2VzLm91dE9mRGF0ZTtcblx0XHRcdGlmIChpc0Jyb3dzZXJVbnN1cHBvcnRlZCgpICYmIG1lc3NhZ2VzLnVuc3VwcG9ydGVkKSB7XG5cdFx0XHRcdGJyb3dzZXJTdXBwb3J0TWVzc2FnZSA9IG1lc3NhZ2VzLnVuc3VwcG9ydGVkO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQnPGRpdiBjbGFzcz1cInZlcnRpY2FsLWNlbnRlclwiPjxoNj4nICtcblx0XHRcdFx0YnJvd3NlclN1cHBvcnRNZXNzYWdlICtcblx0XHRcdFx0XCI8L2g2PlwiICtcblx0XHRcdFx0dXBkYXRlTWVzc2FnZSArXG5cdFx0XHRcdCc8cCBjbGFzcz1cImxhc3RcIj48YSBocmVmPVwiI1wiIGlkPVwiYnV0dG9uQ2xvc2VVcGRhdGVCcm93c2VyXCIgdGl0bGU9XCInICtcblx0XHRcdFx0bWVzc2FnZXMuY2xvc2UgK1xuXHRcdFx0XHQnXCI+JnRpbWVzOzwvYT48L3A+PC9kaXY+J1xuXHRcdFx0KVxuXHRcdH1cblxuXHRcdC8vIENoZWNrIGlmIGJyb3dzZXIgaXMgc3VwcG9ydGVkXG5cdFx0aWYgKGlzQnJvd3Nlck91dE9mRGF0ZSgpIHx8ICFpc1Byb3BlcnR5U3VwcG9ydGVkKHJlcXVpcmVkQ3NzUHJvcGVydHkpIHx8IGlzQW5kcm9pZEJ1dE5vdENocm9tZSkge1xuXHRcdFx0Ly8gVGhpcyBpcyBhbiBvdXRkYXRlZCBicm93c2VyXG5cdFx0XHRpZiAoZG9uZSAmJiBvdXRkYXRlZFVJLnN0eWxlLm9wYWNpdHkgIT09IFwiMVwiKSB7XG5cdFx0XHRcdGRvbmUgPSBmYWxzZVxuXG5cdFx0XHRcdGZvciAodmFyIG9wYWNpdHkgPSAxOyBvcGFjaXR5IDw9IDEwMDsgb3BhY2l0eSsrKSB7XG5cdFx0XHRcdFx0c2V0VGltZW91dChtYWtlRmFkZUluRnVuY3Rpb24ob3BhY2l0eSksIG9wYWNpdHkgKiA4KVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHZhciBpbnNlcnRDb250ZW50SGVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3V0ZGF0ZWRcIilcblx0XHRcdGlmIChmdWxsc2NyZWVuKSB7XG5cdFx0XHRcdGluc2VydENvbnRlbnRIZXJlLmNsYXNzTGlzdC5hZGQoXCJmdWxsc2NyZWVuXCIpXG5cdFx0XHR9XG5cdFx0XHRpbnNlcnRDb250ZW50SGVyZS5pbm5lckhUTUwgPSBnZXRtZXNzYWdlKGxhbmd1YWdlKVxuXHRcdFx0c3RhcnRTdHlsZXNBbmRFdmVudHMoKVxuXHRcdH1cblx0fVxuXG5cdC8vIExvYWQgbWFpbiB3aGVuIERPTSByZWFkeS5cblx0dmFyIG9sZE9ubG9hZCA9IHdpbmRvdy5vbmxvYWRcblx0aWYgKHR5cGVvZiB3aW5kb3cub25sb2FkICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHR3aW5kb3cub25sb2FkID0gbWFpblxuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChvbGRPbmxvYWQpIHtcblx0XHRcdFx0b2xkT25sb2FkKClcblx0XHRcdH1cblx0XHRcdG1haW4oKVxuXHRcdH1cblx0fVxufVxuIiwibW9kdWxlLmV4cG9ydHM9e1xyXG5cdFwiYnJcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJPIHNldSBuYXZlZ2Fkb3IgZXN0JmFhY3V0ZTsgZGVzYXR1YWxpemFkbyFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJBdHVhbGl6ZSBvIHNldSBuYXZlZ2Fkb3IgcGFyYSB0ZXIgdW1hIG1lbGhvciBleHBlcmkmZWNpcmM7bmNpYSBlIHZpc3VhbGl6YSZjY2VkaWw7JmF0aWxkZTtvIGRlc3RlIHNpdGUuIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiQXR1YWxpemUgbyBzZXUgbmF2ZWdhZG9yIGFnb3JhXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiRmVjaGFyXCJcclxuXHR9LFxyXG5cdFwiY2FcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJFbCB2b3N0cmUgbmF2ZWdhZG9yIG5vIGVzdMOgIGFjdHVhbGl0emF0IVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIkFjdHVhbGl0emV1IGVsIHZvc3RyZSBuYXZlZ2Fkb3IgcGVyIHZldXJlIGNvcnJlY3RhbWVudCBhcXVlc3QgbGxvYyB3ZWIuIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJJbnN0YWzCt2xldSBDaHJvbWUgZGVzIGRlIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJBY3R1YWxpdHpldSBpT1MgZGVzIGRlIGwnYXBsaWNhY2nDsyBDb25maWd1cmFjacOzXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiQWN0dWFsaXR6YXIgZWwgbWV1IG5hdmVnYWRvciBhcmFcIixcclxuXHRcdFwiY2xvc2VcIjogXCJUYW5jYXJcIlxyXG5cdH0sXHJcblx0XCJjblwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIuaCqOeahOa1j+iniOWZqOW3sui/h+aXtlwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIuimgeato+W4uOa1j+iniOacrOe9keermeivt+WNh+e6p+aCqOeahOa1j+iniOWZqOOAglwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwi546w5Zyo5Y2H57qnXCIsXHJcblx0XHRcImNsb3NlXCI6IFwi5YWz6ZetXCJcclxuXHR9LFxyXG5cdFwiY3pcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJWw6HFoSBwcm9obMOtxb5lxI0gamUgemFzdGFyYWzDvSFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJQcm8gc3Byw6F2bsOpIHpvYnJhemVuw60gdMSbY2h0byBzdHLDoW5layBha3R1YWxpenVqdGUgc3bFr2ogcHJvaGzDrcW+ZcSNLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiTmFpbnN0YWx1anRlIHNpIENocm9tZSB6IEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJBa3R1YWxpenVqdGUgc2kgc3lzdMOpbSBpT1NcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJBa3R1YWxpem92YXQgbnluw60gc3bFr2ogcHJvaGzDrcW+ZcSNXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiWmF2xZnDrXRcIlxyXG5cdH0sXHJcblx0XCJkYVwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIkRpbiBicm93c2VyIGVyIGZvcsOmbGRldCFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJPcGRhdMOpciBkaW4gYnJvd3NlciBmb3IgYXQgZsOlIHZpc3QgZGVubmUgaGplbW1lc2lkZSBrb3JyZWt0LiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiSW5zdGFsbMOpciB2ZW5saWdzdCBDaHJvbWUgZnJhIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJPcGRhdMOpciB2ZW5saWdzdCBpT1NcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJPcGRhdMOpciBkaW4gYnJvd3NlciBudVwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIkx1a1wiXHJcblx0fSxcclxuXHRcImRlXCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiSWhyIEJyb3dzZXIgaXN0IHZlcmFsdGV0IVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIkJpdHRlIGFrdHVhbGlzaWVyZW4gU2llIElocmVuIEJyb3dzZXIsIHVtIGRpZXNlIFdlYnNpdGUga29ycmVrdCBkYXJ6dXN0ZWxsZW4uIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiRGVuIEJyb3dzZXIgamV0enQgYWt0dWFsaXNpZXJlbiBcIixcclxuXHRcdFwiY2xvc2VcIjogXCJTY2hsaWXDn2VuXCJcclxuXHR9LFxyXG5cdFwiZWVcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJTaW51IHZlZWJpbGVoaXRzZWphIG9uIHZhbmFuZW51ZCFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJQYWx1biB1dWVuZGEgb21hIHZlZWJpbGVoaXRzZWphdCwgZXQgbsOkaGEgbGVoZWvDvGxnZSBrb3JyZWt0c2VsdC4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJVdWVuZGEgb21hIHZlZWJpbGVoaXRzZWphdCBrb2hlXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiU3VsZ2VcIlxyXG5cdH0sXHJcblx0XCJlblwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIllvdXIgYnJvd3NlciBpcyBvdXQtb2YtZGF0ZSFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJVcGRhdGUgeW91ciBicm93c2VyIHRvIHZpZXcgdGhpcyB3ZWJzaXRlIGNvcnJlY3RseS4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJVcGRhdGUgbXkgYnJvd3NlciBub3dcIixcclxuXHRcdFwiY2xvc2VcIjogXCJDbG9zZVwiXHJcblx0fSxcclxuXHRcImVzXCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiwqFUdSBuYXZlZ2Fkb3IgZXN0w6EgYW50aWN1YWRvIVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIkFjdHVhbGl6YSB0dSBuYXZlZ2Fkb3IgcGFyYSB2ZXIgZXN0YSBww6FnaW5hIGNvcnJlY3RhbWVudGUuIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiQWN0dWFsaXphciBtaSBuYXZlZ2Fkb3IgYWhvcmFcIixcclxuXHRcdFwiY2xvc2VcIjogXCJDZXJyYXJcIlxyXG5cdH0sXHJcblx0XCJmYVwiOiB7XHJcblx0XHRcInJpZ2h0VG9MZWZ0XCI6IHRydWUsXHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcItmF2LHZiNix2q/YsSDYtNmF2Kcg2YXZhtiz2YjYriDYtNiv2Ycg2KfYs9iqIVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcItis2YfYqiDZhdi02KfZh9iv2Ycg2LXYrduM2K0g2KfbjNmGINmI2KjYs9in24zYqtiMINmF2LHZiNix2q/Ysdiq2KfZhiDYsdinINio2LHZiNiyINix2LPYp9mG24wg2YbZhdin24zbjNivLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcItmH2YXbjNmGINit2KfZhNinINmF2LHZiNix2q/YsdmFINix2Kcg2KjYsdmI2LIg2qnZhlwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIkNsb3NlXCJcclxuXHR9LFxyXG5cdFwiZmlcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJTZWxhaW1lc2kgb24gdmFuaGVudHVudXQhXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiTGF0YWEgYWphbnRhc2FpbmVuIHNlbGFpbiBuJmF1bWw7aGQmYXVtbDtrc2VzaSB0JmF1bWw7bSZhdW1sO24gc2l2dW4gb2lrZWluLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiQXNlbm5hIHV1c2luIENocm9tZSBHb29nbGUgUGxheSAta2F1cGFzdGFcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlDDpGl2aXTDpCBpT1MgcHVoZWxpbWVzaSBhc2V0dWtzaXN0YVwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIlAmYXVtbDtpdml0JmF1bWw7IHNlbGFpbWVuaSBueXQgXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiU3VsamVcIlxyXG5cdH0sXHJcblx0XCJmclwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIlZvdHJlIG5hdmlnYXRldXIgbidlc3QgcGx1cyBjb21wYXRpYmxlICFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJNZXR0ZXogw6Agam91ciB2b3RyZSBuYXZpZ2F0ZXVyIHBvdXIgYWZmaWNoZXIgY29ycmVjdGVtZW50IGNlIHNpdGUgV2ViLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiTWVyY2kgZCdpbnN0YWxsZXIgQ2hyb21lIGRlcHVpcyBsZSBHb29nbGUgUGxheSBTdG9yZVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiTWVyY2kgZGUgbWV0dHJlIMOgIGpvdXIgaU9TIGRlcHVpcyBsJ2FwcGxpY2F0aW9uIFLDqWdsYWdlc1wiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIk1ldHRyZSDDoCBqb3VyIG1haW50ZW5hbnQgXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiRmVybWVyXCJcclxuXHR9LFxyXG5cdFwiaHVcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJBIGLDtm5nw6lzesWRamUgZWxhdnVsdCFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJGaXJzc8OtdHNlIHZhZ3kgY3NlcsOpbGplIGxlIGEgYsO2bmfDqXN6xZFqw6l0LiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIkEgYsO2bmfDqXN6xZFtIGZyaXNzw610w6lzZSBcIixcclxuXHRcdFwiY2xvc2VcIjogXCJDbG9zZVwiXHJcblx0fSxcclxuXHRcImlkXCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiQnJvd3NlciB5YW5nIEFuZGEgZ3VuYWthbiBzdWRhaCBrZXRpbmdnYWxhbiB6YW1hbiFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJQZXJiYWhhcnVpbGFoIGJyb3dzZXIgQW5kYSBhZ2FyIGJpc2EgbWVuamVsYWphaGkgd2Vic2l0ZSBpbmkgZGVuZ2FuIG55YW1hbi4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJQZXJiYWhhcnVpIGJyb3dzZXIgc2VrYXJhbmcgXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiQ2xvc2VcIlxyXG5cdH0sXHJcblx0XCJpdFwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIklsIHR1byBicm93c2VyIG5vbiAmZWdyYXZlOyBhZ2dpb3JuYXRvIVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIkFnZ2lvcm5hbG8gcGVyIHZlZGVyZSBxdWVzdG8gc2l0byBjb3JyZXR0YW1lbnRlLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIkFnZ2lvcm5hIG9yYVwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIkNoaXVkaVwiXHJcblx0fSxcclxuXHRcImx0XCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiSsWrc8WzIG5hcsWheWtsxJdzIHZlcnNpamEgeXJhIHBhc2VudXNpIVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIkF0bmF1amlua2l0ZSBzYXZvIG5hcsWheWtsxJksIGthZCBnYWzEl3R1bcSXdGUgcGVyxb5pxatyxJd0aSDFoWnEhSBzdmV0YWluxJkgdGlua2FtYWkuIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiQXRuYXVqaW50aSBuYXLFoXlrbMSZIFwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIkNsb3NlXCJcclxuXHR9LFxyXG5cdFwibmxcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJKZSBnZWJydWlrdCBlZW4gb3VkZSBicm93c2VyIVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIlVwZGF0ZSBqZSBicm93c2VyIG9tIGRlemUgd2Vic2l0ZSBjb3JyZWN0IHRlIGJla2lqa2VuLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIlVwZGF0ZSBtaWpuIGJyb3dzZXIgbnUgXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiU2x1aXRlblwiXHJcblx0fSxcclxuXHRcInBsXCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiVHdvamEgcHJ6ZWdsxIVkYXJrYSBqZXN0IHByemVzdGFyemHFgmEhXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiWmFrdHVhbGl6dWogc3dvasSFIHByemVnbMSFZGFya8SZLCBhYnkgcG9wcmF3bmllIHd5xZt3aWV0bGnEhyB0xJkgc3Ryb27EmS4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlByb3N6xJkgemFpbnN0YWxvd2HEhyBwcnplZ2zEhWRhcmvEmSBDaHJvbWUgemUgc2tsZXB1IEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQcm9zesSZIHpha3R1YWxpem93YcSHIGlPUyB6IFVzdGF3aWXFhFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIlpha3R1YWxpenVqIHByemVnbMSFZGFya8SZIGp1xbwgdGVyYXpcIixcclxuXHRcdFwiY2xvc2VcIjogXCJaYW1rbmlqXCJcclxuXHR9LFxyXG5cdFwicHRcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJPIHNldSBicm93c2VyIGVzdCZhYWN1dGU7IGRlc2F0dWFsaXphZG8hXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiQXR1YWxpemUgbyBzZXUgYnJvd3NlciBwYXJhIHRlciB1bWEgbWVsaG9yIGV4cGVyaSZlY2lyYztuY2lhIGUgdmlzdWFsaXphJmNjZWRpbDsmYXRpbGRlO28gZGVzdGUgc2l0ZS4gXCIsXHJcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG5cdFx0fSxcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxyXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJBdHVhbGl6ZSBvIHNldSBicm93c2VyIGFnb3JhXCIsXHJcblx0XHRcImNsb3NlXCI6IFwiRmVjaGFyXCJcclxuXHR9LFxyXG5cdFwicm9cIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCJCcm93c2VydWwgZXN0ZSDDrm52ZWNoaXQhXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwiQWN0dWFsaXphyJtpIGJyb3dzZXJ1bCBwZW50cnUgYSB2aXp1YWxpemEgY29yZWN0IGFjZXN0IHNpdGUuIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiQWN0dWFsaXphyJtpIGJyb3dzZXJ1bCBhY3VtIVwiLFxyXG5cdFx0XCJjbG9zZVwiOiBcIkNsb3NlXCJcclxuXHR9LFxyXG5cdFwicnVcIjoge1xyXG5cdFx0XCJvdXRPZkRhdGVcIjogXCLQktCw0Ygg0LHRgNCw0YPQt9C10YAg0YPRgdGC0LDRgNC10LshXCIsXHJcblx0XHRcInVwZGF0ZVwiOiB7XHJcblx0XHRcdFwid2ViXCI6IFwi0J7QsdC90L7QstC40YLQtSDQstCw0Ygg0LHRgNCw0YPQt9C10YAg0LTQu9GPINC/0YDQsNCy0LjQu9GM0L3QvtCz0L4g0L7RgtC+0LHRgNCw0LbQtdC90LjRjyDRjdGC0L7Qs9C+INGB0LDQudGC0LAuIFwiLFxyXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuXHRcdH0sXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcclxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwi0J7QsdC90L7QstC40YLRjCDQvNC+0Lkg0LHRgNCw0YPQt9C10YAgXCIsXHJcblx0XHRcImNsb3NlXCI6IFwi0JfQsNC60YDRi9GC0YxcIlxyXG5cdH0sXHJcblx0XCJzaVwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcIlZhxaEgYnJza2FsbmlrIGplIHphc3RhcmVsIVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcIlphIHByYXZpbGVuIHByaWtheiBzcGxldG5lIHN0cmFuaSBwb3NvZG9iaXRlIHZhxaEgYnJza2FsbmlrLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIlBvc29kb2JpIGJyc2thbG5payBcIixcclxuXHRcdFwiY2xvc2VcIjogXCJaYXByaVwiXHJcblx0fSxcclxuXHRcInN2XCI6IHtcclxuXHRcdFwib3V0T2ZEYXRlXCI6IFwiRGluIHdlYmJsw6RzYXJlIHN0w7ZkanMgZWogbMOkbmdyZSFcIixcclxuXHRcdFwidXBkYXRlXCI6IHtcclxuXHRcdFx0XCJ3ZWJcIjogXCJVcHBkYXRlcmEgZGluIHdlYmJsw6RzYXJlIGbDtnIgYXR0IHdlYmJwbGF0c2VuIHNrYSB2aXNhcyBrb3JyZWt0LiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIlVwcGRhdGVyYSBtaW4gd2ViYmzDpHNhcmUgbnVcIixcclxuXHRcdFwiY2xvc2VcIjogXCJTdMOkbmdcIlxyXG5cdH0sXHJcblx0XCJ1YVwiOiB7XHJcblx0XHRcIm91dE9mRGF0ZVwiOiBcItCS0LDRiCDQsdGA0LDRg9C30LXRgCDQt9Cw0YHRgtCw0YDRltCyIVwiLFxyXG5cdFx0XCJ1cGRhdGVcIjoge1xyXG5cdFx0XHRcIndlYlwiOiBcItCe0L3QvtCy0ZbRgtGMINCy0LDRiCDQsdGA0LDRg9C30LXRgCDQtNC70Y8g0L/RgNCw0LLQuNC70YzQvdC+0LPQviDQstGW0LTQvtCx0YDQsNC20LXQvdC90Y8g0YbRjNC+0LPQviDRgdCw0LnRgtCwLiBcIixcclxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcblx0XHR9LFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXHJcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcItCe0L3QvtCy0LjRgtC4INC80ZbQuSDQsdGA0LDRg9C30LXRgCBcIixcclxuXHRcdFwiY2xvc2VcIjogXCLQl9Cw0LrRgNC40YLQuFwiXHJcblx0fVxyXG59XHJcbiIsIi8qIVxuICogVUFQYXJzZXIuanMgdjAuNy4yMVxuICogTGlnaHR3ZWlnaHQgSmF2YVNjcmlwdC1iYXNlZCBVc2VyLUFnZW50IHN0cmluZyBwYXJzZXJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWlzYWxtYW4vdWEtcGFyc2VyLWpzXG4gKlxuICogQ29weXJpZ2h0IMKpIDIwMTItMjAxOSBGYWlzYWwgU2FsbWFuIDxmQGZhaXNhbG1hbi5jb20+XG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgTGljZW5zZVxuICovXG5cbihmdW5jdGlvbiAod2luZG93LCB1bmRlZmluZWQpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vLy8vLy8vLy8vLy8vXG4gICAgLy8gQ29uc3RhbnRzXG4gICAgLy8vLy8vLy8vLy8vL1xuXG5cbiAgICB2YXIgTElCVkVSU0lPTiAgPSAnMC43LjIxJyxcbiAgICAgICAgRU1QVFkgICAgICAgPSAnJyxcbiAgICAgICAgVU5LTk9XTiAgICAgPSAnPycsXG4gICAgICAgIEZVTkNfVFlQRSAgID0gJ2Z1bmN0aW9uJyxcbiAgICAgICAgVU5ERUZfVFlQRSAgPSAndW5kZWZpbmVkJyxcbiAgICAgICAgT0JKX1RZUEUgICAgPSAnb2JqZWN0JyxcbiAgICAgICAgU1RSX1RZUEUgICAgPSAnc3RyaW5nJyxcbiAgICAgICAgTUFKT1IgICAgICAgPSAnbWFqb3InLCAvLyBkZXByZWNhdGVkXG4gICAgICAgIE1PREVMICAgICAgID0gJ21vZGVsJyxcbiAgICAgICAgTkFNRSAgICAgICAgPSAnbmFtZScsXG4gICAgICAgIFRZUEUgICAgICAgID0gJ3R5cGUnLFxuICAgICAgICBWRU5ET1IgICAgICA9ICd2ZW5kb3InLFxuICAgICAgICBWRVJTSU9OICAgICA9ICd2ZXJzaW9uJyxcbiAgICAgICAgQVJDSElURUNUVVJFPSAnYXJjaGl0ZWN0dXJlJyxcbiAgICAgICAgQ09OU09MRSAgICAgPSAnY29uc29sZScsXG4gICAgICAgIE1PQklMRSAgICAgID0gJ21vYmlsZScsXG4gICAgICAgIFRBQkxFVCAgICAgID0gJ3RhYmxldCcsXG4gICAgICAgIFNNQVJUVFYgICAgID0gJ3NtYXJ0dHYnLFxuICAgICAgICBXRUFSQUJMRSAgICA9ICd3ZWFyYWJsZScsXG4gICAgICAgIEVNQkVEREVEICAgID0gJ2VtYmVkZGVkJztcblxuXG4gICAgLy8vLy8vLy8vLy9cbiAgICAvLyBIZWxwZXJcbiAgICAvLy8vLy8vLy8vXG5cblxuICAgIHZhciB1dGlsID0ge1xuICAgICAgICBleHRlbmQgOiBmdW5jdGlvbiAocmVnZXhlcywgZXh0ZW5zaW9ucykge1xuICAgICAgICAgICAgdmFyIG1lcmdlZFJlZ2V4ZXMgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcmVnZXhlcykge1xuICAgICAgICAgICAgICAgIGlmIChleHRlbnNpb25zW2ldICYmIGV4dGVuc2lvbnNbaV0ubGVuZ3RoICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZWRSZWdleGVzW2ldID0gZXh0ZW5zaW9uc1tpXS5jb25jYXQocmVnZXhlc1tpXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbWVyZ2VkUmVnZXhlc1tpXSA9IHJlZ2V4ZXNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1lcmdlZFJlZ2V4ZXM7XG4gICAgICAgIH0sXG4gICAgICAgIGhhcyA6IGZ1bmN0aW9uIChzdHIxLCBzdHIyKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBzdHIxID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyMi50b0xvd2VyQ2FzZSgpLmluZGV4T2Yoc3RyMS50b0xvd2VyQ2FzZSgpKSAhPT0gLTE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGxvd2VyaXplIDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9LFxuICAgICAgICBtYWpvciA6IGZ1bmN0aW9uICh2ZXJzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mKHZlcnNpb24pID09PSBTVFJfVFlQRSA/IHZlcnNpb24ucmVwbGFjZSgvW15cXGRcXC5dL2csJycpLnNwbGl0KFwiLlwiKVswXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgfSxcbiAgICAgICAgdHJpbSA6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoL15bXFxzXFx1RkVGRlxceEEwXSt8W1xcc1xcdUZFRkZcXHhBMF0rJC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBNYXAgaGVscGVyXG4gICAgLy8vLy8vLy8vLy8vLy9cblxuXG4gICAgdmFyIG1hcHBlciA9IHtcblxuICAgICAgICByZ3ggOiBmdW5jdGlvbiAodWEsIGFycmF5cykge1xuXG4gICAgICAgICAgICB2YXIgaSA9IDAsIGosIGssIHAsIHEsIG1hdGNoZXMsIG1hdGNoO1xuXG4gICAgICAgICAgICAvLyBsb29wIHRocm91Z2ggYWxsIHJlZ2V4ZXMgbWFwc1xuICAgICAgICAgICAgd2hpbGUgKGkgPCBhcnJheXMubGVuZ3RoICYmICFtYXRjaGVzKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgcmVnZXggPSBhcnJheXNbaV0sICAgICAgIC8vIGV2ZW4gc2VxdWVuY2UgKDAsMiw0LC4uKVxuICAgICAgICAgICAgICAgICAgICBwcm9wcyA9IGFycmF5c1tpICsgMV07ICAgLy8gb2RkIHNlcXVlbmNlICgxLDMsNSwuLilcbiAgICAgICAgICAgICAgICBqID0gayA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLyB0cnkgbWF0Y2hpbmcgdWFzdHJpbmcgd2l0aCByZWdleGVzXG4gICAgICAgICAgICAgICAgd2hpbGUgKGogPCByZWdleC5sZW5ndGggJiYgIW1hdGNoZXMpIHtcblxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzID0gcmVnZXhbaisrXS5leGVjKHVhKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoISFtYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHAgPSAwOyBwIDwgcHJvcHMubGVuZ3RoOyBwKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IG1hdGNoZXNbKytrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxID0gcHJvcHNbcF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgZ2l2ZW4gcHJvcGVydHkgaXMgYWN0dWFsbHkgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHEgPT09IE9CSl9UWVBFICYmIHEubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocS5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBxWzFdID09IEZVTkNfVFlQRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzc2lnbiBtb2RpZmllZCBtYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcVswXV0gPSBxWzFdLmNhbGwodGhpcywgbWF0Y2gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhc3NpZ24gZ2l2ZW4gdmFsdWUsIGlnbm9yZSByZWdleCBtYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcVswXV0gPSBxWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHEubGVuZ3RoID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHdoZXRoZXIgZnVuY3Rpb24gb3IgcmVnZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcVsxXSA9PT0gRlVOQ19UWVBFICYmICEocVsxXS5leGVjICYmIHFbMV0udGVzdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWxsIGZ1bmN0aW9uICh1c3VhbGx5IHN0cmluZyBtYXBwZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1txWzBdXSA9IG1hdGNoID8gcVsxXS5jYWxsKHRoaXMsIG1hdGNoLCBxWzJdKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2FuaXRpemUgbWF0Y2ggdXNpbmcgZ2l2ZW4gcmVnZXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3FbMF1dID0gbWF0Y2ggPyBtYXRjaC5yZXBsYWNlKHFbMV0sIHFbMl0pIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHEubGVuZ3RoID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3FbMF1dID0gbWF0Y2ggPyBxWzNdLmNhbGwodGhpcywgbWF0Y2gucmVwbGFjZShxWzFdLCBxWzJdKSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3FdID0gbWF0Y2ggPyBtYXRjaCA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaSArPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHN0ciA6IGZ1bmN0aW9uIChzdHIsIG1hcCkge1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpIGluIG1hcCkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFycmF5XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXBbaV0gPT09IE9CSl9UWVBFICYmIG1hcFtpXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbWFwW2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXRpbC5oYXMobWFwW2ldW2pdLCBzdHIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChpID09PSBVTktOT1dOKSA/IHVuZGVmaW5lZCA6IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHV0aWwuaGFzKG1hcFtpXSwgc3RyKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGkgPT09IFVOS05PV04pID8gdW5kZWZpbmVkIDogaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gU3RyaW5nIG1hcFxuICAgIC8vLy8vLy8vLy8vLy8vXG5cblxuICAgIHZhciBtYXBzID0ge1xuXG4gICAgICAgIGJyb3dzZXIgOiB7XG4gICAgICAgICAgICBvbGRzYWZhcmkgOiB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbiA6IHtcbiAgICAgICAgICAgICAgICAgICAgJzEuMCcgICA6ICcvOCcsXG4gICAgICAgICAgICAgICAgICAgICcxLjInICAgOiAnLzEnLFxuICAgICAgICAgICAgICAgICAgICAnMS4zJyAgIDogJy8zJyxcbiAgICAgICAgICAgICAgICAgICAgJzIuMCcgICA6ICcvNDEyJyxcbiAgICAgICAgICAgICAgICAgICAgJzIuMC4yJyA6ICcvNDE2JyxcbiAgICAgICAgICAgICAgICAgICAgJzIuMC4zJyA6ICcvNDE3JyxcbiAgICAgICAgICAgICAgICAgICAgJzIuMC40JyA6ICcvNDE5JyxcbiAgICAgICAgICAgICAgICAgICAgJz8nICAgICA6ICcvJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBkZXZpY2UgOiB7XG4gICAgICAgICAgICBhbWF6b24gOiB7XG4gICAgICAgICAgICAgICAgbW9kZWwgOiB7XG4gICAgICAgICAgICAgICAgICAgICdGaXJlIFBob25lJyA6IFsnU0QnLCAnS0YnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcHJpbnQgOiB7XG4gICAgICAgICAgICAgICAgbW9kZWwgOiB7XG4gICAgICAgICAgICAgICAgICAgICdFdm8gU2hpZnQgNEcnIDogJzczNzNLVCdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHZlbmRvciA6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0hUQycgICAgICAgOiAnQVBBJyxcbiAgICAgICAgICAgICAgICAgICAgJ1NwcmludCcgICAgOiAnU3ByaW50J1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvcyA6IHtcbiAgICAgICAgICAgIHdpbmRvd3MgOiB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbiA6IHtcbiAgICAgICAgICAgICAgICAgICAgJ01FJyAgICAgICAgOiAnNC45MCcsXG4gICAgICAgICAgICAgICAgICAgICdOVCAzLjExJyAgIDogJ05UMy41MScsXG4gICAgICAgICAgICAgICAgICAgICdOVCA0LjAnICAgIDogJ05UNC4wJyxcbiAgICAgICAgICAgICAgICAgICAgJzIwMDAnICAgICAgOiAnTlQgNS4wJyxcbiAgICAgICAgICAgICAgICAgICAgJ1hQJyAgICAgICAgOiBbJ05UIDUuMScsICdOVCA1LjInXSxcbiAgICAgICAgICAgICAgICAgICAgJ1Zpc3RhJyAgICAgOiAnTlQgNi4wJyxcbiAgICAgICAgICAgICAgICAgICAgJzcnICAgICAgICAgOiAnTlQgNi4xJyxcbiAgICAgICAgICAgICAgICAgICAgJzgnICAgICAgICAgOiAnTlQgNi4yJyxcbiAgICAgICAgICAgICAgICAgICAgJzguMScgICAgICAgOiAnTlQgNi4zJyxcbiAgICAgICAgICAgICAgICAgICAgJzEwJyAgICAgICAgOiBbJ05UIDYuNCcsICdOVCAxMC4wJ10sXG4gICAgICAgICAgICAgICAgICAgICdSVCcgICAgICAgIDogJ0FSTSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLy8vLy8vLy8vLy8vL1xuICAgIC8vIFJlZ2V4IG1hcFxuICAgIC8vLy8vLy8vLy8vLy9cblxuXG4gICAgdmFyIHJlZ2V4ZXMgPSB7XG5cbiAgICAgICAgYnJvd3NlciA6IFtbXG5cbiAgICAgICAgICAgIC8vIFByZXN0byBiYXNlZFxuICAgICAgICAgICAgLyhvcGVyYVxcc21pbmkpXFwvKFtcXHdcXC4tXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgTWluaVxuICAgICAgICAgICAgLyhvcGVyYVxcc1ttb2JpbGV0YWJdKykuK3ZlcnNpb25cXC8oW1xcd1xcLi1dKykvaSwgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgTW9iaS9UYWJsZXRcbiAgICAgICAgICAgIC8ob3BlcmEpLit2ZXJzaW9uXFwvKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgPiA5LjgwXG4gICAgICAgICAgICAvKG9wZXJhKVtcXC9cXHNdKyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSA8IDkuODBcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKG9waW9zKVtcXC9cXHNdKyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSBtaW5pIG9uIGlwaG9uZSA+PSA4LjBcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ09wZXJhIE1pbmknXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgL1xccyhvcHIpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgV2Via2l0XG4gICAgICAgICAgICBdLCBbW05BTUUsICdPcGVyYSddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvLyBNaXhlZFxuICAgICAgICAgICAgLyhraW5kbGUpXFwvKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBLaW5kbGVcbiAgICAgICAgICAgIC8obHVuYXNjYXBlfG1heHRob258bmV0ZnJvbnR8amFzbWluZXxibGF6ZXIpW1xcL1xcc10/KFtcXHdcXC5dKikvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTHVuYXNjYXBlL01heHRob24vTmV0ZnJvbnQvSmFzbWluZS9CbGF6ZXJcbiAgICAgICAgICAgIC8vIFRyaWRlbnQgYmFzZWRcbiAgICAgICAgICAgIC8oYXZhbnRcXHN8aWVtb2JpbGV8c2xpbSkoPzpicm93c2VyKT9bXFwvXFxzXT8oW1xcd1xcLl0qKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBdmFudC9JRU1vYmlsZS9TbGltQnJvd3NlclxuICAgICAgICAgICAgLyhiaWR1YnJvd3NlcnxiYWlkdWJyb3dzZXIpW1xcL1xcc10/KFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgLy8gQmFpZHUgQnJvd3NlclxuICAgICAgICAgICAgLyg/Om1zfFxcKCkoaWUpXFxzKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW50ZXJuZXQgRXhwbG9yZXJcblxuICAgICAgICAgICAgLy8gV2Via2l0L0tIVE1MIGJhc2VkXG4gICAgICAgICAgICAvKHJla29ucSlcXC8oW1xcd1xcLl0qKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJla29ucVxuICAgICAgICAgICAgLyhjaHJvbWl1bXxmbG9ja3xyb2NrbWVsdHxtaWRvcml8ZXBpcGhhbnl8c2lsa3xza3lmaXJlfG92aWJyb3dzZXJ8Ym9sdHxpcm9ufHZpdmFsZGl8aXJpZGl1bXxwaGFudG9tanN8Ym93c2VyfHF1YXJrfHF1cHppbGxhfGZhbGtvbilcXC8oW1xcd1xcLi1dKykvaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaHJvbWl1bS9GbG9jay9Sb2NrTWVsdC9NaWRvcmkvRXBpcGhhbnkvU2lsay9Ta3lmaXJlL0JvbHQvSXJvbi9JcmlkaXVtL1BoYW50b21KUy9Cb3dzZXIvUXVwWmlsbGEvRmFsa29uXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhrb25xdWVyb3IpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBLb25xdWVyb3JcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0tvbnF1ZXJvciddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKHRyaWRlbnQpLitydls6XFxzXShbXFx3XFwuXSspLitsaWtlXFxzZ2Vja28vaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJRTExXG4gICAgICAgICAgICBdLCBbW05BTUUsICdJRSddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGVkZ2V8ZWRnaW9zfGVkZ2F8ZWRnKVxcLygoXFxkKyk/W1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNaWNyb3NvZnQgRWRnZVxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnRWRnZSddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKHlhYnJvd3NlcilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFlhbmRleFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnWWFuZGV4J10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oQXZhc3QpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXZhc3QgU2VjdXJlIEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0F2YXN0IFNlY3VyZSBCcm93c2VyJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oQVZHKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQVZHIFNlY3VyZSBCcm93c2VyXG4gICAgICAgICAgICBdLCBbW05BTUUsICdBVkcgU2VjdXJlIEJyb3dzZXInXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhwdWZmaW4pXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQdWZmaW5cbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1B1ZmZpbiddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGZvY3VzKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggRm9jdXNcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0ZpcmVmb3ggRm9jdXMnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhvcHQpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSBUb3VjaFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnT3BlcmEgVG91Y2gnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLygoPzpbXFxzXFwvXSl1Yz9cXHM/YnJvd3NlcnwoPzpqdWMuKyl1Y3dlYilbXFwvXFxzXT8oW1xcd1xcLl0rKS9pICAgICAgICAgLy8gVUNCcm93c2VyXG4gICAgICAgICAgICBdLCBbW05BTUUsICdVQ0Jyb3dzZXInXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhjb21vZG9fZHJhZ29uKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDb21vZG8gRHJhZ29uXG4gICAgICAgICAgICBdLCBbW05BTUUsIC9fL2csICcgJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8od2luZG93c3dlY2hhdCBxYmNvcmUpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2VDaGF0IERlc2t0b3AgZm9yIFdpbmRvd3MgQnVpbHQtaW4gQnJvd3NlclxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnV2VDaGF0KFdpbikgRGVza3RvcCddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKG1pY3JvbWVzc2VuZ2VyKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlQ2hhdFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnV2VDaGF0J10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oYnJhdmUpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJhdmUgYnJvd3NlclxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnQnJhdmUnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhxcWJyb3dzZXJsaXRlKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBRUUJyb3dzZXJMaXRlXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhRUSlcXC8oW1xcZFxcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBRUSwgYWthIFNob3VRXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgL20/KHFxYnJvd3NlcilbXFwvXFxzXT8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUVFCcm93c2VyXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhiYWlkdWJveGFwcClbXFwvXFxzXT8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmFpZHUgQXBwXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLygyMzQ1RXhwbG9yZXIpW1xcL1xcc10/KFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMjM0NSBCcm93c2VyXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhNZXRhU3IpW1xcL1xcc10/KFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU291R291QnJvd3NlclxuICAgICAgICAgICAgXSwgW05BTUVdLCBbXG5cbiAgICAgICAgICAgIC8oTEJCUk9XU0VSKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGllQmFvIEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtOQU1FXSwgW1xuXG4gICAgICAgICAgICAveGlhb21pXFwvbWl1aWJyb3dzZXJcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNSVVJIEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBbTkFNRSwgJ01JVUkgQnJvd3NlciddXSwgW1xuXG4gICAgICAgICAgICAvO2ZiYXZcXC8oW1xcd1xcLl0rKTsvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhY2Vib29rIEFwcCBmb3IgaU9TICYgQW5kcm9pZFxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnRmFjZWJvb2snXV0sIFtcblxuICAgICAgICAgICAgL3NhZmFyaVxccyhsaW5lKVxcLyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGluZSBBcHAgZm9yIGlPU1xuICAgICAgICAgICAgL2FuZHJvaWQuKyhsaW5lKVxcLyhbXFx3XFwuXSspXFwvaWFiL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGluZSBBcHAgZm9yIEFuZHJvaWRcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvaGVhZGxlc3NjaHJvbWUoPzpcXC8oW1xcd1xcLl0rKXxcXHMpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaHJvbWUgSGVhZGxlc3NcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBbTkFNRSwgJ0Nocm9tZSBIZWFkbGVzcyddXSwgW1xuXG4gICAgICAgICAgICAvXFxzd3ZcXCkuKyhjaHJvbWUpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hyb21lIFdlYlZpZXdcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgLyguKykvLCAnJDEgV2ViVmlldyddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKCg/Om9jdWx1c3xzYW1zdW5nKWJyb3dzZXIpXFwvKFtcXHdcXC5dKykvaVxuICAgICAgICAgICAgXSwgW1tOQU1FLCAvKC4rKD86Z3x1cykpKC4rKS8sICckMSAkMiddLCBWRVJTSU9OXSwgWyAgICAgICAgICAgICAgICAvLyBPY3VsdXMgLyBTYW1zdW5nIEJyb3dzZXJcblxuICAgICAgICAgICAgL2FuZHJvaWQuK3ZlcnNpb25cXC8oW1xcd1xcLl0rKVxccysoPzptb2JpbGVcXHM/c2FmYXJpfHNhZmFyaSkqL2kgICAgICAgIC8vIEFuZHJvaWQgQnJvd3NlclxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnQW5kcm9pZCBCcm93c2VyJ11dLCBbXG5cbiAgICAgICAgICAgIC8oc2FpbGZpc2hicm93c2VyKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2FpbGZpc2ggQnJvd3NlclxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnU2FpbGZpc2ggQnJvd3NlciddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGNocm9tZXxvbW5pd2VifGFyb3JhfFt0aXplbm9rYV17NX1cXHM/YnJvd3NlcilcXC92PyhbXFx3XFwuXSspL2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hyb21lL09tbmlXZWIvQXJvcmEvVGl6ZW4vTm9raWFcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGRvbGZpbilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbHBoaW5cbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0RvbHBoaW4nXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhxaWh1fHFoYnJvd3NlcnxxaWhvb2Jyb3dzZXJ8MzYwYnJvd3NlcikvaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyAzNjBcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJzM2MCBCcm93c2VyJ11dLCBbXG5cbiAgICAgICAgICAgIC8oKD86YW5kcm9pZC4rKWNybW98Y3Jpb3MpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hyb21lIGZvciBBbmRyb2lkL2lPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnQ2hyb21lJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oY29hc3QpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgQ29hc3RcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ09wZXJhIENvYXN0J10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC9meGlvc1xcLyhbXFx3XFwuLV0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZWZveCBmb3IgaU9TXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdGaXJlZm94J11dLCBbXG5cbiAgICAgICAgICAgIC92ZXJzaW9uXFwvKFtcXHdcXC5dKykuKz9tb2JpbGVcXC9cXHcrXFxzKHNhZmFyaSkvaSAgICAgICAgICAgICAgICAgICAgICAgLy8gTW9iaWxlIFNhZmFyaVxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnTW9iaWxlIFNhZmFyaSddXSwgW1xuXG4gICAgICAgICAgICAvdmVyc2lvblxcLyhbXFx3XFwuXSspLis/KG1vYmlsZVxccz9zYWZhcml8c2FmYXJpKS9pICAgICAgICAgICAgICAgICAgICAvLyBTYWZhcmkgJiBTYWZhcmkgTW9iaWxlXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgTkFNRV0sIFtcblxuICAgICAgICAgICAgL3dlYmtpdC4rPyhnc2EpXFwvKFtcXHdcXC5dKykuKz8obW9iaWxlXFxzP3NhZmFyaXxzYWZhcmkpKFxcL1tcXHdcXC5dKykvaSAgLy8gR29vZ2xlIFNlYXJjaCBBcHBsaWFuY2Ugb24gaU9TXG4gICAgICAgICAgICBdLCBbW05BTUUsICdHU0EnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgL3dlYmtpdC4rPyhtb2JpbGVcXHM/c2FmYXJpfHNhZmFyaSkoXFwvW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpIDwgMy4wXG4gICAgICAgICAgICBdLCBbTkFNRSwgW1ZFUlNJT04sIG1hcHBlci5zdHIsIG1hcHMuYnJvd3Nlci5vbGRzYWZhcmkudmVyc2lvbl1dLCBbXG5cbiAgICAgICAgICAgIC8od2Via2l0fGtodG1sKVxcLyhbXFx3XFwuXSspL2lcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvLyBHZWNrbyBiYXNlZFxuICAgICAgICAgICAgLyhuYXZpZ2F0b3J8bmV0c2NhcGUpXFwvKFtcXHdcXC4tXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOZXRzY2FwZVxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnTmV0c2NhcGUnXSwgVkVSU0lPTl0sIFtcbiAgICAgICAgICAgIC8oc3dpZnRmb3gpL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3dpZnRmb3hcbiAgICAgICAgICAgIC8oaWNlZHJhZ29ufGljZXdlYXNlbHxjYW1pbm98Y2hpbWVyYXxmZW5uZWN8bWFlbW9cXHNicm93c2VyfG1pbmltb3xjb25rZXJvcilbXFwvXFxzXT8oW1xcd1xcLlxcK10rKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJY2VEcmFnb24vSWNld2Vhc2VsL0NhbWluby9DaGltZXJhL0Zlbm5lYy9NYWVtby9NaW5pbW8vQ29ua2Vyb3JcbiAgICAgICAgICAgIC8oZmlyZWZveHxzZWFtb25rZXl8ay1tZWxlb258aWNlY2F0fGljZWFwZXxmaXJlYmlyZHxwaG9lbml4fHBhbGVtb29ufGJhc2lsaXNrfHdhdGVyZm94KVxcLyhbXFx3XFwuLV0rKSQvaSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJlZm94L1NlYU1vbmtleS9LLU1lbGVvbi9JY2VDYXQvSWNlQXBlL0ZpcmViaXJkL1Bob2VuaXhcbiAgICAgICAgICAgIC8obW96aWxsYSlcXC8oW1xcd1xcLl0rKS4rcnZcXDouK2dlY2tvXFwvXFxkKy9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTW96aWxsYVxuXG4gICAgICAgICAgICAvLyBPdGhlclxuICAgICAgICAgICAgLyhwb2xhcmlzfGx5bnh8ZGlsbG98aWNhYnxkb3Jpc3xhbWF5YXx3M218bmV0c3VyZnxzbGVpcG5pcilbXFwvXFxzXT8oW1xcd1xcLl0rKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb2xhcmlzL0x5bngvRGlsbG8vaUNhYi9Eb3Jpcy9BbWF5YS93M20vTmV0U3VyZi9TbGVpcG5pclxuICAgICAgICAgICAgLyhsaW5rcylcXHNcXCgoW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGlua3NcbiAgICAgICAgICAgIC8oZ29icm93c2VyKVxcLz8oW1xcd1xcLl0qKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR29Ccm93c2VyXG4gICAgICAgICAgICAvKGljZVxccz9icm93c2VyKVxcL3Y/KFtcXHdcXC5fXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJQ0UgQnJvd3NlclxuICAgICAgICAgICAgLyhtb3NhaWMpW1xcL1xcc10oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTW9zYWljXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl1cbiAgICAgICAgXSxcblxuICAgICAgICBjcHUgOiBbW1xuXG4gICAgICAgICAgICAvKD86KGFtZHx4KD86KD86ODZ8NjQpW18tXSk/fHdvd3x3aW4pNjQpWztcXCldL2kgICAgICAgICAgICAgICAgICAgICAvLyBBTUQ2NFxuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsICdhbWQ2NCddXSwgW1xuXG4gICAgICAgICAgICAvKGlhMzIoPz07KSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElBMzIgKHF1aWNrdGltZSlcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCB1dGlsLmxvd2VyaXplXV0sIFtcblxuICAgICAgICAgICAgLygoPzppWzM0Nl18eCk4NilbO1xcKV0vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUEzMlxuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsICdpYTMyJ11dLCBbXG5cbiAgICAgICAgICAgIC8vIFBvY2tldFBDIG1pc3Rha2VubHkgaWRlbnRpZmllZCBhcyBQb3dlclBDXG4gICAgICAgICAgICAvd2luZG93c1xccyhjZXxtb2JpbGUpO1xcc3BwYzsvaVxuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsICdhcm0nXV0sIFtcblxuICAgICAgICAgICAgLygoPzpwcGN8cG93ZXJwYykoPzo2NCk/KSg/Olxcc21hY3w7fFxcKSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvd2VyUENcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCAvb3dlci8sICcnLCB1dGlsLmxvd2VyaXplXV0sIFtcblxuICAgICAgICAgICAgLyhzdW40XFx3KVs7XFwpXS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNQQVJDXG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgJ3NwYXJjJ11dLCBbXG5cbiAgICAgICAgICAgIC8oKD86YXZyMzJ8aWE2NCg/PTspKXw2OGsoPz1cXCkpfGFybSg/OjY0fCg/PXZcXGQrWztsXSkpfCg/PWF0bWVsXFxzKWF2cnwoPzppcml4fG1pcHN8c3BhcmMpKD86NjQpPyg/PTspfHBhLXJpc2MpL2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUE2NCwgNjhLLCBBUk0vNjQsIEFWUi8zMiwgSVJJWC82NCwgTUlQUy82NCwgU1BBUkMvNjQsIFBBLVJJU0NcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCB1dGlsLmxvd2VyaXplXV1cbiAgICAgICAgXSxcblxuICAgICAgICBkZXZpY2UgOiBbW1xuXG4gICAgICAgICAgICAvXFwoKGlwYWR8cGxheWJvb2spO1tcXHdcXHNcXCksOy1dKyhyaW18YXBwbGUpL2kgICAgICAgICAgICAgICAgICAgICAgICAvLyBpUGFkL1BsYXlCb29rXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFZFTkRPUiwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hcHBsZWNvcmVtZWRpYVxcL1tcXHdcXC5dKyBcXCgoaXBhZCkvICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlQYWRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FwcGxlJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvKGFwcGxlXFxzezAsMX10dikvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBcHBsZSBUVlxuICAgICAgICAgICAgXSwgW1tNT0RFTCwgJ0FwcGxlIFRWJ10sIFtWRU5ET1IsICdBcHBsZSddLCBbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC8oYXJjaG9zKVxccyhnYW1lcGFkMj8pL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFyY2hvc1xuICAgICAgICAgICAgLyhocCkuKyh0b3VjaHBhZCkvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIUCBUb3VjaFBhZFxuICAgICAgICAgICAgLyhocCkuKyh0YWJsZXQpL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIUCBUYWJsZXRcbiAgICAgICAgICAgIC8oa2luZGxlKVxcLyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gS2luZGxlXG4gICAgICAgICAgICAvXFxzKG5vb2spW1xcd1xcc10rYnVpbGRcXC8oXFx3KykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm9va1xuICAgICAgICAgICAgLyhkZWxsKVxccyhzdHJlYVtrcHJcXHNcXGRdKltcXGRrb10pL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGVsbCBTdHJlYWtcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgLyhrZltBLXpdKylcXHNidWlsZFxcLy4rc2lsa1xcLy9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBLaW5kbGUgRmlyZSBIRFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQW1hem9uJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgLyhzZHxrZilbMDM0OWhpam9yc3R1d10rXFxzYnVpbGRcXC8uK3NpbGtcXC8vaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJlIFBob25lXG4gICAgICAgICAgICBdLCBbW01PREVMLCBtYXBwZXIuc3RyLCBtYXBzLmRldmljZS5hbWF6b24ubW9kZWxdLCBbVkVORE9SLCAnQW1hem9uJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWQuK2FmdChbYm1zXSlcXHNidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZSBUVlxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQW1hem9uJ10sIFtUWVBFLCBTTUFSVFRWXV0sIFtcblxuICAgICAgICAgICAgL1xcKChpcFtob25lZHxcXHNcXHcqXSspOy4rKGFwcGxlKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpUG9kL2lQaG9uZVxuICAgICAgICAgICAgXSwgW01PREVMLCBWRU5ET1IsIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgL1xcKChpcFtob25lZHxcXHNcXHcqXSspOy9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpUG9kL2lQaG9uZVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQXBwbGUnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8oYmxhY2tiZXJyeSlbXFxzLV0/KFxcdyspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCbGFja0JlcnJ5XG4gICAgICAgICAgICAvKGJsYWNrYmVycnl8YmVucXxwYWxtKD89XFwtKXxzb255ZXJpY3Nzb258YWNlcnxhc3VzfGRlbGx8bWVpenV8bW90b3JvbGF8cG9seXRyb24pW1xcc18tXT8oW1xcdy1dKikvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmVuUS9QYWxtL1NvbnktRXJpY3Nzb24vQWNlci9Bc3VzL0RlbGwvTWVpenUvTW90b3JvbGEvUG9seXRyb25cbiAgICAgICAgICAgIC8oaHApXFxzKFtcXHdcXHNdK1xcdykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhQIGlQQVFcbiAgICAgICAgICAgIC8oYXN1cyktPyhcXHcrKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFzdXNcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcbiAgICAgICAgICAgIC9cXChiYjEwO1xccyhcXHcrKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmxhY2tCZXJyeSAxMFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQmxhY2tCZXJyeSddLCBbVFlQRSwgTU9CSUxFXV0sIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXN1cyBUYWJsZXRzXG4gICAgICAgICAgICAvYW5kcm9pZC4rKHRyYW5zZm9bcHJpbWVcXHNdezQsMTB9XFxzXFx3K3xlZWVwY3xzbGlkZXJcXHNcXHcrfG5leHVzIDd8cGFkZm9uZXxwMDBjKS9pXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdBc3VzJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvKHNvbnkpXFxzKHRhYmxldFxcc1twc10pXFxzYnVpbGRcXC8vaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU29ueVxuICAgICAgICAgICAgLyhzb255KT8oPzpzZ3AuKylcXHNidWlsZFxcLy9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ1NvbnknXSwgW01PREVMLCAnWHBlcmlhIFRhYmxldCddLCBbVFlQRSwgVEFCTEVUXV0sIFtcbiAgICAgICAgICAgIC9hbmRyb2lkLitcXHMoW2MtZ11cXGR7NH18c29bLWxdXFx3KykoPz1cXHNidWlsZFxcL3xcXCkuK2Nocm9tZVxcLyg/IVsxLTZdezAsMX1cXGRcXC4pKS9pXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdTb255J10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvXFxzKG91eWEpXFxzL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3V5YVxuICAgICAgICAgICAgLyhuaW50ZW5kbylcXHMoW3dpZHMzdV0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTmludGVuZG9cbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgQ09OU09MRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKHNoaWVsZClcXHNidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOdmlkaWFcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ052aWRpYSddLCBbVFlQRSwgQ09OU09MRV1dLCBbXG5cbiAgICAgICAgICAgIC8ocGxheXN0YXRpb25cXHNbMzRwb3J0YWJsZXZpXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBsYXlzdGF0aW9uXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdTb255J10sIFtUWVBFLCBDT05TT0xFXV0sIFtcblxuICAgICAgICAgICAgLyhzcHJpbnRcXHMoXFx3KykpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNwcmludCBQaG9uZXNcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCBtYXBwZXIuc3RyLCBtYXBzLmRldmljZS5zcHJpbnQudmVuZG9yXSwgW01PREVMLCBtYXBwZXIuc3RyLCBtYXBzLmRldmljZS5zcHJpbnQubW9kZWxdLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgLyhodGMpWztfXFxzLV0rKFtcXHdcXHNdKyg/PVxcKXxcXHNidWlsZCl8XFx3KykvaSwgICAgICAgICAgICAgICAgICAgICAgICAvLyBIVENcbiAgICAgICAgICAgIC8oenRlKS0oXFx3KikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFpURVxuICAgICAgICAgICAgLyhhbGNhdGVsfGdlZWtzcGhvbmV8bmV4aWFufHBhbmFzb25pY3woPz07XFxzKXNvbnkpW19cXHMtXT8oW1xcdy1dKikvaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGNhdGVsL0dlZWtzUGhvbmUvTmV4aWFuL1BhbmFzb25pYy9Tb255XG4gICAgICAgICAgICBdLCBbVkVORE9SLCBbTU9ERUwsIC9fL2csICcgJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKG5leHVzXFxzOSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIVEMgTmV4dXMgOVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnSFRDJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvZFxcL2h1YXdlaShbXFx3XFxzLV0rKVs7XFwpXS9pLFxuICAgICAgICAgICAgLyhuZXh1c1xcczZwfHZvZy1sMjl8YW5lLWx4MXxlbWwtbDI5KS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSHVhd2VpXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdIdWF3ZWknXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLisoYmFoMj8tYT9bbHddXFxkezJ9KS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEh1YXdlaSBNZWRpYVBhZFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnSHVhd2VpJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvKG1pY3Jvc29mdCk7XFxzKGx1bWlhW1xcc1xcd10rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1pY3Jvc29mdCBMdW1pYVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvW1xcc1xcKDtdKHhib3goPzpcXHNvbmUpPylbXFxzXFwpO10vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWljcm9zb2Z0IFhib3hcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ01pY3Jvc29mdCddLCBbVFlQRSwgQ09OU09MRV1dLCBbXG4gICAgICAgICAgICAvKGtpblxcLltvbmV0d117M30pL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNaWNyb3NvZnQgS2luXG4gICAgICAgICAgICBdLCBbW01PREVMLCAvXFwuL2csICcgJ10sIFtWRU5ET1IsICdNaWNyb3NvZnQnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTW90b3JvbGFcbiAgICAgICAgICAgIC9cXHMobWlsZXN0b25lfGRyb2lkKD86WzItNHhdfFxccyg/OmJpb25pY3x4Mnxwcm98cmF6cikpPzo/KFxcczRnKT8pW1xcd1xcc10rYnVpbGRcXC8vaSxcbiAgICAgICAgICAgIC9tb3RbXFxzLV0/KFxcdyopL2ksXG4gICAgICAgICAgICAvKFhUXFxkezMsNH0pIGJ1aWxkXFwvL2ksXG4gICAgICAgICAgICAvKG5leHVzXFxzNikvaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTW90b3JvbGEnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rXFxzKG16NjBcXGR8eG9vbVtcXHMyXXswLDJ9KVxcc2J1aWxkXFwvL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ01vdG9yb2xhJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvaGJidHZcXC9cXGQrXFwuXFxkK1xcLlxcZCtcXHMrXFwoW1xcd1xcc10qO1xccyooXFx3W147XSopOyhbXjtdKikvaSAgICAgICAgICAgIC8vIEhiYlRWIGRldmljZXNcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCB1dGlsLnRyaW1dLCBbTU9ERUwsIHV0aWwudHJpbV0sIFtUWVBFLCBTTUFSVFRWXV0sIFtcblxuICAgICAgICAgICAgL2hiYnR2LittYXBsZTsoXFxkKykvaVxuICAgICAgICAgICAgXSwgW1tNT0RFTCwgL14vLCAnU21hcnRUViddLCBbVkVORE9SLCAnU2Ftc3VuZyddLCBbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC9cXChkdHZbXFwpO10uKyhhcXVvcykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaGFycFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnU2hhcnAnXSwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rKChzY2gtaVs4OV0wXFxkfHNody1tMzgwc3xndC1wXFxkezR9fGd0LW5cXGQrfHNnaC10OFs1Nl05fG5leHVzIDEwKSkvaSxcbiAgICAgICAgICAgIC8oKFNNLVRcXHcrKSkvaVxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdTYW1zdW5nJ10sIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFsgICAgICAgICAgICAgICAgICAvLyBTYW1zdW5nXG4gICAgICAgICAgICAvc21hcnQtdHYuKyhzYW1zdW5nKS9pXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBbVFlQRSwgU01BUlRUVl0sIE1PREVMXSwgW1xuICAgICAgICAgICAgLygoc1tjZ3BdaC1cXHcrfGd0LVxcdyt8Z2FsYXh5XFxzbmV4dXN8c20tXFx3W1xcd1xcZF0rKSkvaSxcbiAgICAgICAgICAgIC8oc2FtW3N1bmddKilbXFxzLV0qKFxcdystP1tcXHctXSopL2ksXG4gICAgICAgICAgICAvc2VjLSgoc2doXFx3KykpL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnU2Ftc3VuZyddLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9zaWUtKFxcdyopL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpZW1lbnNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1NpZW1lbnMnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8obWFlbW98bm9raWEpLioobjkwMHxsdW1pYVxcc1xcZCspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb2tpYVxuICAgICAgICAgICAgLyhub2tpYSlbXFxzXy1dPyhbXFx3LV0qKS9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ05va2lhJ10sIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWRbeFxcZFxcLlxccztdK1xccyhbYWJdWzEtN11cXC0/WzAxNzhhXVxcZFxcZD8pL2kgICAgICAgICAgICAgICAgICAgLy8gQWNlclxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQWNlciddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKyhbdmxda1xcLT9cXGR7M30pXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMRyBUYWJsZXRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0xHJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWRcXHMzXFwuW1xcc1xcdzstXXsxMH0obGc/KS0oWzA2Y3Y5XXszLDR9KS9pICAgICAgICAgICAgICAgICAgICAgLy8gTEcgVGFibGV0XG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ0xHJ10sIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcbiAgICAgICAgICAgIC8obGcpIG5ldGNhc3RcXC50di9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExHIFNtYXJ0VFZcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgU01BUlRUVl1dLCBbXG4gICAgICAgICAgICAvKG5leHVzXFxzWzQ1XSkvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMR1xuICAgICAgICAgICAgL2xnW2U7XFxzXFwvLV0rKFxcdyopL2ksXG4gICAgICAgICAgICAvYW5kcm9pZC4rbGcoXFwtP1tcXGRcXHddKylcXHMrYnVpbGQvaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTEcnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8obGVub3ZvKVxccz8ocyg/OjUwMDB8NjAwMCkoPzpbXFx3LV0rKXx0YWIoPzpbXFxzXFx3XSspKS9pICAgICAgICAgICAgIC8vIExlbm92byB0YWJsZXRzXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rKGlkZWF0YWJbYS16MC05XFwtXFxzXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGVub3ZvXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdMZW5vdm8nXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvKGxlbm92bylbX1xccy1dPyhbXFx3LV0rKS9pXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9saW51eDsuKygoam9sbGEpKTsvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSm9sbGFcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgLygocGViYmxlKSlhcHBcXC9bXFxkXFwuXStcXHMvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGViYmxlXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFdFQVJBQkxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKztcXHMob3BwbylcXHM/KFtcXHdcXHNdKylcXHNidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9QUE9cbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2Nya2V5L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHb29nbGUgQ2hyb21lY2FzdFxuICAgICAgICAgICAgXSwgW1tNT0RFTCwgJ0Nocm9tZWNhc3QnXSwgW1ZFTkRPUiwgJ0dvb2dsZSddLCBbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKGdsYXNzKVxcc1xcZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR29vZ2xlIEdsYXNzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdHb29nbGUnXSwgW1RZUEUsIFdFQVJBQkxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKztcXHMocGl4ZWwgYylbXFxzKV0vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdvb2dsZSBQaXhlbCBDXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdHb29nbGUnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKHBpeGVsKCBbMjNdKT8oIHhsKT8pW1xccyldL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHb29nbGUgUGl4ZWxcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0dvb2dsZSddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKztcXHMoXFx3KylcXHMrYnVpbGRcXC9obVxcMS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFhpYW9taSBIb25nbWkgJ251bWVyaWMnIG1vZGVsc1xuICAgICAgICAgICAgL2FuZHJvaWQuKyhobVtcXHNcXC1fXSpub3RlP1tcXHNfXSooPzpcXGRcXHcpPylcXHMrYnVpbGQvaSwgICAgICAgICAgICAgICAvLyBYaWFvbWkgSG9uZ21pXG4gICAgICAgICAgICAvYW5kcm9pZC4rKG1pW1xcc1xcLV9dKig/OmFcXGR8b25lfG9uZVtcXHNfXXBsdXN8bm90ZSBsdGUpP1tcXHNfXSooPzpcXGQ/XFx3PylbXFxzX10qKD86cGx1cyk/KVxccytidWlsZC9pLCAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gWGlhb21pIE1pXG4gICAgICAgICAgICAvYW5kcm9pZC4rKHJlZG1pW1xcc1xcLV9dKig/Om5vdGUpPyg/OltcXHNfXSpbXFx3XFxzXSspKVxccytidWlsZC9pICAgICAgIC8vIFJlZG1pIFBob25lc1xuICAgICAgICAgICAgXSwgW1tNT0RFTCwgL18vZywgJyAnXSwgW1ZFTkRPUiwgJ1hpYW9taSddLCBbVFlQRSwgTU9CSUxFXV0sIFtcbiAgICAgICAgICAgIC9hbmRyb2lkLisobWlbXFxzXFwtX10qKD86cGFkKSg/OltcXHNfXSpbXFx3XFxzXSspKVxccytidWlsZC9pICAgICAgICAgICAgLy8gTWkgUGFkIHRhYmxldHNcbiAgICAgICAgICAgIF0sW1tNT0RFTCwgL18vZywgJyAnXSwgW1ZFTkRPUiwgJ1hpYW9taSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKG1bMS01XVxcc25vdGUpXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWVpenVcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ01laXp1J10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgLyhteiktKFtcXHctXXsyLH0pL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnTWVpenUnXSwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rYTAwMCgxKVxccytidWlsZC9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPbmVQbHVzXG4gICAgICAgICAgICAvYW5kcm9pZC4rb25lcGx1c1xccyhhXFxkezR9KVtcXHMpXS9pXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdPbmVQbHVzJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihSQ1RbXFxkXFx3XSspXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUkNBIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1JDQSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXFxzXSsoVmVudWVbXFxkXFxzXXsyLDd9KVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgIC8vIERlbGwgVmVudWUgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnRGVsbCddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooUVtUfE1dW1xcZFxcd10rKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZlcml6b24gVGFibGV0XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdWZXJpem9uJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKyhCYXJuZXNbJlxcc10rTm9ibGVcXHMrfEJOW1JUXSkoVj8uKilcXHMrYnVpbGQvaSAgICAgLy8gQmFybmVzICYgTm9ibGUgVGFibGV0XG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ0Jhcm5lcyAmIE5vYmxlJ10sIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccysoVE1cXGR7M30uKlxcYilcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJhcm5lcyAmIE5vYmxlIFRhYmxldFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTnVWaXNpb24nXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKGs4OClcXHNidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBaVEUgSyBTZXJpZXMgVGFibGV0XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdaVEUnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKGdlblxcZHszfSlcXHMrYnVpbGQuKjQ5aC9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN3aXNzIEdFTiBNb2JpbGVcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1N3aXNzJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKih6dXJcXGR7M30pXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTd2lzcyBaVVIgVGFibGV0XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdTd2lzcyddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooKFpla2kpP1RCLipcXGIpXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgLy8gWmVraSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdaZWtpJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvKGFuZHJvaWQpLitbO1xcL11cXHMrKFtZUl1cXGR7Mn0pXFxzK2J1aWxkL2ksXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKyhEcmFnb25bXFwtXFxzXStUb3VjaFxccyt8RFQpKFxcd3s1fSlcXHNidWlsZC9pICAgICAgICAvLyBEcmFnb24gVG91Y2ggVGFibGV0XG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ0RyYWdvbiBUb3VjaCddLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKE5TLT9cXHd7MCw5fSlcXHNidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluc2lnbmlhIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0luc2lnbmlhJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKigoTlh8TmV4dCktP1xcd3swLDl9KVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAvLyBOZXh0Qm9vayBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdOZXh0Qm9vayddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooWHRyZW1lXFxfKT8oVigxWzA0NV18MlswMTVdfDMwfDQwfDYwfDdbMDVdfDkwKSlcXHMrYnVpbGQvaVxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdWb2ljZSddLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbICAgICAgICAgICAgICAgICAgICAvLyBWb2ljZSBYdHJlbWUgUGhvbmVzXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKExWVEVMXFwtKT8oVjFbMTJdKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgLy8gTHZUZWwgUGhvbmVzXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ0x2VGVsJ10sIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKztcXHMoUEgtMSlcXHMvaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnRXNzZW50aWFsJ10sIFtUWVBFLCBNT0JJTEVdXSwgWyAgICAgICAgICAgICAgICAvLyBFc3NlbnRpYWwgUEgtMVxuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihWKDEwME1EfDcwME5BfDcwMTF8OTE3RykuKlxcYilcXHMrYnVpbGQvaSAgICAgICAgICAvLyBFbnZpemVuIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0Vudml6ZW4nXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKExlW1xcc1xcLV0rUGFuKVtcXHNcXC1dKyhcXHd7MSw5fSlcXHMrYnVpbGQvaSAgICAgICAgICAvLyBMZSBQYW4gVGFibGV0c1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihUcmlvW1xcc1xcLV0qLiopXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFjaFNwZWVkIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ01hY2hTcGVlZCddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooVHJpbml0eSlbXFwtXFxzXSooVFxcZHszfSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAvLyBUcmluaXR5IFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccypUVV8oMTQ5MSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSb3RvciBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdSb3RvciddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKyhLUyguKykpXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQW1hem9uIEtpbmRsZSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdBbWF6b24nXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLisoR2lnYXNldClbXFxzXFwtXSsoUVxcd3sxLDl9KVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgIC8vIEdpZ2FzZXQgVGFibGV0c1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvXFxzKHRhYmxldHx0YWIpWztcXC9dL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVW5pZGVudGlmaWFibGUgVGFibGV0XG4gICAgICAgICAgICAvXFxzKG1vYmlsZSkoPzpbO1xcL118XFxzc2FmYXJpKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVuaWRlbnRpZmlhYmxlIE1vYmlsZVxuICAgICAgICAgICAgXSwgW1tUWVBFLCB1dGlsLmxvd2VyaXplXSwgVkVORE9SLCBNT0RFTF0sIFtcblxuICAgICAgICAgICAgL1tcXHNcXC9cXChdKHNtYXJ0LT90dilbO1xcKV0vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU21hcnRUVlxuICAgICAgICAgICAgXSwgW1tUWVBFLCBTTUFSVFRWXV0sIFtcblxuICAgICAgICAgICAgLyhhbmRyb2lkW1xcd1xcLlxcc1xcLV17MCw5fSk7LitidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJpYyBBbmRyb2lkIERldmljZVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnR2VuZXJpYyddXVxuICAgICAgICBdLFxuXG4gICAgICAgIGVuZ2luZSA6IFtbXG5cbiAgICAgICAgICAgIC93aW5kb3dzLitcXHNlZGdlXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVkZ2VIVE1MXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdFZGdlSFRNTCddXSwgW1xuXG4gICAgICAgICAgICAvd2Via2l0XFwvNTM3XFwuMzYuK2Nocm9tZVxcLyg/ITI3KShbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmxpbmtcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBbTkFNRSwgJ0JsaW5rJ11dLCBbXG5cbiAgICAgICAgICAgIC8ocHJlc3RvKVxcLyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlc3RvXG4gICAgICAgICAgICAvKHdlYmtpdHx0cmlkZW50fG5ldGZyb250fG5ldHN1cmZ8YW1heWF8bHlueHx3M218Z29hbm5hKVxcLyhbXFx3XFwuXSspL2ksICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2ViS2l0L1RyaWRlbnQvTmV0RnJvbnQvTmV0U3VyZi9BbWF5YS9MeW54L3czbS9Hb2FubmFcbiAgICAgICAgICAgIC8oa2h0bWx8dGFzbWFufGxpbmtzKVtcXC9cXHNdXFwoPyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBLSFRNTC9UYXNtYW4vTGlua3NcbiAgICAgICAgICAgIC8oaWNhYilbXFwvXFxzXShbMjNdXFwuW1xcZFxcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpQ2FiXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgL3J2XFw6KFtcXHdcXC5dezEsOX0pLisoZ2Vja28pL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZWNrb1xuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIE5BTUVdXG4gICAgICAgIF0sXG5cbiAgICAgICAgb3MgOiBbW1xuXG4gICAgICAgICAgICAvLyBXaW5kb3dzIGJhc2VkXG4gICAgICAgICAgICAvbWljcm9zb2Z0XFxzKHdpbmRvd3MpXFxzKHZpc3RhfHhwKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2luZG93cyAoaVR1bmVzKVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG4gICAgICAgICAgICAvKHdpbmRvd3MpXFxzbnRcXHM2XFwuMjtcXHMoYXJtKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXaW5kb3dzIFJUXG4gICAgICAgICAgICAvKHdpbmRvd3NcXHNwaG9uZSg/Olxcc29zKSopW1xcc1xcL10/KFtcXGRcXC5cXHNcXHddKikvaSwgICAgICAgICAgICAgICAgICAgLy8gV2luZG93cyBQaG9uZVxuICAgICAgICAgICAgLyh3aW5kb3dzXFxzbW9iaWxlfHdpbmRvd3MpW1xcc1xcL10/KFtudGNlXFxkXFwuXFxzXStcXHcpL2lcbiAgICAgICAgICAgIF0sIFtOQU1FLCBbVkVSU0lPTiwgbWFwcGVyLnN0ciwgbWFwcy5vcy53aW5kb3dzLnZlcnNpb25dXSwgW1xuICAgICAgICAgICAgLyh3aW4oPz0zfDl8bil8d2luXFxzOXhcXHMpKFtudFxcZFxcLl0rKS9pXG4gICAgICAgICAgICBdLCBbW05BTUUsICdXaW5kb3dzJ10sIFtWRVJTSU9OLCBtYXBwZXIuc3RyLCBtYXBzLm9zLndpbmRvd3MudmVyc2lvbl1dLCBbXG5cbiAgICAgICAgICAgIC8vIE1vYmlsZS9FbWJlZGRlZCBPU1xuICAgICAgICAgICAgL1xcKChiYikoMTApOy9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmxhY2tCZXJyeSAxMFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnQmxhY2tCZXJyeSddLCBWRVJTSU9OXSwgW1xuICAgICAgICAgICAgLyhibGFja2JlcnJ5KVxcdypcXC8/KFtcXHdcXC5dKikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmxhY2tiZXJyeVxuICAgICAgICAgICAgLyh0aXplbnxrYWlvcylbXFwvXFxzXShbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGl6ZW4vS2FpT1NcbiAgICAgICAgICAgIC8oYW5kcm9pZHx3ZWJvc3xwYWxtXFxzb3N8cW54fGJhZGF8cmltXFxzdGFibGV0XFxzb3N8bWVlZ298c2FpbGZpc2h8Y29udGlraSlbXFwvXFxzLV0/KFtcXHdcXC5dKikvaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbmRyb2lkL1dlYk9TL1BhbG0vUU5YL0JhZGEvUklNL01lZUdvL0NvbnRpa2kvU2FpbGZpc2ggT1NcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuICAgICAgICAgICAgLyhzeW1iaWFuXFxzP29zfHN5bWJvc3xzNjAoPz07KSlbXFwvXFxzLV0/KFtcXHdcXC5dKikvaSAgICAgICAgICAgICAgICAgIC8vIFN5bWJpYW5cbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1N5bWJpYW4nXSwgVkVSU0lPTl0sIFtcbiAgICAgICAgICAgIC9cXCgoc2VyaWVzNDApOy9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNlcmllcyA0MFxuICAgICAgICAgICAgXSwgW05BTUVdLCBbXG4gICAgICAgICAgICAvbW96aWxsYS4rXFwobW9iaWxlOy4rZ2Vja28uK2ZpcmVmb3gvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJlZm94IE9TXG4gICAgICAgICAgICBdLCBbW05BTUUsICdGaXJlZm94IE9TJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8vIENvbnNvbGVcbiAgICAgICAgICAgIC8obmludGVuZG98cGxheXN0YXRpb24pXFxzKFt3aWRzMzRwb3J0YWJsZXZ1XSspL2ksICAgICAgICAgICAgICAgICAgIC8vIE5pbnRlbmRvL1BsYXlzdGF0aW9uXG5cbiAgICAgICAgICAgIC8vIEdOVS9MaW51eCBiYXNlZFxuICAgICAgICAgICAgLyhtaW50KVtcXC9cXHNcXChdPyhcXHcqKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWludFxuICAgICAgICAgICAgLyhtYWdlaWF8dmVjdG9ybGludXgpWztcXHNdL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFnZWlhL1ZlY3RvckxpbnV4XG4gICAgICAgICAgICAvKGpvbGl8W2t4bG5dP3VidW50dXxkZWJpYW58c3VzZXxvcGVuc3VzZXxnZW50b298KD89XFxzKWFyY2h8c2xhY2t3YXJlfGZlZG9yYXxtYW5kcml2YXxjZW50b3N8cGNsaW51eG9zfHJlZGhhdHx6ZW53YWxrfGxpbnB1cylbXFwvXFxzLV0/KD8hY2hyb20pKFtcXHdcXC4tXSopL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEpvbGkvVWJ1bnR1L0RlYmlhbi9TVVNFL0dlbnRvby9BcmNoL1NsYWNrd2FyZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGZWRvcmEvTWFuZHJpdmEvQ2VudE9TL1BDTGludXhPUy9SZWRIYXQvWmVud2Fsay9MaW5wdXNcbiAgICAgICAgICAgIC8oaHVyZHxsaW51eClcXHM/KFtcXHdcXC5dKikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSHVyZC9MaW51eFxuICAgICAgICAgICAgLyhnbnUpXFxzPyhbXFx3XFwuXSopL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHTlVcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGNyb3MpXFxzW1xcd10rXFxzKFtcXHdcXC5dK1xcdykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9taXVtIE9TXG4gICAgICAgICAgICBdLCBbW05BTUUsICdDaHJvbWl1bSBPUyddLCBWRVJTSU9OXSxbXG5cbiAgICAgICAgICAgIC8vIFNvbGFyaXNcbiAgICAgICAgICAgIC8oc3Vub3MpXFxzPyhbXFx3XFwuXFxkXSopL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNvbGFyaXNcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1NvbGFyaXMnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLy8gQlNEIGJhc2VkXG4gICAgICAgICAgICAvXFxzKFtmcmVudG9wYy1dezAsNH1ic2R8ZHJhZ29uZmx5KVxccz8oW1xcd1xcLl0qKS9pICAgICAgICAgICAgICAgICAgICAvLyBGcmVlQlNEL05ldEJTRC9PcGVuQlNEL1BDLUJTRC9EcmFnb25GbHlcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSxbXG5cbiAgICAgICAgICAgIC8oaGFpa3UpXFxzKFxcdyspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIYWlrdVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLFtcblxuICAgICAgICAgICAgL2NmbmV0d29ya1xcLy4rZGFyd2luL2ksXG4gICAgICAgICAgICAvaXBbaG9uZWFkXXsyLDR9KD86Lipvc1xccyhbXFx3XSspXFxzbGlrZVxcc21hY3w7XFxzb3BlcmEpL2kgICAgICAgICAgICAgLy8gaU9TXG4gICAgICAgICAgICBdLCBbW1ZFUlNJT04sIC9fL2csICcuJ10sIFtOQU1FLCAnaU9TJ11dLCBbXG5cbiAgICAgICAgICAgIC8obWFjXFxzb3NcXHN4KVxccz8oW1xcd1xcc1xcLl0qKS9pLFxuICAgICAgICAgICAgLyhtYWNpbnRvc2h8bWFjKD89X3Bvd2VycGMpXFxzKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFjIE9TXG4gICAgICAgICAgICBdLCBbW05BTUUsICdNYWMgT1MnXSwgW1ZFUlNJT04sIC9fL2csICcuJ11dLCBbXG5cbiAgICAgICAgICAgIC8vIE90aGVyXG4gICAgICAgICAgICAvKCg/Om9wZW4pP3NvbGFyaXMpW1xcL1xccy1dPyhbXFx3XFwuXSopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTb2xhcmlzXG4gICAgICAgICAgICAvKGFpeClcXHMoKFxcZCkoPz1cXC58XFwpfFxccylbXFx3XFwuXSkqL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBSVhcbiAgICAgICAgICAgIC8ocGxhblxcczl8bWluaXh8YmVvc3xvc1xcLzJ8YW1pZ2Fvc3xtb3JwaG9zfHJpc2NcXHNvc3xvcGVudm1zfGZ1Y2hzaWEpL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBsYW45L01pbml4L0JlT1MvT1MyL0FtaWdhT1MvTW9ycGhPUy9SSVNDT1MvT3BlblZNUy9GdWNoc2lhXG4gICAgICAgICAgICAvKHVuaXgpXFxzPyhbXFx3XFwuXSopL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVOSVhcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXVxuICAgICAgICBdXG4gICAgfTtcblxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBDb25zdHJ1Y3RvclxuICAgIC8vLy8vLy8vLy8vLy8vLy9cbiAgICB2YXIgVUFQYXJzZXIgPSBmdW5jdGlvbiAodWFzdHJpbmcsIGV4dGVuc2lvbnMpIHtcblxuICAgICAgICBpZiAodHlwZW9mIHVhc3RyaW5nID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZXh0ZW5zaW9ucyA9IHVhc3RyaW5nO1xuICAgICAgICAgICAgdWFzdHJpbmcgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVUFQYXJzZXIpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFVBUGFyc2VyKHVhc3RyaW5nLCBleHRlbnNpb25zKS5nZXRSZXN1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB1YSA9IHVhc3RyaW5nIHx8ICgod2luZG93ICYmIHdpbmRvdy5uYXZpZ2F0b3IgJiYgd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpID8gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQgOiBFTVBUWSk7XG4gICAgICAgIHZhciByZ3htYXAgPSBleHRlbnNpb25zID8gdXRpbC5leHRlbmQocmVnZXhlcywgZXh0ZW5zaW9ucykgOiByZWdleGVzO1xuXG4gICAgICAgIHRoaXMuZ2V0QnJvd3NlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBicm93c2VyID0geyBuYW1lOiB1bmRlZmluZWQsIHZlcnNpb246IHVuZGVmaW5lZCB9O1xuICAgICAgICAgICAgbWFwcGVyLnJneC5jYWxsKGJyb3dzZXIsIHVhLCByZ3htYXAuYnJvd3Nlcik7XG4gICAgICAgICAgICBicm93c2VyLm1ham9yID0gdXRpbC5tYWpvcihicm93c2VyLnZlcnNpb24pOyAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICByZXR1cm4gYnJvd3NlcjtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRDUFUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY3B1ID0geyBhcmNoaXRlY3R1cmU6IHVuZGVmaW5lZCB9O1xuICAgICAgICAgICAgbWFwcGVyLnJneC5jYWxsKGNwdSwgdWEsIHJneG1hcC5jcHUpO1xuICAgICAgICAgICAgcmV0dXJuIGNwdTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXREZXZpY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZGV2aWNlID0geyB2ZW5kb3I6IHVuZGVmaW5lZCwgbW9kZWw6IHVuZGVmaW5lZCwgdHlwZTogdW5kZWZpbmVkIH07XG4gICAgICAgICAgICBtYXBwZXIucmd4LmNhbGwoZGV2aWNlLCB1YSwgcmd4bWFwLmRldmljZSk7XG4gICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldEVuZ2luZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBlbmdpbmUgPSB7IG5hbWU6IHVuZGVmaW5lZCwgdmVyc2lvbjogdW5kZWZpbmVkIH07XG4gICAgICAgICAgICBtYXBwZXIucmd4LmNhbGwoZW5naW5lLCB1YSwgcmd4bWFwLmVuZ2luZSk7XG4gICAgICAgICAgICByZXR1cm4gZW5naW5lO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldE9TID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG9zID0geyBuYW1lOiB1bmRlZmluZWQsIHZlcnNpb246IHVuZGVmaW5lZCB9O1xuICAgICAgICAgICAgbWFwcGVyLnJneC5jYWxsKG9zLCB1YSwgcmd4bWFwLm9zKTtcbiAgICAgICAgICAgIHJldHVybiBvcztcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRSZXN1bHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHVhICAgICAgOiB0aGlzLmdldFVBKCksXG4gICAgICAgICAgICAgICAgYnJvd3NlciA6IHRoaXMuZ2V0QnJvd3NlcigpLFxuICAgICAgICAgICAgICAgIGVuZ2luZSAgOiB0aGlzLmdldEVuZ2luZSgpLFxuICAgICAgICAgICAgICAgIG9zICAgICAgOiB0aGlzLmdldE9TKCksXG4gICAgICAgICAgICAgICAgZGV2aWNlICA6IHRoaXMuZ2V0RGV2aWNlKCksXG4gICAgICAgICAgICAgICAgY3B1ICAgICA6IHRoaXMuZ2V0Q1BVKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0VUEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdWE7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc2V0VUEgPSBmdW5jdGlvbiAodWFzdHJpbmcpIHtcbiAgICAgICAgICAgIHVhID0gdWFzdHJpbmc7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIFVBUGFyc2VyLlZFUlNJT04gPSBMSUJWRVJTSU9OO1xuICAgIFVBUGFyc2VyLkJST1dTRVIgPSB7XG4gICAgICAgIE5BTUUgICAgOiBOQU1FLFxuICAgICAgICBNQUpPUiAgIDogTUFKT1IsIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgVkVSU0lPTiA6IFZFUlNJT05cbiAgICB9O1xuICAgIFVBUGFyc2VyLkNQVSA9IHtcbiAgICAgICAgQVJDSElURUNUVVJFIDogQVJDSElURUNUVVJFXG4gICAgfTtcbiAgICBVQVBhcnNlci5ERVZJQ0UgPSB7XG4gICAgICAgIE1PREVMICAgOiBNT0RFTCxcbiAgICAgICAgVkVORE9SICA6IFZFTkRPUixcbiAgICAgICAgVFlQRSAgICA6IFRZUEUsXG4gICAgICAgIENPTlNPTEUgOiBDT05TT0xFLFxuICAgICAgICBNT0JJTEUgIDogTU9CSUxFLFxuICAgICAgICBTTUFSVFRWIDogU01BUlRUVixcbiAgICAgICAgVEFCTEVUICA6IFRBQkxFVCxcbiAgICAgICAgV0VBUkFCTEU6IFdFQVJBQkxFLFxuICAgICAgICBFTUJFRERFRDogRU1CRURERURcbiAgICB9O1xuICAgIFVBUGFyc2VyLkVOR0lORSA9IHtcbiAgICAgICAgTkFNRSAgICA6IE5BTUUsXG4gICAgICAgIFZFUlNJT04gOiBWRVJTSU9OXG4gICAgfTtcbiAgICBVQVBhcnNlci5PUyA9IHtcbiAgICAgICAgTkFNRSAgICA6IE5BTUUsXG4gICAgICAgIFZFUlNJT04gOiBWRVJTSU9OXG4gICAgfTtcblxuICAgIC8vLy8vLy8vLy8vXG4gICAgLy8gRXhwb3J0XG4gICAgLy8vLy8vLy8vL1xuXG5cbiAgICAvLyBjaGVjayBqcyBlbnZpcm9ubWVudFxuICAgIGlmICh0eXBlb2YoZXhwb3J0cykgIT09IFVOREVGX1RZUEUpIHtcbiAgICAgICAgLy8gbm9kZWpzIGVudlxuICAgICAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gVU5ERUZfVFlQRSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gVUFQYXJzZXI7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0cy5VQVBhcnNlciA9IFVBUGFyc2VyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHJlcXVpcmVqcyBlbnYgKG9wdGlvbmFsKVxuICAgICAgICBpZiAodHlwZW9mKGRlZmluZSkgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAgICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVUFQYXJzZXI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICh3aW5kb3cpIHtcbiAgICAgICAgICAgIC8vIGJyb3dzZXIgZW52XG4gICAgICAgICAgICB3aW5kb3cuVUFQYXJzZXIgPSBVQVBhcnNlcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGpRdWVyeS9aZXB0byBzcGVjaWZpYyAob3B0aW9uYWwpXG4gICAgLy8gTm90ZTpcbiAgICAvLyAgIEluIEFNRCBlbnYgdGhlIGdsb2JhbCBzY29wZSBzaG91bGQgYmUga2VwdCBjbGVhbiwgYnV0IGpRdWVyeSBpcyBhbiBleGNlcHRpb24uXG4gICAgLy8gICBqUXVlcnkgYWx3YXlzIGV4cG9ydHMgdG8gZ2xvYmFsIHNjb3BlLCB1bmxlc3MgalF1ZXJ5Lm5vQ29uZmxpY3QodHJ1ZSkgaXMgdXNlZCxcbiAgICAvLyAgIGFuZCB3ZSBzaG91bGQgY2F0Y2ggdGhhdC5cbiAgICB2YXIgJCA9IHdpbmRvdyAmJiAod2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG8pO1xuICAgIGlmICgkICYmICEkLnVhKSB7XG4gICAgICAgIHZhciBwYXJzZXIgPSBuZXcgVUFQYXJzZXIoKTtcbiAgICAgICAgJC51YSA9IHBhcnNlci5nZXRSZXN1bHQoKTtcbiAgICAgICAgJC51YS5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VyLmdldFVBKCk7XG4gICAgICAgIH07XG4gICAgICAgICQudWEuc2V0ID0gZnVuY3Rpb24gKHVhc3RyaW5nKSB7XG4gICAgICAgICAgICBwYXJzZXIuc2V0VUEodWFzdHJpbmcpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHBhcnNlci5nZXRSZXN1bHQoKTtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgJC51YVtwcm9wXSA9IHJlc3VsdFtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbn0pKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnID8gd2luZG93IDogdGhpcyk7XG4iXX0=
