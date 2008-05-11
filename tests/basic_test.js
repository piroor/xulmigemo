// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

var XMigemoUI, XMigemoHighlight, win, browser, findCommand;
var keyEventTest = baseURL+'keyEventTest.html';
var wait = 300;

var basicTest = new TestCase('基本機能のテスト', {runStrategy: 'async'});

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
		XMigemoUI.highlightCheckedAlways = false;
		XMigemoUI.caseSensitiveCheckedAlways = false;
		XMigemoUI.autoStartRegExpFind = true;
		XMigemoUI.autoStartQuickFind = false;

		XMigemoHighlight = win.XMigemoHighlight;
		XMigemoHighlight.strongHighlight = false;
		XMigemoHighlight.animationEnabled = false;

		findCommand = 'with (win) {'+
			win.document.getElementById('cmd_find').getAttribute('oncommand')+
		'}';

		win.gFindBar.closeFindBar();
		yield wait;
	},

	tearDown : function() {
		utils.tearDownTestWindow();
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
		win.gFindBar.openFindBar();
		yield wait;

		var field = XMigemoUI.findField;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		XMigemoUI.findCaseSensitiveCheck.checked = false;
		field.focus();


		// 検索に成功するケース
		var findTerm = 'text';
		for (var i = 1, maxi = findTerm.length+1; i < maxi; i++)
		{
			action.inputTextToField(field, findTerm.substring(0, i));
			yield wait;
		}
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.equals('text', XMigemoUI.lastFoundRange.toString());


		// 見つからない単語
		action.inputTextToField(field, 'not found text');
		yield wait;
		assert.equals('notfound', field.getAttribute('status'));


		// Enterキーでの再検索
		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
		action.inputTextToField(field, findTerm);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		var lastFoundRange = XMigemoUI.lastFoundRange;
		assert.isTrue(lastFoundRange);

		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		var foundRange = XMigemoUI.lastFoundRange;
		assert.isTrue(foundRange);
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
		lastFoundRange = foundRange;

		key.shiftKey = true;
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		foundRange = XMigemoUI.lastFoundRange;
		assert.isTrue(foundRange);
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
		lastFoundRange = foundRange;


		// F3キーでの再検索
		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		foundRange = XMigemoUI.lastFoundRange;
		assert.isTrue(foundRange);
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
		lastFoundRange = foundRange;

		key.shiftKey = true;
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		foundRange = XMigemoUI.lastFoundRange;
		assert.isTrue(foundRange);
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	},

	'正規表現検索': function() {
		win.gFindBar.openFindBar();
		yield wait;

		var field = XMigemoUI.findField;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		field.focus();


		// 検索に成功するケース
		var findTerm = 'text|field|single';
		action.inputTextToField(field, findTerm);
		yield wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.matches(/text|field|single/, XMigemoUI.lastFoundRange.toString());


		// 見つからない単語
		action.inputTextToField(field, 'not found text');
		yield wait;
		assert.equals('notfound', field.getAttribute('status'));


		// Enterキーでの再検索
		action.inputTextToField(field, findTerm);
		yield wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.equals('single', XMigemoUI.lastFoundRange.toString());

		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('field', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('field', XMigemoUI.lastFoundRange.toString());

		key.shiftKey = true;
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('field', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('single', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('text', XMigemoUI.lastFoundRange.toString());


		// F3キーでの再検索
		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('single', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('field', XMigemoUI.lastFoundRange.toString());

		key.shiftKey = true;
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('single', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('text', XMigemoUI.lastFoundRange.toString());
	},

	'Migemo検索': function() {
		win.gFindBar.openFindBar();
		yield wait;

		var field = XMigemoUI.findField;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		field.focus();


		// 検索に成功するケース
		var findTerm = 'nihongo';
		action.inputTextToField(field, findTerm);
		yield wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.matches('日本語', XMigemoUI.lastFoundRange.toString());


		// 見つからない単語
		action.inputTextToField(field, 'eigo');
		yield wait;
		assert.equals('notfound', field.getAttribute('status'));


		// Enterキーでの再検索
		action.inputTextToField(field, findTerm);
		yield wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.equals('日本語', XMigemoUI.lastFoundRange.toString());

		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('nihongo', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('にほんご', XMigemoUI.lastFoundRange.toString());

		key.shiftKey = true;
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('日本語', XMigemoUI.lastFoundRange.toString());

		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('ニホンゴ', XMigemoUI.lastFoundRange.toString());


		// F3キーでの再検索
		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('日本語', XMigemoUI.lastFoundRange.toString());

		key.shiftKey = true;
		action.fireKeyEventOnElement(field, key);
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('ニホンゴ', XMigemoUI.lastFoundRange.toString());
	},

	'検索モードの自動切り替え': function() {
		var field = XMigemoUI.findField;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		yield wait;

		action.inputTextToField(field, 'text field');
		yield wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.matches('text field', XMigemoUI.lastFoundRange.toString());

		action.inputTextToField(field, '');
		yield wait;
		action.inputTextToField(field, '/(single-row|multirow) field/');
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_REGEXP, XMigemoUI.findMode);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.matches('single-row field', XMigemoUI.lastFoundRange.toString());

		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('multirow field', XMigemoUI.lastFoundRange.toString());

		action.inputTextToField(field, '');
		yield wait;
		action.inputTextToField(field, '(single-row|multirow) field');
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
		assert.equals('notfound', field.getAttribute('status'));
	},

	'複数のモードを切り替えながらの検索': function() {
		var field = XMigemoUI.findField;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		yield wait;

		action.inputTextToField(field, 'text field');
		yield wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.matches('text field', XMigemoUI.lastFoundRange.toString());

		action.inputTextToField(field, '');
		yield wait;

		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[2]);
		yield wait;
		action.inputTextToField(field, 'nihongo');
		yield wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.matches('日本語', XMigemoUI.lastFoundRange.toString());

		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.equals('にほんご', XMigemoUI.lastFoundRange.toString());
	}
};
