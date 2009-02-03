var orig = {};
utils.include('../../content/xulmigemo/core.js', orig, 'Shift_JIS');
utils.include('../../content/xulmigemo/places/places.js', orig, 'Shift_JIS');

var XMigemoCore;
var XMigemoPlaces;

function setUp()
{
	XMigemoCore = {};
	XMigemoCore.__proto__ = orig.XMigemoCore;

	XMigemoPlaces = {};
	XMigemoPlaces.__proto__ = orig.XMigemoPlaces;

	XMigemoPlaces.findHistoryKey = '^';
	XMigemoPlaces.findBookmarksKey = '*';
	XMigemoPlaces.findTaggedKey = '+';
	XMigemoPlaces.findTitleKey = '@';
	XMigemoPlaces.findURIKey = '#';
	XMigemoPlaces.updateFindKeyRegExp();
}

function tearDown()
{
}

function test_isValidInput()
{
	assert.isFalse(XMigemoPlaces.isValidInput('http://piro.sakura.ne.jp/'));
	assert.isFalse(XMigemoPlaces.isValidInput('https://addons.mozilla.org/'));
	assert.isFalse(XMigemoPlaces.isValidInput('i')); // too short input
	assert.isTrue(XMigemoPlaces.isValidInput('/reg(ular)?exp(ression)?s?/'));
	assert.isTrue(XMigemoPlaces.isValidInput('nihongo'));
	assert.isTrue(XMigemoPlaces.isValidInput('nihongo eigo'));
}

function test_updateFindKeyRegExp()
{
	XMigemoPlaces.updateFindKeyRegExp();
	assert.isNotNull(XMigemoPlaces.findKeyRegExp);

	assert.pattern('word + word word', XMigemoPlaces.findKeyRegExp);
	assert.pattern('word + word * word', XMigemoPlaces.findKeyRegExp);
	assert.pattern('word @ word # word', XMigemoPlaces.findKeyRegExp);
	assert.notPattern('word word word', XMigemoPlaces.findKeyRegExp);
	assert.notPattern('word ; word word', XMigemoPlaces.findKeyRegExp);
	assert.notPattern('word $ word word', XMigemoPlaces.findKeyRegExp);

	XMigemoPlaces.findHistoryKey = '';
	XMigemoPlaces.findBookmarksKey = '';
	XMigemoPlaces.findTaggedKey = '';
	XMigemoPlaces.findTitleKey = '';
	XMigemoPlaces.findURIKey = '';
	XMigemoPlaces.updateFindKeyRegExp();
	assert.isNull(XMigemoPlaces.findKeyRegExp);
}

function test_extractFindKeysFromInput()
{
	var input = 'tagged + bookmarked * history ^ title @ uri # find';
	var newInput = {};
	var keys = XMigemoPlaces.extractFindKeysFromInput(input, newInput);

	assert.equals('tagged bookmarked history title uri find', newInput.value);
	assert.contains('+', keys);
	assert.contains('*', keys);
	assert.contains('^', keys);
	assert.contains('@', keys);
	assert.contains('#', keys);
}

function test_getFindFlagFromInput()
{
	var input = 'tagged + bookmarked * history ^ title @ uri # find';
	var newInput = {};
	var flags = XMigemoPlaces.getFindFlagFromInput(input, newInput);

	assert.equals('tagged bookmarked history title uri find', newInput.value);

	assert.isTrue(flags & XMigemoPlaces.kRESTRICT_HISTORY);
	assert.isTrue(flags & XMigemoPlaces.kRESTRICT_BOOKMARKS);
	assert.isTrue(flags & XMigemoPlaces.kRESTRICT_TAGGED);
	assert.isTrue(flags & XMigemoPlaces.kFIND_TITLE);
	assert.isTrue(flags & XMigemoPlaces.kFIND_URI);
}

