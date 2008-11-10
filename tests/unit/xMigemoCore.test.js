utils.include('../../components/pXMigemoCore.js', null, 'Shift_JIS');

var core;

function setUp()
{
	core = new pXMigemoCore();
}

function tearDown()
{
	core = null;
}

function test_getRegExpFor()
{
	assert.equals('(\\(|（)', core.getRegExpFor('('));
	assert.equals('(\\)|）)', core.getRegExpFor(')'));
	assert.equals('(\\[|［)', core.getRegExpFor('['));
	assert.equals('(\\]|］)', core.getRegExpFor(']'));
}
