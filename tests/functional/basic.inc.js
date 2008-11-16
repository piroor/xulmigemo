
assert.find_found = function(aMode, aTerm, aFound) {
	action.inputTextToField(field, aTerm);
	yield wait;
	assert.notEquals('notfound', field.getAttribute('status'), aMode);
	if (typeof aFound == 'string')
		assert.equals(aFound, XMigemoUI.lastFoundRange.toString(), aMode);
	else
		assert.matches(aFound, XMigemoUI.lastFoundRange.toString(), aMode);
}

assert.find_notFound = function(aMode, aTerm) {
	action.inputTextToField(field, aTerm);
	yield wait;
	assert.equals('notfound', field.getAttribute('status'), aMode);
}

assert.find_again = function(aMode, aKey, aTimes, aFound) {
	yield Do(fireKeyEvents(field, aKey, aTimes));
	if (aFound)
		assert.equals(aFound, XMigemoUI.lastFoundRange.toString(), aMode);
	else
		assert.isTrue(XMigemoUI.lastFoundRange, aMode);
}

function setUp()
{
	yield Do(commonSetUp(gTestPageURI));
	assert.isTrue(XMigemoUI.hidden);
}

function tearDown()
{
	commonTearDown();
}

testNormalFind.description = '通常の検索';
function testNormalFind()
{
	gFindBar.openFindBar();
	yield wait;

	var mode = 'FIND_MODE_REGEXP';
	XMigemoUI.findMode = XMigemoUI[mode];
	XMigemoUI.caseSensitiveCheck.checked = false;
	field.focus();


	// 検索に成功するケース
	var findTerm = 'text field';
	yield Do(assert.find_found(mode, findTerm, findTerm));

	// 見つからない単語
	yield Do(assert.find_notFound(mode, 'not found text'));


	// Enterキーでの再検索
	var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
	yield Do(assert.find_found(mode, findTerm, findTerm));
	var lastFoundRange = XMigemoUI.lastFoundRange;
	assert.isTrue(lastFoundRange);

	yield Do(assert.find_again(mode, key, 4));
	var foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	lastFoundRange = foundRange;

	key.shiftKey = true;
	yield Do(assert.find_again(mode, key, 4));
	foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	lastFoundRange = foundRange;


	// F3キーでの再検索
	key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
	yield Do(assert.find_again(mode, key, 4));
	foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	lastFoundRange = foundRange;

	key.shiftKey = true;
	yield Do(assert.find_again(mode, key, 4));
	foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
}

testRegExpFind.description = '正規表現検索';
function testRegExpFind()
{
	gFindBar.openFindBar();
	yield wait;

	var mode = 'FIND_MODE_REGEXP';
	XMigemoUI.findMode = XMigemoUI[mode];
	field.focus();


	// 検索に成功するケース
	var findTerm = 'text|field|single';
	yield Do(assert.find_found(mode, findTerm, /text|field|single/));

	// 見つからない単語
	yield Do(assert.find_notFound(mode, 'not found text'));


	// Enterキーでの再検索
	yield Do(assert.find_found(mode, findTerm, 'text'));
	var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
	yield Do(assert.find_again(mode, key, 1, 'single'));
	yield Do(assert.find_again(mode, key, 1, 'field'));
	yield Do(assert.find_again(mode, key, 3, 'field'));
	key.shiftKey = true;
	yield Do(assert.find_again(mode, key, 3, 'field'));
	yield Do(assert.find_again(mode, key, 1, 'single'));
	yield Do(assert.find_again(mode, key, 1, 'text'));


	// F3キーでの再検索
	key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
	yield Do(assert.find_again(mode, key, 1, 'single'));
	yield Do(assert.find_again(mode, key, 1, 'field'));

	key.shiftKey = true;
	yield Do(assert.find_again(mode, key, 1, 'single'));
	yield Do(assert.find_again(mode, key, 1, 'text'));
}

testMigemoFind.description = 'Migemo検索';
function testMigemoFind()
{
	gFindBar.openFindBar();
	yield wait;

	var mode = 'FIND_MODE_MIGEMO';
	XMigemoUI.findMode = XMigemoUI[mode];
	field.focus();


	// 検索に成功するケース
	var findTerm = 'nihongo';
	yield Do(assert.find_found(mode, findTerm, '日本語'));

	// 見つからない単語
	yield Do(assert.find_notFound(mode, 'eigo'));


	// Enterキーでの再検索
	yield Do(assert.find_found(mode, findTerm, '日本語'));
	var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN };
	yield Do(assert.find_again(mode, key, 3, 'nihongo'));
	yield Do(assert.find_again(mode, key, 2, 'にほんご'));
	key.shiftKey = true;
	yield Do(assert.find_again(mode, key, 1, '日本語'));
	yield Do(assert.find_again(mode, key, 2, 'ニホンゴ'));


	// F3キーでの再検索
	key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
	yield Do(assert.find_again(mode, key, 2, '日本語'));
	key.shiftKey = true;
	yield Do(assert.find_again(mode, key, 2, 'ニホンゴ'));
}

testDynamicSwitch.description = '複数のモードを切り替えながらの検索';
function testDynamicSwitch()
{
	gFindBar.openFindBar();
	yield wait;
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield wait;

	yield Do(assert.find_found('FIND_MODE_NATIVE', 'text field', 'text field'));

	action.inputTextToField(field, '');
	yield wait;

	action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[2]);
	yield wait;
	yield Do(assert.find_found('FIND_MODE_MIGEMO', 'nihongo', '日本語'));

	var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
	yield Do(assert.find_again('FIND_MODE_MIGEMO', key, 1, 'にほんご'));

	action.inputTextToField(field, '');
	yield wait;


	action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[0]);
	yield wait;
	yield Do(assert.find_found('FIND_MODE_NATIVE', 'link', 'link'));

	var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_F3 };
	yield Do(assert.find_again('FIND_MODE_NATIVE', key, 1, 'link'));
}

testFillWithSelection.description = '検索欄を選択範囲で埋める';
function testFillWithSelection()
{
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

	assert.prefill = function(aMode, aPreFill) {
		XMigemoUI.prefillWithSelection = aPreFill;
		var selectedTerm = selectInContent();
		gFindBar.openFindBar();
		yield wait;
		if (aPreFill) {
			assert.equals(selectedTerm, XMigemoUI.findTerm, aMode);
			action.inputTextToField(field, '');
		}
		else {
			assert.equals('', XMigemoUI.findTerm, aMode);
		}
		gFindBar.closeFindBar();
		yield wait;
	}

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield Do(assert.prefill('FIND_MODE_NATIVE', false));
	yield Do(assert.prefill('FIND_MODE_NATIVE', true));

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	yield Do(assert.prefill('FIND_MODE_REGEXP', false));
	yield Do(assert.prefill('FIND_MODE_REGEXP', true));

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield Do(assert.prefill('FIND_MODE_MIGEMO', false));
	yield Do(assert.prefill('FIND_MODE_MIGEMO', true));
}
