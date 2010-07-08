function setUp()
{
	commonSetUp(gTestPageURI);
	assert.isTrue(XMigemoUI.hidden);
	XMigemoUI.highlightCheckedAlways = true;
	XMigemoUI.highlightCheckedAlwaysMinLength = 5;
	XMigemoUI.highlightSelectionAvailable = false;
}

function tearDown()
{
	commonTearDown();
}

testAutoHighlightNormal.description = '通常の検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightNormal()
{
	gFindBar.open();
	utils.wait(WAIT);
	autoHighlightTest(
		'FIND_MODE_NATIVE',
		'text',
		'text field',
		'qute',
		'not found long term',
		10
	);
}

testAutoHighlightRegExp.description = '正規表現検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightRegExp()
{
	gFindBar.open();
	utils.wait(WAIT);
	autoHighlightTest(
		'FIND_MODE_REGEXP',
		'tex',
		'text ?(field|area)',
		'qute',
		'not found long term',
		10
	);
}

testAutoHighlightMigemo.description = 'Migemo検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightMigemo()
{
	gFindBar.open();
	utils.wait(WAIT);
	autoHighlightTest(
		'FIND_MODE_MIGEMO',
		'niho',
		'nihongo',
		'qute',
		'not found long term',
		4
	);
}

testSafariHighlight.description = 'Safari風自動ハイライト';
function testSafariHighlight()
{
	XMigemoHighlight.strongHighlight = true;

	gFindBar.open();
	utils.wait(WAIT);
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	assert.screenStateForFind('text field', true)
	assert.screenStateForFind('', false)
	assert.screenStateForFind('t', false)
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	assert.screenStateForFind('nihongo', true)
	assert.screenStateForFind('', false)
	assert.screenStateForFind('n', false)
}

function testMarker()
{
	XMigemoMarker.enabled = true;

	gFindBar.open();
	utils.wait(WAIT);
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	assert.markerStateForFind('text field', true)
	assert.markerStateForFind('', false)
	assert.markerStateForFind('t', false)
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	assert.markerStateForFind('nihongo', true)
	assert.markerStateForFind('', false)
	assert.markerStateForFind('n', false)
}
