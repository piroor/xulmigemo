var description = 'モード切り替えのテスト';

utils.include('common.inc.js');

function setUp()
{
	yield Do(commonSetUp(keyEventTest));
	assert.isTrue(XMigemoUI.hidden);
}

function tearDown() {
	commonTearDown();
}

assert.modeAPI = function(aMode) {
	XMigemoUI.findMode = XMigemoUI[aMode];
	yield wait;
	assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
}

function test_manualSwitch_API()
{
	assert.isTrue(XMigemoUI.hidden);
	eval(findCommand);
	yield wait;
	assert.isFalse(XMigemoUI.hidden);

	yield Do(assert.modeAPI('FIND_MODE_NATIVE'));
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	yield Do(assert.modeAPI('FIND_MODE_REGEXP'));
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	yield Do(assert.modeAPI('FIND_MODE_MIGEMO'));
	assert.isTrue(XMigemoUI.caseSensitiveCheck.disabled);
}

assert.buttonClick = function(aMode, aIndex) {
	action.clickOn(XMigemoUI.findModeSelector.childNodes[aIndex]);
	yield wait;
	assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
}

function test_manualSwitch_buttonClick()
{
	assert.isTrue(XMigemoUI.hidden);
	eval(findCommand);
	yield wait;
	assert.isFalse(XMigemoUI.hidden);

	yield Do(assert.buttonClick('FIND_MODE_REGEXP', 1));
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	yield Do(assert.buttonClick('FIND_MODE_MIGEMO', 2));
	assert.isTrue(XMigemoUI.caseSensitiveCheck.disabled);
	yield Do(assert.buttonClick('FIND_MODE_NATIVE', 0));
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
}

assert.flipBack = function(aMode, aIndex, aNext) {
	action.clickOn(XMigemoUI.findModeSelector.childNodes[aIndex]);
	yield wait;
	assert.equals(XMigemoUI[aNext], XMigemoUI.findMode, aMode);
}

function test_manualSwitch_flipBackByClick()
{
	assert.isTrue(XMigemoUI.hidden);
	eval(findCommand);
	yield wait;
	assert.isFalse(XMigemoUI.hidden);

	yield Do(assert.flipBack('FIND_MODE_NATIVE', 0, 'FIND_MODE_MIGEMO'));
	yield Do(assert.flipBack('FIND_MODE_MIGEMO', 2, 'FIND_MODE_NATIVE'));
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	yield Do(assert.flipBack('FIND_MODE_REGEXP', 1, 'FIND_MODE_NATIVE'));
}

assert.findCommand = function(aMode) {
	eval(findCommand);
	yield wait;
	assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
}

function test_manualSwitch_circulation()
{
	assert.isTrue(XMigemoUI.hidden);
	eval(findCommand);
	yield wait;
	assert.isFalse(XMigemoUI.hidden);

	// nothing
	XMigemoUI.modeCirculation = XMigemoUI.CIRCULATE_MODE_NONE;
	yield Do(assert.findCommand('FIND_MODE_NATIVE'));
	assert.isFalse(XMigemoUI.hidden);

	// circulate mode
	XMigemoUI.modeCirculation = XMigemoUI.FIND_MODE_NATIVE |
								XMigemoUI.FIND_MODE_REGEXP |
								XMigemoUI.FIND_MODE_MIGEMO;
	yield Do(assert.findCommand('FIND_MODE_REGEXP'));
	yield Do(assert.findCommand('FIND_MODE_MIGEMO'));
	yield Do(assert.findCommand('FIND_MODE_NATIVE'));

	// find => exit => find
	XMigemoUI.modeCirculation = XMigemoUI.CIRCULATE_MODE_EXIT;
	eval(findCommand);
	yield wait;
	assert.isTrue(XMigemoUI.hidden);
	yield Do(assert.findCommand('FIND_MODE_NATIVE'));

	// find => switch mode => exit => find
	XMigemoUI.modeCirculation = XMigemoUI.FIND_MODE_NATIVE |
								XMigemoUI.FIND_MODE_MIGEMO |
								XMigemoUI.CIRCULATE_MODE_EXIT;
	yield Do(assert.findCommand('FIND_MODE_MIGEMO'));
	eval(findCommand);
	yield wait;
	assert.isTrue(XMigemoUI.hidden);
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	yield Do(assert.findCommand('FIND_MODE_NATIVE'));
}

function test_manualSwitch_circulation_forcedFindMode()
{
	assert.isTrue(XMigemoUI.hidden);

	XMigemoUI.modeCirculation = XMigemoUI.FIND_MODE_NATIVE |
								XMigemoUI.FIND_MODE_REGEXP |
								XMigemoUI.FIND_MODE_MIGEMO |
								XMigemoUI.CIRCULATE_MODE_EXIT;

	XMigemoUI.forcedFindMode = XMigemoUI.FIND_MODE_NATIVE;
	yield Do(assert.findCommand('FIND_MODE_NATIVE'));
	yield Do(assert.findCommand('FIND_MODE_REGEXP'));
	yield Do(assert.findCommand('FIND_MODE_MIGEMO'));
	eval(findCommand);
	yield wait;
	assert.isTrue(XMigemoUI.hidden);
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	yield Do(assert.findCommand('FIND_MODE_NATIVE'));

	XMigemoUI.closeFindBar();
	yield wait;

	XMigemoUI.forcedFindMode = XMigemoUI.FIND_MODE_REGEXP;
	yield Do(assert.findCommand('FIND_MODE_REGEXP'));
	yield Do(assert.findCommand('FIND_MODE_MIGEMO'));
	eval(findCommand);
	yield wait;
	assert.isTrue(XMigemoUI.hidden);
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	yield Do(assert.findCommand('FIND_MODE_REGEXP'));

	XMigemoUI.closeFindBar();
	yield wait;

	XMigemoUI.forcedFindMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield Do(assert.findCommand('FIND_MODE_MIGEMO'));
	eval(findCommand);
	yield wait;
	assert.isTrue(XMigemoUI.hidden);
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	yield Do(assert.findCommand('FIND_MODE_MIGEMO'));

}

testAutoSwitch.description = '検索モードの自動切り替え';
function testAutoSwitch()
{
	gFindBar.openFindBar();
	yield wait;
	field.focus();
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield wait;

	action.inputTo(field, 'text field');
	yield wait;
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.matches('text field', XMigemoUI.lastFoundRange.toString());
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	assert.isFalse(XMigemoUI.caseSensitiveCheck.checked);

	action.inputTo(field, '');
	yield wait;
	action.inputTo(field, '/(single-row|multirow) field/');
	yield wait;
	assert.equals(XMigemoUI.FIND_MODE_REGEXP, XMigemoUI.findMode);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.matches('single-row field', XMigemoUI.lastFoundRange.toString());
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	assert.isTrue(XMigemoUI.caseSensitiveCheck.checked);

	action.inputTo(field, '');
	yield wait;
	action.inputTo(field, '/(single-row|multirow) field/i');
	yield wait;
	assert.equals(XMigemoUI.FIND_MODE_REGEXP, XMigemoUI.findMode);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.matches('single-row field', XMigemoUI.lastFoundRange.toString());
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	assert.isFalse(XMigemoUI.caseSensitiveCheck.checked);

	action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_F3);
	yield wait;
	assert.equals('multirow field', XMigemoUI.lastFoundRange.toString());

	action.inputTo(field, '');
	yield wait;
	action.inputTo(field, '(single-row|multirow) field');
	yield wait;
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.equals('notfound', field.getAttribute('status'));
}
