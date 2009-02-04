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
	XMigemoPlaces.db = baseURL+'../res/places.sqlite';

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
	XMigemoPlaces.filterJavaScript = true;
	XMigemoPlaces.filterTyped = false;
	XMigemoPlaces.boundaryFindAvailable = true;
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

function getItemsBySQL(aSQL, aBindings)
{
	var statement = XMigemoPlaces.db.createStatement(aSQL);
	aBindings.forEach(function(aValue, aIndex) {
		if (typeof aValue == 'number')
			statement.bindDoubleParameter(aIndex, aValue);
		else
			statement.bindStringParameter(aIndex, aValue);
	});
	var items = [];
	while(statement.executeStep())
	{
		items.push({
			title    : statement.getString(0),
			uri      : statement.getString(1),
			favicon  : statement.getString(2),
			bookmark : statement.getString(3),
			tags     : statement.getString(4),
			findkey  : statement.getString(5)
		});
	}
	statement.reset();
	if (statement && 'finalize' in statement) statement.finalize();
	return items;
}

function assert_placesSQLSearch(aSource)
{
	var typed            = 'http://www.example.com/really_typed1';
	var bookmark         = 'http://www.example.com/bookmark1';
	var visited          = 'http://www.example.com/visited6';
	var visited_bookmark = 'http://www.example.com/bookmark1';
	var tagged_bookmark  = 'http://www.example.com/tagged';
	var tagged_visited   = 'http://www.example.com/tagged_visited';
	var javascript       = 'javascript:alert(\'OK\')';

	XMigemoPlaces.filterJavaScript = false;
	assert_placesSQLSearchSub(
		aSource,
		0,
		[typed, bookmark, visited, visited_bookmark, tagged_bookmark, tagged_visited, javascript],
		[],
		'JavaScriptフィルタOFF'
	);

	XMigemoPlaces.filterJavaScript = true;
	assert_placesSQLSearchSub(
		aSource,
		0,
		[typed, bookmark, visited, visited_bookmark, tagged_bookmark, tagged_visited],
		[javascript],
		'JavaScriptフィルタON'
	);

	assert_placesSQLSearchSub(
		aSource,
		XMigemoPlaces.kRESTRICT_BOOKMARKS,
		[bookmark, visited_bookmark, tagged_bookmark],
		[typed, visited, tagged_visited, javascript],
		'ブックマークに限定'
	);

	assert_placesSQLSearchSub(
		aSource,
		XMigemoPlaces.kRESTRICT_HISTORY,
		[typed, visited, visited_bookmark, tagged_visited],
		[bookmark, tagged_bookmark, javascript],
		'訪問済みページに限定'
	);

	assert_placesSQLSearchSub(
		aSource,
		XMigemoPlaces.kRESTRICT_HISTORY | XMigemoPlaces.kRESTRICT_BOOKMARKS,
		[visited_bookmark],
		[typed, bookmark, visited, tagged_bookmark, tagged_visited, javascript],
		'訪問済みブックマークに限定'
	);
}

function assert_placesSQLSearchSub(aSource, aFindFlag, aContains, aNotContains, aMessage)
{
	result = XMigemoPlaces.getSingleStringFromRange(
			aSource.getSourceSQL(aFindFlag),
			0, 1000,
			aSource.getSourceBindingFor('')
		);

	aContains.forEach(function(aURI) {
		assert.contains(aURI, result, aMessage);
	});
	aNotContains.forEach(function(aURI) {
		assert.notContains(aURI, result, aMessage);
	});

	var sql = aSource.getItemsSQL(aFindFlag)
				.replace('%TERMS_RULES%', '1')
				.replace('%SOURCES_LIMIT_PART%', 'LIMIT 0,1000');
	var items = getItemsBySQL(sql, []);
	assert.notEquals(0, items.length);
	var uris = items.map(function(aItem) { return aItem.uri; });
	aContains.forEach(function(aURI) {
		assert.contains(aURI, uris, aMessage);
	});
	aNotContains.forEach(function(aURI) {
		assert.notContains(aURI, uris, aMessage);
	});
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

	result = XMigemoPlaces.getSingleStringFromRange(
			source.getSourceSQL(0),
			0, 100,
			source.getSourceBindingFor('key term')
		);
	assert.contains('http://www.example.com/term', result);

	var sql = source.getItemsSQL(0)
				.replace('%SOURCES_LIMIT_PART%', 'LIMIT 0,10');
	var bindings = source.getItemsBindingFor('key term');
	var items = getItemsBySQL(sql, bindings);
	assert.equals(1, items.length);
	assert.equals('http://www.example.com/term', items[0].uri);
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

	result = XMigemoPlaces.getSingleStringFromRange(
			source.getSourceSQL(0),
			0, 1000,
			source.getSourceBindingFor('type')
		);
	assert.contains('http://www.example.com/really_typed1', result);
	assert.notContains('http://www.example.com/visited', result);

	var sql = source.getItemsSQL(0)
				.replace('%TERMS_RULES%', '1')
				.replace('%SOURCES_LIMIT_PART%', 'LIMIT 0,1000');
	var bindings = source.getItemsBindingFor('type');
	var items = getItemsBySQL(sql, bindings);
	assert.equals(3, items.length);
	assert.equals(
		'http://www.example.com/really_typed1\n'+
		'http://www.example.com/really_typed2\n'+
		'http://www.example.com/really_typed3',
		items.map(function(aItem) { return aItem.uri; })
			.sort().join('\n')
	);
}

