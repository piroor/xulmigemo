
assert.find_found = function(aMode, aTerm, aFound) {
	action.inputTo(field, aTerm);
	yield WAIT;
	assert.notEquals('notfound', field.getAttribute('status'), aMode);
	if (typeof aFound == 'string')
		assert.equals(aFound, XMigemoUI.lastFoundRange.toString(), aMode);
	else
		assert.matches(aFound, XMigemoUI.lastFoundRange.toString(), aMode);
}

assert.find_notFound = function(aMode, aTerm) {
	action.inputTo(field, aTerm);
	yield WAIT;
	assert.equals('notfound', field.getAttribute('status'), aMode);
}

assert.find_again = function(aMode, aKeyOptions, aTimes, aFound) {
	yield Do(keypressMultiply([field].concat(aKeyOptions), aTimes));
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
	gFindBar.open();
	yield WAIT;

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
	var key = ['return'];
	yield Do(assert.find_found(mode, findTerm, findTerm));
	var lastFoundRange = XMigemoUI.lastFoundRange;
	assert.isTrue(lastFoundRange);

	yield Do(assert.find_again(mode, key, 4));
	var foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	lastFoundRange = foundRange;

	key = ['return', { shiftKey : true }];
	yield Do(assert.find_again(mode, key, 4));
	foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	lastFoundRange = foundRange;


	// F3キーでの再検索
	key = ['F3'];
	yield Do(assert.find_again(mode, key, 4));
	foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	lastFoundRange = foundRange;

	key = ['F3', { shiftKey : true }];
	yield Do(assert.find_again(mode, key, 4));
	foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
}

testRegExpFind.description = '正規表現検索';
function testRegExpFind()
{
	gFindBar.open();
	yield WAIT;

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
	var key = ['return'];
	yield Do(assert.find_again(mode, key, 1, 'single'));
	yield Do(assert.find_again(mode, key, 1, 'field'));
	yield Do(assert.find_again(mode, key, 3, 'field'));
	key = ['return', { shiftKey : true }];
	yield Do(assert.find_again(mode, key, 3, 'field'));
	yield Do(assert.find_again(mode, key, 1, 'single'));
	yield Do(assert.find_again(mode, key, 1, 'text'));


	// F3キーでの再検索
	key = ['F3'];
	yield Do(assert.find_again(mode, key, 1, 'single'));
	yield Do(assert.find_again(mode, key, 1, 'field'));

	key = ['F3', { shiftKey : true }];
	yield Do(assert.find_again(mode, key, 1, 'single'));
	yield Do(assert.find_again(mode, key, 1, 'text'));
}

testMigemoFind.description = 'Migemo検索';
function testMigemoFind()
{
	gFindBar.open();
	yield WAIT;

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
	var key = ['return'];
	yield Do(assert.find_again(mode, key, 3, 'nihongo'));
	yield Do(assert.find_again(mode, key, 2, 'にほんご'));
	key = ['return', { shiftKey : true }];
	yield Do(assert.find_again(mode, key, 1, '日本語'));
	yield Do(assert.find_again(mode, key, 2, 'ニホンゴ'));


	// F3キーでの再検索
	key = ['F3'];
	yield Do(assert.find_again(mode, key, 2, '日本語'));
	key = ['F3', { shiftKey : true }];
	yield Do(assert.find_again(mode, key, 2, 'ニホンゴ'));
}

testDynamicSwitch.description = '複数のモードを切り替えながらの検索';
function testDynamicSwitch()
{
	gFindBar.open();
	yield WAIT;
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield WAIT;

	yield Do(assert.find_found('FIND_MODE_NATIVE', 'text field', 'text field'));

	action.inputTo(field, '');
	yield WAIT;

	action.clickOn(XMigemoUI.findModeSelector.childNodes[2]);
	yield WAIT;
	yield Do(assert.find_found('FIND_MODE_MIGEMO', 'nihongo', '日本語'));

	var key = ['F3'];
	yield Do(assert.find_again('FIND_MODE_MIGEMO', key, 1, 'にほんご'));

	action.inputTo(field, '');
	yield WAIT;


	action.clickOn(XMigemoUI.findModeSelector.childNodes[0]);
	yield WAIT;
	yield Do(assert.find_found('FIND_MODE_NATIVE', 'link', 'link'));

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
		gFindBar.open();
		yield WAIT;
		if (aPreFill) {
			assert.equals(selectedTerm, XMigemoUI.findTerm, aMode);
			action.inputTo(field, '');
		}
		else {
			assert.equals('', XMigemoUI.findTerm, aMode);
		}
		gFindBar.close();
		yield WAIT;
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

function assertLinkFind(aMode)
{
	var link = content.document.getElementsByTagName('a')[0];
	gFindBar.open();
	yield WAIT;
	XMigemoUI.findMode = XMigemoUI[aMode];
	yield WAIT;
	yield Do(assert.find_found(aMode, 'sample', 'sample'));
	assert.contained($('first', content), XMigemoUI.lastFoundRange);
	assert.notContained(link, XMigemoUI.lastFoundRange);
	XMigemoUI.findNext();
	assert.contained(link, XMigemoUI.lastFoundRange);
	assert.isFalse(link.hasAttribute(XMigemoUI.kFOCUSED));
	XMigemoUI.findNext();
	assert.contained($('first', content), XMigemoUI.lastFoundRange);
	assert.notContained(link, XMigemoUI.lastFoundRange);
}

testLinkFindRegExp.description = 'リンクにもヒットする検索：正規表現検索'
function testLinkFindRegExp()
{
	yield Do(assertLinkFind('FIND_MODE_REGEXP'));
}

testLinkFindMigemo.description = 'リンクにもヒットする検索：Migemo検索'
function testLinkFindMigemo()
{
	yield Do(assertLinkFind('FIND_MODE_MIGEMO'));
}
