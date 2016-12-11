var description = 'XMigemoUIのユニットテスト';

utils.include('common.inc.js');

function setUp()
{
	commonSetUp(keyEventTest);
	assert.isTrue(XMigemoUI.hidden);
}

function tearDown()
{
	commonTearDown();
}

function testProperties()
{
	assert.isTrue(XMigemoUI.browser);
	assert.isTrue(XMigemoUI.activeBrowser);
	assert.isTrue(XMigemoUI.findBar);
	assert.isTrue(XMigemoUI.field);
	assert.isTrue(XMigemoUI.label);
	assert.isTrue(XMigemoUI.caseSensitiveCheck);
	assert.isTrue(XMigemoUI.highlightCheck);
	assert.isTrue(XMigemoUI.findMigemoBar);
	assert.isTrue(XMigemoUI.findModeSelectorBox);
	assert.isTrue(XMigemoUI.findModeSelector);
	assert.isTrue(win.XMigemoFind);
	assert.isTrue(win.XMigemoCore);
}


function getFindFieldFromContent()
{
	var field = XMigemoUI.field;
	assert.isNotNull(field);
	assert.isTrue(field instanceof field.ownerDocument.defaultView.Node);

	assert.equals(field, XMigemoUI.getFindFieldFromContent(field));
	assert.equals(field, XMigemoUI.getFindFieldFromContent(field.ownerDocument.getAnonymousNodes(field)[0]));
	assert.isNull(XMigemoUI.getFindFieldFromContent(gBrowser));
}

function testShouldHighlightAll()
{
	var field = XMigemoUI.field;

	function assertFound(aTerm, aExpected)
	{
		field.value = aTerm;
		if (aExpected)
			assert.isTrue(XMigemoUI.shouldHighlightAll);
		else
			assert.isFalse(XMigemoUI.shouldHighlightAll);
	}

	XMigemoUI.highlightCheckedAlways = false;
	XMigemoUI.highlightCheckedAlwaysMinLength = 3;
	assertFound('', false);
	assertFound('f', true);
	assertFound('foo', true);
	assertFound('foobar', true);
	assertFound('w', true);
	assertFound('wor', true);
	assertFound('word', true);

	XMigemoUI.highlightCheckedAlways = true;
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	assertFound('', false);
	assertFound('f', false);
	assertFound('foo', false);
	assertFound('foobar', false);
	assertFound('w', false);
	assertFound('wor', true);
	assertFound('word', true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	assertFound('', false);
	assertFound('f', false);
	assertFound('foo', false);
	assertFound('foobar', false);
	assertFound('w', false);
	assertFound('wor', true);
	assertFound('word', true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	assertFound('', false);
	assertFound('f', false);
	assertFound('foo', false);
	assertFound('foobar', false);
	assertFound('w', false);
	assertFound('wor', true);
	assertFound('word', true);
	assertFound('n', false);
	assertFound('nih', true);
	assertFound('nihongo', true);
}

function testGetEditableNodes()
{
	function assertGetEditableNodes()
	{
		var nodes = [$('single-row1', content), $('multi-row', content), $('single-row2', content), $('single-row3', content), $('single-row4', content), $('single-row5', content), $('single-row6', content), $('single-row7', content), $('single-row8', content), $('single-row9', content)];

		var result = XMigemoUI.getEditableNodes(content.document);
		assert.equals(nodes.length, result.snapshotLength);
		nodes.forEach(function(aNode, aIndex) {
			assert.isNotNull(aNode);
			assert.equals(aNode, result.snapshotItem(aIndex), aIndex);
		});
	}

	utils.loadURI(baseURL+'../fixtures/keyEventTest.html');
	assertGetEditableNodes();
	utils.loadURI(baseURL+'../fixtures/keyEventTest.xml');
	assertGetEditableNodes();
}

function testGetDocumentBody()
{
	utils.loadURI(baseURL+'../fixtures/keyEventTest.html');
	assert.equals(content.document.body, XMigemoUI.getDocumentBody(content.document));
	utils.loadURI(baseURL+'../fixtures/keyEventTest.xml');
	assert.equals(content.document.getElementsByTagName('body')[0], XMigemoUI.getDocumentBody(content.document));
}

testDoProcessForAllFrames.setUp = function()
{
	utils.loadURI(baseURL+'../fixtures/frameTest.html');
};
function testDoProcessForAllFrames()
{
	var scope = { attrName : '_moz-xmigemo-test-attribute' };
	XMigemoUI.doProcessForAllFrames(
		function(aFrame) {
			aFrame.document.documentElement.setAttribute(this.attrName, true);
		},
		scope
	);
	assert.isTrue(content.document.documentElement.hasAttribute(scope.attrName));
	assert.isTrue($('frame1', content).contentDocument.documentElement.hasAttribute(scope.attrName));
	assert.isTrue($('frame2', content).contentDocument.documentElement.hasAttribute(scope.attrName));

	XMigemoUI.doProcessForAllFrames(
		function(aFrame) {
			aFrame.document.documentElement.removeAttribute(this.attrName, true);
		},
		scope
	);
	assert.isFalse(content.document.documentElement.hasAttribute(scope.attrName));
	assert.isFalse($('frame1', content).contentDocument.documentElement.hasAttribute(scope.attrName));
	assert.isFalse($('frame2', content).contentDocument.documentElement.hasAttribute(scope.attrName));
}

testClearFocusRingForSingleFrame.setUp = function()
{
	utils.loadURI(baseURL+'../fixtures/keyEventTest.html');
	for (let aLink of content.document.links)
	{
		aLink.setAttribute(XMigemoUI.kFOCUSED, true);
	}
};
function testClearFocusRingForSingleFrame()
{
	var links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', content.document);
	assert.equals(2, links.length);
	XMigemoUI.clearFocusRing();
	links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', content.document);
	assert.equals(0, links.length);
}

testClearFocusRingForMultipleFrames.setUp = function()
{
	utils.loadURI(baseURL+'../fixtures/frameTest.html');
	for (let aLink of $('frame1', content).contentDocument.links)
	{
		aLink.setAttribute(XMigemoUI.kFOCUSED, true);
	}
	for (let aLink of $('frame2', content).contentDocument.links)
	{
		aLink.setAttribute(XMigemoUI.kFOCUSED, true);
	}
};
function testClearFocusRingForMultipleFrames()
{
	var links;

	links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', $('frame1', content).contentDocument);
	assert.equals(2, links.length);
	links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', $('frame2', content).contentDocument);
	assert.equals(2, links.length);

	XMigemoUI.clearFocusRing();

	links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', $('frame1', content).contentDocument);
	assert.equals(0, links.length);
	links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', $('frame2', content).contentDocument);
	assert.equals(0, links.length);
}
