var description = 'モード切り替えのテスト';

utils.include('common.inc.js');

function setUp()
{
	commonSetUp(keyEventTest)
	assert.isTrue(XMigemoUI.hidden);
}

function tearDown() {
	commonTearDown();
}

function test_manualSwitch_API()
{
	assert.isTrue(XMigemoUI.hidden);
	eval(findCommand);
	utils.wait(WAIT);
	assert.isFalse(XMigemoUI.hidden);

	assert.changeModeByAPI('FIND_MODE_NATIVE')
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	assert.changeModeByAPI('FIND_MODE_REGEXP')
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	assert.changeModeByAPI('FIND_MODE_MIGEMO')
	assert.isTrue(XMigemoUI.caseSensitiveCheck.disabled);
}

function test_manualSwitch_buttonClick()
{
	assert.isTrue(XMigemoUI.hidden);
	eval(findCommand);
	utils.wait(WAIT);
	assert.isFalse(XMigemoUI.hidden);

	assert.changeModeByButtonClick('FIND_MODE_REGEXP', 1)
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	assert.changeModeByButtonClick('FIND_MODE_MIGEMO', 2)
	assert.isTrue(XMigemoUI.caseSensitiveCheck.disabled);
	assert.changeModeByButtonClick('FIND_MODE_NATIVE', 0)
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
}

function test_manualSwitch_flipBackByClick()
{
	assert.isTrue(XMigemoUI.hidden);
	eval(findCommand);
	utils.wait(WAIT);
	assert.isFalse(XMigemoUI.hidden);

	assert.changeModeByFlipBack('FIND_MODE_NATIVE', 0, 'FIND_MODE_MIGEMO')
	assert.changeModeByFlipBack('FIND_MODE_MIGEMO', 2, 'FIND_MODE_NATIVE')
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	assert.changeModeByFlipBack('FIND_MODE_REGEXP', 1, 'FIND_MODE_NATIVE')
}

function test_manualSwitch_circulation()
{
	assert.isTrue(XMigemoUI.hidden);
	eval(findCommand);
	utils.wait(WAIT);
	assert.isFalse(XMigemoUI.hidden);

	// nothing
	XMigemoUI.modeCirculation = XMigemoUI.CIRCULATE_MODE_NONE;
	assert.changeModeByFindCommand('FIND_MODE_NATIVE')
	assert.isFalse(XMigemoUI.hidden);

	// circulate mode
	XMigemoUI.modeCirculation = XMigemoUI.FIND_MODE_NATIVE |
								XMigemoUI.FIND_MODE_REGEXP |
								XMigemoUI.FIND_MODE_MIGEMO;
	assert.changeModeByFindCommand('FIND_MODE_REGEXP')
	assert.changeModeByFindCommand('FIND_MODE_MIGEMO')
	assert.changeModeByFindCommand('FIND_MODE_NATIVE')

	// find => exit => find
	XMigemoUI.modeCirculation = XMigemoUI.CIRCULATE_MODE_EXIT;
	eval(findCommand);
	utils.wait(WAIT);
	assert.isTrue(XMigemoUI.hidden);
	assert.changeModeByFindCommand('FIND_MODE_NATIVE')

	// find => switch mode => exit => find
	XMigemoUI.modeCirculation = XMigemoUI.FIND_MODE_NATIVE |
								XMigemoUI.FIND_MODE_MIGEMO |
								XMigemoUI.CIRCULATE_MODE_EXIT;
	assert.changeModeByFindCommand('FIND_MODE_MIGEMO')
	eval(findCommand);
	utils.wait(WAIT);
	assert.isTrue(XMigemoUI.hidden);
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.changeModeByFindCommand('FIND_MODE_NATIVE')
}

function test_manualSwitch_circulation_forcedFindMode()
{
	assert.isTrue(XMigemoUI.hidden);

	XMigemoUI.modeCirculation = XMigemoUI.FIND_MODE_NATIVE |
								XMigemoUI.FIND_MODE_REGEXP |
								XMigemoUI.FIND_MODE_MIGEMO |
								XMigemoUI.CIRCULATE_MODE_EXIT;

	XMigemoUI.forcedFindMode = XMigemoUI.FIND_MODE_NATIVE;
	assert.changeModeByFindCommand('FIND_MODE_NATIVE')
	assert.changeModeByFindCommand('FIND_MODE_REGEXP')
	assert.changeModeByFindCommand('FIND_MODE_MIGEMO')
	eval(findCommand);
	utils.wait(WAIT);
	assert.isTrue(XMigemoUI.hidden);
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.changeModeByFindCommand('FIND_MODE_NATIVE')

	XMigemoUI.close();
	utils.wait(WAIT);

	XMigemoUI.forcedFindMode = XMigemoUI.FIND_MODE_REGEXP;
	assert.changeModeByFindCommand('FIND_MODE_REGEXP')
	assert.changeModeByFindCommand('FIND_MODE_MIGEMO')
	eval(findCommand);
	utils.wait(WAIT);
	assert.isTrue(XMigemoUI.hidden);
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.changeModeByFindCommand('FIND_MODE_REGEXP')

	XMigemoUI.close();
	utils.wait(WAIT);

	XMigemoUI.forcedFindMode = XMigemoUI.FIND_MODE_MIGEMO;
	assert.changeModeByFindCommand('FIND_MODE_MIGEMO')
	eval(findCommand);
	utils.wait(WAIT);
	assert.isTrue(XMigemoUI.hidden);
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.changeModeByFindCommand('FIND_MODE_MIGEMO')

}

testAutoSwitch.description = '検索モードの自動切り替え';
function testAutoSwitch()
{
	gFindBar.open();
	utils.wait(WAIT);
	field.focus();
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	utils.wait(WAIT);

	action.inputTo(field, 'text field');
	utils.wait(WAIT);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.matches('text field', XMigemoUI.lastFoundRange.toString());
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	assert.isFalse(XMigemoUI.caseSensitiveCheck.checked);

	action.inputTo(field, '');
	utils.wait(WAIT);
	action.inputTo(field, '/(single-row|multirow) field/');
	utils.wait(WAIT);
	assert.equals(XMigemoUI.FIND_MODE_REGEXP, XMigemoUI.findMode);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.matches('single-row field', XMigemoUI.lastFoundRange.toString());
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	assert.isTrue(XMigemoUI.caseSensitiveCheck.checked);

	action.inputTo(field, '');
	utils.wait(WAIT);
	action.inputTo(field, '/(single-row|multirow) field/i');
	utils.wait(WAIT);
	assert.equals(XMigemoUI.FIND_MODE_REGEXP, XMigemoUI.findMode);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.matches('single-row field', XMigemoUI.lastFoundRange.toString());
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	assert.isFalse(XMigemoUI.caseSensitiveCheck.checked);

	action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_F3);
	utils.wait(WAIT);
	assert.equals('multirow field', XMigemoUI.lastFoundRange.toString());

	action.inputTo(field, '');
	utils.wait(WAIT);
	action.inputTo(field, '(single-row|multirow) field');
	utils.wait(WAIT);
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.equals('notfound', field.getAttribute('status'));
}
