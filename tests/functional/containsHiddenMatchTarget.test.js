var description = '非表示の要素の内容として正規表現検索にマッチする物があるケース';

utils.include('common.inc.js');

var gTestPageURI = '../fixtures/containsHiddenMatchTarget.html';

function setUp()
{
	yield Do(commonSetUp(gTestPageURI));
	assert.isTrue(XMigemoUI.hidden);
}

function tearDown()
{
	commonTearDown();
}

function testRegExpFind()
{
	gFindBar.openFindBar();
	yield wait;
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	field.focus();

	action.inputTextToField(field, 'a|b', false, true);
	yield wait;

	assert.isNotNull(XMigemoUI.lastFoundRange);
	assert.equals('a', XMigemoUI.lastFoundRange.toString());
}
