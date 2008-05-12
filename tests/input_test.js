// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc');

var inputTest = new TestCase('文字入力の一般的な操作のテスト', {runStrategy: 'async'});

inputTest.tests = {
	setUp : function() {
		yield utils.setUpTestWindow();

		var retVal = utils.addTab(keyEventTest);
		yield retVal;
		commonSetUp(retVal);
		yield wait;
	},

	tearDown : function() {
		commonTearDown();
	},

	'BSキーで全削除': function() {
		gFindBar.openFindBar();


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		yield wait;
		action.inputTextToField(inputElem, 'text');
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_BS);
		yield wait;
		assert.equals('', XMigemoUI.findTerm);


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		yield wait;
		action.inputTextToField(inputElem, 'text');
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_BS);
		yield wait;
		assert.equals('', XMigemoUI.findTerm);


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		yield wait;
		action.inputTextToField(inputElem, 'text');
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_BS);
		yield wait;
		assert.equals('', XMigemoUI.findTerm);
	},

	'Delキーで全削除': function() {
		gFindBar.openFindBar();


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		yield wait;
		action.inputTextToField(inputElem, 'text');
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_DEL);
		yield wait;
		assert.equals('', XMigemoUI.findTerm);


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		yield wait;
		action.inputTextToField(inputElem, 'text');
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_DEL);
		yield wait;
		assert.equals('', XMigemoUI.findTerm);


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		yield wait;
		action.inputTextToField(inputElem, 'text');
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_DEL);
		yield wait;
		assert.equals('', XMigemoUI.findTerm);
	},

	'文字入力で全削除': function() {
		gFindBar.openFindBar();


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		yield wait;
		action.inputTextToField(inputElem, 'text');
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_input_a);
		yield wait;
		assert.equals('a', XMigemoUI.findTerm);


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		yield wait;
		action.inputTextToField(inputElem, 'text');
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_input_a);
		yield wait;
		assert.equals('a', XMigemoUI.findTerm);


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		yield wait;
		action.inputTextToField(inputElem, 'text');
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
		yield wait;
		action.fireKeyEventOnElement(inputElem, key_input_a);
		yield wait;
		assert.equals('a', XMigemoUI.findTerm);
	}
};
