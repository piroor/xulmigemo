Components.utils.import('resource://xulmigemo-modules/lib/stringBundle.js');
var bundle = stringBundle.get('chrome://xulmigemo/locale/xulmigemo.properties');

XPCOMUtils.defineLazyModuleGetter(this, 'Downloads', 'resource://gre/modules/Downloads.jsm');

var XMigemoFileDownloader = {
	progressListener   : null,
	onCompleteListener : null,
	onErrorListener	: null,

	percent : -1,

	tempFile : null,
	dicDir   : null,

	PERMS_FILE	  : 0644,
	PERMS_DIRECTORY : 0755,

	nsIFile : Ci.nsIFile,


	downloadDictionary : function()
	{
		var lang = XMigemoService.getMyPref('lang');
		if (!lang) {
			this.onError(bundle.getString('initializer.download.error.invalidLanguage'));
			return;
		}

		var uri = XMigemoService.getMyPref('dictionary.download.uri.'+lang);
		if (!uri) {
			this.onError(bundle.getFormattedString('initializer.download.error.noDownloadURI', [lang]));
		}

		var tempFile = Services.dirsvc.get('TmpD', Ci.nsIFile);

		tempFile.append('xulmigemodic.zip');
		if (tempFile.exists()) {
			tempFile.remove(true);
		}

		this.tempFile = tempFile;

		this.downloadsList = null;
		this.download = null;
		Downloads.getList(Downloads.ALL)
			.then((function(aList) {
				this.downloadsList = aList;
				return aList.addView(this);
			}).bind(this))
			.then((function() {
				return Downloads.createDownload({
					source : Services.io.newURI(uri, null, null),
					target : tempFile
				});
			}).bind(this))
			.then((function(aDownload) {
				this.download = aDownload;
				return this.downloadsList.add(aDownload);
			}).bind(this))
			.then((function() {
				this.download.start();
			}).bind(this))
			.catch((function(aError) {
				Components.utils.reportError(aError);
				this.onError(aError);
				return this.finishDownload();
			}).bind(this));
	},

	finishDownload : function() {
		return this.downloadsList.remove(this.download)
			.then((function() {
				return this.download.finalize(true);
			}).bind(this))
			.then((function() {
				this.downloadsList.removeView(this);
				delete this.downloadsList;
				delete this.download;
			}).bind(this))
			.catch((function(aError) {
				Components.utils.reportError(aError);
				this.onError(aError);
			}).bind(this));
	},

	onDownloadAdded : function(aDownload)
	{
 		this.percent = aDownload.progress;
	},
	onDownloadChanged : function(aDownload)
	{
		this.percent = aDownload.progress;
		if (this.onProgressListener)
			this.onProgressListener(this.percent);
		if (aDownload.stopped)
			this.finishDownload();
	},
	onDownloadRemoved : function(aDownload)
	{
		if (aDownload.succeeded)
	 		this.onComplete();
		else
	 		this.onError();

	 	this.downloadsList.remove(aDownload);
	},

	onComplete : function()
	{
		try {
			var path = this.tempFile.path;

			var parentDir = Services.dirsvc.get('ProfD', Ci.nsIFile);
			parentDir.append('xulmigemodic');
			if (!parentDir.exists()) {
				try {
					parentDir.create(this.nsIFile.DIRECTORY_TYPE, this.PERMS_DIRECTORY);
				}
				catch (e) {
				}
			}

			this.unzipTo(this.tempFile, parentDir);
			this.tempFile.remove(true);

			this.tempFile = null;
		}
		catch(e) {
			this.onError(e);
			return;
		}
		finally {
		}

		this.dicDir = parentDir;

		let { MigemoFileAccess } = Components.utils.import('resource://xulmigemo-modules/core/fileAccess.js', {});
		XMigemoService.setMyPref('dicpath', '');
		XMigemoService.setMyPref('dicpath-relative', '');
		XMigemoService.setMyPref('dicpath', parentDir.path);
		XMigemoService.setMyPref('dicpath-relative', MigemoFileAccess.getRelativePath(parentDir.path));

		if (this.onCompleteListener && typeof this.onCompleteListener == 'function')
			this.onCompleteListener();
	},

	onError : function(aError)
	{
		if (this.onErrorListener && typeof this.onErrorListener == 'function')
			this.onErrorListener(aError);
	},

	unzipTo : function(aFile, aParent)
	{
		var zipReader = Cc['@mozilla.org/libjar/zip-reader;1'].createInstance(Ci.nsIZipReader);
		try {
			zipReader.open(aFile);
		}
		catch(e) {
			zipReader.close();
			throw e;
		}

		var entries = zipReader.findEntries('*/');
		var target;
		while (entries.hasMore())
		{
			var entry = entries.getNext();
			target = aParent.clone();
			target.append(entry);
			if (!target.exists()) {
				try {
					target.create(this.nsIFile.DIRECTORY_TYPE, this.PERMS_DIRECTORY);
				}
				catch (e) {
				}
			}
		}

		entries = zipReader.findEntries('*');
		while (entries.hasMore())
		{
			var entry = entries.getNext();
			target = aParent.clone();
			target.append(entry);
			if (target.exists()) {
//				continue;
				target.remove(true);
			}

			try {
				target.create(this.nsIFile.NORMAL_FILE_TYPE, this.PERMS_FILE);
			}
			catch (e) {
			}
			zipReader.extract(entry, target);
		}

		zipReader.close();
	}
};


//XMigemoFileDownloader.downloadDictionary();
