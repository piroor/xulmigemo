// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc.js');

assert.found = function(aTerm, aDocument) {
	var range = XMigemoUI.lastFoundRange;
	assert.isTrue(range);
	if (aTerm) assert.equals(aTerm, range.toString());
	assert.equals(aDocument, range.startContainer.ownerDocument);
}

assert.find_again = function(aKey, aTimes, aTerm, aDocument) {
	yield Do(fireKeyEvents(field, aKey, aTimes));
	assert.found(aTerm, aDocument);
}

var frameTest = new TestCase('フレームを使用したページのテスト', {runStrategy: 'async'});

frameTest.tests = {
	setUp : function() {
		yield Do(commonSetUp(baseURL+'res/frameTest.html'));
	},

	tearDown : function() {
		commonTearDown();
	},

	'検索': function() {
		gFindBar.openFindBar();
		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		yield wait;

		var firstDoc = content.frames[0].document;
		var secondDoc = content.frames[1].document;

		action.inputTextToField(field, 'nihongo');
		yield wait;
		assert.found('日本語', firstDoc);

		yield Do(assert.find_again(key_RETURN, 1, 'にほんご', firstDoc));
		yield Do(assert.find_again(key_RETURN, 1, 'ニホンゴ', firstDoc));
		yield Do(assert.find_again(key_RETURN, 1, 'nihongo', firstDoc));
		yield Do(assert.find_again(key_RETURN, 1, '日本語', secondDoc));
		yield Do(assert.find_again(key_RETURN, 1, 'にほんご', secondDoc));
		yield Do(assert.find_again(key_RETURN, 1, 'ニホンゴ', secondDoc));
		yield Do(assert.find_again(key_RETURN, 1, 'nihongo', secondDoc));
		yield Do(assert.find_again(key_RETURN, 1, '日本語', firstDoc));

		var key = {
			keyCode : key_RETURN.keyCode,
			shiftKey : true
		};
		yield Do(assert.find_again(key, 1, 'nihongo', secondDoc));
		yield Do(assert.find_again(key, 1, 'ニホンゴ', secondDoc));
		yield Do(assert.find_again(key, 1, 'にほんご', secondDoc));
		yield Do(assert.find_again(key, 1, '日本語', secondDoc));
		yield Do(assert.find_again(key, 1, 'nihongo', firstDoc));
		yield Do(assert.find_again(key, 1, 'ニホンゴ', firstDoc));
		yield Do(assert.find_again(key, 1, 'にほんご', firstDoc));
		yield Do(assert.find_again(key, 1, '日本語', firstDoc));
		yield Do(assert.find_again(key, 1, 'nihongo', secondDoc));

	}
};


var frameTestNotFound = new TestCase('検索語句を含まないフレームがあるページのテスト', {runStrategy: 'async'});

frameTestNotFound.tests = {
	setUp : function() {
		yield Do(commonSetUp(baseURL+'res/frameTest2.html'));
	},

	tearDown : function() {
		commonTearDown();
	},

	'検索': function() {
		gFindBar.openFindBar();
		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		yield wait;

		var rootDoc = content.document;
		var frameDoc = content.frames[0].document;

		action.inputTextToField(field, 'nihongo');
		yield wait;
		assert.found('日本語', rootDoc);

		yield Do(assert.find_again(key_RETURN, 1, 'にほんご', rootDoc));
		yield Do(assert.find_again(key_RETURN, 1, 'ニホンゴ', rootDoc));
		yield Do(assert.find_again(key_RETURN, 1, 'nihongo', rootDoc));

		var key = {
			keyCode : key_RETURN.keyCode,
			shiftKey : true
		};
		yield Do(assert.find_again(key, 1, 'ニホンゴ', rootDoc));
		yield Do(assert.find_again(key, 1, 'にほんご', rootDoc));

	}
};
