var orig = {};
utils.include('../../content/xulmigemo/core.js', orig, 'Shift_JIS');
utils.include('../../content/xulmigemo/places/places.js', null, 'Shift_JIS');

var XMigemoCore;
var service;

function setUp()
{
	XMigemoCore = {};
	XMigemoCore.__proto__ = orig.XMigemoCore;

	service = {};
	service.__proto__ = XMigemoPlaces;

	service.findHistoryKey = '^';
	service.findBookmarksKey = '*';
	service.findTaggedKey = '+';
	service.findTitleKey = '@';
	service.findURIKey = '#';
	service.updateFindKeyRegExp();

	service.defaultBehavior = 0;
	service.autoStartRegExpFind = true;
}

function tearDown()
{
}

function test_isValidInput()
{
	assert.isFalse(service.isValidInput('http://piro.sakura.ne.jp/'));
	assert.isFalse(service.isValidInput('https://addons.mozilla.org/'));
	assert.isFalse(service.isValidInput('i')); // too short input
	assert.isTrue(service.isValidInput('/reg(ular)?exp(ression)?s?/'));
	assert.isTrue(service.isValidInput('nihongo'));
	assert.isTrue(service.isValidInput('nihongo eigo'));
}


function test_parseInput()
{
	var info;
	const pIMigemoFind = Components.interfaces.pIXMigemoFind;

	info = service.parseInput('nihongo');
	assert.equals('nihongo', info.input);
	assert.equals(0, info.findFlag);
	assert.equals(pIMigemoFind.FIND_MODE_MIGEMO, info.findMode);
	assert.pattern('にほんご', info.findRegExp);
	assert.pattern('にほんご', info.termsRegExp);
	assert.isNull(info.exceptionsRegExp);

	info = service.parseInput('nihongo -eigo');
	assert.equals('nihongo -eigo', info.input);
	assert.equals(0, info.findFlag);
	assert.equals(pIMigemoFind.FIND_MODE_MIGEMO, info.findMode);
	assert.pattern('にほんご', info.findRegExp);
	assert.pattern('にほんご', info.termsRegExp);
	assert.pattern('えいご', info.exceptionsRegExp);

	service.autoStartRegExpFind = true;
	info = service.parseInput('/reg(ular )?exp?(ression)?/');
	assert.equals('/reg(ular )?exp?(ression)?/', info.input);
	assert.equals(0, info.findFlag);
	assert.equals(pIMigemoFind.FIND_MODE_REGEXP, info.findMode);
	assert.pattern('regexp', info.findRegExp);
	assert.pattern('regular expression', info.findRegExp);
	assert.pattern('regexp', info.termsRegExp);
	assert.pattern('regular expression', info.termsRegExp);
	assert.isNull(info.exceptionsRegExp);

	service.autoStartRegExpFind = false;
	info = service.parseInput('/reg(ular )?exp?(ression)?/');
	assert.equals('/reg(ular )?exp?(ression)?/', info.input);
	assert.equals(0, info.findFlag);
	assert.equals(pIMigemoFind.FIND_MODE_MIGEMO, info.findMode);
	assert.isNull(info.exceptionsRegExp);
}

function test_updateFindKeyRegExp()
{
	service.updateFindKeyRegExp();
	assert.isNotNull(service.findKeyRegExp);

	assert.pattern('word + word word', service.findKeyRegExp);
	assert.pattern('word + word * word', service.findKeyRegExp);
	assert.pattern('word @ word # word', service.findKeyRegExp);
	assert.notPattern('word word word', service.findKeyRegExp);
	assert.notPattern('word ; word word', service.findKeyRegExp);
	assert.notPattern('word $ word word', service.findKeyRegExp);

	service.findHistoryKey = '';
	service.findBookmarksKey = '';
	service.findTaggedKey = '';
	service.findTitleKey = '';
	service.findURIKey = '';
	service.updateFindKeyRegExp();
	assert.isNull(service.findKeyRegExp);
}

function test_extractFindKeysFromInput()
{
	var input = 'tagged + bookmarked * history ^ title @ uri # find';
	var newInput = {};
	var keys = service.extractFindKeysFromInput(input, newInput);

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
	var flags = service.getFindFlagFromInput(input, newInput);

	assert.equals('tagged bookmarked history title uri find', newInput.value);

	assert.isTrue(flags & service.kRESTRICT_HISTORY);
	assert.isTrue(flags & service.kRESTRICT_BOOKMARKS);
	assert.isTrue(flags & service.kRESTRICT_TAGGED);
	assert.isTrue(flags & service.kFIND_TITLE);
	assert.isTrue(flags & service.kFIND_URI);
}

