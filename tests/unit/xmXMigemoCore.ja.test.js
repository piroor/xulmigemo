utils.include('xmXMigemoClasses.inc.js');

var core;
var range;
function destroyRange()
{
	if (range) {
		range.detach();
		range = null;
	}
}

function setUp()
{
	utils.setPref('xulmigemo.lang', 'ja');
	core = new xmXMigemoCore();
	core.init('ja');
	range = null;
}

function tearDown()
{
	core.destroy();
	core = null;

	destroyRange();
}

test_getRegExpFor.parameters = utils.readJSON('xmXMigemoEngineJa_regExpPatterns.json', 'UTF-8');
function test_getRegExpFor(aParameter)
{
	var regexp = core.getRegExpFor(aParameter.input);
	regexp = new RegExp(regexp, 'i');
	aParameter.terms.forEach(function(aTerm) {
		assert.pattern(aTerm, regexp);
	});
}

function test_regExpFind_forHiddenTargets()
{
	yield Do(utils.loadURI('../fixtures/containsHiddenMatchTarget.html'));

	range = content.document.createRange();
	range.selectNodeContents(content.document.getElementsByTagName('body')[0]);
	var foundRange = core.regExpFind('a|b|c', 'gi', range, null, null, false);
	assert.equals('a', foundRange.toString());

	content.document.getElementsByTagName('legend')[0].setAttribute('style', 'display:inline');
	yield 100;
	foundRange = core.regExpFind('a|b|c', 'gi', range, null, null, false);
	assert.equals('b', foundRange.toString());

	destroyRange();
}

function test_regExpFindArr_forHiddenTargets()
{
	yield Do(utils.loadURI('../fixtures/containsHiddenMatchTarget.html'));

	range = content.document.createRange();
	range.selectNodeContents(content.document.getElementsByTagName('body')[0]);
	var array = core.regExpFindArray('a|b|c', 'gi', range, null, null);
	assert.equals(4, array.length);
	assert.equals(['a', 'b', 'a', 'c'], array.map(function(aRange) { return aRange.toString(); }));

	content.document.getElementsByTagName('legend')[0].setAttribute('style', 'display:inline');
	yield 100;
	array = core.regExpFindArray('a|b|c', 'gi', range, null, null);
	assert.equals(5, array.length);
	assert.equals(['b', 'a', 'b', 'a', 'c'], array.map(function(aRange) { return aRange.toString(); }));

	destroyRange();
}

function test_regExpHighlight()
{
	function assertMatchCount(aTerm, aFlags, aCount, aRoot)
	{
		var surroundNode = content.document.createElement('span');
		surroundNode.setAttribute('class', 'highlight');
		surroundNode.setAttribute('style', 'background: blue;');

		var expression = 'count(descendant::*[@class="highlight"])';

		range = content.document.createRange();
		range.selectNodeContents(content.document.getElementsByTagName('body')[0]);
		core.regExpHighlight(aTerm, aFlags, range, surroundNode);
		assert.equals(aCount, $X(expression, aRoot || content.document, XPathResult.NUMBER_TYPE));

		destroyRange();
	}

	yield Do(utils.loadURI('../fixtures/caseSensitive.html'));
	assertMatchCount('firefox', '', 3);

	yield Do(utils.loadURI('../fixtures/caseSensitive.html'));
	assertMatchCount('firefox', 'i', 9);

	yield Do(utils.loadURI('../fixtures/keyEventTest.html'));
	var input = content.document.getElementsByTagName('input')[0];
	assertMatchCount('Text', '', 0,
		input.QueryInterface(Ci.nsIDOMNSEditableElement)
			.editor
			.rootElement);

	yield Do(utils.loadURI('../fixtures/keyEventTest.html'));
	input = content.document.getElementsByTagName('input')[0];
	assertMatchCount('Text', 'i', 1,
		input.QueryInterface(Ci.nsIDOMNSEditableElement)
			.editor
			.rootElement);

	destroyRange();
}

