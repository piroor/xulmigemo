utils.include('pXMigemoClasses.inc.js');

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
	core = new pXMigemoCore();
	core.init('ja');
	range = null;
}

function tearDown()
{
	core.destroy();
	core = null;

	destroyRange();
}

function test_getRegExpFor()
{
	assert.equals('\\(|（', core.getRegExpFor('('));
	assert.equals('\\)|）', core.getRegExpFor(')'));
	assert.equals('\\[|［', core.getRegExpFor('['));
	assert.equals('\\]|］', core.getRegExpFor(']'));

	function assertRegExpFor(aExpected, aInput) {
		var regexp = core.getRegExpFor(aInput);
		regexp = new RegExp(regexp, 'i');
		assert.pattern(aExpected, regexp);
	}
	assertRegExpFor('かかく', 'kak');
	assertRegExpFor('かこ', 'kak');
	assertRegExpFor('かっか', 'kak');
	assertRegExpFor('カントク', 'kantoku');
	assertRegExpFor('かンとく', 'kanntoku');
	assertRegExpFor('ｶﾝﾄｸ', 'kantoku');
	assertRegExpFor('なんニン', 'nannnin');
	assertRegExpFor('ナンニん', 'nannnin');
	assertRegExpFor('ウぇるカむ', 'werukam');
	assertRegExpFor('ウぇるカも', 'werukam');
	assertRegExpFor('ゑるカム', 'werukam');
	assertRegExpFor('ゑるカみ', 'werukam');
	assertRegExpFor('werukam', 'werukam');
	assertRegExpFor('Dão', 'dao');
	assertRegExpFor('おー', 'o-');
	assertRegExpFor('ｵｰ', 'o-');
	assertRegExpFor('オー', 'o-');
	assertRegExpFor('おｰ', 'o-');
	assertRegExpFor('お-', 'o-');
	assertRegExpFor('日本語', 'nihongo');
	assertRegExpFor('ハロー', 'hello');
	assertRegExpFor('window.open();', 'window.open();');
	assertRegExpFor('window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");');
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
	var array = core.regExpFindArr('a|b|c', 'gi', range, null, null);
	assert.equals(4, array.length);
	assert.equals(['a', 'b', 'a', 'c'], array.map(function(aRange) { return aRange.toString(); }));

	content.document.getElementsByTagName('legend')[0].setAttribute('style', 'display:inline');
	yield 100;
	array = core.regExpFindArr('a|b|c', 'gi', range, null, null);
	assert.equals(5, array.length);
	assert.equals(['b', 'a', 'b', 'a', 'c'], array.map(function(aRange) { return aRange.toString(); }));

	destroyRange();
}

function test_regExpHighlightText()
{
	function assertMatchCount(aTerm, aFlags, aCount, aRoot)
	{
		var surroundNode = content.document.createElement('span');
		surroundNode.setAttribute('class', 'highlight');
		surroundNode.setAttribute('style', 'background: blue;');

		var expression = 'count(descendant::*[@class="highlight"])';

		range = content.document.createRange();
		range.selectNodeContents(content.document.getElementsByTagName('body')[0]);
		core.regExpHighlightText(aTerm, aFlags, range, surroundNode);
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

test_regExpHighlightTextWithSelection.description = 'Firefox 3.1以降での選択範囲によるハイライト表示';
function test_regExpHighlightTextWithSelection()
{
	function assertMatchCount(aTerm, aFlags, aCount, aSelCon)
	{
		range = content.document.createRange();
		range.selectNodeContents(content.document.getElementsByTagName('body')[0]);
		core.regExpHighlightTextWithSelection(aTerm, aFlags, range, null);

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
	test_regExpHighlightTextWithSelection.priority = 'never';
}

function test_getRegExpFunctional()
{
	var terms, exceptions, result, regexp;

	terms = {};
	exceptions = {};
	result = core.getRegExpFunctional('nihongo', terms, exceptions);
	assert.isString(result);
	assert.pattern('日本語', new RegExp(result));
	assert.isDefined(terms.value);
	assert.pattern('日本語', new RegExp(terms.value));
	assert.isDefined(exceptions.value);
	assert.equals("", exceptions.value);

	terms = {};
	exceptions = {};
	result = core.getRegExpFunctional('nihongo eigo', terms, exceptions);
	assert.isString(result);
	regexp = new RegExp(result);
	assert.pattern('日本語と英語', regexp);
	assert.pattern('英語と日本語', regexp);
	assert.notPattern('日本語', regexp);
	assert.notPattern('英語', regexp);
	assert.isDefined(terms.value);
	regexp = new RegExp(terms.value);
	assert.pattern('日本語', regexp);
	assert.pattern('英語', regexp);
	assert.isDefined(exceptions.value);
	assert.equals("", exceptions.value);

	terms = {};
	exceptions = {};
	result = core.getRegExpFunctional('nihongo eigo -mozira', terms, exceptions);
	assert.isString(result);
	regexp = new RegExp(result);
	assert.pattern('日本語と英語', regexp);
	assert.pattern('英語と日本語', regexp);
	assert.pattern('英語と日本語もモジラ', regexp);
	assert.notPattern('日本語', regexp);
	assert.notPattern('英語', regexp);
	assert.notPattern('モジラ', regexp);
	assert.isDefined(terms.value);
	regexp = new RegExp(terms.value);
	assert.pattern('日本語', regexp);
	assert.pattern('英語', regexp);
	assert.isDefined(exceptions.value);
	regexp = new RegExp(exceptions.value);
	assert.pattern('モジラ', regexp);
}

function test_getRegExpsFunctional()
{
	var terms, exceptions, result, regexp;

	terms = {};
	exceptions = {};
	result = core.getRegExpsFunctional('nihongo', terms, exceptions);
	assert.isNotString(result);
	assert.equals(1, result.length);
	assert.pattern('日本語', new RegExp(result[0]));
	assert.isDefined(terms.value);
	assert.pattern('日本語', new RegExp(terms.value));
	assert.isDefined(exceptions.value);
	assert.equals("", exceptions.value);

	terms = {};
	exceptions = {};
	result = core.getRegExpsFunctional('nihongo eigo', terms, exceptions);
	assert.isNotString(result);
	assert.equals(2, result.length);
	regexp = new RegExp(result[0]);
	assert.pattern('日本語', regexp);
	assert.notPattern('英語', regexp);
	regexp = new RegExp(result[1]);
	assert.pattern('英語', regexp);
	assert.notPattern('日本語', regexp);
	assert.isDefined(terms.value);
	regexp = new RegExp(terms.value);
	assert.pattern('日本語', regexp);
	assert.pattern('英語', regexp);
	assert.isDefined(exceptions.value);
	assert.equals("", exceptions.value);

	terms = {};
	exceptions = {};
	result = core.getRegExpsFunctional('nihongo eigo -mozira', terms, exceptions);
	assert.isNotString(result);
	assert.equals(2, result.length);
	regexp = new RegExp(result[0]);
	assert.pattern('日本語', regexp);
	assert.notPattern('英語', regexp);
	regexp = new RegExp(result[1]);
	assert.pattern('英語', regexp);
	assert.notPattern('日本語', regexp);
	assert.isDefined(terms.value);
	regexp = new RegExp(terms.value);
	assert.pattern('日本語', regexp);
	assert.pattern('英語', regexp);
	assert.isDefined(exceptions.value);
	regexp = new RegExp(exceptions.value);
	assert.pattern('モジラ', regexp);
}
