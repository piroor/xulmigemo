var description = '文字入力の一般的な操作のテスト';

utils.include('common.inc.js');

function setUp()
{
	commonSetUp(keyEventTest)
}

function tearDown() {
	commonTearDown();
}

testBS.description = 'BSキーで全削除';
function testBS()
{
	gFindBar.open();

	var mode;
	function doTest() {
		utils.wait(WAIT);
		action.inputTo(inputElem, 'text');
		utils.wait(WAIT);
		action.keypressOn(inputElem, 'a', { ctrlKey : true });
		utils.wait(WAIT);
		action.keypressOn(inputElem, Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE);
		utils.wait(WAIT);
		assert.equals('', XMigemoUI.findTerm, 'mode is '+mode);
	}

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	mode = 'native';
	doTest();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	mode = 'regexp';
	doTest();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	mode = 'migemo';
	doTest();
}

testDel.description = 'Delキーで全削除';
function testDel()
{
	gFindBar.open();

	var mode;
	function doTest() {
		utils.wait(WAIT);
		action.inputTo(inputElem, 'text');
		utils.wait(WAIT);
		action.keypressOn(inputElem, 'a', { ctrlKey : true });
		utils.wait(WAIT);
		action.keypressOn(inputElem, Ci.nsIDOMKeyEvent.DOM_VK_DELETE);
		utils.wait(WAIT);
		assert.equals('', XMigemoUI.findTerm, 'mode is '+mode);
	}

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	mode = 'native';
	doTest();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	mode = 'regexp';
	doTest();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	mode = 'migemo';
	doTest();
}

testInput.description = '文字入力で全削除';
function testInput()
{
	gFindBar.open();

	var mode;
	function doTest() {
		utils.wait(WAIT);
		action.inputTo(inputElem, 'text');
		utils.wait(WAIT);
		action.keypressOn(inputElem, 'a', { ctrlKey : true });
		utils.wait(WAIT);
		action.keypressOn(inputElem, 'a');
		utils.wait(WAIT);
		assert.equals('a', XMigemoUI.findTerm, 'mode is '+mode);
	}

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	mode = 'native';
	doTest();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	mode = 'regexp';
	doTest();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	mode = 'migemo';
	doTest();
}
