utils.include('pXMigemoClasses.inc.js');

var core;

function setUp()
{
	core = new pXMigemoCore();
	core.init('ja');
}

function tearDown()
{
	core.destroy();
	core = null;
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

	var range = content.document.createRange();
	range.selectNodeContents(content.document.getElementsByTagName('body')[0]);
	var foundRange = core.regExpFind('a|b|c', 'gi', range, null, null, false);
	assert.equals('a', foundRange.toString());

	content.document.getElementsByTagName('legend')[0].setAttribute('style', 'display:inline');
	yield 100;
	foundRange = core.regExpFind('a|b|c', 'gi', range, null, null, false);
	assert.equals('b', foundRange.toString());
}

function test_regExpFindArr_forHiddenTargets()
{
	yield Do(utils.loadURI('../fixtures/containsHiddenMatchTarget.html'));

	var range = content.document.createRange();
	range.selectNodeContents(content.document.getElementsByTagName('body')[0]);
	var array = core.regExpFindArr('a|b|c', 'gi', range, null, null);
	assert.equals(4, array.length);
	assert.equals(['a', 'b', 'a', 'c'], array.map(function(aRange) { return aRange.toString(); }));

	content.document.getElementsByTagName('legend')[0].setAttribute('style', 'display:inline');
	yield 100;
	array = core.regExpFindArr('a|b|c', 'gi', range, null, null);
	assert.equals(5, array.length);
	assert.equals(['b', 'a', 'b', 'a', 'c'], array.map(function(aRange) { return aRange.toString(); }));
}


test_regExpHighlightTextWithSelection.description = 'Firefox 3.1以降での選択範囲によるハイライト表示';
function test_regExpHighlightTextWithSelection()
{
	yield Do(utils.loadURI('../fixtures/keyEventTest.html'));

	var range = content.document.createRange();
	range.selectNodeContents(content.document.getElementsByTagName('body')[0]);
	core.regExpHighlightTextWithSelection('text', '', range, null);

	var selCon = content.QueryInterface(Ci.nsIInterfaceRequestor)
						.getInterface(Ci.nsIWebNavigation)
						.QueryInterface(Ci.nsIDocShell)
						.QueryInterface(Ci.nsIInterfaceRequestor)
						.getInterface(Ci.nsISelectionDisplay)
						.QueryInterface(Ci.nsISelectionController);

	var selection = selCon.getSelection(selCon.SELECTION_FIND);
	assert.notEquals(0, selection.rangeCount);

	var input = content.document.getElementsByTagName('input')[0];
	selCon = input.QueryInterface(Ci.nsIDOMNSEditableElement)
				.editor
				.selectionController;
	selection = selCon.getSelection(selCon.SELECTION_FIND);
	assert.notEquals(0, selection.rangeCount);
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
