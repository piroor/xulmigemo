var description = 'クイックMigemo検索の詳細テスト';

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

testStartQuickMigemoFindFromMigemoFind.description = 'Migemo検索モードからクイックMigemo検索を実行した場合';
function testStartQuickMigemoFindFromMigemoFind()
{
	XMigemoUI.autoStartQuickFind = true;

	gFindBar.openFindBar();
	yield WAIT;
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield WAIT;
	gFindBar.closeFindBar();
	yield WAIT;

	var findTerm = 'nihongo';
	yield Do(assert.autoStart('nihongo'));
	yield Do(assert.timeout(XMigemoUI.FIND_MODE_MIGEMO));
}

testResetTimerOnInput.description = '文字入力操作でタイマーが正しくリセットされるか';
function testResetTimerOnInput()
{
	XMigemoUI.autoStartQuickFind = true;

	var findTerm = 'nihongoNoTekisuto';
	yield Do(assert.autoStart(findTerm.charAt(0)));

	var startAt = (new Date()).getTime();

	var lastInput = XMigemoUI.findTerm;
	var key;
	for (var i = 1, maxi = findTerm.length+1; i < maxi; i++)
	{
		action.keypressOn(field, findTerm.charAt(i));
		yield WAIT;
		assert.equals(lastInput+findTerm.charAt(i), XMigemoUI.findTerm);
		lastInput = XMigemoUI.findTerm;
		if (((new Date()).getTime() - startAt) > XMigemoUI.timeout) break;
	}
	assert.isQuickMigemoFindActive();

	action.inputTo(field, findTerm);
	yield WAIT;

	startAt = (new Date()).getTime();
	while (((new Date()).getTime() - startAt) < XMigemoUI.timeout)
	{
		assert.isQuickMigemoFindActive();
		action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_RETURN);
		yield WAIT;
	}

	startAt = (new Date()).getTime();
	lastInput = XMigemoUI.findTerm;
	for (var i = findTerm.length; i > 0; i--)
	{
		action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE);
		yield WAIT;
		assert.equals(lastInput.substring(0, lastInput.length-1), XMigemoUI.findTerm);
		lastInput = XMigemoUI.findTerm;
		if (((new Date()).getTime() - startAt) > XMigemoUI.timeout) break;
	}
	assert.isQuickMigemoFindActive();
}

testFocusToInputFieldWhileQuickMigemoFind.description = 'クイックMigemo検索実行中にテキストエリアにフォーカス';
function testFocusToInputFieldWhileQuickMigemoFind()
{
	XMigemoUI.autoStartQuickFind = true;

	var findTerm = 'foobar';
	yield Do(assert.autoStart(findTerm));

	var input = content.document.getElementsByTagName('input')[0];
	input.focus();
	action.clickOn(input);
	yield WAIT;
	assert.isTrue(XMigemoUI.hidden);

	var originalValue = input.value;
	var focused = win.document.commandDispatcher.focusedElement;
	action.keypressOn(focused, 'a');
	yield WAIT;
	assert.equals(originalValue+'a', focused.value);
}

testQuickMigemoFindAgain.description = 'クイックMigemo検索で通常の文字列にヒットした後に再びクイックMigemo検索';
function testQuickMigemoFindAgain()
{
	XMigemoUI.autoStartQuickFind = true;

	var findTerm = 'multirow';
	yield Do(assert.autoStart(findTerm));
	yield Do(assert.timeout());
	yield Do(assert.autoStart(findTerm.charAt(0)));
}
