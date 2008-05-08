// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

var keyEventTest = baseURL+'keyEventTest.html';


var XMigemoUI, win, browser;

var basicTest = new TestCase('基本機能のテスト', {runStrategy: 'async'});

var wait = 500;

basicTest.tests = {
	setUp : function() {
		yield utils.setUpTestWindow();

		var retVal = utils.addTab(keyEventTest);
		yield retVal;

		browser = utils.getBrowser();
		browser.removeAllTabsBut(retVal.tab);

		win = utils.getTestWindow();
		XMigemoUI = win.XMigemoUI;
		XMigemoUI.openAgainAction = XMigemoUI.ACTION_NONE;

		yield wait;
	},

	tearDown : function() {
		utils.tearDownTestWindow();
	},

	'モード切り替えのテスト': function() {
		win.gFindBar.closeFindBar();
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);
		yield wait;

		var findCommand = 'with (win) {'+
				win.document.getElementById('cmd_find').getAttribute('oncommand')+
			'}';

		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);


		// APIによる切り替え
		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		assert.equals(XMigemoUI.FIND_MODE_REGEXP, XMigemoUI.findMode);

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);


		// ボタンのクリックによる切り替え
		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[0]);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);

		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[1]);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_REGEXP, XMigemoUI.findMode);

		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[2]);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);

		// 二度目のクリックによるフリップバック
		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[2]);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);

		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[0]);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[1]);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);


		// 検索バーにフォーカスした状態でCtrl-F
		XMigemoUI.openAgainAction = XMigemoUI.ACTION_NONE;
		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);

		XMigemoUI.openAgainAction = XMigemoUI.ACTION_SWITCH;
		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.equals(XMigemoUI.FIND_MODE_REGEXP, XMigemoUI.findMode);
		eval(findCommand);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		eval(findCommand);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);

		XMigemoUI.openAgainAction = XMigemoUI.ACTION_CLOSE;
		eval(findCommand);
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);
	},

	'通常の検索のテスト': function() {
		win.gFindBar.openFindBar();
		yield wait;

		var field = XMigemoUI.findField;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		XMigemoUI.highlightCheckedAlways = false;
		field.focus();

		var findTerm = 'text';
		for (var i = 1, maxi = findTerm.length+1; i < maxi; i++)
		{
			action.inputTextToField(field, findTerm.substring(0, i));
			yield wait;
		}
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.equals('text', browser.contentWindow.getSelection().toString());

		action.inputTextToField(field, 'not found text');
		yield wait;
		assert.equals('notfound', field.getAttribute('status'));
	}
};
