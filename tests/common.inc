var XMigemoUI, XMigemoHighlight, win, browser, findCommand, field, input;
var keyEventTest = baseURL+'keyEventTest.html';
var wait = 300;

function commonSetUp(aRetVal)
{
	browser = utils.getBrowser();
	browser.removeAllTabsBut(aRetVal.tab);

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

	field = XMigemoUI.findField;
	input = field.inputField;

	win.gFindBar.closeFindBar();
}

function commonTearDown()
{
	utils.tearDownTestWindow();
}
