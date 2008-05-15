// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

var extract;
eval('extract = function() { '+
		utils.readFrom('../../components/pXMigemoFind.js') +
		'; return DocShellIterator }');
var DocShellIterator = extract();

var win, browser, content, iterator;

function getDocShellFromFrame(aFrame) {
	return aFrame
		.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		.getInterface(Components.interfaces.nsIWebNavigation)
		.QueryInterface(Components.interfaces.nsIDocShell);
}

function assert_docShellEquals(aExpected, aActual) {
	assert.isTrue(aActual);
	assert.equals(
		aExpected
			.QueryInterface(Components.interfaces.nsIWebNavigation)
			.document.defaultView
			.location.href,
		aActual
			.QueryInterface(Components.interfaces.nsIWebNavigation)
			.document.defaultView
			.location.href
	);
}

function assert_initialized(aIterator, aInitialFrame) {
	assert.equals(aInitialFrame.top,
		aIterator.root
			.QueryInterface(Components.interfaces.nsIWebNavigation)
			.document.defaultView);
	assert_focus(aIterator, aInitialFrame);
	assert.equals(aInitialFrame.document, aIterator.initialDocument);
	assert.isTrue(aIterator.isInitial);
}

function assert_focus(aIterator, aFrame) {
	assert.equals(aFrame.location.href, aIterator.view.location.href);
	assert.equals(aFrame, aIterator.view);
	assert.equals(aFrame.document, aIterator.document);
	assert.equals(aFrame.document.body, aIterator.body);
	var docShell = getDocShellFromFrame(aFrame);
	assert_docShellEquals(docShell, aIterator.current);
	assert.isTrue(aIterator.isFindable);
}

var DocShellIteratorTest = new TestCase('DocShellIteratorのユニットテスト', {runStrategy: 'async'});

DocShellIteratorTest.tests = {
	setUp : function() {
		yield utils.setUpTestWindow();
		var retVal = utils.addTab('../res/frameTest.html');
		yield retVal;
		browser = utils.getBrowser();
		browser.removeAllTabsBut(retVal.tab);
		win = utils.getTestWindow();
		content = win.content;
	},

	tearDown : function() {
		iterator.destroy();
		utils.tearDownTestWindow();
	},

	'内部メソッド': function() {
		var contentDocShell = getDocShellFromFrame(content);
		var frame1DocShell = getDocShellFromFrame(content.frames[0]);
		var frame2DocShell = getDocShellFromFrame(content.frames[1]);

		iterator = new DocShellIterator(content, false);
		assert_docShellEquals(contentDocShell, iterator.getDocShellFromFrame(content));
		assert_docShellEquals(frame1DocShell, iterator.getNextDocShell(contentDocShell));
		assert.isNull(iterator.getPrevDocShell(contentDocShell));
		iterator.destroy();

		iterator = new DocShellIterator(content.frames[0], false);
		assert_docShellEquals(frame1DocShell, iterator.getDocShellFromFrame(content.frames[0]));
		assert_docShellEquals(frame2DocShell, iterator.getNextDocShell(frame1DocShell));
		assert_docShellEquals(contentDocShell, iterator.getPrevDocShell(frame1DocShell));
		iterator.destroy();

		iterator = new DocShellIterator(content.frames[1], false);
		assert_docShellEquals(frame2DocShell, iterator.getDocShellFromFrame(content.frames[1]));
		assert.isNull(iterator.getNextDocShell(frame2DocShell));
		assert_docShellEquals(frame1DocShell, iterator.getPrevDocShell(frame2DocShell));
		iterator.destroy();
	},

	'前方検索': function() {
		iterator = new DocShellIterator(content.frames[0], false);
		assert_initialized(iterator, content.frames[0]);

		assert.isTrue(iterator.iterateNext());
		assert_focus(iterator, content.frames[1]);
		assert.isFalse(iterator.isInitial);
		assert.isTrue(iterator.iterateNext());
		assert_focus(iterator, content);
		assert.isFalse(iterator.isInitial);
		assert.isTrue(iterator.iterateNext());
		assert_focus(iterator, content.frames[0]);
	},

	'後方検索': function() {
		iterator = new DocShellIterator(content.frames[0], true);
		assert_initialized(iterator, content.frames[0]);

		assert.isTrue(iterator.iterateNext());
		assert_focus(iterator, content);
		assert.isFalse(iterator.isInitial);
		assert.isTrue(iterator.iterateNext());
		assert_focus(iterator, content.frames[1]);
		assert.isFalse(iterator.isInitial);
		assert.isTrue(iterator.iterateNext());
		assert_focus(iterator, content.frames[0]);
	}
};
