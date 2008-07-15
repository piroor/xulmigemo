// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc.js');

var inputTest = new TestCase('文字入力の一般的な操作のテスト');

inputTest.tests = {
	setUp : function() {
		yield Do(commonSetUp(keyEventTest));
	},

	tearDown : function() {
		commonTearDown();
	},

	'BSキーで全削除': function() {
		gFindBar.openFindBar();

		var mode;
		function doTest() {
			yield wait;
			action.inputTextToField(inputElem, 'text');
			yield wait;
			action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
			yield wait;
			action.fireKeyEventOnElement(inputElem, key_BS);
			yield wait;
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
	},

	'Delキーで全削除': function() {
		gFindBar.openFindBar();

		var mode;
		function doTest() {
			yield wait;
			action.inputTextToField(inputElem, 'text');
			yield wait;
			action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
			yield wait;
			action.fireKeyEventOnElement(inputElem, key_DEL);
			yield wait;
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
	},

	'文字入力で全削除': function() {
		gFindBar.openFindBar();

		var mode;
		function doTest() {
			yield wait;
			action.inputTextToField(inputElem, 'text');
			yield wait;
			action.fireKeyEventOnElement(inputElem, key_Ctrl_A);
			yield wait;
			action.fireKeyEventOnElement(inputElem, key_input_a);
			yield wait;
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
};
