utils.include('xmXMigemoClasses.inc.js');

var findModule;

function setUp()
{
	yield utils.setUpTestWindow();
	findModule = new xmXMigemoFind();
	findModule.target = utils.getTestWindow().gBrowser;
	findModule.findMode = findModule.FIND_MODE_MIGEMO;
}

function tearDown()
{
	findModule.destroy();
	findModule = null;
	utils.tearDownTestWindow();
}


function assertFindAndFound(aBackward, aFindTerm, aFoundTerm)
{
	findModule.find(aBackward, aFindTerm, false);
	assertFound(aFoundTerm);
}

function assertFound(aTerm)
{
	assert.equals(aTerm, findModule.foundRange);
//	assert.equals(aTerm, findModule.foundRange, inspectDOMNode(findModule.foundRange.commonAncestorContainer.parentNode));
}


function assertFindInSingleFrame()
{
	yield Do(utils.loadURI(baseURL+'../fixtures/keyEventTest.html'));

	assertFindAndFound(false, 'nihongo', '日本語');
	assertFindAndFound(false, 'nihongo', 'にほんご');
	assertFindAndFound(false, 'nihongo', 'ニホンゴ');
	assertFindAndFound(false, 'nihongo', 'nihongo');
	assertFindAndFound(false, 'nihongo', '日本語');

	assertFindAndFound(true, 'nihongo', 'nihongo');
	assertFindAndFound(true, 'nihongo', 'ニホンゴ');
	assertFindAndFound(true, 'nihongo', 'にほんご');

	findModule.findNext(false);
	assertFound('ニホンゴ');
	findModule.findNext(false);
	assertFound('nihongo');
	findModule.findNext(false);
	assertFound('日本語');

	findModule.findPrevious(false);
	assertFound('nihongo');
	findModule.findPrevious(false);
	assertFound('ニホンゴ');
	findModule.findPrevious(false);
	assertFound('にほんご');
}

testFind.setUp = function() {
	findModule.startFromViewport = false;
};
function testFind()
{
	yield Do(assertFindInSingleFrame());
}

testFindFromViewport.setUp = function() {
	findModule.startFromViewport = true;
};
function testFindFromViewport()
{
	yield Do(assertFindInSingleFrame());
}


function assertFindInMultipleFrames()
{
	yield Do(utils.loadURI(baseURL+'../fixtures/frameTest.html'));

	function assertFindAndFoundInDocument(aBackward, aFindTerm, aFoundTerm, aFoundDocument) {
		findModule.find(aBackward, aFindTerm, false);
		assertFoundInDocument(aFoundTerm, aFoundDocument);
	}

	function assertFoundInDocument(aFoundTerm, aFoundDocument) {
		assert.equals(aFoundTerm, findModule.foundRange);
		assert.equals(aFoundDocument, findModule.foundRange.startContainer.ownerDocument);
	}

	var firstDoc = $('frame1', content).contentDocument;
	var secondDoc = $('frame2', content).contentDocument;

	assertFindAndFoundInDocument(false, 'nihongo', '日本語', firstDoc);
	assertFindAndFoundInDocument(false, 'nihongo', 'にほんご', firstDoc);
	assertFindAndFoundInDocument(false, 'nihongo', 'ニホンゴ', firstDoc);
	assertFindAndFoundInDocument(false, 'nihongo', 'nihongo', firstDoc);
	assertFindAndFoundInDocument(false, 'nihongo', '日本語', secondDoc);
	assertFindAndFoundInDocument(false, 'nihongo', 'にほんご', secondDoc);
	assertFindAndFoundInDocument(false, 'nihongo', 'ニホンゴ', secondDoc);
	assertFindAndFoundInDocument(false, 'nihongo', 'nihongo', secondDoc);
	assertFindAndFoundInDocument(false, 'nihongo', '日本語', firstDoc);

	assertFindAndFoundInDocument(true, 'nihongo', 'nihongo', secondDoc);
	assertFindAndFoundInDocument(true, 'nihongo', 'ニホンゴ', secondDoc);
	assertFindAndFoundInDocument(true, 'nihongo', 'にほんご', secondDoc);
	assertFindAndFoundInDocument(true, 'nihongo', '日本語', secondDoc);
	assertFindAndFoundInDocument(true, 'nihongo', 'nihongo', firstDoc);
	assertFindAndFoundInDocument(true, 'nihongo', 'ニホンゴ', firstDoc);

	findModule.findNext(false);
	assertFoundInDocument('nihongo', firstDoc);
	findModule.findNext(false);
	assertFoundInDocument('日本語', secondDoc);
	findModule.findNext(false);
	assertFoundInDocument('にほんご', secondDoc);

	findModule.findPrevious(false);
	assertFoundInDocument('日本語', secondDoc);
	findModule.findPrevious(false);
	assertFoundInDocument('nihongo', firstDoc);
	findModule.findPrevious(false);
	assertFoundInDocument('ニホンゴ', firstDoc);
}

testFindInFrame.setUp = function() {
	findModule.startFromViewport = false;
};
function testFindInFrame()
{
	yield Do(assertFindInMultipleFrames());
}

testFindInFrameFromViewport.setUp = function() {
	findModule.startFromViewport = true;
};
function testFindInFrameFromViewport()
{
	yield Do(assertFindInMultipleFrames());
}


