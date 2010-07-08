var description = '非表示の要素の内容として正規表現検索にマッチする物があるケース';

utils.include('common.inc.js');

var gTestPageURI = '../fixtures/containsHiddenMatchTarget.html';

function setUp()
{
	commonSetUp(gTestPageURI);
	assert.isTrue(XMigemoUI.hidden);
}

function tearDown()
{
	commonTearDown();
}

function testRegExpFind()
{
	gFindBar.open();
	utils.wait(WAIT);
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	field.focus();

	action.inputTo(field, 'a|b');
	utils.wait(WAIT);

	assert.isNotNull(XMigemoUI.lastFoundRange);
	assert.equals('a', XMigemoUI.lastFoundRange.toString());
}
