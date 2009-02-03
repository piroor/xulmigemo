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

function test_foo()
{
}

