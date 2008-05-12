// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc');

var basicTest = new TestCase('基本機能のテスト', {runStrategy: 'async'});

basicTest.tests = {
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

	'モード切り替え': function() {
		assert.isTrue(XMigemoUI.findBarHidden);
		yield wait;

		eval(findCommand);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);


		// APIによる切り替え
		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.findCaseSensitiveCheck.disabled);

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_REGEXP, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findCaseSensitiveCheck.disabled);

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findCaseSensitiveCheck.disabled);


		// ボタンのクリックによる切り替え
		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[0]);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.findCaseSensitiveCheck.disabled);

		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[1]);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_REGEXP, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findCaseSensitiveCheck.disabled);

		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[2]);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findCaseSensitiveCheck.disabled);

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

	'通常の検索': function() {
		gFindBar.openFindBar();
		yield wait;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		XMigemoUI.findCaseSensitiveCheck.checked = false;
		findField.focus();


		// 検索に成功するケース
		var findTerm = 'text';
		for (var i = 1, maxi = findTerm.length+1; i < maxi; i++)
		{
			action.inputTextToField(findField, findTerm.substring(0, i));
			yield wait;
		}
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.equals('text', XMigemoUI.lastFoundRange.toString());


		// 見つからない単語
		action.inputTextToField(findField, 'not found text');
		yield wait;
		assert.equals('notfound', findField.getAttribute('status'));


		// Enterキーでの再検索
		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
		action.inputTextToField(findField, findTerm);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.notEquals('notfound', findField.getAttribute('status'));
		var lastFoundRange = XMigemoUI.lastFoundRange;
		assert.isTrue(lastFoundRange);

		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		var foundRange = XMigemoUI.lastFoundRange;
		assert.isTrue(foundRange);
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
		lastFoundRange = foundRange;

		key.shiftKey = true;
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		foundRange = XMigemoUI.lastFoundRange;
		assert.isTrue(foundRange);
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
		lastFoundRange = foundRange;


		// F3キーでの再検索
		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		foundRange = XMigemoUI.lastFoundRange;
		assert.isTrue(foundRange);
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
		lastFoundRange = foundRange;

		key.shiftKey = true;
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		foundRange = XMigemoUI.lastFoundRange;
		assert.isTrue(foundRange);
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	},

	'正規表現検索': function() {
		gFindBar.openFindBar();
		yield wait;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		findField.focus();


		// 検索に成功するケース
		var findTerm = 'text|field|single';
		action.inputTextToField(findField, findTerm);
		yield wait;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.matches(/text|field|single/, XMigemoUI.lastFoundRange.toString());


		// 見つからない単語
		action.inputTextToField(findField, 'not found text');
		yield wait;
		assert.equals('notfound', findField.getAttribute('status'));


		// Enterキーでの再検索
		action.inputTextToField(findField, findTerm);
		yield wait;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.equals('single', XMigemoUI.lastFoundRange.toString());

		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('field', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('field', XMigemoUI.lastFoundRange.toString());

		key.shiftKey = true;
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('field', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('single', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('text', XMigemoUI.lastFoundRange.toString());


		// F3キーでの再検索
		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('single', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('field', XMigemoUI.lastFoundRange.toString());

		key.shiftKey = true;
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('single', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('text', XMigemoUI.lastFoundRange.toString());
	},

	'Migemo検索': function() {
		gFindBar.openFindBar();
		yield wait;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		findField.focus();


		// 検索に成功するケース
		var findTerm = 'nihongo';
		action.inputTextToField(findField, findTerm);
		yield wait;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.matches('日本語', XMigemoUI.lastFoundRange.toString());


		// 見つからない単語
		action.inputTextToField(findField, 'eigo');
		yield wait;
		assert.equals('notfound', findField.getAttribute('status'));


		// Enterキーでの再検索
		action.inputTextToField(findField, findTerm);
		yield wait;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.equals('日本語', XMigemoUI.lastFoundRange.toString());

		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('nihongo', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('にほんご', XMigemoUI.lastFoundRange.toString());

		key.shiftKey = true;
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('日本語', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('ニホンゴ', XMigemoUI.lastFoundRange.toString());


		// F3キーでの再検索
		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('日本語', XMigemoUI.lastFoundRange.toString());

		key.shiftKey = true;
		action.fireKeyEventOnElement(findField, key);
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('ニホンゴ', XMigemoUI.lastFoundRange.toString());
	},

	'検索モードの自動切り替え': function() {
		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		yield wait;

		action.inputTextToField(findField, 'text field');
		yield wait;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.matches('text field', XMigemoUI.lastFoundRange.toString());

		action.inputTextToField(findField, '');
		yield wait;
		action.inputTextToField(findField, '/(single-row|multirow) field/');
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_REGEXP, XMigemoUI.findMode);
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.matches('single-row field', XMigemoUI.lastFoundRange.toString());

		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('multirow field', XMigemoUI.lastFoundRange.toString());

		action.inputTextToField(findField, '');
		yield wait;
		action.inputTextToField(findField, '(single-row|multirow) field');
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
		assert.equals('notfound', findField.getAttribute('status'));
	},

	'複数のモードを切り替えながらの検索': function() {
		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		yield wait;

		action.inputTextToField(findField, 'text field');
		yield wait;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.matches('text field', XMigemoUI.lastFoundRange.toString());

		action.inputTextToField(findField, '');
		yield wait;


		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[2]);
		yield wait;
		action.inputTextToField(findField, 'nihongo');
		yield wait;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.matches('日本語', XMigemoUI.lastFoundRange.toString());

		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('にほんご', XMigemoUI.lastFoundRange.toString());

		action.inputTextToField(findField, '');
		yield wait;


		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[0]);
		yield wait;
		action.inputTextToField(findField, 'link');
		yield wait;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.matches('link', XMigemoUI.lastFoundRange.toString());

		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		action.fireKeyEventOnElement(findField, key);
		yield wait;
		assert.equals('link', XMigemoUI.lastFoundRange.toString());
	},

	'検索欄を選択範囲で埋める': function() {
		function selectInContent()
		{
			var range = content.document.createRange();
			range.selectNodeContents(content.document.getElementsByTagName('A')[0]);
			var selectedTerm = range.toString();
			var sel = content.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
			return selectedTerm;
		}


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		XMigemoUI.prefillWithSelection = false;
		var selectedTerm = selectInContent();
		gFindBar.openFindBar();
		yield wait;
		assert.equals('', XMigemoUI.findTerm);
		gFindBar.closeFindBar();
		yield wait;

		XMigemoUI.prefillWithSelection = true;
		selectedTerm = selectInContent();
		gFindBar.openFindBar();
		yield wait;
		assert.equals(selectedTerm, XMigemoUI.findTerm);
		action.inputTextToField(findField, '');
		yield wait;
		gFindBar.closeFindBar();
		yield wait;


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		XMigemoUI.prefillWithSelection = false;
		selectedTerm = selectInContent();
		gFindBar.openFindBar();
		yield wait;
		assert.equals('', XMigemoUI.findTerm);
		gFindBar.closeFindBar();
		yield wait;

		XMigemoUI.prefillWithSelection = true;
		selectedTerm = selectInContent();
		gFindBar.openFindBar();
		yield wait;
		assert.equals(selectedTerm, XMigemoUI.findTerm);
		action.inputTextToField(findField, '');
		yield wait;
		gFindBar.closeFindBar();
		yield wait;


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		XMigemoUI.prefillWithSelection = false;
		selectedTerm = selectInContent();
		gFindBar.openFindBar();
		yield wait;
		assert.equals('', XMigemoUI.findTerm);
		gFindBar.closeFindBar();
		yield wait;

		XMigemoUI.prefillWithSelection = true;
		selectedTerm = selectInContent();
		gFindBar.openFindBar();
		yield wait;
		assert.equals(selectedTerm, XMigemoUI.findTerm);
	}
};
