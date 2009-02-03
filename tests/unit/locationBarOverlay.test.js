var orig = {};
utils.include('../../content/xulmigemo/core.js', orig, 'Shift_JIS');
utils.include('../../content/xulmigemo/places/places.js', orig, 'Shift_JIS');
utils.include('../../content/xulmigemo/places/locationBarOverlay.js', null, 'Shift_JIS');

var XMigemoCore;
var XMigemoPlaces;
var searchSource;
var service;

function setUp()
{
	XMigemoCore = {};
	XMigemoCore.__proto__ = orig.XMigemoCore;

	XMigemoPlaces = {};
	XMigemoPlaces.__proto__ = orig.XMigemoPlaces;

	service = {};
	service.__proto__ = XMigemoLocationBarOverlay;

	searchSource = {};
	searchSource.__proto__ = XMigemoLocationBarSearchSource;

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

function test_findSources()
{
	for (var i in service.sources)
	{
		let source = service.sources[i];
	}
}

function test_findItemsFromRange()
{
}

function test_findItemsFromRangeByTerms()
{
}

