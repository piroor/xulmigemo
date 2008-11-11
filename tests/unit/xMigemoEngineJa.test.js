utils.include('../../components/pXMigemoEngineJa.js', null, 'Shift_JIS');

var engine;

function setUp()
{
	engine = new pXMigemoEngineJa();
}

function tearDown()
{
	engine = null;
}

function test_getRegExpFor()
{
	assert.equals('\\(|（', engine.getRegExpFor('('));
	assert.equals('\\)|）', engine.getRegExpFor(')'));
	assert.equals('\\[|［', engine.getRegExpFor('['));
	assert.equals('\\]|］', engine.getRegExpFor(']'));

	function assertRegExpFor(aExpected, aInput) {
		var regexp = engine.getRegExpFor(aInput);
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
}