function test_getFindKeyContentsFromFlag()
{
	var flags, result;

	flags = XMigemoPlaces.kFIND_TITLE;
	result = XMigemoPlaces.getFindKeyContentsFromFlag(flags);
	assert.contains('COALESCE(bookmark, title)', result);
	assert.notContains('uri', result);
	assert.notContains('COALESCE(tags, "")', result);

	flags = XMigemoPlaces.kFIND_URI;
	result = XMigemoPlaces.getFindKeyContentsFromFlag(flags);
	assert.notContains('COALESCE(bookmark, title)', result);
	assert.contains('uri', result);
	assert.notContains('COALESCE(tags, "")', result);

	flags = XMigemoPlaces.kFIND_TITLE | XMigemoPlaces.kFIND_URI;
	result = XMigemoPlaces.getFindKeyContentsFromFlag(flags);
	assert.contains('COALESCE(bookmark, title)', result);
	assert.contains('uri', result);
	assert.notContains('COALESCE(tags, "")', result);

	flags = 0;
	result = XMigemoPlaces.getFindKeyContentsFromFlag(flags);
	assert.contains('COALESCE(bookmark, title)', result);
	assert.contains('uri', result);
	assert.contains('COALESCE(tags, "")', result);
}

function test_getFindSourceFilterFromFlag()
{
	var flags, result;

	flags = XMigemoPlaces.kRESTRICT_HISTORY;
	result = XMigemoPlaces.getFindSourceFilterFromFlag(flags);
	assert.contains('JOIN moz_historyvisits', result);
	assert.notContains('JOIN moz_bookmarks', result);

	flags = XMigemoPlaces.kRESTRICT_BOOKMARKS;
	result = XMigemoPlaces.getFindSourceFilterFromFlag(flags);
	assert.contains('JOIN moz_bookmarks', result);
	assert.notContains('JOIN moz_historyvisits', result);

	flags = XMigemoPlaces.kRESTRICT_TAGGED;
	result = XMigemoPlaces.getFindSourceFilterFromFlag(flags);
	assert.contains('JOIN moz_bookmarks', result);
	assert.notContains('JOIN moz_historyvisits', result);
}


assert.insertCondition = function(aMethod, aSQL, aRestrictTarget, aCondition)
{
	var message = aMethod+' for '+aRestrictTarget;
	[
		'kRESTRICT_HISTORY',
		'kRESTRICT_BOOKMARKS',
		'kRESTRICT_TAGGED',
		'kRESTRICT_TYPED'
	].forEach(function(aFlag) {
		var flag = XMigemoPlaces[aFlag];
		var result = XMigemoPlaces[aMethod](aSQL, flag);
		if (aRestrictTarget == '*' || aRestrictTarget == aFlag) {
			assert.contains(aCondition, result, message+' / '+aFlag);
		}
		else {
			assert.notContains(aCondition, result, message+' / '+aFlag);
		}
	});
}

function test_insertConditions()
{
	assert.insertCondition(
		'insertTaggedCondition',
		'%ONLY_TAGGED%',
		'kRESTRICT_TAGGED',
		'tags NOT NULL'
	);

	XMigemoPlaces.filterTyped = false;
	assert.insertCondition(
		'insertTypedCondition',
		'%ONLY_TYPED%',
		'kRESTRICT_TYPED',
		'typed = 1'
	);
	XMigemoPlaces.filterTyped = true;
	assert.insertCondition(
		'insertTypedCondition',
		'%ONLY_TYPED%',
		'*',
		'typed = 1'
	);

	XMigemoPlaces.filterJavaScript = false;
	assert.insertCondition(
		'insertJavaScriptCondition',
		'%EXCLUDE_JAVASCRIPT%',
		'',
		'url NOT LIKE "javascript:%"'
	);
	XMigemoPlaces.filterJavaScript = true;
	assert.insertCondition(
		'insertJavaScriptCondition',
		'%EXCLUDE_JAVASCRIPT%',
		'*',
		'url NOT LIKE "javascript:%"'
	);
}


