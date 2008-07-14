// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('../../components/pXMigemoFind.js', null, 'Shift_JIS');

var win, browser, iterator;

function getDocShellFromFrame(aFrame) {
	return aFrame
		.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIWebNavigation)
		.QueryInterface(Ci.nsIDocShell);
}

assert.docShellEquals = function(aExpected, aActual) {
	assert.isTrue(aActual);
	assert.equals(
		aExpected
			.QueryInterface(Ci.nsIWebNavigation)
			.document.defaultView
			.location.href,
		aActual
			.QueryInterface(Ci.nsIWebNavigation)
			.document.defaultView
			.location.href
	);
}

assert.initialized = function(aIterator, aInitialFrame) {
	assert.equals(aInitialFrame.top,
		aIterator.root
			.QueryInterface(Ci.nsIWebNavigation)
			.document.defaultView);
	assert.focus(aIterator, aInitialFrame);
	assert.equals(aInitialFrame.document, aIterator.initialDocument);
	assert.isTrue(aIterator.isInitial);
}

assert.focus = function(aIterator, aFrame) {
	assert.equals(aFrame.location.href, aIterator.view.location.href);
	assert.equals(aFrame, aIterator.view);
	assert.equals(aFrame.document, aIterator.document);
	assert.equals(aFrame.document.body, aIterator.body);
	var docShell = getDocShellFromFrame(aFrame);
	assert.docShellEquals(docShell, aIterator.current);
	assert.isTrue(aIterator.isFindable);
}

var DocShellIteratorTest = new TestCase('DocShellIteratorのユニットテスト', {runStrategy: 'async'});

DocShellIteratorTest.tests = {
	setUp : function() {
		yield Do(utils.loadURI('../res/frameTest.html'));
	},

	tearDown : function() {
		iterator.destroy();
		yield Do(utils.loadURI());
	},

	'内部メソッド': function() {
		var contentDocShell = getDocShellFromFrame(content);
		var frame1DocShell = getDocShellFromFrame(content.frames[0]);
		var frame2DocShell = getDocShellFromFrame(content.frames[1]);

		iterator = new DocShellIterator(content, false);
		assert.equals(-1, iterator.getChildOffsetFromDocShellNode(contentDocShell));
		assert.docShellEquals(contentDocShell, iterator.getDocShellFromFrame(content));
		assert.docShellEquals(frame1DocShell, iterator.getNextDocShell(contentDocShell));
		assert.isNull(iterator.getPrevDocShell(contentDocShell));
		assert.docShellEquals(frame2DocShell, iterator.getLastChildDocShell(contentDocShell));
		assert.equals(content.frames[0].document.body, iterator.getDocumentBody(content.frames[0].document));
		iterator.destroy();

		iterator = new DocShellIterator(content.frames[0], false);
		assert.equals(0, iterator.getChildOffsetFromDocShellNode(frame1DocShell));
		assert.docShellEquals(frame2DocShell, iterator.getNextDocShell(frame1DocShell));
		assert.docShellEquals(contentDocShell, iterator.getPrevDocShell(frame1DocShell));
		assert.isNull(iterator.getLastChildDocShell(frame1DocShell));
		iterator.destroy();

		iterator = new DocShellIterator(content.frames[1], false);
		assert.equals(1, iterator.getChildOffsetFromDocShellNode(frame2DocShell));
		assert.isNull(iterator.getNextDocShell(frame2DocShell));
		assert.docShellEquals(frame1DocShell, iterator.getPrevDocShell(frame2DocShell));
		iterator.destroy();
	},

	'前方検索': function() {
		iterator = new DocShellIterator(content.frames[0], false);
		assert.initialized(iterator, content.frames[0]);

		assert.isTrue(iterator.iterateNext());
		assert.focus(iterator, content.frames[1]);
		assert.isFalse(iterator.isInitial);
		assert.isTrue(iterator.iterateNext());
		assert.focus(iterator, content);
		assert.isFalse(iterator.isInitial);
		assert.isTrue(iterator.iterateNext());
		assert.focus(iterator, content.frames[0]);
	},

	'後方検索': function() {
		iterator = new DocShellIterator(content.frames[0], true);
		assert.initialized(iterator, content.frames[0]);

		assert.isTrue(iterator.iterateNext());
		assert.focus(iterator, content);
		assert.isFalse(iterator.isInitial);
		assert.isTrue(iterator.iterateNext());
		assert.focus(iterator, content.frames[1]);
		assert.isFalse(iterator.isInitial);
		assert.isTrue(iterator.iterateNext());
		assert.focus(iterator, content.frames[0]);
	}
};
