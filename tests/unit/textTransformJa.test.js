utils.include('../../components/pXMigemoTextTransformJa.js', null, 'Shift_JIS');

var transform;

function setUp()
{
	transform = new pXMigemoTextTransformJa();
}

function tearDown()
{
	transform = null;
}

function test_optimizeRegExp()
{
	assert.equals('[abc]', transform.optimizeRegExp('(a|b|c)'));
	assert.equals('[abc]', transform.optimizeRegExp('(a|||b|||c)'));
	assert.equals('(a|b|cd)', transform.optimizeRegExp('(a|b|cd)'));
	assert.equals('(a|b|cd)', transform.optimizeRegExp('(a|||b|||cd)'));
	assert.equals('(\\()', transform.optimizeRegExp('(\\()'));
	assert.equals('(\\))', transform.optimizeRegExp('(\\))'));
	assert.equals('(\\(\\))', transform.optimizeRegExp('(\\(\\))'));
	assert.equals('(\\(|（)', transform.optimizeRegExp('(\\(|（)'));
	assert.equals('(\\)|）)', transform.optimizeRegExp('(\\)|）)'));
	assert.equals('((\\(|（)(\\)|）))', transform.optimizeRegExp('((\\(|（)(\\)|）))'));
	assert.equals('(\\[)', transform.optimizeRegExp('(\\[)'));
	assert.equals('(\\])', transform.optimizeRegExp('(\\])'));
	assert.equals('(\\[\\])', transform.optimizeRegExp('(\\[\\])'));
	assert.equals('(\\[|［)', transform.optimizeRegExp('(\\[|［)'));
	assert.equals('(\\]|］)', transform.optimizeRegExp('(\\]|］)'));
	assert.equals('((\\[|［)(\\]|］))', transform.optimizeRegExp('((\\[|［)(\\]|］))'));
}