testFindFirstVisibleNode.setUp = function() {
	var win = utils.getTestWindow();
	win.resizeTo(500, 500);
	assert.compare(200, '<', utils.contentWindow.innerHeight);
};
function testFindFirstVisibleNode()
{
	function assertScrollAndFind(aIdOrNode, aFindFlag)
	{
		var frame = utils.contentWindow;
		var item = typeof aIdOrNode == 'string' ? frame.document.getElementById(aIdOrNode) : aIdOrNode ;
		frame.scrollTo(
			0,
			(aFindFlag & findModule.FIND_BACK ?
				item.offsetTop - frame.innerHeight + item.offsetHeight :
				item.offsetTop
			)
		);
		var node = findModule.findFirstVisibleNode(aFindFlag, frame);
		assert.equals(item, node);
	}

	yield utils.addTab(baseURL+'../fixtures/shortPage.html', { selected : true });
	assertScrollAndFind(utils.contentDocument.documentElement, findModule.FIND_DEFAULT);
	assertScrollAndFind('p3', findModule.FIND_BACK);

	yield utils.addTab(baseURL+'../fixtures/longPage.html', { selected : true });
	assertScrollAndFind(utils.contentDocument.documentElement, findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_BACK);
	assertScrollAndFind('p21', findModule.FIND_BACK);

	yield utils.addTab(baseURL+'../fixtures/tooLongPage.html', { selected : true });
	assertScrollAndFind(utils.contentDocument.documentElement, findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_BACK);
	assertScrollAndFind('p21', findModule.FIND_BACK);
}


testGetParentLinkFromRange.setUp = function() {
	yield Do(utils.loadURI(baseURL+'../fixtures/keyEventTest.html'));
};
function testGetParentLinkFromRange()
{
	var range = content.document.createRange();
	var textNode = $('first', content).getElementsByTagName('A')[0].firstChild;
	range.setStart(textNode, 1);
	range.setEnd(textNode, 3);
	assert.equals('am', range.toString());
	assert.equals(textNode.parentNode, findModule.getParentLinkFromRange(range));

	textNode = $('first', content).firstChild;
	range.setStart(textNode, 1);
	range.setEnd(textNode, 3);
	assert.equals('hi', range.toString());
	assert.isNull(findModule.getParentLinkFromRange(range));
}


testRegExpFind.setUp = function() {
	findModule.findMode = findModule.FIND_MODE_REGEXP;
	yield Do(utils.loadURI(baseURL+'../fixtures/caseSensitive.html'));
};
function testRegExpFind()
{
	findModule.caseSensitive = false;

	assertFindAndFound(false, 'firefox|addon', 'firefox');
	assertFindAndFound(false, 'firefox|addon', 'Firefox');
	assertFindAndFound(false, 'firefox|addon', 'FireFox');
	assertFindAndFound(false, 'firefox|addon', 'addon');
	assertFindAndFound(false, 'firefox|addon', 'AddOn');

	assertFindAndFound(true, 'firefox|addon', 'addon');
	assertFindAndFound(true, 'firefox|addon', 'FireFox');
	assertFindAndFound(true, 'firefox|addon', 'Firefox');

	findModule.findNext(false);
	assertFound('FireFox');
	findModule.findNext(false);
	assertFound('addon');
	findModule.findNext(false);
	assertFound('AddOn');

	findModule.findPrevious(false);
	assertFound('addon');
	findModule.findPrevious(false);
	assertFound('FireFox');
	findModule.findPrevious(false);
	assertFound('Firefox');

	findModule.caseSensitive = true;

	assertFindAndFound(false, 'firefox|addon', 'addon');
	assertFindAndFound(false, 'firefox|addon', 'firefox');
	assertFindAndFound(false, 'firefox|addon', 'addon');

	assertFindAndFound(true, 'firefox|addon', 'firefox');
	assertFindAndFound(true, 'firefox|addon', 'addon');
	assertFindAndFound(true, 'firefox|addon', 'firefox');

	findModule.findNext(false);
	assertFound('addon');
	findModule.findNext(false);
	assertFound('firefox');
	findModule.findNext(false);
	assertFound('addon');

	findModule.findPrevious(false);
	assertFound('firefox');
	findModule.findPrevious(false);
	assertFound('addon');
	findModule.findPrevious(false);
	assertFound('firefox');
}


testRegExpFindWithFlags.setUp = function() {
	findModule.findMode = findModule.FIND_MODE_REGEXP;
	findModule.caseSensitive = false;
	yield Do(utils.loadURI(baseURL+'../fixtures/caseSensitive.html'));
};
function testRegExpFindWithFlags()
{
	assertFindAndFound(false, '/firefox|addon/', 'firefox');
	assertFindAndFound(false, '/firefox|addon/', 'addon');
	assertFindAndFound(false, '/firefox|addon/i', 'firefox');
	assertFindAndFound(false, '/firefox|addon/i', 'Firefox');

	assertFindAndFound(true, '/firefox|addon/', 'addon');
	assertFindAndFound(true, '/firefox|addon/', 'firefox');
	assertFindAndFound(true, '/firefox|addon/i', 'Addon');
	assertFindAndFound(true, '/firefox|addon/i', 'AddOn');

	assertFindAndFound(false, '/firefox|addon/', 'firefox');
	findModule.findNext(false);
	assertFound('addon');
	findModule.findNext(false);
	assertFound('firefox');

	assertFindAndFound(false, '/firefox|addon/i', 'firefox');
	findModule.findNext(false);
	assertFound('Firefox');
	findModule.findNext(false);
	assertFound('FireFox');

	assertFindAndFound(false, '/firefox|addon/', 'firefox');
	findModule.findPrevious(false);
	assertFound('addon');
	findModule.findPrevious(false);
	assertFound('firefox');

	assertFindAndFound(false, '/firefox|addon/i', 'firefox');
	findModule.findPrevious(false);
	assertFound('Addon');
	findModule.findPrevious(false);
	assertFound('AddOn');
}