function test_findSource_MATCHING_BOUNDARY()
{
	var source = service.sources.MATCHING_BOUNDARY;

	assert.isNull(source.style);

	XMigemoPlaces.boundaryFindAvailable = true;
	XMigemoPlaces.matchBehavior = 0;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 1;
	assert.isTrue(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 2;
	assert.isTrue(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 3;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));

	XMigemoPlaces.boundaryFindAvailable = false;
	XMigemoPlaces.matchBehavior = 0;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 1;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 2;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 3;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));

	var item = {
			title : 'にほんご日本語ニホンゴnihongo',
			uri   : 'http://www.example.com/'
		};
	assert.equals(service.kITEM_ACCEPT, source.itemFilter(item, ['にほん'], 0));
	assert.equals(service.kITEM_ACCEPT, source.itemFilter(item, ['にほん', '日本'], 0));
	assert.equals(service.kITEM_ACCEPT, source.itemFilter(item, ['にほん', 'example'], 0));
	assert.equals(service.kITEM_DEFERED, source.itemFilter(item, ['ほん'], 0));
	assert.equals(service.kITEM_DEFERED, source.itemFilter(item, ['にほん', '本'], 0));
	assert.equals(service.kITEM_DEFERED, source.itemFilter(item, ['にほん', 'xam'], 0));

	assert_placesSQLSearch(source);
}

function test_findSource_MATCHING_ANYWHERE()
{
	var source = service.sources.MATCHING_ANYWHERE;

	assert.isNull(source.style);

	XMigemoPlaces.boundaryFindAvailable = true;
	XMigemoPlaces.matchBehavior = 0;
	assert.isTrue(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isTrue(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 1;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isTrue(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 2;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isTrue(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 3;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isTrue(source.isAvailable(service.FIND_MODE_REGEXP));

	XMigemoPlaces.boundaryFindAvailable = false;
	XMigemoPlaces.matchBehavior = 0;
	assert.isTrue(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isTrue(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 1;
	assert.isTrue(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isTrue(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 2;
	assert.isTrue(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isTrue(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 3;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));

	assert_placesSQLSearch(source);
}

function test_findSource_MATCHING_START()
{
	var source = service.sources.MATCHING_START;

	assert.isNull(source.style);

	XMigemoPlaces.matchBehavior = 0;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 1;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 2;
	assert.isFalse(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));
	XMigemoPlaces.matchBehavior = 3;
	assert.isTrue(source.isAvailable(service.FIND_MODE_MIGEMO));
	assert.isFalse(source.isAvailable(service.FIND_MODE_REGEXP));

	var item = {
			title : 'にほんご日本語ニホンゴnihongo',
			uri   : 'http://www.example.com/'
		};
	assert.equals(service.kITEM_ACCEPT, source.itemFilter(item, ['にほん'], 0));
	assert.equals(service.kITEM_SKIP, source.itemFilter(item, ['ほん'], 0));
	assert.equals(service.kITEM_SKIP, source.itemFilter(item, ['日本'], 0));
	assert.equals(service.kITEM_ACCEPT, source.itemFilter(item, ['http'], 0));
	assert.equals(service.kITEM_SKIP, source.itemFilter(item, ['example'], 0));
	assert.equals(service.kITEM_ACCEPT, source.itemFilter(item, ['にほん', 'http'], 0));
	assert.equals(service.kITEM_SKIP, source.itemFilter(item, ['にほん', 'example'], 0));

	assert_placesSQLSearch(source);
}

function test_findItemsFromRange()
{
}

function test_findItemsFromRangeByTerms()
{
}

