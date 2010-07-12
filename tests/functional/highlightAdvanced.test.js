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
	utils.wait(1500);
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
	commonSetUp(keyEventTest)
	assert.isTrue(XMigemoUI.hidden);
	XMigemoHighlight.strongHighlight = true;
	XMigemoUI.highlightCheckedAlways = true;
	XMigemoUI.highlightCheckedAlwaysMinLength = 5;
	XMigemoUI.highlightSelectionAvailable = false;
}

function tearDown()
{
	commonTearDown();
}

testClickOnScreen.description = 'スクリーン上でのクリック操作';
function testClickOnScreen()
{
	gFindBar.open();
	utils.wait(WAIT);
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;

	action.inputTo(field, 'text field');
	utils.wait(1500);
	assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
	fireClickEventOn(browser.selectedBrowser, 0)
	assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));

	XMigemoHighlight.toggleHighlightScreen(true);
	content.scrollTo(0, 0);
	utils.wait(WAIT);

	var link = content.document.getElementsByTagName('a')[0];
	var tabNum = getTabs(browser).length;
	fireClickEventOn(link, 1)
	assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
	assert.equals(tabNum+1, getTabs(browser).length);

	fireClickEventOn(link, 0)
	assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));
	assert.matches(/\#link$/, content.location.href);
}

testNoInput.description = '自動強調表示の最低文字数が0の時、入力文字列がない場合';
function testNoInput()
{
	XMigemoUI.highlightCheckedAlwaysMinLength = 0;
	XMigemoUI.autoStartQuickFind = true;

	var findTerm = 'nihongo';
	assert.autoStart(findTerm)
	for (var i = 0, maxi = findTerm.length; i < maxi; i++)
	{
		utils.wait(WAIT);
		assert.highlightCheck(false, true);
		action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE);
		utils.wait(WAIT);
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.hidden);
	}
	utils.wait(WAIT);
	assert.isTrue(XMigemoUI.highlightCheck.disabled);
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
	XMigemoHighlight.strongHighlight = false;

	gFindBar.open();
	utils.wait(WAIT);
	field.focus();
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.highlightCheck(true, false);
	assert.findAndFound({ input : 'sample', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);

	action.inputTo(field, '');
	utils.wait(WAIT);
	gFindBar.close();
	utils.wait(WAIT);

	content.getSelection().removeAllRanges();
	XMigemoHighlight.strongHighlight = true;

	gFindBar.open();
	utils.wait(WAIT);
	field.focus();
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.highlightCheck(true, false);
	assert.findAndFound({ input : 'sample', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());
}

testAutoHighlightAndFindAnotherWordNative.description = 'ハイライト表示したまま別の単語の検索を開始した場合（通常検索）';
function testAutoHighlightAndFindAnotherWordNative()
{
	gFindBar.open();
	utils.wait(WAIT);
	field.focus();

	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.highlightCheck(true, false);
	assert.findAndFound({ input : 'sample', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	assert.findAndFound({ input : 'word1, out of text field', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(6, getHighlightCount());

	assert.findAndFound({ input : 'word3, out of text field', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());
}

testAutoHighlightAndFindAnotherWordRegExp.description = 'ハイライト表示したまま別の単語の検索を開始した場合（正規表現検索）';
function testAutoHighlightAndFindAnotherWordRegExp()
{
	gFindBar.open();
	utils.wait(WAIT);
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	assert.highlightCheck(true, false);

	assert.findAndFound({ input : 'sample', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	assert.findAndFound({ input : 'word1, out of text field', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(6, getHighlightCount());

	assert.findAndFound({ input : 'word3, out of text field', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	assert.findAndFound({ input : 'word[13], out of text field', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(8, getHighlightCount());
}

testAutoHighlightAndFindAnotherWordMigemo.description = 'ハイライト表示したまま別の単語の検索を開始した場合（Migemo検索）';
function testAutoHighlightAndFindAnotherWordMigemo()
{
	gFindBar.open();
	utils.wait(WAIT);
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;

	assert.highlightCheck(true, false);
	assert.findAndFound({ input : 'sample', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	assert.findAndFound({ input : 'word1, out of text field', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(6, getHighlightCount());

	assert.findAndFound({ input : 'word3, out of text field', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	assert.findAndFound({ input : 'nihongo', wait : 1500, ignoreFoundRange : true })
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(4, getHighlightCount());
}
