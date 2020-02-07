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
			return version.replace(/[^\d.]/g,'').split(".")[1];
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
			return isUnsupported;
		}

		var isBrowserOutOfDate = function() {
			var browserName = parsedUserAgent.browser.name
			var browserMajorVersion = parsedUserAgent.browser.major
			if (browserName === "Edge") {
				browserMajorVersion = EDGEHTML_VS_EDGE_VERSIONS[browserMajorVersion]
			}
			var isOutOfDate = false
			if (isBrowserUnsupported()) {
				isOutOfDate = true;
			} else if (browserName in browserSupport) {
				var minVersion = browserSupport[browserName];
				if (typeof minVersion == 'object') {
					var minMajorVersion = minVersion.major;
					var minMinorVersion = minVersion.minor;

					if (browserMajorVersion < minMajorVersion) {
						isOutOfDate = true
					} else if (browserMajorVersion == minMajorVersion) {
						var browserMinorVersion = parseMinorVersion(parsedUserAgent.browser.version)

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
    "url": "http://outdatedbrowser.com/br",
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
    "url": "http://outdatedbrowser.com/es",
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
    "url": "http://outdatedbrowser.com/cn",
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
    "url": "http://outdatedbrowser.com/cz",
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
    "url": "http://outdatedbrowser.com/da",
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
    "url": "http://outdatedbrowser.com/de",
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
    "url": "http://outdatedbrowser.com/ee",
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
    "url": "http://outdatedbrowser.com/",
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
    "url": "http://outdatedbrowser.com/es",
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
    "url": "http://outdatedbrowser.com/",
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
    "url": "http://outdatedbrowser.com/fi",
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
    "url": "http://outdatedbrowser.com/fr",
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
    "url": "http://outdatedbrowser.com/hu",
    "callToAction": "A böngészőm frissítése ",
    "close": "Close"
  },
  "id":{
    "outOfDate": "Browser yang Anda gunakan sudah ketinggalan zaman!",
    "update": {
      "web": "Perbaharuilah browser Anda agar bisa menjelajahi website ini dengan nyaman. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
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
    "url": "http://outdatedbrowser.com/it",
    "callToAction": "Aggiorna ora",
    "close": "Chiudi"
  },
  "lt":{
    "outOfDate": "Jūsų naršyklės versija yra pasenusi!",
    "update": {
      "web": "Atnaujinkite savo naršyklę, kad galėtumėte peržiūrėti šią svetainę tinkamai. ",
      "googlePlay": "Please install Chrome from Google Play",
      "appStore": "Please update iOS from the Settings App"
    },
    "url": "http://outdatedbrowser.com/",
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
    "url": "http://outdatedbrowser.com/nl",
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
    "url": "http://outdatedbrowser.com/pl",
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
    "url": "http://outdatedbrowser.com/pt",
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
    "url": "http://outdatedbrowser.com/",
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
    "url": "http://outdatedbrowser.com/ru",
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
    "url": "http://outdatedbrowser.com/si",
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
    "url": "http://outdatedbrowser.com/",
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
    "url": "http://outdatedbrowser.com/ua",
    "callToAction": "Оновити мій браузер ",
    "close": "Закрити"
  }
}

},{}],4:[function(require,module,exports){
/*!
 * UAParser.js v0.7.20
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


    var LIBVERSION  = '0.7.20',
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
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser/Baidu
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

            /(brave)\/([\w\.]+)/i                                              // Brave browser
            ], [[NAME, 'Brave'], VERSION], [

            /(qqbrowserlite)\/([\w\.]+)/i                                       // QQBrowserLite
            ], [NAME, VERSION], [

            /(QQ)\/([\d\.]+)/i                                                  // QQ, aka ShouQ
            ], [NAME, VERSION], [

            /m?(qqbrowser)[\/\s]?([\w\.]+)/i                                    // QQBrowser
            ], [NAME, VERSION], [

            /(BIDUBrowser)[\/\s]?([\w\.]+)/i                                    // Baidu Browser
            ], [NAME, VERSION], [

            /(2345Explorer)[\/\s]?([\w\.]+)/i                                   // 2345 Browser
            ], [NAME, VERSION], [

            /(MetaSr)[\/\s]?([\w\.]+)/i                                         // SouGouBrowser
            ], [NAME], [

            /(LBBROWSER)/i                                      // LieBao Browser
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
            ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple']], [

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
            /(nexus\s6p)/i                                                      // Huawei
            ], [MODEL, [VENDOR, 'Huawei'], [TYPE, MOBILE]], [

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
            ], [[MODEL, 'Chromecast'], [VENDOR, 'Google']], [

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
            /android.+oneplus\s(a\d{4})\s+build/i
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

            /webkit\/537\.36.+chrome\/(?!27)/i                                  // Blink
            ], [[NAME, 'Blink']], [

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
            /(tizen)[\/\s]([\w\.]+)/i,                                          // Tizen
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
    if (typeof $ !== UNDEF_TYPE && !$.ua) {
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleHRlbmQuanMiLCJpbmRleC5qcyIsImxhbmd1YWdlcy5qc29uIiwibm9kZV9tb2R1bGVzL3VhLXBhcnNlci1qcy9zcmMvdWEtcGFyc2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKiBIaWdobHkgZHVtYmVkIGRvd24gdmVyc2lvbiBvZiBodHRwczovL2dpdGh1Yi5jb20vdW5jbGVjaHUvbm9kZS1kZWVwLWV4dGVuZCAqL1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuaW5nIG9iamVjdCB0aGF0IGVudGVyZWQgaW4gZmlyc3QgYXJndW1lbnQuXHJcbiAqXHJcbiAqIFJldHVybnMgZXh0ZW5kZWQgb2JqZWN0IG9yIGZhbHNlIGlmIGhhdmUgbm8gdGFyZ2V0IG9iamVjdCBvciBpbmNvcnJlY3QgdHlwZS5cclxuICpcclxuICogSWYgeW91IHdpc2ggdG8gY2xvbmUgc291cmNlIG9iamVjdCAod2l0aG91dCBtb2RpZnkgaXQpLCBqdXN0IHVzZSBlbXB0eSBuZXdcclxuICogb2JqZWN0IGFzIGZpcnN0IGFyZ3VtZW50LCBsaWtlIHRoaXM6XHJcbiAqICAgZGVlcEV4dGVuZCh7fSwgeW91ck9ial8xLCBbeW91ck9ial9OXSk7XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlZXBFeHRlbmQoLypvYmpfMSwgW29ial8yXSwgW29ial9OXSovKSB7XHJcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAxIHx8IHR5cGVvZiBhcmd1bWVudHNbMF0gIT09IFwib2JqZWN0XCIpIHtcclxuXHRcdHJldHVybiBmYWxzZVxyXG5cdH1cclxuXHJcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XHJcblx0XHRyZXR1cm4gYXJndW1lbnRzWzBdXHJcblx0fVxyXG5cclxuXHR2YXIgdGFyZ2V0ID0gYXJndW1lbnRzWzBdXHJcblxyXG5cdGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR2YXIgb2JqID0gYXJndW1lbnRzW2ldXHJcblxyXG5cdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xyXG5cdFx0XHR2YXIgc3JjID0gdGFyZ2V0W2tleV1cclxuXHRcdFx0dmFyIHZhbCA9IG9ialtrZXldXHJcblxyXG5cdFx0XHRpZiAodHlwZW9mIHZhbCAhPT0gXCJvYmplY3RcIiB8fCB2YWwgPT09IG51bGwpIHtcclxuXHRcdFx0XHR0YXJnZXRba2V5XSA9IHZhbFxyXG5cclxuXHRcdFx0XHQvLyBqdXN0IGNsb25lIGFycmF5cyAoYW5kIHJlY3Vyc2l2ZSBjbG9uZSBvYmplY3RzIGluc2lkZSlcclxuXHRcdFx0fSBlbHNlIGlmICh0eXBlb2Ygc3JjICE9PSBcIm9iamVjdFwiIHx8IHNyYyA9PT0gbnVsbCkge1xyXG5cdFx0XHRcdHRhcmdldFtrZXldID0gZGVlcEV4dGVuZCh7fSwgdmFsKVxyXG5cclxuXHRcdFx0XHQvLyBzb3VyY2UgdmFsdWUgYW5kIG5ldyB2YWx1ZSBpcyBvYmplY3RzIGJvdGgsIGV4dGVuZGluZy4uLlxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRhcmdldFtrZXldID0gZGVlcEV4dGVuZChzcmMsIHZhbClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRhcmdldFxyXG59XHJcbiIsInZhciBVc2VyQWdlbnRQYXJzZXIgPSByZXF1aXJlKFwidWEtcGFyc2VyLWpzXCIpXHJcbnZhciBsYW5ndWFnZU1lc3NhZ2VzID0gcmVxdWlyZShcIi4vbGFuZ3VhZ2VzLmpzb25cIilcclxudmFyIGRlZXBFeHRlbmQgPSByZXF1aXJlKFwiLi9leHRlbmRcIilcclxuXHJcbnZhciBERUZBVUxUUyA9IHtcclxuXHRDaHJvbWU6IDU3LCAvLyBJbmNsdWRlcyBDaHJvbWUgZm9yIG1vYmlsZSBkZXZpY2VzXHJcblx0RWRnZTogMzksXHJcblx0U2FmYXJpOiAxMCxcclxuXHRcIk1vYmlsZSBTYWZhcmlcIjogMTAsXHJcblx0T3BlcmE6IDUwLFxyXG5cdEZpcmVmb3g6IDUwLFxyXG5cdFZpdmFsZGk6IDEsXHJcblx0SUU6IGZhbHNlXHJcbn1cclxuXHJcbnZhciBFREdFSFRNTF9WU19FREdFX1ZFUlNJT05TID0ge1xyXG5cdDEyOiAwLjEsXHJcblx0MTM6IDIxLFxyXG5cdDE0OiAzMSxcclxuXHQxNTogMzksXHJcblx0MTY6IDQxLFxyXG5cdDE3OiA0MixcclxuXHQxODogNDRcclxufVxyXG5cclxudmFyIENPTE9SUyA9IHtcclxuXHRzYWxtb246IFwiI2YyNTY0OFwiLFxyXG5cdHdoaXRlOiBcIndoaXRlXCJcclxufVxyXG5cclxudmFyIHVwZGF0ZURlZmF1bHRzID0gZnVuY3Rpb24oZGVmYXVsdHMsIHVwZGF0ZWRWYWx1ZXMpIHtcclxuXHRmb3IgKHZhciBrZXkgaW4gdXBkYXRlZFZhbHVlcykge1xyXG5cdFx0ZGVmYXVsdHNba2V5XSA9IHVwZGF0ZWRWYWx1ZXNba2V5XVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGRlZmF1bHRzXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG5cdHZhciBtYWluID0gZnVuY3Rpb24oKSB7XHJcblx0XHQvLyBEZXNwaXRlIHRoZSBkb2NzLCBVQSBuZWVkcyB0byBiZSBwcm92aWRlZCB0byBjb25zdHJ1Y3RvciBleHBsaWNpdGx5OlxyXG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2ZhaXNhbG1hbi91YS1wYXJzZXItanMvaXNzdWVzLzkwXHJcblx0XHR2YXIgcGFyc2VkVXNlckFnZW50ID0gbmV3IFVzZXJBZ2VudFBhcnNlcih3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCkuZ2V0UmVzdWx0KClcclxuXHJcblx0XHQvLyBWYXJpYWJsZSBkZWZpbml0aW9uIChiZWZvcmUgYWpheClcclxuXHRcdHZhciBvdXRkYXRlZFVJID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdXRkYXRlZFwiKVxyXG5cclxuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcblxyXG5cdFx0dmFyIGJyb3dzZXJMb2NhbGUgPSB3aW5kb3cubmF2aWdhdG9yLmxhbmd1YWdlIHx8IHdpbmRvdy5uYXZpZ2F0b3IudXNlckxhbmd1YWdlIC8vIEV2ZXJ5b25lIGVsc2UsIElFXHJcblxyXG5cdFx0Ly8gU2V0IGRlZmF1bHQgb3B0aW9uc1xyXG5cdFx0dmFyIGJyb3dzZXJTdXBwb3J0ID0gb3B0aW9ucy5icm93c2VyU3VwcG9ydCA/IHVwZGF0ZURlZmF1bHRzKERFRkFVTFRTLCBvcHRpb25zLmJyb3dzZXJTdXBwb3J0KSA6IERFRkFVTFRTXHJcblx0XHQvLyBDU1MgcHJvcGVydHkgdG8gY2hlY2sgZm9yLiBZb3UgbWF5IGFsc28gbGlrZSAnYm9yZGVyU3BhY2luZycsICdib3hTaGFkb3cnLCAndHJhbnNmb3JtJywgJ2JvcmRlckltYWdlJztcclxuXHRcdHZhciByZXF1aXJlZENzc1Byb3BlcnR5ID0gb3B0aW9ucy5yZXF1aXJlZENzc1Byb3BlcnR5IHx8IGZhbHNlXHJcblx0XHR2YXIgYmFja2dyb3VuZENvbG9yID0gb3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3IgfHwgQ09MT1JTLnNhbG1vblxyXG5cdFx0dmFyIHRleHRDb2xvciA9IG9wdGlvbnMudGV4dENvbG9yIHx8IENPTE9SUy53aGl0ZVxyXG5cdFx0dmFyIGZ1bGxzY3JlZW4gPSBvcHRpb25zLmZ1bGxzY3JlZW4gfHwgZmFsc2VcclxuXHRcdHZhciBsYW5ndWFnZSA9IG9wdGlvbnMubGFuZ3VhZ2UgfHwgYnJvd3NlckxvY2FsZS5zbGljZSgwLCAyKSAvLyBMYW5ndWFnZSBjb2RlXHJcblxyXG5cdFx0dmFyIHVwZGF0ZVNvdXJjZSA9IFwid2ViXCIgLy8gT3RoZXIgcG9zc2libGUgdmFsdWVzIGFyZSAnZ29vZ2xlUGxheScgb3IgJ2FwcFN0b3JlJy4gRGV0ZXJtaW5lcyB3aGVyZSB3ZSB0ZWxsIHVzZXJzIHRvIGdvIGZvciB1cGdyYWRlcy5cclxuXHJcblx0XHQvLyBDaHJvbWUgbW9iaWxlIGlzIHN0aWxsIENocm9tZSAodW5saWtlIFNhZmFyaSB3aGljaCBpcyAnTW9iaWxlIFNhZmFyaScpXHJcblx0XHR2YXIgaXNBbmRyb2lkID0gcGFyc2VkVXNlckFnZW50Lm9zLm5hbWUgPT09IFwiQW5kcm9pZFwiXHJcblx0XHRpZiAoaXNBbmRyb2lkKSB7XHJcblx0XHRcdHVwZGF0ZVNvdXJjZSA9IFwiZ29vZ2xlUGxheVwiXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGlzQW5kcm9pZEJ1dE5vdENocm9tZVxyXG5cdFx0aWYgKG9wdGlvbnMucmVxdWlyZUNocm9tZU9uQW5kcm9pZCkge1xyXG5cdFx0XHRpc0FuZHJvaWRCdXROb3RDaHJvbWUgPSBpc0FuZHJvaWQgJiYgcGFyc2VkVXNlckFnZW50LmJyb3dzZXIubmFtZSAhPT0gXCJDaHJvbWVcIlxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChwYXJzZWRVc2VyQWdlbnQub3MubmFtZSA9PT0gXCJpT1NcIikge1xyXG5cdFx0XHR1cGRhdGVTb3VyY2UgPSBcImFwcFN0b3JlXCJcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZG9uZSA9IHRydWVcclxuXHJcblx0XHR2YXIgY2hhbmdlT3BhY2l0eSA9IGZ1bmN0aW9uKG9wYWNpdHlWYWx1ZSkge1xyXG5cdFx0XHRvdXRkYXRlZFVJLnN0eWxlLm9wYWNpdHkgPSBvcGFjaXR5VmFsdWUgLyAxMDBcclxuXHRcdFx0b3V0ZGF0ZWRVSS5zdHlsZS5maWx0ZXIgPSBcImFscGhhKG9wYWNpdHk9XCIgKyBvcGFjaXR5VmFsdWUgKyBcIilcIlxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBmYWRlSW4gPSBmdW5jdGlvbihvcGFjaXR5VmFsdWUpIHtcclxuXHRcdFx0Y2hhbmdlT3BhY2l0eShvcGFjaXR5VmFsdWUpXHJcblx0XHRcdGlmIChvcGFjaXR5VmFsdWUgPT09IDEpIHtcclxuXHRcdFx0XHRvdXRkYXRlZFVJLnN0eWxlLmRpc3BsYXkgPSBcInRhYmxlXCJcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAob3BhY2l0eVZhbHVlID09PSAxMDApIHtcclxuXHRcdFx0XHRkb25lID0gdHJ1ZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHBhcnNlTWlub3JWZXJzaW9uID0gZnVuY3Rpb24gKHZlcnNpb24pIHtcclxuXHRcdFx0cmV0dXJuIHZlcnNpb24ucmVwbGFjZSgvW15cXGQuXS9nLCcnKS5zcGxpdChcIi5cIilbMV07XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGlzQnJvd3NlclVuc3VwcG9ydGVkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBicm93c2VyTmFtZSA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm5hbWVcclxuXHRcdFx0dmFyIGlzVW5zdXBwb3J0ZWQgPSBmYWxzZVxyXG5cdFx0XHRpZiAoIShicm93c2VyTmFtZSBpbiBicm93c2VyU3VwcG9ydCkpIHtcclxuXHRcdFx0XHRpZiAoIW9wdGlvbnMuaXNVbmtub3duQnJvd3Nlck9LKSB7XHJcblx0XHRcdFx0XHRpc1Vuc3VwcG9ydGVkID0gdHJ1ZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIGlmICghYnJvd3NlclN1cHBvcnRbYnJvd3Nlck5hbWVdKSB7XHJcblx0XHRcdFx0aXNVbnN1cHBvcnRlZCA9IHRydWVcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gaXNVbnN1cHBvcnRlZDtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgaXNCcm93c2VyT3V0T2ZEYXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBicm93c2VyTmFtZSA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm5hbWVcclxuXHRcdFx0dmFyIGJyb3dzZXJNYWpvclZlcnNpb24gPSBwYXJzZWRVc2VyQWdlbnQuYnJvd3Nlci5tYWpvclxyXG5cdFx0XHRpZiAoYnJvd3Nlck5hbWUgPT09IFwiRWRnZVwiKSB7XHJcblx0XHRcdFx0YnJvd3Nlck1ham9yVmVyc2lvbiA9IEVER0VIVE1MX1ZTX0VER0VfVkVSU0lPTlNbYnJvd3Nlck1ham9yVmVyc2lvbl1cclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgaXNPdXRPZkRhdGUgPSBmYWxzZVxyXG5cdFx0XHRpZiAoaXNCcm93c2VyVW5zdXBwb3J0ZWQoKSkge1xyXG5cdFx0XHRcdGlzT3V0T2ZEYXRlID0gdHJ1ZTtcclxuXHRcdFx0fSBlbHNlIGlmIChicm93c2VyTmFtZSBpbiBicm93c2VyU3VwcG9ydCkge1xyXG5cdFx0XHRcdHZhciBtaW5WZXJzaW9uID0gYnJvd3NlclN1cHBvcnRbYnJvd3Nlck5hbWVdO1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgbWluVmVyc2lvbiA9PSAnb2JqZWN0Jykge1xyXG5cdFx0XHRcdFx0dmFyIG1pbk1ham9yVmVyc2lvbiA9IG1pblZlcnNpb24ubWFqb3I7XHJcblx0XHRcdFx0XHR2YXIgbWluTWlub3JWZXJzaW9uID0gbWluVmVyc2lvbi5taW5vcjtcclxuXHJcblx0XHRcdFx0XHRpZiAoYnJvd3Nlck1ham9yVmVyc2lvbiA8IG1pbk1ham9yVmVyc2lvbikge1xyXG5cdFx0XHRcdFx0XHRpc091dE9mRGF0ZSA9IHRydWVcclxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoYnJvd3Nlck1ham9yVmVyc2lvbiA9PSBtaW5NYWpvclZlcnNpb24pIHtcclxuXHRcdFx0XHRcdFx0dmFyIGJyb3dzZXJNaW5vclZlcnNpb24gPSBwYXJzZU1pbm9yVmVyc2lvbihwYXJzZWRVc2VyQWdlbnQuYnJvd3Nlci52ZXJzaW9uKVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGJyb3dzZXJNaW5vclZlcnNpb24gPCBtaW5NaW5vclZlcnNpb24pIHtcclxuXHRcdFx0XHRcdFx0XHRpc091dE9mRGF0ZSA9IHRydWVcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0gZWxzZSBpZiAoYnJvd3Nlck1ham9yVmVyc2lvbiA8IG1pblZlcnNpb24pIHtcclxuXHRcdFx0XHRcdGlzT3V0T2ZEYXRlID0gdHJ1ZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gaXNPdXRPZkRhdGVcclxuXHRcdH1cclxuXHJcblx0XHQvLyBSZXR1cm5zIHRydWUgaWYgYSBicm93c2VyIHN1cHBvcnRzIGEgY3NzMyBwcm9wZXJ0eVxyXG5cdFx0dmFyIGlzUHJvcGVydHlTdXBwb3J0ZWQgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG5cdFx0XHRpZiAoIXByb3BlcnR5KSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxyXG5cdFx0XHR2YXIgdmVuZG9yUHJlZml4ZXMgPSBbXCJraHRtbFwiLCBcIm1zXCIsIFwib1wiLCBcIm1velwiLCBcIndlYmtpdFwiXVxyXG5cdFx0XHR2YXIgY291bnQgPSB2ZW5kb3JQcmVmaXhlcy5sZW5ndGhcclxuXHJcblx0XHRcdC8vIE5vdGU6IEhUTUxFbGVtZW50LnN0eWxlLmhhc093blByb3BlcnR5IHNlZW1zIGJyb2tlbiBpbiBFZGdlXHJcblx0XHRcdGlmIChwcm9wZXJ0eSBpbiBkaXYuc3R5bGUpIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRwcm9wZXJ0eSA9IHByb3BlcnR5LnJlcGxhY2UoL15bYS16XS8sIGZ1bmN0aW9uKHZhbCkge1xyXG5cdFx0XHRcdHJldHVybiB2YWwudG9VcHBlckNhc2UoKVxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0d2hpbGUgKGNvdW50LS0pIHtcclxuXHRcdFx0XHR2YXIgcHJlZml4ZWRQcm9wZXJ0eSA9IHZlbmRvclByZWZpeGVzW2NvdW50XSArIHByb3BlcnR5XHJcblx0XHRcdFx0Ly8gU2VlIGNvbW1lbnQgcmU6IEhUTUxFbGVtZW50LnN0eWxlLmhhc093blByb3BlcnR5IGFib3ZlXHJcblx0XHRcdFx0aWYgKHByZWZpeGVkUHJvcGVydHkgaW4gZGl2LnN0eWxlKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgbWFrZUZhZGVJbkZ1bmN0aW9uID0gZnVuY3Rpb24ob3BhY2l0eVZhbHVlKSB7XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRmYWRlSW4ob3BhY2l0eVZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gU3R5bGUgZWxlbWVudCBleHBsaWNpdGx5IC0gVE9ETzogaW52ZXN0aWdhdGUgYW5kIGRlbGV0ZSBpZiBub3QgbmVlZGVkXHJcblx0XHR2YXIgc3RhcnRTdHlsZXNBbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGJ1dHRvbkNsb3NlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJidXR0b25DbG9zZVVwZGF0ZUJyb3dzZXJcIilcclxuXHRcdFx0dmFyIGJ1dHRvblVwZGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnV0dG9uVXBkYXRlQnJvd3NlclwiKVxyXG5cclxuXHRcdFx0Ly9jaGVjayBzZXR0aW5ncyBhdHRyaWJ1dGVzXHJcblx0XHRcdG91dGRhdGVkVUkuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gYmFja2dyb3VuZENvbG9yXHJcblx0XHRcdC8vd2F5IHRvbyBoYXJkIHRvIHB1dCAhaW1wb3J0YW50IG9uIElFNlxyXG5cdFx0XHRvdXRkYXRlZFVJLnN0eWxlLmNvbG9yID0gdGV4dENvbG9yXHJcblx0XHRcdG91dGRhdGVkVUkuY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0uc3R5bGUuY29sb3IgPSB0ZXh0Q29sb3JcclxuXHRcdFx0b3V0ZGF0ZWRVSS5jaGlsZHJlblswXS5jaGlsZHJlblsxXS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxyXG5cclxuXHRcdFx0Ly8gVXBkYXRlIGJ1dHRvbiBpcyBkZXNrdG9wIG9ubHlcclxuXHRcdFx0aWYgKGJ1dHRvblVwZGF0ZSkge1xyXG5cdFx0XHRcdGJ1dHRvblVwZGF0ZS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxyXG5cdFx0XHRcdGlmIChidXR0b25VcGRhdGUuc3R5bGUuYm9yZGVyQ29sb3IpIHtcclxuXHRcdFx0XHRcdGJ1dHRvblVwZGF0ZS5zdHlsZS5ib3JkZXJDb2xvciA9IHRleHRDb2xvclxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly8gT3ZlcnJpZGUgdGhlIHVwZGF0ZSBidXR0b24gY29sb3IgdG8gbWF0Y2ggdGhlIGJhY2tncm91bmQgY29sb3JcclxuXHRcdFx0XHRidXR0b25VcGRhdGUub25tb3VzZW92ZXIgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHRoaXMuc3R5bGUuY29sb3IgPSBiYWNrZ3JvdW5kQ29sb3JcclxuXHRcdFx0XHRcdHRoaXMuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGV4dENvbG9yXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRidXR0b25VcGRhdGUub25tb3VzZW91dCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dGhpcy5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxyXG5cdFx0XHRcdFx0dGhpcy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBiYWNrZ3JvdW5kQ29sb3JcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGJ1dHRvbkNsb3NlLnN0eWxlLmNvbG9yID0gdGV4dENvbG9yXHJcblxyXG5cdFx0XHRidXR0b25DbG9zZS5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdG91dGRhdGVkVUkuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZ2V0bWVzc2FnZSA9IGZ1bmN0aW9uKGxhbmcpIHtcclxuXHRcdFx0dmFyIGRlZmF1bHRNZXNzYWdlcyA9IGxhbmd1YWdlTWVzc2FnZXNbbGFuZ10gfHwgbGFuZ3VhZ2VNZXNzYWdlcy5lblxyXG5cdFx0XHR2YXIgY3VzdG9tTWVzc2FnZXMgPSBvcHRpb25zLm1lc3NhZ2VzICYmIG9wdGlvbnMubWVzc2FnZXNbbGFuZ11cclxuXHRcdFx0dmFyIG1lc3NhZ2VzID0gZGVlcEV4dGVuZCh7fSwgZGVmYXVsdE1lc3NhZ2VzLCBjdXN0b21NZXNzYWdlcylcclxuXHJcblx0XHRcdHZhciB1cGRhdGVNZXNzYWdlcyA9IHtcclxuXHRcdFx0XHR3ZWI6XHJcblx0XHRcdFx0XHRcIjxwPlwiICtcclxuXHRcdFx0XHRcdG1lc3NhZ2VzLnVwZGF0ZS53ZWIgK1xyXG5cdFx0XHRcdFx0KG1lc3NhZ2VzLnVybCA/IChcclxuXHRcdFx0XHRcdFx0JzxhIGlkPVwiYnV0dG9uVXBkYXRlQnJvd3NlclwiIHJlbD1cIm5vZm9sbG93XCIgaHJlZj1cIicgK1xyXG5cdFx0XHRcdFx0XHRtZXNzYWdlcy51cmwgK1xyXG5cdFx0XHRcdFx0XHQnXCI+JyArXHJcblx0XHRcdFx0XHRcdG1lc3NhZ2VzLmNhbGxUb0FjdGlvbiArXHJcblx0XHRcdFx0XHRcdFwiPC9hPlwiXHJcblx0XHRcdFx0XHQpIDogJycpICtcclxuXHRcdFx0XHRcdFwiPC9wPlwiLFxyXG5cdFx0XHRcdGdvb2dsZVBsYXk6XHJcblx0XHRcdFx0XHRcIjxwPlwiICtcclxuXHRcdFx0XHRcdG1lc3NhZ2VzLnVwZGF0ZS5nb29nbGVQbGF5ICtcclxuXHRcdFx0XHRcdCc8YSBpZD1cImJ1dHRvblVwZGF0ZUJyb3dzZXJcIiByZWw9XCJub2ZvbGxvd1wiIGhyZWY9XCJodHRwczovL3BsYXkuZ29vZ2xlLmNvbS9zdG9yZS9hcHBzL2RldGFpbHM/aWQ9Y29tLmFuZHJvaWQuY2hyb21lXCI+JyArXHJcblx0XHRcdFx0XHRtZXNzYWdlcy5jYWxsVG9BY3Rpb24gK1xyXG5cdFx0XHRcdFx0XCI8L2E+PC9wPlwiLFxyXG5cdFx0XHRcdGFwcFN0b3JlOiBcIjxwPlwiICsgbWVzc2FnZXMudXBkYXRlW3VwZGF0ZVNvdXJjZV0gKyBcIjwvcD5cIlxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgdXBkYXRlTWVzc2FnZSA9IHVwZGF0ZU1lc3NhZ2VzW3VwZGF0ZVNvdXJjZV1cclxuXHJcblx0XHRcdHZhciBicm93c2VyU3VwcG9ydE1lc3NhZ2UgPSBtZXNzYWdlcy5vdXRPZkRhdGU7XHJcblx0XHRcdGlmIChpc0Jyb3dzZXJVbnN1cHBvcnRlZCgpICYmIG1lc3NhZ2VzLnVuc3VwcG9ydGVkKSB7XHJcblx0XHRcdFx0YnJvd3NlclN1cHBvcnRNZXNzYWdlID0gbWVzc2FnZXMudW5zdXBwb3J0ZWQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiAoXHJcblx0XHRcdFx0JzxkaXYgY2xhc3M9XCJ2ZXJ0aWNhbC1jZW50ZXJcIj48aDY+JyArXHJcblx0XHRcdFx0YnJvd3NlclN1cHBvcnRNZXNzYWdlICtcclxuXHRcdFx0XHRcIjwvaDY+XCIgK1xyXG5cdFx0XHRcdHVwZGF0ZU1lc3NhZ2UgK1xyXG5cdFx0XHRcdCc8cCBjbGFzcz1cImxhc3RcIj48YSBocmVmPVwiI1wiIGlkPVwiYnV0dG9uQ2xvc2VVcGRhdGVCcm93c2VyXCIgdGl0bGU9XCInICtcclxuXHRcdFx0XHRtZXNzYWdlcy5jbG9zZSArXHJcblx0XHRcdFx0J1wiPiZ0aW1lczs8L2E+PC9wPjwvZGl2PidcclxuXHRcdFx0KVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIENoZWNrIGlmIGJyb3dzZXIgaXMgc3VwcG9ydGVkXHJcblx0XHRpZiAoaXNCcm93c2VyT3V0T2ZEYXRlKCkgfHwgIWlzUHJvcGVydHlTdXBwb3J0ZWQocmVxdWlyZWRDc3NQcm9wZXJ0eSkgfHwgaXNBbmRyb2lkQnV0Tm90Q2hyb21lKSB7XHJcblx0XHRcdC8vIFRoaXMgaXMgYW4gb3V0ZGF0ZWQgYnJvd3NlclxyXG5cdFx0XHRpZiAoZG9uZSAmJiBvdXRkYXRlZFVJLnN0eWxlLm9wYWNpdHkgIT09IFwiMVwiKSB7XHJcblx0XHRcdFx0ZG9uZSA9IGZhbHNlXHJcblxyXG5cdFx0XHRcdGZvciAodmFyIG9wYWNpdHkgPSAxOyBvcGFjaXR5IDw9IDEwMDsgb3BhY2l0eSsrKSB7XHJcblx0XHRcdFx0XHRzZXRUaW1lb3V0KG1ha2VGYWRlSW5GdW5jdGlvbihvcGFjaXR5KSwgb3BhY2l0eSAqIDgpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgaW5zZXJ0Q29udGVudEhlcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm91dGRhdGVkXCIpXHJcblx0XHRcdGlmIChmdWxsc2NyZWVuKSB7XHJcblx0XHRcdFx0aW5zZXJ0Q29udGVudEhlcmUuY2xhc3NMaXN0LmFkZChcImZ1bGxzY3JlZW5cIilcclxuXHRcdFx0fVxyXG5cdFx0XHRpbnNlcnRDb250ZW50SGVyZS5pbm5lckhUTUwgPSBnZXRtZXNzYWdlKGxhbmd1YWdlKVxyXG5cdFx0XHRzdGFydFN0eWxlc0FuZEV2ZW50cygpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBMb2FkIG1haW4gd2hlbiBET00gcmVhZHkuXHJcblx0dmFyIG9sZE9ubG9hZCA9IHdpbmRvdy5vbmxvYWRcclxuXHRpZiAodHlwZW9mIHdpbmRvdy5vbmxvYWQgIT09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0d2luZG93Lm9ubG9hZCA9IG1haW5cclxuXHR9IGVsc2Uge1xyXG5cdFx0d2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpZiAob2xkT25sb2FkKSB7XHJcblx0XHRcdFx0b2xkT25sb2FkKClcclxuXHRcdFx0fVxyXG5cdFx0XHRtYWluKClcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHM9e1xyXG4gIFwiYnJcIjoge1xyXG4gICAgXCJvdXRPZkRhdGVcIjogXCJPIHNldSBuYXZlZ2Fkb3IgZXN0JmFhY3V0ZTsgZGVzYXR1YWxpemFkbyFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJBdHVhbGl6ZSBvIHNldSBuYXZlZ2Fkb3IgcGFyYSB0ZXIgdW1hIG1lbGhvciBleHBlcmkmZWNpcmM7bmNpYSBlIHZpc3VhbGl6YSZjY2VkaWw7JmF0aWxkZTtvIGRlc3RlIHNpdGUuIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL2JyXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIkF0dWFsaXplIG8gc2V1IG5hdmVnYWRvciBhZ29yYVwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIkZlY2hhclwiXHJcbiAgfSxcclxuICBcImNhXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiRWwgdm9zdHJlIG5hdmVnYWRvciBubyBlc3TDoCBhY3R1YWxpdHphdCFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJBY3R1YWxpdHpldSBlbCB2b3N0cmUgbmF2ZWdhZG9yIHBlciB2ZXVyZSBjb3JyZWN0YW1lbnQgYXF1ZXN0IGxsb2Mgd2ViLiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiSW5zdGFswrdsZXUgQ2hyb21lIGRlcyBkZSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiQWN0dWFsaXR6ZXUgaU9TIGRlcyBkZSBsJ2FwbGljYWNpw7MgQ29uZmlndXJhY2nDs1wiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9lc1wiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJBY3R1YWxpdHphciBlbCBtZXUgbmF2ZWdhZG9yIGFyYVwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIlRhbmNhclwiXHJcbiAgfSxcclxuICBcImNuXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwi5oKo55qE5rWP6KeI5Zmo5bey6L+H5pe2XCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwi6KaB5q2j5bi45rWP6KeI5pys572R56uZ6K+35Y2H57qn5oKo55qE5rWP6KeI5Zmo44CCXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vY25cIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwi546w5Zyo5Y2H57qnXCIsXHJcbiAgICBcImNsb3NlXCI6IFwi5YWz6ZetXCJcclxuICB9LFxyXG4gIFwiY3pcIjoge1xyXG4gICAgXCJvdXRPZkRhdGVcIjogXCJWw6HFoSBwcm9obMOtxb5lxI0gamUgemFzdGFyYWzDvSFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJQcm8gc3Byw6F2bsOpIHpvYnJhemVuw60gdMSbY2h0byBzdHLDoW5layBha3R1YWxpenVqdGUgc3bFr2ogcHJvaGzDrcW+ZcSNLiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiTmFpbnN0YWx1anRlIHNpIENocm9tZSB6IEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJBa3R1YWxpenVqdGUgc2kgc3lzdMOpbSBpT1NcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vY3pcIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiQWt0dWFsaXpvdmF0IG55bsOtIHN2xa9qIHByb2hsw63FvmXEjVwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIlphdsWZw610XCJcclxuICB9LFxyXG4gICBcImRhXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiRGluIGJyb3dzZXIgZXIgZm9yw6ZsZGV0IVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIk9wZGF0w6lyIGRpbiBicm93c2VyIGZvciBhdCBmw6UgdmlzdCBkZW5uZSBoamVtbWVzaWRlIGtvcnJla3QuIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJJbnN0YWxsw6lyIHZlbmxpZ3N0IENocm9tZSBmcmEgR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIk9wZGF0w6lyIHZlbmxpZ3N0IGlPU1wiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9kYVwiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJPcGRhdMOpciBkaW4gYnJvd3NlciBudVwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIkx1a1wiXHJcbiAgfSxcclxuICBcImRlXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiSWhyIEJyb3dzZXIgaXN0IHZlcmFsdGV0IVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIkJpdHRlIGFrdHVhbGlzaWVyZW4gU2llIElocmVuIEJyb3dzZXIsIHVtIGRpZXNlIFdlYnNpdGUga29ycmVrdCBkYXJ6dXN0ZWxsZW4uIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL2RlXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIkRlbiBCcm93c2VyIGpldHp0IGFrdHVhbGlzaWVyZW4gXCIsXHJcbiAgICBcImNsb3NlXCI6IFwiU2NobGllw59lblwiXHJcbiAgfSxcclxuICBcImVlXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiU2ludSB2ZWViaWxlaGl0c2VqYSBvbiB2YW5hbmVudWQhXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiUGFsdW4gdXVlbmRhIG9tYSB2ZWViaWxlaGl0c2VqYXQsIGV0IG7DpGhhIGxlaGVrw7xsZ2Uga29ycmVrdHNlbHQuIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL2VlXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIlV1ZW5kYSBvbWEgdmVlYmlsZWhpdHNlamF0IGtvaGVcIixcclxuICAgIFwiY2xvc2VcIjogXCJTdWxnZVwiXHJcbiAgfSxcclxuICBcImVuXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiWW91ciBicm93c2VyIGlzIG91dC1vZi1kYXRlIVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIlVwZGF0ZSB5b3VyIGJyb3dzZXIgdG8gdmlldyB0aGlzIHdlYnNpdGUgY29ycmVjdGx5LiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9cIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiVXBkYXRlIG15IGJyb3dzZXIgbm93XCIsXHJcbiAgICBcImNsb3NlXCI6IFwiQ2xvc2VcIlxyXG4gIH0sXHJcbiAgXCJlc1wiOiB7XHJcbiAgICBcIm91dE9mRGF0ZVwiOiBcIsKhVHUgbmF2ZWdhZG9yIGVzdMOhIGFudGljdWFkbyFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJBY3R1YWxpemEgdHUgbmF2ZWdhZG9yIHBhcmEgdmVyIGVzdGEgcMOhZ2luYSBjb3JyZWN0YW1lbnRlLiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9lc1wiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJBY3R1YWxpemFyIG1pIG5hdmVnYWRvciBhaG9yYVwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIkNlcnJhclwiXHJcbiAgfSxcclxuICBcImZhXCI6IHtcclxuICAgIFwicmlnaHRUb0xlZnRcIjogdHJ1ZSxcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwi2YXYsdmI2LHar9ixINi02YXYpyDZhdmG2LPZiNiuINi02K/ZhyDYp9iz2KohXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwi2KzZh9iqINmF2LTYp9mH2K/ZhyDYtdit24zYrSDYp9uM2YYg2YjYqNiz2KfbjNiq2Iwg2YXYsdmI2LHar9ix2KrYp9mGINix2Kcg2KjYsdmI2LIg2LHYs9in2YbbjCDZhtmF2KfbjNuM2K8uIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL1wiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCLZh9mF24zZhiDYrdin2YTYpyDZhdix2YjYsdqv2LHZhSDYsdinINio2LHZiNiyINqp2YZcIixcclxuICAgIFwiY2xvc2VcIjogXCJDbG9zZVwiXHJcbiAgfSxcclxuICBcImZpXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiU2VsYWltZXNpIG9uIHZhbmhlbnR1bnV0IVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIkxhdGFhIGFqYW50YXNhaW5lbiBzZWxhaW4gbiZhdW1sO2hkJmF1bWw7a3Nlc2kgdCZhdW1sO20mYXVtbDtuIHNpdnVuIG9pa2Vpbi4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIkFzZW5uYSB1dXNpbiBDaHJvbWUgR29vZ2xlIFBsYXkgLWthdXBhc3RhXCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQw6Rpdml0w6QgaU9TIHB1aGVsaW1lc2kgYXNldHVrc2lzdGFcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vZmlcIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiUCZhdW1sO2l2aXQmYXVtbDsgc2VsYWltZW5pIG55dCBcIixcclxuICAgIFwiY2xvc2VcIjogXCJTdWxqZVwiXHJcbiAgfSxcclxuICBcImZyXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiVm90cmUgbmF2aWdhdGV1ciBuJ2VzdCBwbHVzIGNvbXBhdGlibGUgIVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIk1ldHRleiDDoCBqb3VyIHZvdHJlIG5hdmlnYXRldXIgcG91ciBhZmZpY2hlciBjb3JyZWN0ZW1lbnQgY2Ugc2l0ZSBXZWIuIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJNZXJjaSBkJ2luc3RhbGxlciBDaHJvbWUgZGVwdWlzIGxlIEdvb2dsZSBQbGF5IFN0b3JlXCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJNZXJjaSBkZSBtZXR0cmUgw6Agam91ciBpT1MgZGVwdWlzIGwnYXBwbGljYXRpb24gUsOpZ2xhZ2VzXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL2ZyXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIk1ldHRyZSDDoCBqb3VyIG1haW50ZW5hbnQgXCIsXHJcbiAgICBcImNsb3NlXCI6IFwiRmVybWVyXCJcclxuICB9LFxyXG4gIFwiaHVcIjoge1xyXG4gICAgXCJvdXRPZkRhdGVcIjogXCJBIGLDtm5nw6lzesWRamUgZWxhdnVsdCFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJGaXJzc8OtdHNlIHZhZ3kgY3NlcsOpbGplIGxlIGEgYsO2bmfDqXN6xZFqw6l0LiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9odVwiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJBIGLDtm5nw6lzesWRbSBmcmlzc8OtdMOpc2UgXCIsXHJcbiAgICBcImNsb3NlXCI6IFwiQ2xvc2VcIlxyXG4gIH0sXHJcbiAgXCJpZFwiOntcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiQnJvd3NlciB5YW5nIEFuZGEgZ3VuYWthbiBzdWRhaCBrZXRpbmdnYWxhbiB6YW1hbiFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJQZXJiYWhhcnVpbGFoIGJyb3dzZXIgQW5kYSBhZ2FyIGJpc2EgbWVuamVsYWphaGkgd2Vic2l0ZSBpbmkgZGVuZ2FuIG55YW1hbi4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIlBlcmJhaGFydWkgYnJvd3NlciBzZWthcmFuZyBcIixcclxuICAgIFwiY2xvc2VcIjogXCJDbG9zZVwiXHJcbiAgfSxcclxuICBcIml0XCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiSWwgdHVvIGJyb3dzZXIgbm9uICZlZ3JhdmU7IGFnZ2lvcm5hdG8hXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiQWdnaW9ybmFsbyBwZXIgdmVkZXJlIHF1ZXN0byBzaXRvIGNvcnJldHRhbWVudGUuIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL2l0XCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIkFnZ2lvcm5hIG9yYVwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIkNoaXVkaVwiXHJcbiAgfSxcclxuICBcImx0XCI6e1xyXG4gICAgXCJvdXRPZkRhdGVcIjogXCJKxatzxbMgbmFyxaF5a2zEl3MgdmVyc2lqYSB5cmEgcGFzZW51c2khXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiQXRuYXVqaW5raXRlIHNhdm8gbmFyxaF5a2zEmSwga2FkIGdhbMSXdHVtxJd0ZSBwZXLFvmnFq3LEl3RpIMWhacSFIHN2ZXRhaW7EmSB0aW5rYW1haS4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIkF0bmF1amludGkgbmFyxaF5a2zEmSBcIixcclxuICAgIFwiY2xvc2VcIjogXCJDbG9zZVwiXHJcbiAgfSxcclxuICBcIm5sXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiSmUgZ2VicnVpa3QgZWVuIG91ZGUgYnJvd3NlciFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJVcGRhdGUgamUgYnJvd3NlciBvbSBkZXplIHdlYnNpdGUgY29ycmVjdCB0ZSBiZWtpamtlbi4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vbmxcIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiVXBkYXRlIG1pam4gYnJvd3NlciBudSBcIixcclxuICAgIFwiY2xvc2VcIjogXCJTbHVpdGVuXCJcclxuICB9LFxyXG4gIFwicGxcIjoge1xyXG4gICAgXCJvdXRPZkRhdGVcIjogXCJUd29qYSBwcnplZ2zEhWRhcmthIGplc3QgcHJ6ZXN0YXJ6YcWCYSFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJaYWt0dWFsaXp1aiBzd29qxIUgcHJ6ZWdsxIVkYXJrxJksIGFieSBwb3ByYXduaWUgd3nFm3dpZXRsacSHIHTEmSBzdHJvbsSZLiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUHJvc3rEmSB6YWluc3RhbG93YcSHIHByemVnbMSFZGFya8SZIENocm9tZSB6ZSBza2xlcHUgR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlByb3N6xJkgemFrdHVhbGl6b3dhxIcgaU9TIHogVXN0YXdpZcWEXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL3BsXCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIlpha3R1YWxpenVqIHByemVnbMSFZGFya8SZIGp1xbwgdGVyYXpcIixcclxuICAgIFwiY2xvc2VcIjogXCJaYW1rbmlqXCJcclxuICB9LFxyXG4gIFwicHRcIjoge1xyXG4gICAgXCJvdXRPZkRhdGVcIjogXCJPIHNldSBicm93c2VyIGVzdCZhYWN1dGU7IGRlc2F0dWFsaXphZG8hXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwiQXR1YWxpemUgbyBzZXUgYnJvd3NlciBwYXJhIHRlciB1bWEgbWVsaG9yIGV4cGVyaSZlY2lyYztuY2lhIGUgdmlzdWFsaXphJmNjZWRpbDsmYXRpbGRlO28gZGVzdGUgc2l0ZS4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vcHRcIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiQXR1YWxpemUgbyBzZXUgYnJvd3NlciBhZ29yYVwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIkZlY2hhclwiXHJcbiAgfSxcclxuICBcInJvXCI6IHtcclxuICAgIFwib3V0T2ZEYXRlXCI6IFwiQnJvd3NlcnVsIGVzdGUgw65udmVjaGl0IVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIkFjdHVhbGl6YcibaSBicm93c2VydWwgcGVudHJ1IGEgdml6dWFsaXphIGNvcmVjdCBhY2VzdCBzaXRlLiBcIixcclxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcclxuICAgICAgXCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXHJcbiAgICB9LFxyXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vb3V0ZGF0ZWRicm93c2VyLmNvbS9cIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiQWN0dWFsaXphyJtpIGJyb3dzZXJ1bCBhY3VtIVwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIkNsb3NlXCJcclxuICB9LFxyXG4gIFwicnVcIjoge1xyXG4gICAgXCJvdXRPZkRhdGVcIjogXCLQktCw0Ygg0LHRgNCw0YPQt9C10YAg0YPRgdGC0LDRgNC10LshXCIsXHJcbiAgICBcInVwZGF0ZVwiOiB7XHJcbiAgICAgIFwid2ViXCI6IFwi0J7QsdC90L7QstC40YLQtSDQstCw0Ygg0LHRgNCw0YPQt9C10YAg0LTQu9GPINC/0YDQsNCy0LjQu9GM0L3QvtCz0L4g0L7RgtC+0LHRgNCw0LbQtdC90LjRjyDRjdGC0L7Qs9C+INGB0LDQudGC0LAuIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL3J1XCIsXHJcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcItCe0LHQvdC+0LLQuNGC0Ywg0LzQvtC5INCx0YDQsNGD0LfQtdGAIFwiLFxyXG4gICAgXCJjbG9zZVwiOiBcItCX0LDQutGA0YvRgtGMXCJcclxuICB9LFxyXG4gIFwic2lcIjoge1xyXG4gICAgXCJvdXRPZkRhdGVcIjogXCJWYcWhIGJyc2thbG5payBqZSB6YXN0YXJlbCFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCJaYSBwcmF2aWxlbiBwcmlrYXogc3BsZXRuZSBzdHJhbmkgcG9zb2RvYml0ZSB2YcWhIGJyc2thbG5pay4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vc2lcIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwiUG9zb2RvYmkgYnJza2FsbmlrIFwiLFxyXG4gICAgXCJjbG9zZVwiOiBcIlphcHJpXCJcclxuICB9LFxyXG4gIFwic3ZcIjoge1xyXG4gICAgXCJvdXRPZkRhdGVcIjogXCJEaW4gd2ViYmzDpHNhcmUgc3TDtmRqcyBlaiBsw6RuZ3JlIVwiLFxyXG4gICAgXCJ1cGRhdGVcIjoge1xyXG4gICAgICBcIndlYlwiOiBcIlVwcGRhdGVyYSBkaW4gd2ViYmzDpHNhcmUgZsO2ciBhdHQgd2ViYnBsYXRzZW4gc2thIHZpc2FzIGtvcnJla3QuIFwiLFxyXG4gICAgICBcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxyXG4gICAgICBcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcclxuICAgIH0sXHJcbiAgICBcInVybFwiOiBcImh0dHA6Ly9vdXRkYXRlZGJyb3dzZXIuY29tL1wiLFxyXG4gICAgXCJjYWxsVG9BY3Rpb25cIjogXCJVcHBkYXRlcmEgbWluIHdlYmJsw6RzYXJlIG51XCIsXHJcbiAgICBcImNsb3NlXCI6IFwiU3TDpG5nXCJcclxuICB9LFxyXG4gIFwidWFcIjoge1xyXG4gICAgXCJvdXRPZkRhdGVcIjogXCLQktCw0Ygg0LHRgNCw0YPQt9C10YAg0LfQsNGB0YLQsNGA0ZbQsiFcIixcclxuICAgIFwidXBkYXRlXCI6IHtcclxuICAgICAgXCJ3ZWJcIjogXCLQntC90L7QstGW0YLRjCDQstCw0Ygg0LHRgNCw0YPQt9C10YAg0LTQu9GPINC/0YDQsNCy0LjQu9GM0L3QvtCz0L4g0LLRltC00L7QsdGA0LDQttC10L3QvdGPINGG0YzQvtCz0L4g0YHQsNC50YLQsC4gXCIsXHJcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXHJcbiAgICAgIFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxyXG4gICAgfSxcclxuICAgIFwidXJsXCI6IFwiaHR0cDovL291dGRhdGVkYnJvd3Nlci5jb20vdWFcIixcclxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwi0J7QvdC+0LLQuNGC0Lgg0LzRltC5INCx0YDQsNGD0LfQtdGAIFwiLFxyXG4gICAgXCJjbG9zZVwiOiBcItCX0LDQutGA0LjRgtC4XCJcclxuICB9XHJcbn1cclxuIiwiLyohXG4gKiBVQVBhcnNlci5qcyB2MC43LjIwXG4gKiBMaWdodHdlaWdodCBKYXZhU2NyaXB0LWJhc2VkIFVzZXItQWdlbnQgc3RyaW5nIHBhcnNlclxuICogaHR0cHM6Ly9naXRodWIuY29tL2ZhaXNhbG1hbi91YS1wYXJzZXItanNcbiAqXG4gKiBDb3B5cmlnaHQgwqkgMjAxMi0yMDE5IEZhaXNhbCBTYWxtYW4gPGZAZmFpc2FsbWFuLmNvbT5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCBMaWNlbnNlXG4gKi9cblxuKGZ1bmN0aW9uICh3aW5kb3csIHVuZGVmaW5lZCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBDb25zdGFudHNcbiAgICAvLy8vLy8vLy8vLy8vXG5cblxuICAgIHZhciBMSUJWRVJTSU9OICA9ICcwLjcuMjAnLFxuICAgICAgICBFTVBUWSAgICAgICA9ICcnLFxuICAgICAgICBVTktOT1dOICAgICA9ICc/JyxcbiAgICAgICAgRlVOQ19UWVBFICAgPSAnZnVuY3Rpb24nLFxuICAgICAgICBVTkRFRl9UWVBFICA9ICd1bmRlZmluZWQnLFxuICAgICAgICBPQkpfVFlQRSAgICA9ICdvYmplY3QnLFxuICAgICAgICBTVFJfVFlQRSAgICA9ICdzdHJpbmcnLFxuICAgICAgICBNQUpPUiAgICAgICA9ICdtYWpvcicsIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgTU9ERUwgICAgICAgPSAnbW9kZWwnLFxuICAgICAgICBOQU1FICAgICAgICA9ICduYW1lJyxcbiAgICAgICAgVFlQRSAgICAgICAgPSAndHlwZScsXG4gICAgICAgIFZFTkRPUiAgICAgID0gJ3ZlbmRvcicsXG4gICAgICAgIFZFUlNJT04gICAgID0gJ3ZlcnNpb24nLFxuICAgICAgICBBUkNISVRFQ1RVUkU9ICdhcmNoaXRlY3R1cmUnLFxuICAgICAgICBDT05TT0xFICAgICA9ICdjb25zb2xlJyxcbiAgICAgICAgTU9CSUxFICAgICAgPSAnbW9iaWxlJyxcbiAgICAgICAgVEFCTEVUICAgICAgPSAndGFibGV0JyxcbiAgICAgICAgU01BUlRUViAgICAgPSAnc21hcnR0dicsXG4gICAgICAgIFdFQVJBQkxFICAgID0gJ3dlYXJhYmxlJyxcbiAgICAgICAgRU1CRURERUQgICAgPSAnZW1iZWRkZWQnO1xuXG5cbiAgICAvLy8vLy8vLy8vL1xuICAgIC8vIEhlbHBlclxuICAgIC8vLy8vLy8vLy9cblxuXG4gICAgdmFyIHV0aWwgPSB7XG4gICAgICAgIGV4dGVuZCA6IGZ1bmN0aW9uIChyZWdleGVzLCBleHRlbnNpb25zKSB7XG4gICAgICAgICAgICB2YXIgbWVyZ2VkUmVnZXhlcyA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgaSBpbiByZWdleGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4dGVuc2lvbnNbaV0gJiYgZXh0ZW5zaW9uc1tpXS5sZW5ndGggJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lcmdlZFJlZ2V4ZXNbaV0gPSBleHRlbnNpb25zW2ldLmNvbmNhdChyZWdleGVzW2ldKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZWRSZWdleGVzW2ldID0gcmVnZXhlc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkUmVnZXhlcztcbiAgICAgICAgfSxcbiAgICAgICAgaGFzIDogZnVuY3Rpb24gKHN0cjEsIHN0cjIpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIHN0cjEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHIyLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihzdHIxLnRvTG93ZXJDYXNlKCkpICE9PSAtMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbG93ZXJpemUgOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH0sXG4gICAgICAgIG1ham9yIDogZnVuY3Rpb24gKHZlcnNpb24pIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YodmVyc2lvbikgPT09IFNUUl9UWVBFID8gdmVyc2lvbi5yZXBsYWNlKC9bXlxcZFxcLl0vZywnJykuc3BsaXQoXCIuXCIpWzBdIDogdW5kZWZpbmVkO1xuICAgICAgICB9LFxuICAgICAgICB0cmltIDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvXltcXHNcXHVGRUZGXFx4QTBdK3xbXFxzXFx1RkVGRlxceEEwXSskL2csICcnKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIC8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIE1hcCBoZWxwZXJcbiAgICAvLy8vLy8vLy8vLy8vL1xuXG5cbiAgICB2YXIgbWFwcGVyID0ge1xuXG4gICAgICAgIHJneCA6IGZ1bmN0aW9uICh1YSwgYXJyYXlzKSB7XG5cbiAgICAgICAgICAgIHZhciBpID0gMCwgaiwgaywgcCwgcSwgbWF0Y2hlcywgbWF0Y2g7XG5cbiAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCBhbGwgcmVnZXhlcyBtYXBzXG4gICAgICAgICAgICB3aGlsZSAoaSA8IGFycmF5cy5sZW5ndGggJiYgIW1hdGNoZXMpIHtcblxuICAgICAgICAgICAgICAgIHZhciByZWdleCA9IGFycmF5c1tpXSwgICAgICAgLy8gZXZlbiBzZXF1ZW5jZSAoMCwyLDQsLi4pXG4gICAgICAgICAgICAgICAgICAgIHByb3BzID0gYXJyYXlzW2kgKyAxXTsgICAvLyBvZGQgc2VxdWVuY2UgKDEsMyw1LC4uKVxuICAgICAgICAgICAgICAgIGogPSBrID0gMDtcblxuICAgICAgICAgICAgICAgIC8vIHRyeSBtYXRjaGluZyB1YXN0cmluZyB3aXRoIHJlZ2V4ZXNcbiAgICAgICAgICAgICAgICB3aGlsZSAoaiA8IHJlZ2V4Lmxlbmd0aCAmJiAhbWF0Y2hlcykge1xuXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMgPSByZWdleFtqKytdLmV4ZWModWEpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghIW1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAocCA9IDA7IHAgPCBwcm9wcy5sZW5ndGg7IHArKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoID0gbWF0Y2hlc1srK2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEgPSBwcm9wc1twXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBnaXZlbiBwcm9wZXJ0eSBpcyBhY3R1YWxseSBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcSA9PT0gT0JKX1RZUEUgJiYgcS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHFbMV0gPT0gRlVOQ19UWVBFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXNzaWduIG1vZGlmaWVkIG1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1txWzBdXSA9IHFbMV0uY2FsbCh0aGlzLCBtYXRjaCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzc2lnbiBnaXZlbiB2YWx1ZSwgaWdub3JlIHJlZ2V4IG1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1txWzBdXSA9IHFbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocS5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgd2hldGhlciBmdW5jdGlvbiBvciByZWdleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBxWzFdID09PSBGVU5DX1RZUEUgJiYgIShxWzFdLmV4ZWMgJiYgcVsxXS50ZXN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhbGwgZnVuY3Rpb24gKHVzdWFsbHkgc3RyaW5nIG1hcHBlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3FbMF1dID0gbWF0Y2ggPyBxWzFdLmNhbGwodGhpcywgbWF0Y2gsIHFbMl0pIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzYW5pdGl6ZSBtYXRjaCB1c2luZyBnaXZlbiByZWdleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcVswXV0gPSBtYXRjaCA/IG1hdGNoLnJlcGxhY2UocVsxXSwgcVsyXSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocS5sZW5ndGggPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcVswXV0gPSBtYXRjaCA/IHFbM10uY2FsbCh0aGlzLCBtYXRjaC5yZXBsYWNlKHFbMV0sIHFbMl0pKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcV0gPSBtYXRjaCA/IG1hdGNoIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpICs9IDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RyIDogZnVuY3Rpb24gKHN0ciwgbWFwKSB7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgaW4gbWFwKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgYXJyYXlcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hcFtpXSA9PT0gT0JKX1RZUEUgJiYgbWFwW2ldLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBtYXBbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1dGlsLmhhcyhtYXBbaV1bal0sIHN0cikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGkgPT09IFVOS05PV04pID8gdW5kZWZpbmVkIDogaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodXRpbC5oYXMobWFwW2ldLCBzdHIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoaSA9PT0gVU5LTk9XTikgPyB1bmRlZmluZWQgOiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBTdHJpbmcgbWFwXG4gICAgLy8vLy8vLy8vLy8vLy9cblxuXG4gICAgdmFyIG1hcHMgPSB7XG5cbiAgICAgICAgYnJvd3NlciA6IHtcbiAgICAgICAgICAgIG9sZHNhZmFyaSA6IHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uIDoge1xuICAgICAgICAgICAgICAgICAgICAnMS4wJyAgIDogJy84JyxcbiAgICAgICAgICAgICAgICAgICAgJzEuMicgICA6ICcvMScsXG4gICAgICAgICAgICAgICAgICAgICcxLjMnICAgOiAnLzMnLFxuICAgICAgICAgICAgICAgICAgICAnMi4wJyAgIDogJy80MTInLFxuICAgICAgICAgICAgICAgICAgICAnMi4wLjInIDogJy80MTYnLFxuICAgICAgICAgICAgICAgICAgICAnMi4wLjMnIDogJy80MTcnLFxuICAgICAgICAgICAgICAgICAgICAnMi4wLjQnIDogJy80MTknLFxuICAgICAgICAgICAgICAgICAgICAnPycgICAgIDogJy8nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGRldmljZSA6IHtcbiAgICAgICAgICAgIGFtYXpvbiA6IHtcbiAgICAgICAgICAgICAgICBtb2RlbCA6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0ZpcmUgUGhvbmUnIDogWydTRCcsICdLRiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwcmludCA6IHtcbiAgICAgICAgICAgICAgICBtb2RlbCA6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0V2byBTaGlmdCA0RycgOiAnNzM3M0tUJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdmVuZG9yIDoge1xuICAgICAgICAgICAgICAgICAgICAnSFRDJyAgICAgICA6ICdBUEEnLFxuICAgICAgICAgICAgICAgICAgICAnU3ByaW50JyAgICA6ICdTcHJpbnQnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9zIDoge1xuICAgICAgICAgICAgd2luZG93cyA6IHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uIDoge1xuICAgICAgICAgICAgICAgICAgICAnTUUnICAgICAgICA6ICc0LjkwJyxcbiAgICAgICAgICAgICAgICAgICAgJ05UIDMuMTEnICAgOiAnTlQzLjUxJyxcbiAgICAgICAgICAgICAgICAgICAgJ05UIDQuMCcgICAgOiAnTlQ0LjAnLFxuICAgICAgICAgICAgICAgICAgICAnMjAwMCcgICAgICA6ICdOVCA1LjAnLFxuICAgICAgICAgICAgICAgICAgICAnWFAnICAgICAgICA6IFsnTlQgNS4xJywgJ05UIDUuMiddLFxuICAgICAgICAgICAgICAgICAgICAnVmlzdGEnICAgICA6ICdOVCA2LjAnLFxuICAgICAgICAgICAgICAgICAgICAnNycgICAgICAgICA6ICdOVCA2LjEnLFxuICAgICAgICAgICAgICAgICAgICAnOCcgICAgICAgICA6ICdOVCA2LjInLFxuICAgICAgICAgICAgICAgICAgICAnOC4xJyAgICAgICA6ICdOVCA2LjMnLFxuICAgICAgICAgICAgICAgICAgICAnMTAnICAgICAgICA6IFsnTlQgNi40JywgJ05UIDEwLjAnXSxcbiAgICAgICAgICAgICAgICAgICAgJ1JUJyAgICAgICAgOiAnQVJNJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIC8vLy8vLy8vLy8vLy8vXG4gICAgLy8gUmVnZXggbWFwXG4gICAgLy8vLy8vLy8vLy8vL1xuXG5cbiAgICB2YXIgcmVnZXhlcyA9IHtcblxuICAgICAgICBicm93c2VyIDogW1tcblxuICAgICAgICAgICAgLy8gUHJlc3RvIGJhc2VkXG4gICAgICAgICAgICAvKG9wZXJhXFxzbWluaSlcXC8oW1xcd1xcLi1dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSBNaW5pXG4gICAgICAgICAgICAvKG9wZXJhXFxzW21vYmlsZXRhYl0rKS4rdmVyc2lvblxcLyhbXFx3XFwuLV0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSBNb2JpL1RhYmxldFxuICAgICAgICAgICAgLyhvcGVyYSkuK3ZlcnNpb25cXC8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSA+IDkuODBcbiAgICAgICAgICAgIC8ob3BlcmEpW1xcL1xcc10rKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIDwgOS44MFxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8ob3Bpb3MpW1xcL1xcc10rKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIG1pbmkgb24gaXBob25lID49IDguMFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnT3BlcmEgTWluaSddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvXFxzKG9wcilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSBXZWJraXRcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ09wZXJhJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8vIE1peGVkXG4gICAgICAgICAgICAvKGtpbmRsZSlcXC8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtpbmRsZVxuICAgICAgICAgICAgLyhsdW5hc2NhcGV8bWF4dGhvbnxuZXRmcm9udHxqYXNtaW5lfGJsYXplcilbXFwvXFxzXT8oW1xcd1xcLl0qKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMdW5hc2NhcGUvTWF4dGhvbi9OZXRmcm9udC9KYXNtaW5lL0JsYXplclxuXG4gICAgICAgICAgICAvLyBUcmlkZW50IGJhc2VkXG4gICAgICAgICAgICAvKGF2YW50XFxzfGllbW9iaWxlfHNsaW18YmFpZHUpKD86YnJvd3Nlcik/W1xcL1xcc10/KFtcXHdcXC5dKikvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXZhbnQvSUVNb2JpbGUvU2xpbUJyb3dzZXIvQmFpZHVcbiAgICAgICAgICAgIC8oPzptc3xcXCgpKGllKVxccyhbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludGVybmV0IEV4cGxvcmVyXG5cbiAgICAgICAgICAgIC8vIFdlYmtpdC9LSFRNTCBiYXNlZFxuICAgICAgICAgICAgLyhyZWtvbnEpXFwvKFtcXHdcXC5dKikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZWtvbnFcbiAgICAgICAgICAgIC8oY2hyb21pdW18ZmxvY2t8cm9ja21lbHR8bWlkb3JpfGVwaXBoYW55fHNpbGt8c2t5ZmlyZXxvdmlicm93c2VyfGJvbHR8aXJvbnx2aXZhbGRpfGlyaWRpdW18cGhhbnRvbWpzfGJvd3NlcnxxdWFya3xxdXB6aWxsYXxmYWxrb24pXFwvKFtcXHdcXC4tXSspL2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hyb21pdW0vRmxvY2svUm9ja01lbHQvTWlkb3JpL0VwaXBoYW55L1NpbGsvU2t5ZmlyZS9Cb2x0L0lyb24vSXJpZGl1bS9QaGFudG9tSlMvQm93c2VyL1F1cFppbGxhL0ZhbGtvblxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oa29ucXVlcm9yKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gS29ucXVlcm9yXG4gICAgICAgICAgICBdLCBbW05BTUUsICdLb25xdWVyb3InXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyh0cmlkZW50KS4rcnZbOlxcc10oW1xcd1xcLl0rKS4rbGlrZVxcc2dlY2tvL2kgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUUxMVxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnSUUnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhlZGdlfGVkZ2lvc3xlZGdhfGVkZylcXC8oKFxcZCspP1tcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWljcm9zb2Z0IEVkZ2VcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0VkZ2UnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyh5YWJyb3dzZXIpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBZYW5kZXhcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1lhbmRleCddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKHB1ZmZpbilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFB1ZmZpblxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnUHVmZmluJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oZm9jdXMpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZWZveCBGb2N1c1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnRmlyZWZveCBGb2N1cyddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKG9wdClcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIFRvdWNoXG4gICAgICAgICAgICBdLCBbW05BTUUsICdPcGVyYSBUb3VjaCddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKCg/OltcXHNcXC9dKXVjP1xccz9icm93c2VyfCg/Omp1Yy4rKXVjd2ViKVtcXC9cXHNdPyhbXFx3XFwuXSspL2kgICAgICAgICAvLyBVQ0Jyb3dzZXJcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1VDQnJvd3NlciddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGNvbW9kb19kcmFnb24pXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbW9kbyBEcmFnb25cbiAgICAgICAgICAgIF0sIFtbTkFNRSwgL18vZywgJyAnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyh3aW5kb3dzd2VjaGF0IHFiY29yZSlcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZUNoYXQgRGVza3RvcCBmb3IgV2luZG93cyBCdWlsdC1pbiBCcm93c2VyXG4gICAgICAgICAgICBdLCBbW05BTUUsICdXZUNoYXQoV2luKSBEZXNrdG9wJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8obWljcm9tZXNzZW5nZXIpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2VDaGF0XG4gICAgICAgICAgICBdLCBbW05BTUUsICdXZUNoYXQnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhicmF2ZSlcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyYXZlIGJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0JyYXZlJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8ocXFicm93c2VybGl0ZSlcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUVFCcm93c2VyTGl0ZVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oUVEpXFwvKFtcXGRcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUVEsIGFrYSBTaG91UVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC9tPyhxcWJyb3dzZXIpW1xcL1xcc10/KFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFFRQnJvd3NlclxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oQklEVUJyb3dzZXIpW1xcL1xcc10/KFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJhaWR1IEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKDIzNDVFeHBsb3JlcilbXFwvXFxzXT8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAyMzQ1IEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKE1ldGFTcilbXFwvXFxzXT8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTb3VHb3VCcm93c2VyXG4gICAgICAgICAgICBdLCBbTkFNRV0sIFtcblxuICAgICAgICAgICAgLyhMQkJST1dTRVIpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpZUJhbyBCcm93c2VyXG4gICAgICAgICAgICBdLCBbTkFNRV0sIFtcblxuICAgICAgICAgICAgL3hpYW9taVxcL21pdWlicm93c2VyXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTUlVSSBCcm93c2VyXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdNSVVJIEJyb3dzZXInXV0sIFtcblxuICAgICAgICAgICAgLztmYmF2XFwvKFtcXHdcXC5dKyk7L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGYWNlYm9vayBBcHAgZm9yIGlPUyAmIEFuZHJvaWRcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBbTkFNRSwgJ0ZhY2Vib29rJ11dLCBbXG5cbiAgICAgICAgICAgIC9zYWZhcmlcXHMobGluZSlcXC8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpbmUgQXBwIGZvciBpT1NcbiAgICAgICAgICAgIC9hbmRyb2lkLisobGluZSlcXC8oW1xcd1xcLl0rKVxcL2lhYi9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpbmUgQXBwIGZvciBBbmRyb2lkXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgL2hlYWRsZXNzY2hyb21lKD86XFwvKFtcXHdcXC5dKyl8XFxzKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hyb21lIEhlYWRsZXNzXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdDaHJvbWUgSGVhZGxlc3MnXV0sIFtcblxuICAgICAgICAgICAgL1xcc3d2XFwpLisoY2hyb21lKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9tZSBXZWJWaWV3XG4gICAgICAgICAgICBdLCBbW05BTUUsIC8oLispLywgJyQxIFdlYlZpZXcnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLygoPzpvY3VsdXN8c2Ftc3VuZylicm93c2VyKVxcLyhbXFx3XFwuXSspL2lcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgLyguKyg/Omd8dXMpKSguKykvLCAnJDEgJDInXSwgVkVSU0lPTl0sIFsgICAgICAgICAgICAgICAgLy8gT2N1bHVzIC8gU2Ftc3VuZyBCcm93c2VyXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLit2ZXJzaW9uXFwvKFtcXHdcXC5dKylcXHMrKD86bW9iaWxlXFxzP3NhZmFyaXxzYWZhcmkpKi9pICAgICAgICAvLyBBbmRyb2lkIEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBbTkFNRSwgJ0FuZHJvaWQgQnJvd3NlciddXSwgW1xuXG4gICAgICAgICAgICAvKHNhaWxmaXNoYnJvd3NlcilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNhaWxmaXNoIEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1NhaWxmaXNoIEJyb3dzZXInXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhjaHJvbWV8b21uaXdlYnxhcm9yYXxbdGl6ZW5va2FdezV9XFxzP2Jyb3dzZXIpXFwvdj8oW1xcd1xcLl0rKS9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9tZS9PbW5pV2ViL0Fyb3JhL1RpemVuL05va2lhXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhkb2xmaW4pXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEb2xwaGluXG4gICAgICAgICAgICBdLCBbW05BTUUsICdEb2xwaGluJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oKD86YW5kcm9pZC4rKWNybW98Y3Jpb3MpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hyb21lIGZvciBBbmRyb2lkL2lPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnQ2hyb21lJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oY29hc3QpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgQ29hc3RcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ09wZXJhIENvYXN0J10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC9meGlvc1xcLyhbXFx3XFwuLV0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZWZveCBmb3IgaU9TXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdGaXJlZm94J11dLCBbXG5cbiAgICAgICAgICAgIC92ZXJzaW9uXFwvKFtcXHdcXC5dKykuKz9tb2JpbGVcXC9cXHcrXFxzKHNhZmFyaSkvaSAgICAgICAgICAgICAgICAgICAgICAgLy8gTW9iaWxlIFNhZmFyaVxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnTW9iaWxlIFNhZmFyaSddXSwgW1xuXG4gICAgICAgICAgICAvdmVyc2lvblxcLyhbXFx3XFwuXSspLis/KG1vYmlsZVxccz9zYWZhcml8c2FmYXJpKS9pICAgICAgICAgICAgICAgICAgICAvLyBTYWZhcmkgJiBTYWZhcmkgTW9iaWxlXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgTkFNRV0sIFtcblxuICAgICAgICAgICAgL3dlYmtpdC4rPyhnc2EpXFwvKFtcXHdcXC5dKykuKz8obW9iaWxlXFxzP3NhZmFyaXxzYWZhcmkpKFxcL1tcXHdcXC5dKykvaSAgLy8gR29vZ2xlIFNlYXJjaCBBcHBsaWFuY2Ugb24gaU9TXG4gICAgICAgICAgICBdLCBbW05BTUUsICdHU0EnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgL3dlYmtpdC4rPyhtb2JpbGVcXHM/c2FmYXJpfHNhZmFyaSkoXFwvW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpIDwgMy4wXG4gICAgICAgICAgICBdLCBbTkFNRSwgW1ZFUlNJT04sIG1hcHBlci5zdHIsIG1hcHMuYnJvd3Nlci5vbGRzYWZhcmkudmVyc2lvbl1dLCBbXG5cbiAgICAgICAgICAgIC8od2Via2l0fGtodG1sKVxcLyhbXFx3XFwuXSspL2lcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvLyBHZWNrbyBiYXNlZFxuICAgICAgICAgICAgLyhuYXZpZ2F0b3J8bmV0c2NhcGUpXFwvKFtcXHdcXC4tXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOZXRzY2FwZVxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnTmV0c2NhcGUnXSwgVkVSU0lPTl0sIFtcbiAgICAgICAgICAgIC8oc3dpZnRmb3gpL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3dpZnRmb3hcbiAgICAgICAgICAgIC8oaWNlZHJhZ29ufGljZXdlYXNlbHxjYW1pbm98Y2hpbWVyYXxmZW5uZWN8bWFlbW9cXHNicm93c2VyfG1pbmltb3xjb25rZXJvcilbXFwvXFxzXT8oW1xcd1xcLlxcK10rKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJY2VEcmFnb24vSWNld2Vhc2VsL0NhbWluby9DaGltZXJhL0Zlbm5lYy9NYWVtby9NaW5pbW8vQ29ua2Vyb3JcbiAgICAgICAgICAgIC8oZmlyZWZveHxzZWFtb25rZXl8ay1tZWxlb258aWNlY2F0fGljZWFwZXxmaXJlYmlyZHxwaG9lbml4fHBhbGVtb29ufGJhc2lsaXNrfHdhdGVyZm94KVxcLyhbXFx3XFwuLV0rKSQvaSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJlZm94L1NlYU1vbmtleS9LLU1lbGVvbi9JY2VDYXQvSWNlQXBlL0ZpcmViaXJkL1Bob2VuaXhcbiAgICAgICAgICAgIC8obW96aWxsYSlcXC8oW1xcd1xcLl0rKS4rcnZcXDouK2dlY2tvXFwvXFxkKy9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTW96aWxsYVxuXG4gICAgICAgICAgICAvLyBPdGhlclxuICAgICAgICAgICAgLyhwb2xhcmlzfGx5bnh8ZGlsbG98aWNhYnxkb3Jpc3xhbWF5YXx3M218bmV0c3VyZnxzbGVpcG5pcilbXFwvXFxzXT8oW1xcd1xcLl0rKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb2xhcmlzL0x5bngvRGlsbG8vaUNhYi9Eb3Jpcy9BbWF5YS93M20vTmV0U3VyZi9TbGVpcG5pclxuICAgICAgICAgICAgLyhsaW5rcylcXHNcXCgoW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGlua3NcbiAgICAgICAgICAgIC8oZ29icm93c2VyKVxcLz8oW1xcd1xcLl0qKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR29Ccm93c2VyXG4gICAgICAgICAgICAvKGljZVxccz9icm93c2VyKVxcL3Y/KFtcXHdcXC5fXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJQ0UgQnJvd3NlclxuICAgICAgICAgICAgLyhtb3NhaWMpW1xcL1xcc10oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTW9zYWljXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl1cbiAgICAgICAgXSxcblxuICAgICAgICBjcHUgOiBbW1xuXG4gICAgICAgICAgICAvKD86KGFtZHx4KD86KD86ODZ8NjQpW18tXSk/fHdvd3x3aW4pNjQpWztcXCldL2kgICAgICAgICAgICAgICAgICAgICAvLyBBTUQ2NFxuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsICdhbWQ2NCddXSwgW1xuXG4gICAgICAgICAgICAvKGlhMzIoPz07KSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElBMzIgKHF1aWNrdGltZSlcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCB1dGlsLmxvd2VyaXplXV0sIFtcblxuICAgICAgICAgICAgLygoPzppWzM0Nl18eCk4NilbO1xcKV0vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUEzMlxuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsICdpYTMyJ11dLCBbXG5cbiAgICAgICAgICAgIC8vIFBvY2tldFBDIG1pc3Rha2VubHkgaWRlbnRpZmllZCBhcyBQb3dlclBDXG4gICAgICAgICAgICAvd2luZG93c1xccyhjZXxtb2JpbGUpO1xcc3BwYzsvaVxuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsICdhcm0nXV0sIFtcblxuICAgICAgICAgICAgLygoPzpwcGN8cG93ZXJwYykoPzo2NCk/KSg/Olxcc21hY3w7fFxcKSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvd2VyUENcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCAvb3dlci8sICcnLCB1dGlsLmxvd2VyaXplXV0sIFtcblxuICAgICAgICAgICAgLyhzdW40XFx3KVs7XFwpXS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNQQVJDXG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgJ3NwYXJjJ11dLCBbXG5cbiAgICAgICAgICAgIC8oKD86YXZyMzJ8aWE2NCg/PTspKXw2OGsoPz1cXCkpfGFybSg/OjY0fCg/PXZcXGQrWztsXSkpfCg/PWF0bWVsXFxzKWF2cnwoPzppcml4fG1pcHN8c3BhcmMpKD86NjQpPyg/PTspfHBhLXJpc2MpL2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUE2NCwgNjhLLCBBUk0vNjQsIEFWUi8zMiwgSVJJWC82NCwgTUlQUy82NCwgU1BBUkMvNjQsIFBBLVJJU0NcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCB1dGlsLmxvd2VyaXplXV1cbiAgICAgICAgXSxcblxuICAgICAgICBkZXZpY2UgOiBbW1xuXG4gICAgICAgICAgICAvXFwoKGlwYWR8cGxheWJvb2spO1tcXHdcXHNcXCksOy1dKyhyaW18YXBwbGUpL2kgICAgICAgICAgICAgICAgICAgICAgICAvLyBpUGFkL1BsYXlCb29rXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFZFTkRPUiwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hcHBsZWNvcmVtZWRpYVxcL1tcXHdcXC5dKyBcXCgoaXBhZCkvICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlQYWRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FwcGxlJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvKGFwcGxlXFxzezAsMX10dikvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBcHBsZSBUVlxuICAgICAgICAgICAgXSwgW1tNT0RFTCwgJ0FwcGxlIFRWJ10sIFtWRU5ET1IsICdBcHBsZSddXSwgW1xuXG4gICAgICAgICAgICAvKGFyY2hvcylcXHMoZ2FtZXBhZDI/KS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBcmNob3NcbiAgICAgICAgICAgIC8oaHApLisodG91Y2hwYWQpL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFAgVG91Y2hQYWRcbiAgICAgICAgICAgIC8oaHApLisodGFibGV0KS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFAgVGFibGV0XG4gICAgICAgICAgICAvKGtpbmRsZSlcXC8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtpbmRsZVxuICAgICAgICAgICAgL1xccyhub29rKVtcXHdcXHNdK2J1aWxkXFwvKFxcdyspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vb2tcbiAgICAgICAgICAgIC8oZGVsbClcXHMoc3RyZWFba3ByXFxzXFxkXSpbXFxka29dKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlbGwgU3RyZWFrXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC8oa2ZbQS16XSspXFxzYnVpbGRcXC8uK3NpbGtcXC8vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gS2luZGxlIEZpcmUgSERcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FtYXpvbiddLCBbVFlQRSwgVEFCTEVUXV0sIFtcbiAgICAgICAgICAgIC8oc2R8a2YpWzAzNDloaWpvcnN0dXddK1xcc2J1aWxkXFwvLitzaWxrXFwvL2kgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZSBQaG9uZVxuICAgICAgICAgICAgXSwgW1tNT0RFTCwgbWFwcGVyLnN0ciwgbWFwcy5kZXZpY2UuYW1hem9uLm1vZGVsXSwgW1ZFTkRPUiwgJ0FtYXpvbiddLCBbVFlQRSwgTU9CSUxFXV0sIFtcbiAgICAgICAgICAgIC9hbmRyb2lkLithZnQoW2Jtc10pXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmUgVFZcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FtYXpvbiddLCBbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC9cXCgoaXBbaG9uZWR8XFxzXFx3Kl0rKTsuKyhhcHBsZSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaVBvZC9pUGhvbmVcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgVkVORE9SLCBbVFlQRSwgTU9CSUxFXV0sIFtcbiAgICAgICAgICAgIC9cXCgoaXBbaG9uZWR8XFxzXFx3Kl0rKTsvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaVBvZC9pUGhvbmVcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FwcGxlJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKGJsYWNrYmVycnkpW1xccy1dPyhcXHcrKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmxhY2tCZXJyeVxuICAgICAgICAgICAgLyhibGFja2JlcnJ5fGJlbnF8cGFsbSg/PVxcLSl8c29ueWVyaWNzc29ufGFjZXJ8YXN1c3xkZWxsfG1laXp1fG1vdG9yb2xhfHBvbHl0cm9uKVtcXHNfLV0/KFtcXHctXSopL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJlblEvUGFsbS9Tb255LUVyaWNzc29uL0FjZXIvQXN1cy9EZWxsL01laXp1L01vdG9yb2xhL1BvbHl0cm9uXG4gICAgICAgICAgICAvKGhwKVxccyhbXFx3XFxzXStcXHcpL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIUCBpUEFRXG4gICAgICAgICAgICAvKGFzdXMpLT8oXFx3KykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3VzXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvXFwoYmIxMDtcXHMoXFx3KykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJsYWNrQmVycnkgMTBcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0JsYWNrQmVycnknXSwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFzdXMgVGFibGV0c1xuICAgICAgICAgICAgL2FuZHJvaWQuKyh0cmFuc2ZvW3ByaW1lXFxzXXs0LDEwfVxcc1xcdyt8ZWVlcGN8c2xpZGVyXFxzXFx3K3xuZXh1cyA3fHBhZGZvbmV8cDAwYykvaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQXN1cyddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgLyhzb255KVxccyh0YWJsZXRcXHNbcHNdKVxcc2J1aWxkXFwvL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNvbnlcbiAgICAgICAgICAgIC8oc29ueSk/KD86c2dwLispXFxzYnVpbGRcXC8vaVxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdTb255J10sIFtNT0RFTCwgJ1hwZXJpYSBUYWJsZXQnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rXFxzKFtjLWddXFxkezR9fHNvWy1sXVxcdyspKD89XFxzYnVpbGRcXC98XFwpLitjaHJvbWVcXC8oPyFbMS02XXswLDF9XFxkXFwuKSkvaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnU29ueSddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL1xccyhvdXlhKVxccy9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE91eWFcbiAgICAgICAgICAgIC8obmludGVuZG8pXFxzKFt3aWRzM3VdKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5pbnRlbmRvXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIENPTlNPTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhzaGllbGQpXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTnZpZGlhXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdOdmlkaWEnXSwgW1RZUEUsIENPTlNPTEVdXSwgW1xuXG4gICAgICAgICAgICAvKHBsYXlzdGF0aW9uXFxzWzM0cG9ydGFibGV2aV0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQbGF5c3RhdGlvblxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnU29ueSddLCBbVFlQRSwgQ09OU09MRV1dLCBbXG5cbiAgICAgICAgICAgIC8oc3ByaW50XFxzKFxcdyspKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTcHJpbnQgUGhvbmVzXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgbWFwcGVyLnN0ciwgbWFwcy5kZXZpY2Uuc3ByaW50LnZlbmRvcl0sIFtNT0RFTCwgbWFwcGVyLnN0ciwgbWFwcy5kZXZpY2Uuc3ByaW50Lm1vZGVsXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8oaHRjKVs7X1xccy1dKyhbXFx3XFxzXSsoPz1cXCl8XFxzYnVpbGQpfFxcdyspL2ksICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFRDXG4gICAgICAgICAgICAvKHp0ZSktKFxcdyopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBaVEVcbiAgICAgICAgICAgIC8oYWxjYXRlbHxnZWVrc3Bob25lfG5leGlhbnxwYW5hc29uaWN8KD89O1xccylzb255KVtfXFxzLV0/KFtcXHctXSopL2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxjYXRlbC9HZWVrc1Bob25lL05leGlhbi9QYW5hc29uaWMvU29ueVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgW01PREVMLCAvXy9nLCAnICddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgLyhuZXh1c1xcczkpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFRDIE5leHVzIDlcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0hUQyddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2RcXC9odWF3ZWkoW1xcd1xccy1dKylbO1xcKV0vaSxcbiAgICAgICAgICAgIC8obmV4dXNcXHM2cCkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEh1YXdlaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnSHVhd2VpJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKG1pY3Jvc29mdCk7XFxzKGx1bWlhW1xcc1xcd10rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1pY3Jvc29mdCBMdW1pYVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvW1xcc1xcKDtdKHhib3goPzpcXHNvbmUpPylbXFxzXFwpO10vaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWljcm9zb2Z0IFhib3hcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ01pY3Jvc29mdCddLCBbVFlQRSwgQ09OU09MRV1dLCBbXG4gICAgICAgICAgICAvKGtpblxcLltvbmV0d117M30pL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNaWNyb3NvZnQgS2luXG4gICAgICAgICAgICBdLCBbW01PREVMLCAvXFwuL2csICcgJ10sIFtWRU5ET1IsICdNaWNyb3NvZnQnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTW90b3JvbGFcbiAgICAgICAgICAgIC9cXHMobWlsZXN0b25lfGRyb2lkKD86WzItNHhdfFxccyg/OmJpb25pY3x4Mnxwcm98cmF6cikpPzo/KFxcczRnKT8pW1xcd1xcc10rYnVpbGRcXC8vaSxcbiAgICAgICAgICAgIC9tb3RbXFxzLV0/KFxcdyopL2ksXG4gICAgICAgICAgICAvKFhUXFxkezMsNH0pIGJ1aWxkXFwvL2ksXG4gICAgICAgICAgICAvKG5leHVzXFxzNikvaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTW90b3JvbGEnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rXFxzKG16NjBcXGR8eG9vbVtcXHMyXXswLDJ9KVxcc2J1aWxkXFwvL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ01vdG9yb2xhJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvaGJidHZcXC9cXGQrXFwuXFxkK1xcLlxcZCtcXHMrXFwoW1xcd1xcc10qO1xccyooXFx3W147XSopOyhbXjtdKikvaSAgICAgICAgICAgIC8vIEhiYlRWIGRldmljZXNcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCB1dGlsLnRyaW1dLCBbTU9ERUwsIHV0aWwudHJpbV0sIFtUWVBFLCBTTUFSVFRWXV0sIFtcblxuICAgICAgICAgICAgL2hiYnR2LittYXBsZTsoXFxkKykvaVxuICAgICAgICAgICAgXSwgW1tNT0RFTCwgL14vLCAnU21hcnRUViddLCBbVkVORE9SLCAnU2Ftc3VuZyddLCBbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC9cXChkdHZbXFwpO10uKyhhcXVvcykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaGFycFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnU2hhcnAnXSwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rKChzY2gtaVs4OV0wXFxkfHNody1tMzgwc3xndC1wXFxkezR9fGd0LW5cXGQrfHNnaC10OFs1Nl05fG5leHVzIDEwKSkvaSxcbiAgICAgICAgICAgIC8oKFNNLVRcXHcrKSkvaVxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdTYW1zdW5nJ10sIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFsgICAgICAgICAgICAgICAgICAvLyBTYW1zdW5nXG4gICAgICAgICAgICAvc21hcnQtdHYuKyhzYW1zdW5nKS9pXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBbVFlQRSwgU01BUlRUVl0sIE1PREVMXSwgW1xuICAgICAgICAgICAgLygoc1tjZ3BdaC1cXHcrfGd0LVxcdyt8Z2FsYXh5XFxzbmV4dXN8c20tXFx3W1xcd1xcZF0rKSkvaSxcbiAgICAgICAgICAgIC8oc2FtW3N1bmddKilbXFxzLV0qKFxcdystP1tcXHctXSopL2ksXG4gICAgICAgICAgICAvc2VjLSgoc2doXFx3KykpL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnU2Ftc3VuZyddLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9zaWUtKFxcdyopL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpZW1lbnNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1NpZW1lbnMnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8obWFlbW98bm9raWEpLioobjkwMHxsdW1pYVxcc1xcZCspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb2tpYVxuICAgICAgICAgICAgLyhub2tpYSlbXFxzXy1dPyhbXFx3LV0qKS9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ05va2lhJ10sIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWRbeFxcZFxcLlxccztdK1xccyhbYWJdWzEtN11cXC0/WzAxNzhhXVxcZFxcZD8pL2kgICAgICAgICAgICAgICAgICAgLy8gQWNlclxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQWNlciddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKyhbdmxda1xcLT9cXGR7M30pXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMRyBUYWJsZXRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0xHJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWRcXHMzXFwuW1xcc1xcdzstXXsxMH0obGc/KS0oWzA2Y3Y5XXszLDR9KS9pICAgICAgICAgICAgICAgICAgICAgLy8gTEcgVGFibGV0XG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ0xHJ10sIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcbiAgICAgICAgICAgIC8obGcpIG5ldGNhc3RcXC50di9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExHIFNtYXJ0VFZcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgU01BUlRUVl1dLCBbXG4gICAgICAgICAgICAvKG5leHVzXFxzWzQ1XSkvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMR1xuICAgICAgICAgICAgL2xnW2U7XFxzXFwvLV0rKFxcdyopL2ksXG4gICAgICAgICAgICAvYW5kcm9pZC4rbGcoXFwtP1tcXGRcXHddKylcXHMrYnVpbGQvaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTEcnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8obGVub3ZvKVxccz8ocyg/OjUwMDB8NjAwMCkoPzpbXFx3LV0rKXx0YWIoPzpbXFxzXFx3XSspKS9pICAgICAgICAgICAgIC8vIExlbm92byB0YWJsZXRzXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rKGlkZWF0YWJbYS16MC05XFwtXFxzXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGVub3ZvXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdMZW5vdm8nXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvKGxlbm92bylbX1xccy1dPyhbXFx3LV0rKS9pXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9saW51eDsuKygoam9sbGEpKTsvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSm9sbGFcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgLygocGViYmxlKSlhcHBcXC9bXFxkXFwuXStcXHMvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGViYmxlXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFdFQVJBQkxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKztcXHMob3BwbylcXHM/KFtcXHdcXHNdKylcXHNidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9QUE9cbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2Nya2V5L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHb29nbGUgQ2hyb21lY2FzdFxuICAgICAgICAgICAgXSwgW1tNT0RFTCwgJ0Nocm9tZWNhc3QnXSwgW1ZFTkRPUiwgJ0dvb2dsZSddXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhnbGFzcylcXHNcXGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdvb2dsZSBHbGFzc1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnR29vZ2xlJ10sIFtUWVBFLCBXRUFSQUJMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKHBpeGVsIGMpW1xccyldL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHb29nbGUgUGl4ZWwgQ1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnR29vZ2xlJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhwaXhlbCggWzIzXSk/KCB4bCk/KVtcXHMpXS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR29vZ2xlIFBpeGVsXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdHb29nbGUnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKFxcdyspXFxzK2J1aWxkXFwvaG1cXDEvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBYaWFvbWkgSG9uZ21pICdudW1lcmljJyBtb2RlbHNcbiAgICAgICAgICAgIC9hbmRyb2lkLisoaG1bXFxzXFwtX10qbm90ZT9bXFxzX10qKD86XFxkXFx3KT8pXFxzK2J1aWxkL2ksICAgICAgICAgICAgICAgLy8gWGlhb21pIEhvbmdtaVxuICAgICAgICAgICAgL2FuZHJvaWQuKyhtaVtcXHNcXC1fXSooPzphXFxkfG9uZXxvbmVbXFxzX11wbHVzfG5vdGUgbHRlKT9bXFxzX10qKD86XFxkP1xcdz8pW1xcc19dKig/OnBsdXMpPylcXHMrYnVpbGQvaSwgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFhpYW9taSBNaVxuICAgICAgICAgICAgL2FuZHJvaWQuKyhyZWRtaVtcXHNcXC1fXSooPzpub3RlKT8oPzpbXFxzX10qW1xcd1xcc10rKSlcXHMrYnVpbGQvaSAgICAgICAvLyBSZWRtaSBQaG9uZXNcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsIC9fL2csICcgJ10sIFtWRU5ET1IsICdYaWFvbWknXSwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rKG1pW1xcc1xcLV9dKig/OnBhZCkoPzpbXFxzX10qW1xcd1xcc10rKSlcXHMrYnVpbGQvaSAgICAgICAgICAgIC8vIE1pIFBhZCB0YWJsZXRzXG4gICAgICAgICAgICBdLFtbTU9ERUwsIC9fL2csICcgJ10sIFtWRU5ET1IsICdYaWFvbWknXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhtWzEtNV1cXHNub3RlKVxcc2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1laXp1XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNZWl6dSddLCBbVFlQRSwgTU9CSUxFXV0sIFtcbiAgICAgICAgICAgIC8obXopLShbXFx3LV17Mix9KS9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ01laXp1J10sIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK2EwMDAoMSlcXHMrYnVpbGQvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT25lUGx1c1xuICAgICAgICAgICAgL2FuZHJvaWQuK29uZXBsdXNcXHMoYVxcZHs0fSlcXHMrYnVpbGQvaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnT25lUGx1cyddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooUkNUW1xcZFxcd10rKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJDQSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdSQ0EnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL1xcc10rKFZlbnVlW1xcZFxcc117Miw3fSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAvLyBEZWxsIFZlbnVlIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0RlbGwnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFFbVHxNXVtcXGRcXHddKylcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWZXJpem9uIFRhYmxldFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnVmVyaXpvbiddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccysoQmFybmVzWyZcXHNdK05vYmxlXFxzK3xCTltSVF0pKFY/LiopXFxzK2J1aWxkL2kgICAgIC8vIEJhcm5lcyAmIE5vYmxlIFRhYmxldFxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdCYXJuZXMgJiBOb2JsZSddLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMrKFRNXFxkezN9LipcXGIpXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCYXJuZXMgJiBOb2JsZSBUYWJsZXRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ051VmlzaW9uJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhrODgpXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gWlRFIEsgU2VyaWVzIFRhYmxldFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnWlRFJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihnZW5cXGR7M30pXFxzK2J1aWxkLio0OWgvaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTd2lzcyBHRU4gTW9iaWxlXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdTd2lzcyddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooenVyXFxkezN9KVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3dpc3MgWlVSIFRhYmxldFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnU3dpc3MnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKChaZWtpKT9UQi4qXFxiKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFpla2kgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnWmVraSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgLyhhbmRyb2lkKS4rWztcXC9dXFxzKyhbWVJdXFxkezJ9KVxccytidWlsZC9pLFxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccysoRHJhZ29uW1xcLVxcc10rVG91Y2hcXHMrfERUKShcXHd7NX0pXFxzYnVpbGQvaSAgICAgICAgLy8gRHJhZ29uIFRvdWNoIFRhYmxldFxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdEcmFnb24gVG91Y2gnXSwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihOUy0/XFx3ezAsOX0pXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnNpZ25pYSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdJbnNpZ25pYSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooKE5YfE5leHQpLT9cXHd7MCw5fSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgLy8gTmV4dEJvb2sgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTmV4dEJvb2snXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFh0cmVtZVxcXyk/KFYoMVswNDVdfDJbMDE1XXwzMHw0MHw2MHw3WzA1XXw5MCkpXFxzK2J1aWxkL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnVm9pY2UnXSwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgWyAgICAgICAgICAgICAgICAgICAgLy8gVm9pY2UgWHRyZW1lIFBob25lc1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihMVlRFTFxcLSk/KFYxWzEyXSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgIC8vIEx2VGVsIFBob25lc1xuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdMdlRlbCddLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKFBILTEpXFxzL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0Vzc2VudGlhbCddLCBbVFlQRSwgTU9CSUxFXV0sIFsgICAgICAgICAgICAgICAgLy8gRXNzZW50aWFsIFBILTFcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooVigxMDBNRHw3MDBOQXw3MDExfDkxN0cpLipcXGIpXFxzK2J1aWxkL2kgICAgICAgICAgLy8gRW52aXplbiBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdFbnZpemVuJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihMZVtcXHNcXC1dK1BhbilbXFxzXFwtXSsoXFx3ezEsOX0pXFxzK2J1aWxkL2kgICAgICAgICAgLy8gTGUgUGFuIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooVHJpb1tcXHNcXC1dKi4qKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hY2hTcGVlZCBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNYWNoU3BlZWQnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFRyaW5pdHkpW1xcLVxcc10qKFRcXGR7M30pXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgLy8gVHJpbml0eSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqVFVfKDE0OTEpXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUm90b3IgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnUm90b3InXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLisoS1MoLispKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFtYXpvbiBLaW5kbGUgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQW1hem9uJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rKEdpZ2FzZXQpW1xcc1xcLV0rKFFcXHd7MSw5fSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAvLyBHaWdhc2V0IFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL1xccyh0YWJsZXR8dGFiKVs7XFwvXS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVuaWRlbnRpZmlhYmxlIFRhYmxldFxuICAgICAgICAgICAgL1xccyhtb2JpbGUpKD86WztcXC9dfFxcc3NhZmFyaSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVbmlkZW50aWZpYWJsZSBNb2JpbGVcbiAgICAgICAgICAgIF0sIFtbVFlQRSwgdXRpbC5sb3dlcml6ZV0sIFZFTkRPUiwgTU9ERUxdLCBbXG5cbiAgICAgICAgICAgIC9bXFxzXFwvXFwoXShzbWFydC0/dHYpWztcXCldL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNtYXJ0VFZcbiAgICAgICAgICAgIF0sIFtbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC8oYW5kcm9pZFtcXHdcXC5cXHNcXC1dezAsOX0pOy4rYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyaWMgQW5kcm9pZCBEZXZpY2VcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0dlbmVyaWMnXV1cbiAgICAgICAgXSxcblxuICAgICAgICBlbmdpbmUgOiBbW1xuXG4gICAgICAgICAgICAvd2luZG93cy4rXFxzZWRnZVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFZGdlSFRNTFxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnRWRnZUhUTUwnXV0sIFtcblxuICAgICAgICAgICAgL3dlYmtpdFxcLzUzN1xcLjM2LitjaHJvbWVcXC8oPyEyNykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCbGlua1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnQmxpbmsnXV0sIFtcblxuICAgICAgICAgICAgLyhwcmVzdG8pXFwvKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmVzdG9cbiAgICAgICAgICAgIC8od2Via2l0fHRyaWRlbnR8bmV0ZnJvbnR8bmV0c3VyZnxhbWF5YXxseW54fHczbXxnb2FubmEpXFwvKFtcXHdcXC5dKykvaSwgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZWJLaXQvVHJpZGVudC9OZXRGcm9udC9OZXRTdXJmL0FtYXlhL0x5bngvdzNtL0dvYW5uYVxuICAgICAgICAgICAgLyhraHRtbHx0YXNtYW58bGlua3MpW1xcL1xcc11cXCg/KFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtIVE1ML1Rhc21hbi9MaW5rc1xuICAgICAgICAgICAgLyhpY2FiKVtcXC9cXHNdKFsyM11cXC5bXFxkXFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlDYWJcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvcnZcXDooW1xcd1xcLl17MSw5fSkuKyhnZWNrbykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlY2tvXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgTkFNRV1cbiAgICAgICAgXSxcblxuICAgICAgICBvcyA6IFtbXG5cbiAgICAgICAgICAgIC8vIFdpbmRvd3MgYmFzZWRcbiAgICAgICAgICAgIC9taWNyb3NvZnRcXHMod2luZG93cylcXHModmlzdGF8eHApL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXaW5kb3dzIChpVHVuZXMpXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcbiAgICAgICAgICAgIC8od2luZG93cylcXHNudFxcczZcXC4yO1xccyhhcm0pL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdpbmRvd3MgUlRcbiAgICAgICAgICAgIC8od2luZG93c1xcc3Bob25lKD86XFxzb3MpKilbXFxzXFwvXT8oW1xcZFxcLlxcc1xcd10qKS9pLCAgICAgICAgICAgICAgICAgICAvLyBXaW5kb3dzIFBob25lXG4gICAgICAgICAgICAvKHdpbmRvd3NcXHNtb2JpbGV8d2luZG93cylbXFxzXFwvXT8oW250Y2VcXGRcXC5cXHNdK1xcdykvaVxuICAgICAgICAgICAgXSwgW05BTUUsIFtWRVJTSU9OLCBtYXBwZXIuc3RyLCBtYXBzLm9zLndpbmRvd3MudmVyc2lvbl1dLCBbXG4gICAgICAgICAgICAvKHdpbig/PTN8OXxuKXx3aW5cXHM5eFxccykoW250XFxkXFwuXSspL2lcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1dpbmRvd3MnXSwgW1ZFUlNJT04sIG1hcHBlci5zdHIsIG1hcHMub3Mud2luZG93cy52ZXJzaW9uXV0sIFtcblxuICAgICAgICAgICAgLy8gTW9iaWxlL0VtYmVkZGVkIE9TXG4gICAgICAgICAgICAvXFwoKGJiKSgxMCk7L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCbGFja0JlcnJ5IDEwXG4gICAgICAgICAgICBdLCBbW05BTUUsICdCbGFja0JlcnJ5J10sIFZFUlNJT05dLCBbXG4gICAgICAgICAgICAvKGJsYWNrYmVycnkpXFx3KlxcLz8oW1xcd1xcLl0qKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCbGFja2JlcnJ5XG4gICAgICAgICAgICAvKHRpemVuKVtcXC9cXHNdKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaXplblxuICAgICAgICAgICAgLyhhbmRyb2lkfHdlYm9zfHBhbG1cXHNvc3xxbnh8YmFkYXxyaW1cXHN0YWJsZXRcXHNvc3xtZWVnb3xzYWlsZmlzaHxjb250aWtpKVtcXC9cXHMtXT8oW1xcd1xcLl0qKS9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFuZHJvaWQvV2ViT1MvUGFsbS9RTlgvQmFkYS9SSU0vTWVlR28vQ29udGlraS9TYWlsZmlzaCBPU1xuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG4gICAgICAgICAgICAvKHN5bWJpYW5cXHM/b3N8c3ltYm9zfHM2MCg/PTspKVtcXC9cXHMtXT8oW1xcd1xcLl0qKS9pICAgICAgICAgICAgICAgICAgLy8gU3ltYmlhblxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnU3ltYmlhbiddLCBWRVJTSU9OXSwgW1xuICAgICAgICAgICAgL1xcKChzZXJpZXM0MCk7L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2VyaWVzIDQwXG4gICAgICAgICAgICBdLCBbTkFNRV0sIFtcbiAgICAgICAgICAgIC9tb3ppbGxhLitcXChtb2JpbGU7LitnZWNrby4rZmlyZWZveC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggT1NcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0ZpcmVmb3ggT1MnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLy8gQ29uc29sZVxuICAgICAgICAgICAgLyhuaW50ZW5kb3xwbGF5c3RhdGlvbilcXHMoW3dpZHMzNHBvcnRhYmxldnVdKykvaSwgICAgICAgICAgICAgICAgICAgLy8gTmludGVuZG8vUGxheXN0YXRpb25cblxuICAgICAgICAgICAgLy8gR05VL0xpbnV4IGJhc2VkXG4gICAgICAgICAgICAvKG1pbnQpW1xcL1xcc1xcKF0/KFxcdyopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNaW50XG4gICAgICAgICAgICAvKG1hZ2VpYXx2ZWN0b3JsaW51eClbO1xcc10vaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYWdlaWEvVmVjdG9yTGludXhcbiAgICAgICAgICAgIC8oam9saXxba3hsbl0/dWJ1bnR1fGRlYmlhbnxzdXNlfG9wZW5zdXNlfGdlbnRvb3woPz1cXHMpYXJjaHxzbGFja3dhcmV8ZmVkb3JhfG1hbmRyaXZhfGNlbnRvc3xwY2xpbnV4b3N8cmVkaGF0fHplbndhbGt8bGlucHVzKVtcXC9cXHMtXT8oPyFjaHJvbSkoW1xcd1xcLi1dKikvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSm9saS9VYnVudHUvRGViaWFuL1NVU0UvR2VudG9vL0FyY2gvU2xhY2t3YXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZlZG9yYS9NYW5kcml2YS9DZW50T1MvUENMaW51eE9TL1JlZEhhdC9aZW53YWxrL0xpbnB1c1xuICAgICAgICAgICAgLyhodXJkfGxpbnV4KVxccz8oW1xcd1xcLl0qKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIdXJkL0xpbnV4XG4gICAgICAgICAgICAvKGdudSlcXHM/KFtcXHdcXC5dKikvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdOVVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oY3JvcylcXHNbXFx3XStcXHMoW1xcd1xcLl0rXFx3KS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hyb21pdW0gT1NcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0Nocm9taXVtIE9TJ10sIFZFUlNJT05dLFtcblxuICAgICAgICAgICAgLy8gU29sYXJpc1xuICAgICAgICAgICAgLyhzdW5vcylcXHM/KFtcXHdcXC5cXGRdKikvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU29sYXJpc1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnU29sYXJpcyddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvLyBCU0QgYmFzZWRcbiAgICAgICAgICAgIC9cXHMoW2ZyZW50b3BjLV17MCw0fWJzZHxkcmFnb25mbHkpXFxzPyhbXFx3XFwuXSopL2kgICAgICAgICAgICAgICAgICAgIC8vIEZyZWVCU0QvTmV0QlNEL09wZW5CU0QvUEMtQlNEL0RyYWdvbkZseVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLFtcblxuICAgICAgICAgICAgLyhoYWlrdSlcXHMoXFx3KykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhaWt1XG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sW1xuXG4gICAgICAgICAgICAvY2ZuZXR3b3JrXFwvLitkYXJ3aW4vaSxcbiAgICAgICAgICAgIC9pcFtob25lYWRdezIsNH0oPzouKm9zXFxzKFtcXHddKylcXHNsaWtlXFxzbWFjfDtcXHNvcGVyYSkvaSAgICAgICAgICAgICAvLyBpT1NcbiAgICAgICAgICAgIF0sIFtbVkVSU0lPTiwgL18vZywgJy4nXSwgW05BTUUsICdpT1MnXV0sIFtcblxuICAgICAgICAgICAgLyhtYWNcXHNvc1xcc3gpXFxzPyhbXFx3XFxzXFwuXSopL2ksXG4gICAgICAgICAgICAvKG1hY2ludG9zaHxtYWMoPz1fcG93ZXJwYylcXHMpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYWMgT1NcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ01hYyBPUyddLCBbVkVSU0lPTiwgL18vZywgJy4nXV0sIFtcblxuICAgICAgICAgICAgLy8gT3RoZXJcbiAgICAgICAgICAgIC8oKD86b3Blbik/c29sYXJpcylbXFwvXFxzLV0/KFtcXHdcXC5dKikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNvbGFyaXNcbiAgICAgICAgICAgIC8oYWl4KVxccygoXFxkKSg/PVxcLnxcXCl8XFxzKVtcXHdcXC5dKSovaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFJWFxuICAgICAgICAgICAgLyhwbGFuXFxzOXxtaW5peHxiZW9zfG9zXFwvMnxhbWlnYW9zfG1vcnBob3N8cmlzY1xcc29zfG9wZW52bXN8ZnVjaHNpYSkvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGxhbjkvTWluaXgvQmVPUy9PUzIvQW1pZ2FPUy9Nb3JwaE9TL1JJU0NPUy9PcGVuVk1TL0Z1Y2hzaWFcbiAgICAgICAgICAgIC8odW5peClcXHM/KFtcXHdcXC5dKikvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVU5JWFxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dXG4gICAgICAgIF1cbiAgICB9O1xuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIENvbnN0cnVjdG9yXG4gICAgLy8vLy8vLy8vLy8vLy8vL1xuICAgIHZhciBVQVBhcnNlciA9IGZ1bmN0aW9uICh1YXN0cmluZywgZXh0ZW5zaW9ucykge1xuXG4gICAgICAgIGlmICh0eXBlb2YgdWFzdHJpbmcgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBleHRlbnNpb25zID0gdWFzdHJpbmc7XG4gICAgICAgICAgICB1YXN0cmluZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBVQVBhcnNlcikpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVUFQYXJzZXIodWFzdHJpbmcsIGV4dGVuc2lvbnMpLmdldFJlc3VsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHVhID0gdWFzdHJpbmcgfHwgKCh3aW5kb3cgJiYgd2luZG93Lm5hdmlnYXRvciAmJiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCkgPyB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCA6IEVNUFRZKTtcbiAgICAgICAgdmFyIHJneG1hcCA9IGV4dGVuc2lvbnMgPyB1dGlsLmV4dGVuZChyZWdleGVzLCBleHRlbnNpb25zKSA6IHJlZ2V4ZXM7XG5cbiAgICAgICAgdGhpcy5nZXRCcm93c2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGJyb3dzZXIgPSB7IG5hbWU6IHVuZGVmaW5lZCwgdmVyc2lvbjogdW5kZWZpbmVkIH07XG4gICAgICAgICAgICBtYXBwZXIucmd4LmNhbGwoYnJvd3NlciwgdWEsIHJneG1hcC5icm93c2VyKTtcbiAgICAgICAgICAgIGJyb3dzZXIubWFqb3IgPSB1dGlsLm1ham9yKGJyb3dzZXIudmVyc2lvbik7IC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIHJldHVybiBicm93c2VyO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldENQVSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjcHUgPSB7IGFyY2hpdGVjdHVyZTogdW5kZWZpbmVkIH07XG4gICAgICAgICAgICBtYXBwZXIucmd4LmNhbGwoY3B1LCB1YSwgcmd4bWFwLmNwdSk7XG4gICAgICAgICAgICByZXR1cm4gY3B1O1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldERldmljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkZXZpY2UgPSB7IHZlbmRvcjogdW5kZWZpbmVkLCBtb2RlbDogdW5kZWZpbmVkLCB0eXBlOiB1bmRlZmluZWQgfTtcbiAgICAgICAgICAgIG1hcHBlci5yZ3guY2FsbChkZXZpY2UsIHVhLCByZ3htYXAuZGV2aWNlKTtcbiAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0RW5naW5lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGVuZ2luZSA9IHsgbmFtZTogdW5kZWZpbmVkLCB2ZXJzaW9uOiB1bmRlZmluZWQgfTtcbiAgICAgICAgICAgIG1hcHBlci5yZ3guY2FsbChlbmdpbmUsIHVhLCByZ3htYXAuZW5naW5lKTtcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmU7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0T1MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgb3MgPSB7IG5hbWU6IHVuZGVmaW5lZCwgdmVyc2lvbjogdW5kZWZpbmVkIH07XG4gICAgICAgICAgICBtYXBwZXIucmd4LmNhbGwob3MsIHVhLCByZ3htYXAub3MpO1xuICAgICAgICAgICAgcmV0dXJuIG9zO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldFJlc3VsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdWEgICAgICA6IHRoaXMuZ2V0VUEoKSxcbiAgICAgICAgICAgICAgICBicm93c2VyIDogdGhpcy5nZXRCcm93c2VyKCksXG4gICAgICAgICAgICAgICAgZW5naW5lICA6IHRoaXMuZ2V0RW5naW5lKCksXG4gICAgICAgICAgICAgICAgb3MgICAgICA6IHRoaXMuZ2V0T1MoKSxcbiAgICAgICAgICAgICAgICBkZXZpY2UgIDogdGhpcy5nZXREZXZpY2UoKSxcbiAgICAgICAgICAgICAgICBjcHUgICAgIDogdGhpcy5nZXRDUFUoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRVQSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB1YTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5zZXRVQSA9IGZ1bmN0aW9uICh1YXN0cmluZykge1xuICAgICAgICAgICAgdWEgPSB1YXN0cmluZztcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgVUFQYXJzZXIuVkVSU0lPTiA9IExJQlZFUlNJT047XG4gICAgVUFQYXJzZXIuQlJPV1NFUiA9IHtcbiAgICAgICAgTkFNRSAgICA6IE5BTUUsXG4gICAgICAgIE1BSk9SICAgOiBNQUpPUiwgLy8gZGVwcmVjYXRlZFxuICAgICAgICBWRVJTSU9OIDogVkVSU0lPTlxuICAgIH07XG4gICAgVUFQYXJzZXIuQ1BVID0ge1xuICAgICAgICBBUkNISVRFQ1RVUkUgOiBBUkNISVRFQ1RVUkVcbiAgICB9O1xuICAgIFVBUGFyc2VyLkRFVklDRSA9IHtcbiAgICAgICAgTU9ERUwgICA6IE1PREVMLFxuICAgICAgICBWRU5ET1IgIDogVkVORE9SLFxuICAgICAgICBUWVBFICAgIDogVFlQRSxcbiAgICAgICAgQ09OU09MRSA6IENPTlNPTEUsXG4gICAgICAgIE1PQklMRSAgOiBNT0JJTEUsXG4gICAgICAgIFNNQVJUVFYgOiBTTUFSVFRWLFxuICAgICAgICBUQUJMRVQgIDogVEFCTEVULFxuICAgICAgICBXRUFSQUJMRTogV0VBUkFCTEUsXG4gICAgICAgIEVNQkVEREVEOiBFTUJFRERFRFxuICAgIH07XG4gICAgVUFQYXJzZXIuRU5HSU5FID0ge1xuICAgICAgICBOQU1FICAgIDogTkFNRSxcbiAgICAgICAgVkVSU0lPTiA6IFZFUlNJT05cbiAgICB9O1xuICAgIFVBUGFyc2VyLk9TID0ge1xuICAgICAgICBOQU1FICAgIDogTkFNRSxcbiAgICAgICAgVkVSU0lPTiA6IFZFUlNJT05cbiAgICB9O1xuXG4gICAgLy8vLy8vLy8vLy9cbiAgICAvLyBFeHBvcnRcbiAgICAvLy8vLy8vLy8vXG5cblxuICAgIC8vIGNoZWNrIGpzIGVudmlyb25tZW50XG4gICAgaWYgKHR5cGVvZihleHBvcnRzKSAhPT0gVU5ERUZfVFlQRSkge1xuICAgICAgICAvLyBub2RlanMgZW52XG4gICAgICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSBVTkRFRl9UWVBFICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBVQVBhcnNlcjtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRzLlVBUGFyc2VyID0gVUFQYXJzZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gcmVxdWlyZWpzIGVudiAob3B0aW9uYWwpXG4gICAgICAgIGlmICh0eXBlb2YoZGVmaW5lKSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgICAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVQVBhcnNlcjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHdpbmRvdykge1xuICAgICAgICAgICAgLy8gYnJvd3NlciBlbnZcbiAgICAgICAgICAgIHdpbmRvdy5VQVBhcnNlciA9IFVBUGFyc2VyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8galF1ZXJ5L1plcHRvIHNwZWNpZmljIChvcHRpb25hbClcbiAgICAvLyBOb3RlOlxuICAgIC8vICAgSW4gQU1EIGVudiB0aGUgZ2xvYmFsIHNjb3BlIHNob3VsZCBiZSBrZXB0IGNsZWFuLCBidXQgalF1ZXJ5IGlzIGFuIGV4Y2VwdGlvbi5cbiAgICAvLyAgIGpRdWVyeSBhbHdheXMgZXhwb3J0cyB0byBnbG9iYWwgc2NvcGUsIHVubGVzcyBqUXVlcnkubm9Db25mbGljdCh0cnVlKSBpcyB1c2VkLFxuICAgIC8vICAgYW5kIHdlIHNob3VsZCBjYXRjaCB0aGF0LlxuICAgIHZhciAkID0gd2luZG93ICYmICh3aW5kb3cualF1ZXJ5IHx8IHdpbmRvdy5aZXB0byk7XG4gICAgaWYgKHR5cGVvZiAkICE9PSBVTkRFRl9UWVBFICYmICEkLnVhKSB7XG4gICAgICAgIHZhciBwYXJzZXIgPSBuZXcgVUFQYXJzZXIoKTtcbiAgICAgICAgJC51YSA9IHBhcnNlci5nZXRSZXN1bHQoKTtcbiAgICAgICAgJC51YS5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VyLmdldFVBKCk7XG4gICAgICAgIH07XG4gICAgICAgICQudWEuc2V0ID0gZnVuY3Rpb24gKHVhc3RyaW5nKSB7XG4gICAgICAgICAgICBwYXJzZXIuc2V0VUEodWFzdHJpbmcpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHBhcnNlci5nZXRSZXN1bHQoKTtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgJC51YVtwcm9wXSA9IHJlc3VsdFtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbn0pKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnID8gd2luZG93IDogdGhpcyk7XG4iXX0=
