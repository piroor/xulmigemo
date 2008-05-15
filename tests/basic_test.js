// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc');

var switchModeTest = new TestCase('モード切り替えのテスト', {runStrategy: 'async'});

switchModeTest.tests = {
	setUp : function() {
		yield utils.doIteration(commonSetUp(keyEventTest));
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
		function assert_modeAPI(aMode) {
			XMigemoUI.findMode = XMigemoUI[aMode];
			yield wait;
			assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
		}
		yield utils.doIteration(assert_modeAPI('FIND_MODE_NATIVE'));
		assert.isFalse(XMigemoUI.findCaseSensitiveCheck.disabled);
		yield utils.doIteration(assert_modeAPI('FIND_MODE_REGEXP'));
		assert.isTrue(XMigemoUI.findCaseSensitiveCheck.disabled);
		yield utils.doIteration(assert_modeAPI('FIND_MODE_MIGEMO'));
		assert.isTrue(XMigemoUI.findCaseSensitiveCheck.disabled);


		// ボタンのクリックによる切り替え
		function assert_buttonClick(aMode, aIndex) {
			action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[aIndex]);
			yield wait;
			assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
		}
		yield utils.doIteration(assert_buttonClick('FIND_MODE_NATIVE', 0));
		assert.isFalse(XMigemoUI.findCaseSensitiveCheck.disabled);
		yield utils.doIteration(assert_buttonClick('FIND_MODE_REGEXP', 1));
		assert.isTrue(XMigemoUI.findCaseSensitiveCheck.disabled);
		yield utils.doIteration(assert_buttonClick('FIND_MODE_MIGEMO', 2));
		assert.isTrue(XMigemoUI.findCaseSensitiveCheck.disabled);


		// 二度目のクリックによるフリップバック
		function assert_flipBack(aMode, aIndex, aNext) {
			action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[aIndex]);
			yield wait;
			assert.equals(XMigemoUI[aNext], XMigemoUI.findMode, aMode);
		}
		yield utils.doIteration(assert_flipBack('FIND_MODE_MIGEMO', 2, 'FIND_MODE_NATIVE'));
		yield utils.doIteration(assert_flipBack('FIND_MODE_NATIVE', 0, 'FIND_MODE_MIGEMO'));
		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		yield utils.doIteration(assert_flipBack('FIND_MODE_REGEXP', 1, 'FIND_MODE_NATIVE'));


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		yield wait;


		// 検索バーにフォーカスした状態でCtrl-F
		function assert_findCommand(aMode) {
			eval(findCommand);
			yield wait;
			assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
		}

		XMigemoUI.openAgainAction = XMigemoUI.ACTION_NONE;
		yield utils.doIteration(assert_findCommand('FIND_MODE_NATIVE'));
		assert.isFalse(XMigemoUI.findBarHidden);

		XMigemoUI.openAgainAction = XMigemoUI.ACTION_SWITCH;
		yield utils.doIteration(assert_findCommand('FIND_MODE_REGEXP'));
		yield utils.doIteration(assert_findCommand('FIND_MODE_MIGEMO'));
		yield utils.doIteration(assert_findCommand('FIND_MODE_NATIVE'));

		XMigemoUI.openAgainAction = XMigemoUI.ACTION_CLOSE;
		eval(findCommand);
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);
	},

	'検索モードの自動切り替え': function() {
		gFindBar.openFindBar();
		yield wait;
		findField.focus();
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
	}
};


var htmlTests = {
	setUp : function() {
		yield utils.doIteration(commonSetUp(keyEventTest));
		assert.isTrue(XMigemoUI.findBarHidden);
	}
};

var xmlTests = {
	setUp : function() {
		yield utils.doIteration(commonSetUp(keyEventTestXML));
		assert.isTrue(XMigemoUI.findBarHidden);
	}
};


