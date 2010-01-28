function setUp()
{
	yield Do(commonSetUp(gTestPageURI));
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
	gFindBar.openFindBar();
	yield WAIT;
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
	yield WAIT;
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
	yield WAIT;
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
	yield WAIT;
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield Do(assert.screenStateForFind('text field', true));
	yield Do(assert.screenStateForFind('', false));
	yield Do(assert.screenStateForFind('t', false));
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield Do(assert.screenStateForFind('nihongo', true));
	yield Do(assert.screenStateForFind('', false));
	yield Do(assert.screenStateForFind('n', false));
}
function getHighlightCount()
{
	return content.document.evaluate(
			'count('+kHIGHLIGHTS+')',
			content.document,
			null,
			XPathResult.NUMBER_TYPE,
			null
		).numberValue;
}

testAutoHighlightAndModeSwitch.description = 'ハイライト表示したまま検索モードを切り替えた場合';
function testAutoHighlightAndModeSwitch()
{
	gFindBar.openFindBar();
	yield WAIT;
	field.focus();
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.highlightCheck(true, false);
	yield Do(assert.find_found('sample'));
	yield WAIT;
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	yield WAIT;
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield WAIT;
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield WAIT;
	assert.highlightCheck(false, true);

	action.inputTo(field, '');
	yield WAIT;
	gFindBar.closeFindBar();
	yield WAIT;

	content.getSelection().removeAllRanges();
	XMigemoHighlight.strongHighlight = true;

	gFindBar.openFindBar();
	yield WAIT;
	field.focus();
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.highlightCheck(true, false);
	yield Do(assert.find_found('sample'));
	yield WAIT;
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	yield WAIT;
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield WAIT;
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield WAIT;
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());
}


function testMarker()
{
	XMigemoMarker.enabled = true;

	gFindBar.openFindBar();
	yield WAIT;
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield Do(assert.markerStateForFind('text field', true));
	yield Do(assert.markerStateForFind('', false));
	yield Do(assert.markerStateForFind('t', false));
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield Do(assert.markerStateForFind('nihongo', true));
	yield Do(assert.markerStateForFind('', false));
	yield Do(assert.markerStateForFind('n', false));
}