function test_getFindKeyContentsFromFlag()
{
	var flags, result;

	flags = service.kFIND_TITLE;
	result = service.getFindKeyContentsFromFlag(flags);
	assert.contains('COALESCE(bookmark, title)', result);
	assert.notContains('uri', result);
	assert.notContains('COALESCE(tags, "")', result);

	flags = service.kFIND_URI;
	result = service.getFindKeyContentsFromFlag(flags);
	assert.notContains('COALESCE(bookmark, title)', result);
	assert.contains('uri', result);
	assert.notContains('COALESCE(tags, "")', result);

	flags = service.kFIND_TITLE | service.kFIND_URI;
	result = service.getFindKeyContentsFromFlag(flags);
	assert.contains('COALESCE(bookmark, title)', result);
	assert.contains('uri', result);
	assert.notContains('COALESCE(tags, "")', result);

	flags = 0;
	result = service.getFindKeyContentsFromFlag(flags);
	assert.contains('COALESCE(bookmark, title)', result);
	assert.contains('uri', result);
	assert.contains('COALESCE(tags, "")', result);
}

function test_getFindSourceFilterFromFlag()
{
	var flags, result;

	flags = service.kRESTRICT_HISTORY;
	result = service.getFindSourceFilterFromFlag(flags);
	assert.contains('JOIN moz_historyvisits', result);
	assert.notContains('JOIN moz_bookmarks', result);

	flags = service.kRESTRICT_BOOKMARKS;
	result = service.getFindSourceFilterFromFlag(flags);
	assert.contains('JOIN moz_bookmarks', result);
	assert.notContains('JOIN moz_historyvisits', result);

	flags = service.kRESTRICT_TAGGED;
	result = service.getFindSourceFilterFromFlag(flags);
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
		var flag = service[aFlag];
		var result = service[aMethod](aSQL, flag);
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

	service.filterTyped = false;
	assert.insertCondition(
		'insertTypedCondition',
		'%ONLY_TYPED%',
		'kRESTRICT_TYPED',
		'typed = 1'
	);
	service.filterTyped = true;
	assert.insertCondition(
		'insertTypedCondition',
		'%ONLY_TYPED%',
		'*',
		'typed = 1'
	);

	service.filterJavaScript = false;
	assert.insertCondition(
		'insertJavaScriptCondition',
		'%EXCLUDE_JAVASCRIPT%',
		'',
		'url NOT LIKE "javascript:%"'
	);
	service.filterJavaScript = true;
	assert.insertCondition(
		'insertJavaScriptCondition',
		'%EXCLUDE_JAVASCRIPT%',
		'*',
		'url NOT LIKE "javascript:%"'
	);
}

function test_formatInputForKeywordSearch()
{
	var result;

	result = service.formatInputForKeywordSearch('keyword term');
	assert.equals('keyword', result.keyword);
	assert.equals('term', result.terms);

	result = service.formatInputForKeywordSearch('language C++ JavaScript Ruby ');
	assert.equals('language', result.keyword);
	assert.equals('C%2B%2B+JavaScript+Ruby', result.terms);
}


function test_getSingleStringFromRange_withoutRange()
{
	var sql = <![CDATA[
			SELECT GROUP_CONCAT(url, %PLACE_FOR_LINEBREAK%)
			  FROM (SELECT *
			          FROM moz_places
			         ORDER BY id ASC
			         LIMIT 0,2)
		]]>.toString();
	assert.equals('', service.getSingleStringFromRange(sql, 0, 0));
}

function test_getSingleStringFromRange_withoutBinding()
{
	var sql = <![CDATA[
			SELECT GROUP_CONCAT(url, %PLACE_FOR_LINEBREAK%)
			  FROM (SELECT *
			          FROM moz_places
			         ORDER BY id ASC
			         LIMIT %PLACE_FOR_START%,%PLACE_FOR_RANGE%)
		]]>.toString();
	var sources1 = service.getSingleStringFromRange(sql, 0, 2);
	var sources2 = service.getSingleStringFromRange(sql, 2, 2);
	var sources3 = service.getSingleStringFromRange(sql, 0, 4);
	assert.notEquals(sources1, sources2);
	assert.equals(sources1+'\n'+sources2, sources3);
}

function test_getSingleStringFromRange_withBinding()
{
	var sql = <![CDATA[
			SELECT GROUP_CONCAT(url, %PLACE_FOR_LINEBREAK%)
			  FROM (SELECT *
			          FROM moz_places
			         WHERE url LIKE ?1 OR visit_count > ?2
			         ORDER BY id ASC
			         LIMIT %PLACE_FOR_START%,%PLACE_FOR_RANGE%)
		]]>.toString();
	var binding = ['http://%', 1];
	var sources1 = service.getSingleStringFromRange(sql, 0, 2, binding);
	var sources2 = service.getSingleStringFromRange(sql, 2, 2, binding);
	var sources3 = service.getSingleStringFromRange(sql, 0, 4, binding);
	assert.notEquals(sources1, sources2);
	assert.equals(sources1+'\n'+sources2, sources3);
}

