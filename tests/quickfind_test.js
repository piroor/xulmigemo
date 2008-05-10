// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

var XMigemoUI, win, browser, findCommand;
var keyEventTest = baseURL+'keyEventTest.html';
var wait = 300;

var quickFindTest = new TestCase('クイックMigemo検索のテスト', {runStrategy: 'async'});

quickFindTest.tests = {
	setUp : function() {
		yield utils.setUpTestWindow();

		var retVal = utils.addTab(keyEventTest);
		yield retVal;

		browser = utils.getBrowser();
		browser.removeAllTabsBut(retVal.tab);

		win = utils.getTestWindow();
		XMigemoUI = win.XMigemoUI;
		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		XMigemoUI.openAgainAction = XMigemoUI.ACTION_NONE;
		XMigemoUI.highlightCheckedAlways = false;
		XMigemoUI.caseSensitiveCheckedAlways = false;
		XMigemoUI.autoStartRegExpFind = true;
		XMigemoUI.autoStartQuickFind = false;
		XMigemoUI.autoExitQuickFindInherit = true;
		XMigemoUI.autoExitQuickFind = true;
		XMigemoUI.timeout = 2000;
		XMigemoUI.shouldTimeout = true;
		XMigemoUI.shouldIndicateTimeout = true;

		findCommand = 'with (win) {'+
			win.document.getElementById('cmd_find').getAttribute('oncommand')+
		'}';

		win.gFindBar.closeFindBar();
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);
	},

	tearDown : function() {
		utils.tearDownTestWindow();
	},

	'自動開始→自動終了': function() {
		XMigemoUI.autoStartQuickFind = true;

		var field = XMigemoUI.findField;
		var findTerm = 'nihongo';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals(findTerm.charAt(0), XMigemoUI.findTerm);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));

		yield XMigemoUI.timeout + wait;
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findBarHidden);

		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	},

	'自動開始→手動終了（BS）': function() {
		XMigemoUI.autoStartQuickFind = true;

		var field = XMigemoUI.findField;
		var findTerm = 'nihongo';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals(findTerm.charAt(0), XMigemoUI.findTerm);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);

		action.inputTextToField(field, '');
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.findBarHidden);

		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_BACK_SPACE };
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findBarHidden);

		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	},

	'自動開始→手動終了（ESC）': function() {
		XMigemoUI.autoStartQuickFind = true;

		var field = XMigemoUI.findField;
		var findTerm = 'nihongo';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals(findTerm.charAt(0), XMigemoUI.findTerm);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);

		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_ESCAPE };
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findBarHidden);

		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	},

	'自動開始→手動終了（画面クリック）': function() {
		XMigemoUI.autoStartQuickFind = true;

		var field = XMigemoUI.findField;
		var findTerm = 'nihongo';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals(findTerm.charAt(0), XMigemoUI.findTerm);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);

		action.fireMouseEventOnElement(win.content.document.documentElement);
		yield wait;
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findBarHidden);

		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	},

	'自動開始の時に手動開始を試みた場合': function() {
		XMigemoUI.autoStartQuickFind = true;

		var key = { charCode : '/'.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('/', XMigemoUI.findTerm);
		assert.isFalse(XMigemoUI.findBarHidden);
	},

	'手動開始→自動終了': function() {
		var field = XMigemoUI.findField;
		var findTerm = 'nihongo';

		var key = { charCode : '/'.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('', XMigemoUI.findTerm);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));

		yield XMigemoUI.timeout + wait;
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findBarHidden);

		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	},

	'手動開始→手動終了（BS）': function() {
		var field = XMigemoUI.findField;
		var findTerm = 'nihongo';

		var key = { charCode : '/'.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('', XMigemoUI.findTerm);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);

		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_BACK_SPACE };
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findBarHidden);

		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	},

	'手動開始→手動終了（ESC）': function() {
		var field = XMigemoUI.findField;
		var findTerm = 'nihongo';

		var key = { charCode : '/'.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('', XMigemoUI.findTerm);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);

		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_ESCAPE };
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findBarHidden);

		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	},

	'手動開始→手動終了（画面クリック）': function() {
		var field = XMigemoUI.findField;
		var findTerm = 'nihongo';

		var key = { charCode : '/'.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('', XMigemoUI.findTerm);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);

		action.fireMouseEventOnElement(win.content.document.documentElement);
		win.content.focus();
		yield wait;
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findBarHidden);

		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	},

	'手動開始の時に自動開始を試みた場合': function() {
		var key = { charCode : 'n'.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);
	},

	'文字入力操作でタイマーが正しくリセットされるか': function() {
		XMigemoUI.autoStartQuickFind = true;

		var field = XMigemoUI.findField;
		var findTerm = 'nihongoNoTekisuto';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals(findTerm.charAt(0), XMigemoUI.findTerm);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));

		var startAt = (new Date()).getTime();

		var lastInput = XMigemoUI.findTerm;
		for (var i = 1, maxi = findTerm.length+1; i < maxi; i++)
		{
			key = { charCode : findTerm.charCodeAt(i) };
			action.fireKeyEventOnElement(field, key);
			yield wait;
			assert.equals(lastInput, XMigemoUI.findTerm);
			action.inputTextToField(field, findTerm.substring(0, i));
			yield wait;
			lastInput = XMigemoUI.findTerm;
			if (((new Date()).getTime() - startAt) > XMigemoUI.timeout) break;
		}
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));

		action.inputTextToField(field, findTerm);
		yield wait;
		startAt = (new Date()).getTime();

		lastInput = XMigemoUI.findTerm;
		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_BACK_SPACE };
		for (var i = findTerm.length; i > 0; i--)
		{
			action.fireKeyEventOnElement(field, key);
			yield wait;
			assert.equals(lastInput, XMigemoUI.findTerm);
			action.inputTextToField(field, findTerm.substring(0, i));
			yield wait;
			lastInput = XMigemoUI.findTerm;
			if (((new Date()).getTime() - startAt) > XMigemoUI.timeout) break;
		}
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	}
};
