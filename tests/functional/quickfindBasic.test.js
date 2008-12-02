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
	var key = { charCode : 'n'.charCodeAt(0) };
	action.fireKeyEventOnElement(content.document.documentElement, key);
	yield wait;
	assert.isTrue(XMigemoUI.hidden);
}
