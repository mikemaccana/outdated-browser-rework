'use strict';

const evaluateBrowser = require('../evaluateBrowser.js');
var UserAgentParser = require("ua-parser-js")

function parseUserAgent(userAgent) {
	// Despite the docs, UA needs to be provided to constructor explicitly:
	// https://github.com/faisalman/ua-parser-js/issues/90
	return new UserAgentParser(userAgent).getResult();
}

// Is browser unsupported tests
{
	const opera12 = parseUserAgent('Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16');
	const maxthon3 = parseUserAgent('Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/533.1 (KHTML, like Gecko) Maxthon/3.0.8.2 Safari/533.1');

	test('Opera is unsupported when browser support for it is falsy and unknown browsers are unsupported', () => {
		let result = evaluateBrowser(
			opera12, {
				browserSupport: { Opera: undefined },
				isUnknownBrowserOK: true
		});
		expect(result.isBrowserUnsupported).toBeTruthy();

		result = evaluateBrowser(
			opera12, {
				browserSupport: { Opera: false },
				isUnknownBrowserOK: true
		});
		expect(result.isBrowserUnsupported).toBeTruthy();
	});

	test('Maxthon is unsupported when browser support for it is not defined and unknown browsers are not OK', () => {
		const result = evaluateBrowser(
			maxthon3, {
				browserSupport: {}, // will get DEFAULTS, which includes a few browsers, but not maxthon
				isUnknownBrowserOK: false
		});
		expect(result.isBrowserUnsupported).toBeTruthy();
	});

	test('Maxthon is supported when browser support for it is not defined but unknown browsers are OK', () => {
		const result = evaluateBrowser(
			maxthon3, {
				browserSupport: {}, // will get DEFAULTS, which includes a few browsers, but not maxthon
				isUnknownBrowserOK: true
		});
		expect(result.isBrowserUnsupported).toBeFalsy();
	});
}

// Is Android but not Chrome tests
{
	const chromeOnGalaxyNexus = parseUserAgent('Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19');
	const firefoxForAndroid = parseUserAgent('Mozilla/5.0 (Android 4.4; Mobile; rv:41.0) Gecko/41.0 Firefox/41.0');

	test('isAndroidButNotChrome is false if Chrome on Android', () => {
		const result = evaluateBrowser(
			chromeOnGalaxyNexus, {
				requireChromeOnAndroid: true
		});
		expect(result.isAndroidButNotChrome).toBeFalsy();
	});
	
	test('isAndroidButNotChrome is true if Firefox for Android', () => {
		const result = evaluateBrowser(
			firefoxForAndroid, {
				requireChromeOnAndroid: true
		});
		expect(result.isAndroidButNotChrome).toBeTruthy();
	});
	
	test('isAndroidButNotChrome is false if Firefox for Android but not required to be Chrome', () => {
		const result = evaluateBrowser(
			firefoxForAndroid, {
				requireChromeOnAndroid: false
		});
		expect(result.isAndroidButNotChrome).toBeFalsy();
	});
}

// Is browser out-of-date
{
	// Firefox
	{
		// Firefox Mobile 23 (equivalent to Safari Mobile 13.3.1)
		const firefoxMobile23 = parseUserAgent('Mozilla/5.0 (iPhone; CPU OS 13_3_1 like Mac OS X). AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/23.0 Mobile/15E148 Safari/605.1.15');

		test('FF Mobile 23.0 is out-of-date when min Mobile Safari is 13.3', () => {
			const result = evaluateBrowser(
				firefoxMobile23, {
				browserSupport: { 'Mobile Safari': { major: 13, minor: 3 } },
			});
			expect(result.isBrowserOutOfDate).toBeFalsy();
		});

		test('FF Mobile 23.0 is not out-of-date when min Mobile Safari is 13.4', () => {
			const result = evaluateBrowser(
				firefoxMobile23, {
				browserSupport: { 'Mobile Safari': { major: 13, minor: 4 } },
			});
			expect(result.isBrowserOutOfDate).toBeTruthy();
		});

		test('FF Mobile 23.0 is not out-of-date when min Mobile Safari is 14', () => {
			const result = evaluateBrowser(
				firefoxMobile23, {
				browserSupport: { 'Mobile Safari': 14 },
			});
			expect(result.isBrowserOutOfDate).toBeTruthy();
		});
	}

	// Edge
	{
		const edge80 = parseUserAgent('Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Mobile Safari/537.36');
		const edge79 = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36 Edg/79.0.309.71');
		const edge18 = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; Cortana 1.12.3.18362; 10.0.0.0.18362.720) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18362');
		const edge17 = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; MSAppHost/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134');

		test('Edge 79 is not out-of-date when min Edge is 79', () => {
			const result = evaluateBrowser(
				edge79, {
				browserSupport: { Edge: 79 },
			});
			expect(result.isBrowserOutOfDate).toBeFalsy();
		});

		test('Edge 79 is out-of-date when min Edge is 80', () => {
			const result = evaluateBrowser(
				edge79, {
				browserSupport: { Edge: 80 },
			});
			expect(result.isBrowserOutOfDate).toBeTruthy();
		});

		test('Edge 80 is not out-of-date when min Edge is 80', () => {
			const result = evaluateBrowser(
				edge80, {
				browserSupport: { Edge: 80 },
			});
			expect(result.isBrowserOutOfDate).toBeFalsy();
		});

		// For Edge before it was on Chromium, when it was using the EDGEHTML_VS_EDGE_VERSIONS mapping
		test('Edge 18 is out-of-date when min Edge is 80', () => {
			const result = evaluateBrowser(
				edge18, {
				browserSupport: { Edge: 80 },
			});
			expect(result.isBrowserOutOfDate).toBeTruthy();
		});

		test('Edge 18 is not out-of-date when min Edge is 44 (after version map)', () => {
			const result = evaluateBrowser(
				edge18, {
				browserSupport: { Edge: 44 },
			});
			expect(result.isBrowserOutOfDate).toBeFalsy();
		});

		test('Edge 17 is out-of-date when min Edge is 44 (after version map)', () => {
			const result = evaluateBrowser(
				edge17, {
				browserSupport: { Edge: 44 },
			});
			expect(result.isBrowserOutOfDate).toBeTruthy();
		});
	}
}
