
function setUp()
{
	commonSetUp(gTestPageURI);
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
	utils.wait(WAIT);

	var mode = 'FIND_MODE_REGEXP';
	XMigemoUI.findMode = XMigemoUI[mode];
	XMigemoUI.caseSensitiveCheck.checked = false;
	field.focus();


	// 検索に成功するケース
	var findTerm = 'text field';
	assert.findAndFound({ input : findTerm, found : findTerm });

	// 見つからない単語
	assert.findAndNofFound({ input : 'not found text' });


	// Enterキーでの再検索
	var key = ['return'];
	assert.findAndFound({ input : findTerm, found : findTerm });
	var lastFoundRange = XMigemoUI.lastFoundRange;
	assert.isTrue(lastFoundRange);

	assert.findAgain({ keyOptions : key, times : 4 });
	var foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	lastFoundRange = foundRange;

	key = ['return', { shiftKey : true }];
	assert.findAgain({ keyOptions : key, times : 4 });
	foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	lastFoundRange = foundRange;


	// F3キーでの再検索
	key = ['F3'];
	assert.findAgain({ keyOptions : key, times : 4 });
	foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
	lastFoundRange = foundRange;

	key = ['F3', { shiftKey : true }];
	assert.findAgain({ keyOptions : key, times : 4 });
	foundRange = XMigemoUI.lastFoundRange;
	assert.notEquals(lastFoundRange.startContainer, foundRange.startContainer);
}

testRegExpFind.description = '正規表現検索';
function testRegExpFind()
{
	gFindBar.open();
	utils.wait(WAIT);

	var mode = 'FIND_MODE_REGEXP';
	XMigemoUI.findMode = XMigemoUI[mode];
	field.focus();


	// 検索に成功するケース
	var findTerm = 'text|field|single';
	assert.findAndFound({ input : findTerm, found : /text|field|single/ });

	// 見つからない単語
	assert.findAndNofFound({ input : 'not found text' });


	// Enterキーでの再検索
	assert.findAndFound({ input : findTerm, found : 'text' });
	var key = ['return'];
	assert.findAgain({ keyOptions : key, found : 'single' });
	assert.findAgain({ keyOptions : key, found : 'field' });
	assert.findAgain({ keyOptions : key, found : 'field', times : 3 });
	key = ['return', { shiftKey : true }];
	assert.findAgain({ keyOptions : key, found : 'field', times : 3 });
	assert.findAgain({ keyOptions : key, found : 'single' });
	assert.findAgain({ keyOptions : key, found : 'text' });


	// F3キーでの再検索
	key = ['F3'];
	assert.findAgain({ keyOptions : key, found : 'single' });
	assert.findAgain({ keyOptions : key, found : 'field' });

	key = ['F3', { shiftKey : true }];
	assert.findAgain({ keyOptions : key, found : 'single' });
	assert.findAgain({ keyOptions : key, found : 'text' });
}

testMigemoFind.description = 'Migemo検索';
function testMigemoFind()
{
	gFindBar.open();
	utils.wait(WAIT);

	var mode = 'FIND_MODE_MIGEMO';
	XMigemoUI.findMode = XMigemoUI[mode];
	field.focus();


	// 検索に成功するケース
	var findTerm = 'nihongo';
	assert.findAndFound({ input : findTerm, found : '日本語' });

	// 見つからない単語
	assert.findAndNofFound({ input : 'eigo' });


	// Enterキーでの再検索
	assert.findAndFound({ input : findTerm, found : '日本語' });
	var key = ['return'];
	assert.findAgain({ keyOptions : key, found : 'nihongo', times : 3 });
	assert.findAgain({ keyOptions : key, found : 'にほんご', times : 2 });
	key = ['return', { shiftKey : true }];
	assert.findAgain({ keyOptions : key, found : '日本語' });
	assert.findAgain({ keyOptions : key, found : 'ニホンゴ', times : 2 });


	// F3キーでの再検索
	key = ['F3'];
	assert.findAgain({ keyOptions : key, found : '日本語', times : 2 });
	key = ['F3', { shiftKey : true }];
	assert.findAgain({ keyOptions : key, found : 'ニホンゴ', times : 2 });
}

testDynamicSwitch.description = '複数のモードを切り替えながらの検索';
function testDynamicSwitch()
{
	gFindBar.open();
	utils.wait(WAIT);
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	utils.wait(WAIT);

	assert.findAndFound({ input : 'text field', found : 'text field' });

	action.inputTo(field, '');
	utils.wait(WAIT);

	action.clickOn(XMigemoUI.findModeSelector.childNodes[2]);
	utils.wait(WAIT);
	assert.findAndFound({ input : 'nihongo', found : '日本語' });

	var key = ['F3'];
	assert.findAgain({ keyOptions : key, found : 'にほんご' });

	action.inputTo(field, '');
	utils.wait(WAIT);


	action.clickOn(XMigemoUI.findModeSelector.childNodes[0]);
	utils.wait(WAIT);
	assert.findAndFound({ input : 'link', found : 'link' });

	assert.findAgain({ keyOptions : key, found : 'link' });
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
		var selectedTerm = selectInContent();
		gFindBar.open();
		utils.wait(WAIT);
		if (aPreFill) {
			assert.equals(selectedTerm, XMigemoUI.findTerm, aMode);
			action.inputTo(field, '');
		}
		else {
			assert.equals('', XMigemoUI.findTerm, aMode);
		}
		gFindBar.close();
		utils.wait(WAIT);
	}

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	assert.prefill('FIND_MODE_NATIVE', false);
	assert.prefill('FIND_MODE_NATIVE', true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	assert.prefill('FIND_MODE_REGEXP', false);
	assert.prefill('FIND_MODE_REGEXP', true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	assert.prefill('FIND_MODE_MIGEMO', false);
	assert.prefill('FIND_MODE_MIGEMO', true);
}

function assertLinkFind(aMode)
{
	var link = content.document.getElementsByTagName('a')[0];
	gFindBar.open();
	utils.wait(WAIT);
	XMigemoUI.findMode = XMigemoUI[aMode];
	utils.wait(WAIT);
	assert.findAndFound({ input : 'sample', found : 'sample' });
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
	assertLinkFind('FIND_MODE_REGEXP');
}

testLinkFindMigemo.description = 'リンクにもヒットする検索：Migemo検索'
function testLinkFindMigemo()
{
	assertLinkFind('FIND_MODE_MIGEMO');
}
