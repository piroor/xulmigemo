var description = 'ハイライト表示時の発展テスト';

utils.include('common.inc.js');
utils.include('quickfind.inc.js');

utils.include('highlight.common.inc.js');

function fireClickEventOn(aNode, aButton) {
	var box = utils.getBoxObjectFor(aNode);
	switch (aButton)
	{
		case 0: action.clickAt(content, box.x+10, box.y+5); break;
		case 1: action.middleClickAt(content, box.x+10, box.y+5); break;
		case 2: action.rightClickAt(content, box.x+10, box.y+5); break;
	}
	yield 1500;
}

function getTabs(aTabBrowser) {
	var tabs = aTabBrowser.ownerDocument.evaluate(
			'descendant::*[local-name()="tab"]',
			aTabBrowser.mTabContainer,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
	var array = [];
	for (var i = 0, maxi = tabs.snapshotLength; i < maxi; i++)
	{
		array.push(tabs.snapshotItem(i));
	}
	return array;
}

function setUp()
{
	yield Do(commonSetUp(keyEventTest));
	XMigemoUI.highlightCheckedAlways = true;
	XMigemoHighlight.strongHighlight = true;
}

function tearDown()
{
	commonTearDown();
}

testClickOnScreen.description = 'スクリーン上でのクリック操作';
function testClickOnScreen()
{
	XMigemoUI.highlightCheckedAlwaysMinLength = 5;

	gFindBar.openFindBar();
	yield wait;
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;

	action.inputTextToField(field, 'text field');
	yield 1500;
	assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
	yield Do(fireClickEventOn(browser.selectedBrowser, 0));
	assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));

	XMigemoHighlight.toggleHighlightScreen(true);
	content.scrollTo(0, 0);
	yield wait;

	var link = content.document.getElementsByTagName('a')[0];
	var tabNum = getTabs(browser).length;
	yield Do(fireClickEventOn(link, 1));
	assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
	assert.equals(tabNum+1, getTabs(browser).length);

	yield Do(fireClickEventOn(link, 0));
	assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));
	assert.matches(/\#link$/, content.location.href);
}

testNoInput.description = '自動強調表示の最低文字数が0の時、入力文字列がない場合';
function testNoInput()
{
	XMigemoUI.highlightCheckedAlwaysMinLength = 0;
	XMigemoUI.autoStartQuickFind = true;

	var findTerm = 'nihongo';
	yield Do(assert.autoStart(findTerm));
	for (var i = 0, maxi = findTerm.length; i < maxi; i++)
	{
		yield wait;
		assert.highlightCheck(false, true);
		action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.hidden);
	}
	yield wait;
	assert.isTrue(XMigemoUI.highlightCheck.disabled);
}
