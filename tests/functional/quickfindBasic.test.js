var description = 'クイックMigemo検索の基本テスト';

utils.include('common.inc.js');
utils.include('quickfind.inc.js');

function setUp()
{
	yield Do(commonSetUp(keyEventTest));
	assert.isTrue(XMigemoUI.hidden);
}

function tearDown()
{
	commonTearDown();
}

testAutoStartAutoExitTimeout.description = '自動開始→タイムアウトによる自動終了';
function testAutoStartAutoExitTimeout()
{
	XMigemoUI.autoStartQuickFind = true;
	yield Do(assert.autoStart('nihongo'));
	yield Do(assert.timeout());
	yield Do(assert.findStart());
	yield Do(assert.autoStart('nihongo'));
}

testAutoStartManualExitByBS.description = '自動開始→手動終了（BS）';
function testAutoStartManualExitByBS()
{
	XMigemoUI.autoStartQuickFind = true;
	var findTerm = 'nihongo';
	yield Do(assert.autoStart(findTerm));
	yield Do(assert.exitByBS(findTerm));
	yield Do(assert.findStart());
	yield Do(assert.autoStart(findTerm));
}

testAutoStartManualExitByESC.description = '自動開始→手動終了（ESC）';
function testAutoStartManualExitByESC()
{
	XMigemoUI.autoStartQuickFind = true;
	var findTerm = 'nihongo';
	yield Do(assert.autoStart(findTerm));
	yield Do(assert.exitByESC());
	yield Do(assert.findStart());
	yield Do(assert.autoStart(findTerm));
}

testAutoStartManualExitByClick.description = '自動開始→手動終了（画面クリック）';
function testAutoStartManualExitByClick()
{
	XMigemoUI.autoStartQuickFind = true;
	var findTerm = 'nihongo';
	yield Do(assert.autoStart(findTerm));
	yield Do(assert.exitByClick());
	yield Do(assert.findStart());
	yield Do(assert.autoStart(findTerm));
}

testManulStartInQuickFind.description = '自動開始の時に手動開始を試みた場合';
function testManulStartInQuickFind()
{
	XMigemoUI.autoStartQuickFind = true;
	yield Do(assert.autoStart('/'));
}

testManulStartAutoExitTimeout.description = '手動開始→タイムアウトによる自動終了';
function testManulStartAutoExitTimeout()
{
	var findTerm = 'nihongo';
	yield Do(assert.manualStart(findTerm));
	yield Do(assert.timeout());
	yield Do(assert.findStart());
	yield Do(assert.manualStart(findTerm));
}

testManulStartManualExitByBS.description = '手動開始→手動終了（BS）';
function testManulStartManualExitByBS()
{
	var findTerm = 'nihongo';
	yield Do(assert.manualStart(findTerm));
	yield Do(assert.exitByBS(findTerm));
	yield Do(assert.findStart());
	yield Do(assert.manualStart(findTerm));
}

testManulStartManualExitByESC.description = '手動開始→手動終了（ESC）';
function testManulStartManualExitByESC()
{
	var findTerm = 'nihongo';
	yield Do(assert.manualStart(findTerm));
	yield Do(assert.exitByESC());
	yield Do(assert.findStart());
	yield Do(assert.manualStart(findTerm));
}

testManulStartManualExitByClick.description = '手動開始→手動終了（画面クリック）';
function testManulStartManualExitByClick()
{
	var findTerm = 'nihongo';
	yield Do(assert.manualStart(findTerm));
	yield Do(assert.exitByClick());
	yield Do(assert.findStart());
	yield Do(assert.manualStart(findTerm));
}

testAutoStartInQuickFind.description = '手動開始の時に自動開始を試みた場合';
function testAutoStartInQuickFind()
{
	action.keypressOn(content.document.documentElement, 'n');
	yield wait;
	assert.isTrue(XMigemoUI.hidden);
}


testAutoStartLinksOnly.description = '手動開始：リンクにもヒットする検索';
function testAutoStartLinksOnly()
{
	var link = content.document.links[0];
	yield Do(assert.manualStart('sample'));
	assert.contained($('first', content).firstChild, XMigemoUI.lastFoundRange);
	assert.isFalse(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.findNext();
	assert.contained(link, XMigemoUI.lastFoundRange);
	assert.isTrue(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.findNext();
	assert.isFalse(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.findNext();
	assert.isTrue(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.closeFindBar();
	yield wait;
	assert.equals('1', link.getAttribute('focus-count'));
}

testAutoStartLinksOnly.description = '自動開始：リンクのみ検索';
testAutoStartLinksOnly.setUp = function()
{
	XMigemoUI.autoStartQuickFind = true;
	utils.setPref('xulmigemo.linksonly', true);
};
testAutoStartLinksOnly.tearDown = function()
{
	utils.clearPref('xulmigemo.linksonly');
};
function testAutoStartLinksOnly()
{
	var link = content.document.links[0];
	yield Do(assert.autoStart('sample'));
	assert.contained(link, XMigemoUI.lastFoundRange);
	assert.isTrue(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.findNext();
	assert.contained(link, XMigemoUI.lastFoundRange);
	assert.isTrue(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.closeFindBar();
	yield wait;
	assert.equals('1', link.getAttribute('focus-count'));
}

testManualStartLinksOnly.description = '手動開始：リンクのみ検索';
function testManualStartLinksOnly()
{
	var link = content.document.links[0];
	yield Do(assert.manualStart('sample', '\\'));
	assert.contained(link, XMigemoUI.lastFoundRange);
	assert.isTrue(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.findNext();
	assert.contained(link, XMigemoUI.lastFoundRange);
	assert.isTrue(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.closeFindBar();
	yield wait;
	assert.equals('1', link.getAttribute('focus-count'));
}
