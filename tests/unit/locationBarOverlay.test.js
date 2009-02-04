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
		assert.isFunction(source.isAvailable, i);
		assert.isFunction(source.getSourceSQL, i);
		assert.isFunction(source.getSourceBindingFor, i);
		assert.isFunction(source.getItemsSQL, i);
		assert.isFunction(source.getItemsBindingFor, i);
		assert.isFunction(source.itemFilter, i);
	}
}

function test_findSource_KEYWORD_SEARCH()
{
	var source = service.sources.KEYWORD_SEARCH;

	var result;
	result = source.formatInput('keyword term');
	assert.equals('keyword', result.keyword);
	assert.equals('term', result.terms);

	result = source.formatInput('language C++ JavaScript Ruby ');
	assert.equals('language', result.keyword);
	assert.equals('C%2B%2B+JavaScript+Ruby', result.terms);

	assert.equals(['keyword', 'terms'], source.getSourceBindingFor('keyword terms'));
	assert.equals(['keyword', 'terms'], source.getItemsBindingFor('keyword terms'));

	assert.isFunction(source.termsGetter);
	assert.equals(['keyword', 'terms'], source.termsGetter('keyword terms', 'keyword terms'));

	assert.isFunction(source.exceptionsGetter);
	assert.equals([], source.exceptionsGetter('keyword terms'));

	assert.equals('keyword', source.style);

	assert.isTrue(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isTrue(source.isAvailable(service.FIND_MODE_REGEXP));
}

function test_findSource_INPUT_HISTORY()
{
	var source = service.sources.INPUT_HISTORY;

	assert.equals(['input'], source.getSourceBindingFor('input'));
	assert.equals(['input'], source.getItemsBindingFor('input'));

	assert.isNotFunction(source.termsGetter);
	assert.isNotFunction(source.exceptionsGetter);

	assert.isNull(source.style);

	assert.isTrue(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isTrue(source.isAvailable(service.FIND_MODE_REGEXP));
}

function test_findItemsFromRange()
{
}

function test_findItemsFromRangeByTerms()
{
}

