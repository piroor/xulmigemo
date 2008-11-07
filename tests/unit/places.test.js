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

function testValidInput()
{
	assert.isFalse(XMigemoPlaces.isValidInput('http://piro.sakura.ne.jp/'));
	assert.isFalse(XMigemoPlaces.isValidInput('https://addons.mozilla.org/'));
	assert.isFalse(XMigemoPlaces.isValidInput('i')); // too short input
	assert.isTrue(XMigemoPlaces.isValidInput('/reg(ular)?exp(ression)?s?/'));
	assert.isTrue(XMigemoPlaces.isValidInput('nihongo'));
	assert.isTrue(XMigemoPlaces.isValidInput('nihongo eigo'));
}

function testUpdateFindKeyRegExp()
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

function testExtractFindKeysFromInput()
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

function testGetFindFlagFromInput()
{
	var input = 'tagged + bookmarked * history ^ title @ uri # find';
	var newInput = {};
	var flags = XMigemoPlaces.getFindFlagFromInput(input, newInput);

	assert.equals('tagged bookmarked history title uri find', newInput.value);

	assert.isTrue(flags & XMigemoPlaces.kFIND_HISTORY);
	assert.isTrue(flags & XMigemoPlaces.kFIND_BOOKMARKS);
	assert.isTrue(flags & XMigemoPlaces.kFIND_TAGGED);
	assert.isTrue(flags & XMigemoPlaces.kFIND_TITLE);
	assert.isTrue(flags & XMigemoPlaces.kFIND_URI);
}

function testGetFindKeyContentsFromFlag()
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

function testGetFindSourceFilterFromFlag()
{
	var flags, result;

	flags = XMigemoPlaces.kFIND_HISTORY;
	result = XMigemoPlaces.getFindSourceFilterFromFlag(flags);
	assert.contains('JOIN moz_historyvisits', result);
	assert.notContains('JOIN moz_bookmarks', result);

	flags = XMigemoPlaces.kFIND_BOOKMARKS;
	result = XMigemoPlaces.getFindSourceFilterFromFlag(flags);
	assert.contains('JOIN moz_bookmarks', result);
	assert.notContains('JOIN moz_historyvisits', result);

	flags = XMigemoPlaces.kFIND_TAGGED;
	result = XMigemoPlaces.getFindSourceFilterFromFlag(flags);
	assert.contains('JOIN moz_bookmarks', result);
	assert.notContains('JOIN moz_historyvisits', result);
}
