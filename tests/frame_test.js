// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc');

function assert_found(aTerm, aDocument) {
	var range = XMigemoUI.lastFoundRange;
	assert.isTrue(range);
	if (aTerm) assert.equals(aTerm, range.toString());
	assert.equals(aDocument, range.startContainer.ownerDocument);
}

function assert_find_again(aKey, aTimes, aTerm, aDocument) {
	yield utils.doIteration(fireKeyEvents(findField, aKey, aTimes));
	assert_found(aTerm, aDocument);
}

var frameTest = new TestCase('フレームを使用したページのテスト', {runStrategy: 'async'});

frameTest.tests = {
	setUp : function() {
		yield utils.doIteration(commonSetUp(baseURL+'res/frameTest.html'));
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

		action.inputTextToField(findField, 'nihongo');
		yield wait;
		assert_found('日本語', firstDoc);

		yield utils.doIteration(assert_find_again(key_RETURN, 1, 'にほんご', firstDoc));
		yield utils.doIteration(assert_find_again(key_RETURN, 1, 'ニホンゴ', firstDoc));
		yield utils.doIteration(assert_find_again(key_RETURN, 1, 'nihongo', firstDoc));
		yield utils.doIteration(assert_find_again(key_RETURN, 1, '日本語', secondDoc));
		yield utils.doIteration(assert_find_again(key_RETURN, 1, 'にほんご', secondDoc));
		yield utils.doIteration(assert_find_again(key_RETURN, 1, 'ニホンゴ', secondDoc));
		yield utils.doIteration(assert_find_again(key_RETURN, 1, 'nihongo', secondDoc));
		yield utils.doIteration(assert_find_again(key_RETURN, 1, '日本語', firstDoc));

		var key = {
			keyCode : key_RETURN.keyCode,
			shiftKey : true
		};
		yield utils.doIteration(assert_find_again(key, 1, 'nihongo', secondDoc));
		yield utils.doIteration(assert_find_again(key, 1, 'ニホンゴ', secondDoc));
		yield utils.doIteration(assert_find_again(key, 1, 'にほんご', secondDoc));
		yield utils.doIteration(assert_find_again(key, 1, '日本語', secondDoc));
		yield utils.doIteration(assert_find_again(key, 1, 'nihongo', firstDoc));
		yield utils.doIteration(assert_find_again(key, 1, 'ニホンゴ', firstDoc));
		yield utils.doIteration(assert_find_again(key, 1, 'にほんご', firstDoc));
		yield utils.doIteration(assert_find_again(key, 1, '日本語', firstDoc));
		yield utils.doIteration(assert_find_again(key, 1, 'nihongo', secondDoc));

	}
};
