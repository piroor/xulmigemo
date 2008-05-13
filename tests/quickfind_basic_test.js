// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc');

var quickFindBasicTest = new TestCase('クイックMigemo検索の基本テスト', {runStrategy: 'async'});

quickFindBasicTest.tests = {
	setUp : function() {
		yield utils.setUpTestWindow();

		var retVal = utils.addTab(keyEventTest);
		yield retVal;
		commonSetUp(retVal);
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);
	},

	tearDown : function() {
		commonTearDown();
	},

	'自動開始→タイムアウトによる自動終了': function() {
		XMigemoUI.autoStartQuickFind = true;

		var findTerm = 'nihongo';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals(findTerm.charAt(0), XMigemoUI.findTerm);
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
		action.inputTextToField(findField, findTerm.substring(1), true);

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

		var findTerm = 'nihongo';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals(findTerm.charAt(0), XMigemoUI.findTerm);
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		action.inputTextToField(findField, findTerm.substring(1), true);
		yield wait;

		for (var i = 0, maxi = findTerm.length; i < maxi; i++)
		{
			action.fireKeyEventOnElement(findField, key_BS);
			yield wait;
			assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
			assert.isFalse(XMigemoUI.findBarHidden);
		}

		action.fireKeyEventOnElement(findField, key_BS);
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

		var findTerm = 'nihongo';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals(findTerm.charAt(0), XMigemoUI.findTerm);
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		action.inputTextToField(findField, findTerm.substring(1), true);
		yield wait;

		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_ESCAPE };
		action.fireKeyEventOnElement(findField, key);
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

		var findTerm = 'nihongo';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals(findTerm.charAt(0), XMigemoUI.findTerm);
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		action.inputTextToField(findField, findTerm.substring(1), true);
		yield wait;

		action.fireMouseEventOnElement(content.document.documentElement);
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
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('/', XMigemoUI.findTerm);
		assert.isFalse(XMigemoUI.findBarHidden);
	},

	'手動開始→タイムアウトによる自動終了': function() {
		var findTerm = 'nihongo';

		var key = { charCode : '/'.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('', XMigemoUI.findTerm);
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
		action.inputTextToField(findField, findTerm, true);

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
		var findTerm = 'nihongo';

		var key = { charCode : '/'.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('', XMigemoUI.findTerm);
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		action.inputTextToField(findField, findTerm);
		yield wait;

		for (var i = 0, maxi = findTerm.length; i < maxi; i++)
		{
			action.fireKeyEventOnElement(findField, key_BS);
			yield wait;
			assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
			assert.isFalse(XMigemoUI.findBarHidden);
		}

		action.fireKeyEventOnElement(findField, key_BS);
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
		var findTerm = 'nihongo';

		var key = { charCode : '/'.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('', XMigemoUI.findTerm);
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		action.inputTextToField(findField, findTerm);
		yield wait;

		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_ESCAPE };
		action.fireKeyEventOnElement(findField, key);
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
		var findTerm = 'nihongo';

		var key = { charCode : '/'.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('', XMigemoUI.findTerm);
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		action.inputTextToField(findField, findTerm);
		yield wait;

		action.fireMouseEventOnElement(content.document.documentElement);
		content.focus();
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
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);
	}
};
