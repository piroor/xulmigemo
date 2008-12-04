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

function test_regExpFindArr_forHiddenTargets()
{
	yield Do(utils.loadURI('../res/containsHiddenMatchTarget.html'));

	var range = content.document.createRange();
	range.selectNodeContents(content.document.getElementsByTagName('body')[0]);
	var array = core.regExpFindArr('a|能', 'gi', range, null, null);
	assert.equals(3, array.length);

	content.document.getElementsByTagName('legend')[0].setAttribute('style', 'display:inline');
	yield 100;
	array = core.regExpFindArr('a|能', 'gi', range, null, null);
	assert.equals(4, array.length);
}
