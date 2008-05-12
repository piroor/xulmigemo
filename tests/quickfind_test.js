// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc');

var quickFindTest = new TestCase('クイックMigemo検索のテスト', {runStrategy: 'async'});

quickFindTest.tests = {
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

	'自動開始→自動終了': function() {
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

		action.fireKeyEventOnElement(findField, key_BS);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.findBarHidden);

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

	'手動開始→自動終了': function() {
		var findTerm = 'nihongo';

		var key = { charCode : '/'.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('', XMigemoUI.findTerm);
		assert.notEquals('notfound', findField.getAttribute('status'));
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
		var findTerm = 'nihongo';

		var key = { charCode : '/'.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals('', XMigemoUI.findTerm);
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);

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
	},

	'文字入力操作でタイマーが正しくリセットされるか': function() {
		XMigemoUI.autoStartQuickFind = true;

		var findTerm = 'nihongoNoTekisuto';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.equals(findTerm.charAt(0), XMigemoUI.findTerm);
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));

		var startAt = (new Date()).getTime();

		var lastInput = XMigemoUI.findTerm;
		for (var i = 1, maxi = findTerm.length+1; i < maxi; i++)
		{
			key = { charCode : findTerm.charCodeAt(i) };
			action.fireKeyEventOnElement(findField, key);
			yield wait;
			assert.equals(lastInput+findTerm.charAt(i), XMigemoUI.findTerm);
			lastInput = XMigemoUI.findTerm;
			if (((new Date()).getTime() - startAt) > XMigemoUI.timeout) break;
		}
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));

		action.inputTextToField(findField, findTerm);
		yield wait;
		startAt = (new Date()).getTime();

		lastInput = XMigemoUI.findTerm;
		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_BACK_SPACE };
		for (var i = findTerm.length; i > 0; i--)
		{
			action.fireKeyEventOnElement(findField, key_BS);
			yield wait;
			assert.equals(lastInput.substring(0, lastInput.length-1), XMigemoUI.findTerm);
			lastInput = XMigemoUI.findTerm;
			if (((new Date()).getTime() - startAt) > XMigemoUI.timeout) break;
		}
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	},

	'クイックMigemo検索実行中にテキストエリアにフォーカス': function() {
		XMigemoUI.autoStartQuickFind = true;

		var findTerm = 'foobar';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		action.inputTextToField(findField, findTerm.substring(1), true);
		yield wait;

		var input = content.document.getElementsByTagName('input')[0];
		input.focus();
		action.fireMouseEventOnElement(input);
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);

		var originalValue = input.value;
		var focused = win.document.commandDispatcher.focusedElement;
		action.fireKeyEventOnElement(focused, key_input_a);
		yield wait;
		action.fireKeyEventOnElement(focused, key_input_a);
		yield wait;
		action.fireKeyEventOnElement(focused, key_input_a);
		yield wait;
		assert.equals(originalValue+'aaa', focused.value);
	},

	'クイックMigemo検索で通常の文字列にヒットした後に再びクイックMigemo検索': function() {
		XMigemoUI.autoStartQuickFind = true;

		var findTerm = 'multirow';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		action.inputTextToField(findField, findTerm.substring(1), true);

		yield XMigemoUI.timeout + wait;

		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
		assert.equals(findTerm.charAt(0), XMigemoUI.findTerm);
	}
};
