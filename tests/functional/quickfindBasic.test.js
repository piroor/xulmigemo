var description = 'クイックMigemo検索の基本テスト';

utils.include('common.inc.js');
utils.include('quickfind.inc.js');

function setUp()
{
	commonSetUp(keyEventTest)
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
	assert.autoStart('nihongo')
	assert.timeout()
	assert.findStart()
	assert.autoStart('nihongo')
}

testAutoStartManualExitByBS.description = '自動開始→手動終了（BS）';
function testAutoStartManualExitByBS()
{
	XMigemoUI.autoStartQuickFind = true;
	var findTerm = 'nihongo';
	assert.autoStart(findTerm)
	assert.exitByBS(findTerm)
	assert.findStart()
	assert.autoStart(findTerm)
}

testAutoStartManualExitByESC.description = '自動開始→手動終了（ESC）';
function testAutoStartManualExitByESC()
{
	XMigemoUI.autoStartQuickFind = true;
	var findTerm = 'nihongo';
	assert.autoStart(findTerm)
	assert.exitByESC()
	assert.findStart()
	assert.autoStart(findTerm)
}

testAutoStartManualExitByClick.description = '自動開始→手動終了（画面クリック）';
function testAutoStartManualExitByClick()
{
	XMigemoUI.autoStartQuickFind = true;
	var findTerm = 'nihongo';
	assert.autoStart(findTerm)
	assert.exitByClick()
	assert.findStart()
	assert.autoStart(findTerm)
}

testManulStartInQuickFind.description = '自動開始の時に手動開始を試みた場合';
function testManulStartInQuickFind()
{
	XMigemoUI.autoStartQuickFind = true;
	assert.autoStart('/')
}

testManulStartAutoExitTimeout.description = '手動開始→タイムアウトによる自動終了';
function testManulStartAutoExitTimeout()
{
	var findTerm = 'nihongo';
	assert.manualStart(findTerm)
	assert.timeout()
	assert.findStart()
	assert.manualStart(findTerm)
}

testManulStartManualExitByBS.description = '手動開始→手動終了（BS）';
function testManulStartManualExitByBS()
{
	var findTerm = 'nihongo';
	assert.manualStart(findTerm)
	assert.exitByBS(findTerm)
	assert.findStart()
	assert.manualStart(findTerm)
}

testManulStartManualExitByESC.description = '手動開始→手動終了（ESC）';
function testManulStartManualExitByESC()
{
	var findTerm = 'nihongo';
	assert.manualStart(findTerm)
	assert.exitByESC()
	assert.findStart()
	assert.manualStart(findTerm)
}

testManulStartManualExitByClick.description = '手動開始→手動終了（画面クリック）';
function testManulStartManualExitByClick()
{
	var findTerm = 'nihongo';
	assert.manualStart(findTerm)
	assert.exitByClick()
	assert.findStart()
	assert.manualStart(findTerm)
}

testAutoStartInQuickFind.description = '手動開始の時に自動開始を試みた場合';
function testAutoStartInQuickFind()
{
	action.keypressOn(content.document.documentElement, 'n');
	utils.wait(WAIT);
	assert.isTrue(XMigemoUI.hidden);
}


testAutoStartLinksOnly.description = '手動開始：リンクにもヒットする検索';
function testAutoStartLinksOnly()
{
	var link = content.document.links[0];
	assert.manualStart('sample')
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
	XMigemoUI.close();
	utils.wait(WAIT);
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
	assert.autoStart('sample')
	assert.contained(link, XMigemoUI.lastFoundRange);
	assert.isTrue(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.findNext();
	assert.contained(link, XMigemoUI.lastFoundRange);
	assert.isTrue(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.close();
	utils.wait(WAIT);
	assert.equals('1', link.getAttribute('focus-count'));
}

testManualStartLinksOnly.description = '手動開始：リンクのみ検索';
function testManualStartLinksOnly()
{
	var link = content.document.links[0];
	assert.manualStart('sample', '\\')
	assert.contained(link, XMigemoUI.lastFoundRange);
	assert.isTrue(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.findNext();
	assert.contained(link, XMigemoUI.lastFoundRange);
	assert.isTrue(link.hasAttribute(XMigemoUI.kFOCUSED));
	assert.notEquals('1', link.getAttribute('focus-count'));
	XMigemoUI.close();
	utils.wait(WAIT);
	assert.equals('1', link.getAttribute('focus-count'));
}