function assert_find_found(aMode, aTerm, aFound) {
	action.inputTextToField(findField, aTerm);
	yield wait;
	assert.notEquals('notfound', findField.getAttribute('status'), aMode);
	if (typeof aFound == 'string')
		assert.equals(aFound, XMigemoUI.lastFoundRange.toString(), aMode);
	else
		assert.matches(aFound, XMigemoUI.lastFoundRange.toString(), aMode);
}

function assert_find_notFound(aMode, aTerm) {
	action.inputTextToField(findField, aTerm);
	yield wait;
	assert.equals('notfound', findField.getAttribute('status'), aMode);
}

function assert_find_again(aMode, aKey, aTimes, aFound) {
	yield utils.doIteration(fireKeyEvents(findField, aKey, aTimes));
	if (aFound)
		assert.equals(aFound, XMigemoUI.lastFoundRange.toString(), aMode);
	else
		assert.isTrue(XMigemoUI.lastFoundRange, aMode);
}

var baseTests = {
	tearDown : function() {
		commonTearDown();
	},

	'通常の検索': function() {
		gFindBar.openFindBar();
		yield wait;

		var mode = 'FIND_MODE_REGEXP';
		XMigemoUI.findMode = XMigemoUI[mode];
		XMigemoUI.findCaseSensitiveCheck.checked = false;
		findField.focus();


		// 検索に成功するケース
		var findTerm = 'text field';
		yield utils.doIteration(assert_find_found(mode, findTerm, findTerm));

		// 見つからない単語
		yield utils.doIteration(assert_find_notFound(mode, 'not found text'));


		// Enterキーでの再検索
		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
		yield utils.doIteration(assert_find_found(mode, findTerm, findTerm));
		var lastFoundRange = XMigemoUI.lastFoundRange;
		assert.isTrue(lastFoundRange);

		yield utils.doIteration(assert_find_again(mode, key, 4));
		var foundRange = XMigemoUI.lastFoundRange;
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
		lastFoundRange = foundRange;

		key.shiftKey = true;
		yield utils.doIteration(assert_find_again(mode, key, 4));
		foundRange = XMigemoUI.lastFoundRange;
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
		lastFoundRange = foundRange;


		// F3キーでの再検索
		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		yield utils.doIteration(assert_find_again(mode, key, 4));
		foundRange = XMigemoUI.lastFoundRange;
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
		lastFoundRange = foundRange;

		key.shiftKey = true;
		yield utils.doIteration(assert_find_again(mode, key, 4));
		foundRange = XMigemoUI.lastFoundRange;
		assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	},

	'正規表現検索': function() {
		gFindBar.openFindBar();
		yield wait;

		var mode = 'FIND_MODE_REGEXP';
		XMigemoUI.findMode = XMigemoUI[mode];
		findField.focus();


		// 検索に成功するケース
		var findTerm = 'text|field|single';
		yield utils.doIteration(assert_find_found(mode, findTerm, /text|field|single/));

		// 見つからない単語
		yield utils.doIteration(assert_find_notFound(mode, 'not found text'));


		// Enterキーでの再検索
		yield utils.doIteration(assert_find_found(mode, findTerm, 'single'));
		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
		yield utils.doIteration(assert_find_again(mode, key, 1, 'field'));
		yield utils.doIteration(assert_find_again(mode, key, 3, 'field'));
		key.shiftKey = true;
		yield utils.doIteration(assert_find_again(mode, key, 3, 'field'));
		yield utils.doIteration(assert_find_again(mode, key, 1, 'single'));
		yield utils.doIteration(assert_find_again(mode, key, 1, 'text'));


		// F3キーでの再検索
		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		yield utils.doIteration(assert_find_again(mode, key, 1, 'single'));
		yield utils.doIteration(assert_find_again(mode, key, 1, 'field'));

		key.shiftKey = true;
		yield utils.doIteration(assert_find_again(mode, key, 1, 'single'));
		yield utils.doIteration(assert_find_again(mode, key, 1, 'text'));
	},

	'Migemo検索': function() {
		gFindBar.openFindBar();
		yield wait;

		var mode = 'FIND_MODE_MIGEMO';
		XMigemoUI.findMode = XMigemoUI[mode];
		findField.focus();


		// 検索に成功するケース
		var findTerm = 'nihongo';
		yield utils.doIteration(assert_find_found(mode, findTerm, '日本語'));

		// 見つからない単語
		yield utils.doIteration(assert_find_notFound(mode, 'eigo'));


		// Enterキーでの再検索
		yield utils.doIteration(assert_find_found(mode, findTerm, '日本語'));
		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
		yield utils.doIteration(assert_find_again(mode, key, 3, 'nihongo'));
		yield utils.doIteration(assert_find_again(mode, key, 2, 'にほんご'));
		key.shiftKey = true;
		yield utils.doIteration(assert_find_again(mode, key, 1, '日本語'));
		yield utils.doIteration(assert_find_again(mode, key, 2, 'ニホンゴ'));


		// F3キーでの再検索
		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		yield utils.doIteration(assert_find_again(mode, key, 2, '日本語'));
		key.shiftKey = true;
		yield utils.doIteration(assert_find_again(mode, key, 2, 'ニホンゴ'));
	},

	'複数のモードを切り替えながらの検索': function() {
		gFindBar.openFindBar();
		yield wait;
		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		yield wait;

		yield utils.doIteration(assert_find_found('FIND_MODE_NATIVE', 'text field', 'text field'));

		action.inputTextToField(findField, '');
		yield wait;

		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[2]);
		yield wait;
		yield utils.doIteration(assert_find_found('FIND_MODE_MIGEMO', 'nihongo', '日本語'));

		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		yield utils.doIteration(assert_find_again('FIND_MODE_MIGEMO', key, 1, 'にほんご'));

		action.inputTextToField(findField, '');
		yield wait;


		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[0]);
		yield wait;
		yield utils.doIteration(assert_find_found('FIND_MODE_NATIVE', 'link', 'link'));

		var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
		yield utils.doIteration(assert_find_again('FIND_MODE_NATIVE', key, 1, 'link'));
	},

	'検索欄を選択範囲で埋める': function() {
		function selectInContent()
		{
			var range = content.document.createRange();
			range.selectNodeContents(content.document.getElementsByTagName('a')[0]);
			var selectedTerm = range.toString();
			var sel = content.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
			return selectedTerm;
		}

		function assert_prefill(aMode, aPreFill) {
			XMigemoUI.prefillWithSelection = aPreFill;
			var selectedTerm = selectInContent();
			gFindBar.openFindBar();
			yield wait;
			if (aPreFill) {
				assert.equals(selectedTerm, XMigemoUI.findTerm, aMode);
				action.inputTextToField(findField, '');
			}
			else {
				assert.equals('', XMigemoUI.findTerm, aMode);
			}
			gFindBar.closeFindBar();
			yield wait;
		}

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		yield utils.doIteration(assert_prefill('FIND_MODE_NATIVE', false));
		yield utils.doIteration(assert_prefill('FIND_MODE_NATIVE', true));

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		yield utils.doIteration(assert_prefill('FIND_MODE_REGEXP', false));
		yield utils.doIteration(assert_prefill('FIND_MODE_REGEXP', true));

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		yield utils.doIteration(assert_prefill('FIND_MODE_MIGEMO', false));
		yield utils.doIteration(assert_prefill('FIND_MODE_MIGEMO', true));
	}
};

htmlTests.__proto__ = baseTests;
xmlTests.__proto__ = baseTests;


var basicTest = new TestCase('基本機能のテスト（HTML）', {runStrategy: 'async'});
basicTest.tests = htmlTests;

var basicTestXML = new TestCase('基本機能のテスト（XML）', {runStrategy: 'async'});
basicTestXML.tests = xmlTests;
