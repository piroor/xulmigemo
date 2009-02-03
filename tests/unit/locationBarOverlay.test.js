var orig = {};
utils.include('../../content/xulmigemo/core.js', orig, 'Shift_JIS');
utils.include('../../content/xulmigemo/places/places.js', orig, 'Shift_JIS');
utils.include('../../content/xulmigemo/places/locationBarOverlay.js', null, 'Shift_JIS');

var XMigemoCore;
var XMigemoPlaces;
var service;

function setUp()
{
	XMigemoCore = {};
	XMigemoCore.__proto__ = orig.XMigemoCore;

	XMigemoPlaces = {};
	XMigemoPlaces.__proto__ = orig.XMigemoPlaces;

	service = {};
	service.__proto__ = XMigemoLocationBarOverlay;

	XMigemoPlaces.findHistoryKey = '^';
	XMigemoPlaces.findBookmarksKey = '*';
	XMigemoPlaces.findTaggedKey = '+';
	XMigemoPlaces.findTitleKey = '@';
	XMigemoPlaces.findURIKey = '#';
	XMigemoPlaces.updateFindKeyRegExp();

	XMigemoPlaces.defaultBehavior = 0;
	XMigemoPlaces.autoStartRegExpFind = true;
}

function tearDown()
{
}

function test_parseInput()
{
	var info;

	info = service.parseInput('nihongo');
	assert.equals('nihongo', info.input);
	assert.equals(0, info.findFlag);
	assert.equals(service.FIND_MODE_MIGEMO, info.findMode);
	assert.pattern('にほんご', info.findRegExp);
	assert.pattern('にほんご', info.termsRegExp);
	assert.isNull(info.exceptionsRegExp);

	info = service.parseInput('nihongo -eigo');
	assert.equals('nihongo -eigo', info.input);
	assert.equals(0, info.findFlag);
	assert.equals(service.FIND_MODE_MIGEMO, info.findMode);
	assert.pattern('にほんご', info.findRegExp);
	assert.pattern('にほんご', info.termsRegExp);
	assert.pattern('えいご', info.exceptionsRegExp);

	XMigemoPlaces.autoStartRegExpFind = true;
	info = service.parseInput('/reg(ular )?exp?(ression)?/');
	assert.equals('/reg(ular )?exp?(ression)?/', info.input);
	assert.equals(0, info.findFlag);
	assert.equals(service.FIND_MODE_REGEXP, info.findMode);
	assert.pattern('regexp', info.findRegExp);
	assert.pattern('regular expression', info.findRegExp);
	assert.pattern('regexp', info.termsRegExp);
	assert.pattern('regular expression', info.termsRegExp);
	assert.isNull(info.exceptionsRegExp);

	XMigemoPlaces.autoStartRegExpFind = false;
	info = service.parseInput('/reg(ular )?exp?(ression)?/');
	assert.equals('/reg(ular )?exp?(ression)?/', info.input);
	assert.equals(0, info.findFlag);
	assert.equals(service.FIND_MODE_MIGEMO, info.findMode);
	assert.isNull(info.exceptionsRegExp);
}

