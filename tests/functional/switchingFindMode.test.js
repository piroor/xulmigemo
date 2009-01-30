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

testManualSwitch.description = 'モード切り替え';
function testManualSwitch()
{
	assert.isTrue(XMigemoUI.hidden);
	yield wait;

	eval(findCommand);
	yield wait;
	assert.isFalse(XMigemoUI.hidden);


	// APIによる切り替え
	assert.modeAPI = function(aMode) {
		XMigemoUI.findMode = XMigemoUI[aMode];
		yield wait;
		assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
	}
	yield Do(assert.modeAPI('FIND_MODE_NATIVE'));
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	yield Do(assert.modeAPI('FIND_MODE_REGEXP'));
	assert.isTrue(XMigemoUI.caseSensitiveCheck.disabled);
	yield Do(assert.modeAPI('FIND_MODE_MIGEMO'));
	assert.isTrue(XMigemoUI.caseSensitiveCheck.disabled);


	// ボタンのクリックによる切り替え
	assert.buttonClick = function(aMode, aIndex) {
		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[aIndex]);
		yield wait;
		assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
	}
	yield Do(assert.buttonClick('FIND_MODE_NATIVE', 0));
	assert.isFalse(XMigemoUI.caseSensitiveCheck.disabled);
	yield Do(assert.buttonClick('FIND_MODE_REGEXP', 1));
	assert.isTrue(XMigemoUI.caseSensitiveCheck.disabled);
	yield Do(assert.buttonClick('FIND_MODE_MIGEMO', 2));
	assert.isTrue(XMigemoUI.caseSensitiveCheck.disabled);


	// 二度目のクリックによるフリップバック
	assert.flipBack = function(aMode, aIndex, aNext) {
		action.fireMouseEventOnElement(XMigemoUI.findModeSelector.childNodes[aIndex]);
		yield wait;
		assert.equals(XMigemoUI[aNext], XMigemoUI.findMode, aMode);
	}
	yield Do(assert.flipBack('FIND_MODE_MIGEMO', 2, 'FIND_MODE_NATIVE'));
	yield Do(assert.flipBack('FIND_MODE_NATIVE', 0, 'FIND_MODE_MIGEMO'));
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	yield Do(assert.flipBack('FIND_MODE_REGEXP', 1, 'FIND_MODE_NATIVE'));


	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield wait;


	// 検索バーにフォーカスした状態でCtrl-F
	assert.findCommand = function(aMode) {
		eval(findCommand);
		yield wait;
		assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
	}

	XMigemoUI.openAgainAction = XMigemoUI.ACTION_NONE;
	yield Do(assert.findCommand('FIND_MODE_NATIVE'));
	assert.isFalse(XMigemoUI.hidden);

	XMigemoUI.openAgainAction = XMigemoUI.ACTION_SWITCH;
	yield Do(assert.findCommand('FIND_MODE_REGEXP'));
	yield Do(assert.findCommand('FIND_MODE_MIGEMO'));
	yield Do(assert.findCommand('FIND_MODE_NATIVE'));

	XMigemoUI.openAgainAction = XMigemoUI.ACTION_CLOSE;
	eval(findCommand);
	yield wait;
	assert.isTrue(XMigemoUI.hidden);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield wait;
	XMigemoUI.openAgainAction = XMigemoUI.ACTION_SWITCH_OR_CLOSE;
	yield Do(assert.findCommand('FIND_MODE_NATIVE'));
	yield Do(assert.findCommand('FIND_MODE_REGEXP'));
	yield Do(assert.findCommand('FIND_MODE_MIGEMO'));
	eval(findCommand);
	yield wait;
	assert.isTrue(XMigemoUI.hidden);
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
}

testAutoSwitch.description = '検索モードの自動切り替え';
function testAutoSwitch()
{
	gFindBar.openFindBar();
	yield wait;
	field.focus();
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
}
