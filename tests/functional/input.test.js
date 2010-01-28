var description = '文字入力の一般的な操作のテスト';

utils.include('common.inc.js');

function setUp()
{
	yield Do(commonSetUp(keyEventTest));
}

function tearDown() {
	commonTearDown();
}

testBS.description = 'BSキーで全削除';
function testBS()
{
	gFindBar.openFindBar();

	var mode;
	function doTest() {
		yield WAIT;
		action.inputTo(inputElem, 'text');
		yield WAIT;
		action.keypressOn(inputElem, 'a', { ctrlKey : true });
		yield WAIT;
		action.keypressOn(inputElem, Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE);
		yield WAIT;
		assert.equals('', XMigemoUI.findTerm, 'mode is '+mode);
	}

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	mode = 'native';
	yield Do(doTest);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	mode = 'regexp';
	yield Do(doTest);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	mode = 'migemo';
	yield Do(doTest);
}

testDel.description = 'Delキーで全削除';
function testDel()
{
	gFindBar.openFindBar();

	var mode;
	function doTest() {
		yield WAIT;
		action.inputTo(inputElem, 'text');
		yield WAIT;
		action.keypressOn(inputElem, 'a', { ctrlKey : true });
		yield WAIT;
		action.keypressOn(inputElem, Ci.nsIDOMKeyEvent.DOM_VK_DELETE);
		yield WAIT;
		assert.equals('', XMigemoUI.findTerm, 'mode is '+mode);
	}

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	mode = 'native';
	yield Do(doTest);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	mode = 'regexp';
	yield Do(doTest);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	mode = 'migemo';
	yield Do(doTest);
}

testInput.description = '文字入力で全削除';
function testInput()
{
	gFindBar.openFindBar();

	var mode;
	function doTest() {
		yield WAIT;
		action.inputTo(inputElem, 'text');
		yield WAIT;
		action.keypressOn(inputElem, 'a', { ctrlKey : true });
		yield WAIT;
		action.keypressOn(inputElem, 'a');
		yield WAIT;
		assert.equals('a', XMigemoUI.findTerm, 'mode is '+mode);
	}

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	mode = 'native';
	yield Do(doTest);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	mode = 'regexp';
	yield Do(doTest);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	mode = 'migemo';
	yield Do(doTest);
}