test_regExpHighlightSelection.description = 'Firefox 3.1以降での選択範囲によるハイライト表示';
function test_regExpHighlightSelection()
{
	function assertMatchCount(aTerm, aFlags, aCount, aSelCon)
	{
		range = content.document.createRange();
		range.selectNodeContents(content.document.getElementsByTagName('body')[0]);
		core.regExpHighlightSelection(aTerm, aFlags, range, null);

		var selCon = aSelCon || content.QueryInterface(Ci.nsIInterfaceRequestor)
							.getInterface(Ci.nsIWebNavigation)
							.QueryInterface(Ci.nsIDocShell)
							.QueryInterface(Ci.nsIInterfaceRequestor)
							.getInterface(Ci.nsISelectionDisplay)
							.QueryInterface(Ci.nsISelectionController);
		var selection = selCon.getSelection(selCon.SELECTION_FIND);
		assert.equals(aCount, selection.rangeCount);

		destroyRange();
	}

	yield Do(utils.loadURI('../fixtures/caseSensitive.html'));
	assertMatchCount('firefox', '', 3);

	yield Do(utils.loadURI('../fixtures/caseSensitive.html'));
	assertMatchCount('firefox', 'i', 9);

	yield Do(utils.loadURI('../fixtures/keyEventTest.html'));
	var input = content.document.getElementsByTagName('input')[0];
	var selCon = input.QueryInterface(Ci.nsIDOMNSEditableElement)
				.editor
				.selectionController;
	assertMatchCount('Text', '', 0, selCon);

	yield Do(utils.loadURI('../fixtures/keyEventTest.html'));
	input = content.document.getElementsByTagName('input')[0];
	selCon = input.QueryInterface(Ci.nsIDOMNSEditableElement)
				.editor
				.selectionController;
	assertMatchCount('Text', 'i', 1, selCon);

	destroyRange();
}
if (!('SELECTION_FIND' in Components.interfaces.nsISelectionController)) {
	test_regExpHighlightSelection.priority = 'never';
}

var getRegExpPatterns = {
	single    : { input      : 'nihongo',
	              match      : ['日本語'],
	              notMatch   : ['英語'],
	              matchArray : [['日本語']],
	              notMatchArray : [['英語']],
	              terms      : ['日本語'],
	              notTerms   : ['英語'],
	              exceptions : [] },
	multiple  : { input      : 'nihongo eigo',
	              match      : ['日本語と英語', '英語と日本語'],
	              notMatch   : ['日本語', '英語'],
	              matchArray : [['日本語'], ['英語']],
	              notMatchArray : [['英語'], ['日本語']],
	              terms      : ['日本語', '英語'],
	              notTerms   : ['仏語'],
	              exceptions : [] },
	exception : { input      : 'nihongo eigo -mozira',
	              match      : ['日本語と英語', '英語と日本語', '英語と日本語もモジラ'],
	              notMatch   : ['日本語', '英語', 'モジラ'],
	              matchArray : [['日本語'], ['英語']],
	              notMatchArray : [['英語', 'モジラ'], ['日本語', 'モジラ']],
	              terms      : ['日本語', '英語'],
	              notTerms   : ['モジラ'],
	              exceptions : ['モジラ'] }
};

test_getRegExpFunctional.parameters = getRegExpPatterns;
function test_getRegExpFunctional(aParameter)
{
	var terms = {};
	var exceptions = {};
	var result = core.getRegExpFunctional(aParameter.input, terms, exceptions);

	assert.isString(result);
	var regexp = new RegExp(result);
	aParameter.match.forEach(function(aMatch) {
		assert.pattern(aMatch, regexp);
	});
	aParameter.notMatch.forEach(function(aNotMatch) {
		assert.notPattern(aNotMatch, regexp);
	});

	assert.isString(terms.value);
	assert.notEquals('', terms.value);
	regexp = new RegExp(terms.value);
	aParameter.terms.forEach(function(aMatch) {
		assert.pattern(aMatch, regexp);
	});
	aParameter.notTerms.forEach(function(aNotMatch) {
		assert.notPattern(aNotMatch, regexp);
	});

	if (aParameter.exceptions.length) {
		assert.isString(exceptions.value);
		assert.notEquals('', exceptions.value);
		regexp = new RegExp(exceptions.value);
		aParameter.exceptions.forEach(function(aException) {
			assert.pattern(aException, regexp);
		});
	}
	else {
		assert.equals('', exceptions.value);
	}
}

test_getRegExpsFunctional.parameters = getRegExpPatterns;
function test_getRegExpsFunctional(aParameter)
{
	var terms = {};
	var exceptions = {};
	var result = core.getRegExpsFunctional(aParameter.input, terms, exceptions);

	assert.isNotString(result);
	assert.equals(aParameter.matchArray.length, result.length);
	aParameter.matchArray.forEach(function(aMatchPatterns, aIndex) {
		var regexp = new RegExp(result[aIndex]);
		aMatchPatterns.forEach(function(aMatch) {
			assert.pattern(aMatch, regexp);
		});
		aParameter.notMatchArray[aIndex].forEach(function(aNotMatch) {
			assert.notPattern(aNotMatch, regexp);
		});
	});

	assert.isString(terms.value);
	assert.notEquals('', terms.value);
	regexp = new RegExp(terms.value);
	aParameter.terms.forEach(function(aMatch) {
		assert.pattern(aMatch, regexp);
	});
	aParameter.notTerms.forEach(function(aNotMatch) {
		assert.notPattern(aNotMatch, regexp);
	});

	if (aParameter.exceptions.length) {
		assert.isString(exceptions.value);
		assert.notEquals('', exceptions.value);
		regexp = new RegExp(exceptions.value);
		aParameter.exceptions.forEach(function(aException) {
			assert.pattern(aException, regexp);
		});
	}
	else {
		assert.equals('', exceptions.value);
	}
}
