function setUp()
{
	yield Do(commonSetUp(gTestPageURI));
	assert.isTrue(XMigemoUI.hidden);
	XMigemoUI.highlightCheckedAlways = true;
	XMigemoUI.highlightCheckedAlwaysMinLength = 5;
}

function tearDown()
	commonTearDown();
}

testAutoHighlightNormal.description = '通常の検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightNormal()
{
	gFindBar.openFindBar();
	yield wait;
	yield Do(autoHighlightTest(
		'FIND_MODE_NATIVE',
		'text',
		'text field',
		'qute',
		'not found long term',
		10
	));
}

testAutoHighlightRegExp.description = '正規表現検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightRegExp()
{
	gFindBar.openFindBar();
	yield wait;
	yield Do(autoHighlightTest(
		'FIND_MODE_REGEXP',
		'tex',
		'text ?(field|area)',
		'qute',
		'not found long term',
		10
	));
}

testAutoHighlightMigemo.description = 'Migemo検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightMigemo()
{
	gFindBar.openFindBar();
	yield wait;
	yield Do(autoHighlightTest(
		'FIND_MODE_MIGEMO',
		'niho',
		'nihongo',
		'qute',
		'not found long term',
		4
	));
}

testSafariHighlight.description = 'Safari風自動ハイライト';
function testSafariHighlight()
{
	XMigemoHighlight.strongHighlight = true;

	gFindBar.openFindBar();
	yield wait;
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NORMAL;
	yield Do(assert.screenStateForFind('text field', true));
	yield Do(assert.screenStateForFind('', false));
	yield Do(assert.screenStateForFind('t', false));
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield Do(assert.screenStateForFind('nihongo', true));
	yield Do(assert.screenStateForFind('', false));
	yield Do(assert.screenStateForFind('n', false));
}
