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
}
