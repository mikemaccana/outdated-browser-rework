'use strict';

const evaluateBrowser = require('../evaluateBrowser.js');
var UserAgentParser = require("ua-parser-js")

function parseUserAgent(userAgent) {
	// Despite the docs, UA needs to be provided to constructor explicitly:
	// https://github.com/faisalman/ua-parser-js/issues/90
	return new UserAgentParser(userAgent).getResult();
}

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
