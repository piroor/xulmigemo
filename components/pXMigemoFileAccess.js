var UConv = Components
		.classes['@mozilla.org/intl/scriptableunicodeconverter']
		.getService(Components.interfaces.nsIScriptableUnicodeConverter);

const DIR = Components
		.classes['@mozilla.org/file/directory_service;1']
		.getService(Components.interfaces.nsIProperties);

const nsIFile = Components.interfaces.nsIFile;

const PLATFORM = Components
		.classes['@mozilla.org/network/protocol;1?name=http']
		.getService(Components.interfaces.nsIHttpProtocolHandler)
		.oscpu;

function pXMigemoFileAccess() {}

pXMigemoFileAccess.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/file-access;1';
	},
	get classDescription() {
		return 'This is a utility service for XUL/Migemo.';
	},
	get classID() {
		return Components.ID('{19c2aa1c-cef4-11db-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},

	readFrom : function(aFile, aEncoding)
	{
		var fileContents;

		var stream = Components
						.classes['@mozilla.org/network/file-input-stream;1']
						.createInstance(Components.interfaces.nsIFileInputStream);
		try {
			stream.init(aFile, 1, 0, false); // open as "read only"

			var scriptableStream = Components
									.classes['@mozilla.org/scriptableinputstream;1']
									.createInstance(Components.interfaces.nsIScriptableInputStream);
			scriptableStream.init(stream);

			var fileSize = scriptableStream.available();
			fileContents = scriptableStream.read(fileSize);

			scriptableStream.close();
			stream.close();
		}
		catch(e) {
			dump(e+'\n');
			return null;
		}

		try {
			UConv.charset = aEncoding || 'UTF-8';
			fileContents = UConv.ConvertToUnicode(fileContents);
		}
		catch(e) {
			try {
				UConv.charset = 'Shift_JIS';
				fileContents = UConv.ConvertToUnicode(fileContents);
			}
			catch(e){
			}
		}

		return fileContents;
	},

	writeTo : function(aFile, aContent, aEncoding)
	{
		try {
			UConv.charset = aEncoding || 'UTF-8';
			aContent = UConv.ConvertFromUnicode(aContent);
		}
		catch(e) {
			dump(e+'\n');
		}
		if (!aFile)
			throw 'writeTo: output file is not specified!';

		if (aFile.exists()) aFile.remove(true); // 上書き確認は無し。必要があれば処理を追加。
		aFile.create(aFile.NORMAL_FILE_TYPE, 0666); // アクセス権を8進数で指定。 Win9x などでは無視される。

		var stream = Components
						.classes['@mozilla.org/network/file-output-stream;1']
						.createInstance(Components.interfaces.nsIFileOutputStream);
		stream.init(aFile, 2, 0x200, false); // open as "write only"
		stream.write(aContent, aContent.length);
		stream.close();

		return aFile;
	},

	getAbsolutePath : function(aPath)
	{
		var file = Components
				.classes['@mozilla.org/file/local;1']
				.createInstance(Components.interfaces.nsILocalFile);
		try {
			file.initWithPath(aPath);
			return aPath;
		}
		catch(e) {
		}

		var path;
		if (this.relativePathKeywords.some(function(aKeyword) {
				try {
					if (aPath.indexOf('['+aKeyword+']') == 0) {
						path = aPath.replace('['+aKeyword+']', DIR.get(aKeyword, nsIFile).path);
						return true;
					}
				}
				catch(e) {
				}
				return false;
			}))
			return path;

		if (aPath.indexOf('.') == 0) {
			// relative path
			if (PLATFORM.indexOf('Win') > -1) {
				aPath = aPath.replace(/^\.\.\./g, '\.\.\\\.\.')
							.replace(/\\\.\.\./g, '\\\.\.\\\.\.')
							.replace(/\\/g, '/');
			}
			var binDir = DIR.get('CurProcD', nsIFile);
			file.setRelativeDescriptor(binDir, aPath);
			return file.path;
		}

		return '';
	},

	getRelativePath : function(aPath)
	{
		var path;
		if (this.relativePathKeywords.some(function(aKeyword) {
				try {
					var dir = DIR.get(aKeyword, nsIFile);
					if (aPath.indexOf(dir.path) == 0) {
						path = aPath.replace(dir.path, '['+aKeyword+']');
						return true;
					}
				}
				catch(e) {
				}
				return false;
			}))
			return path;

		var file = Components
				.classes['@mozilla.org/file/local;1']
				.createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(aPath);

		var binDir = DIR.get('CurProcD', Components.interfaces.nsIFile);
		try {
			aPath = file.getRelativeDescriptor(binDir);
		}
		catch(e) {
			return '';
		}

		if (PLATFORM.indexOf('Win') > -1) {
			aPath = aPath.replace(/\//g, '\\');
		}

		return aPath;
	},

	relativePathKeywords : [
		'ProfD',
		'AppData',
		'LocalAppData',
		'Home',
		'Desk',
		'Docs', // OS X
		'CurProcD',
		'CurWorkD',
		'GreD'
	],


	getExistingPath : function(aPath)
	{
		var file = Components
				.classes['@mozilla.org/file/local;1']
				.createInstance(Components.interfaces.nsILocalFile);
		try {
			file.initWithPath(this.getAbsolutePath(aPath));
			if (file.exists()) return aPath;
		}
		catch(e) {
		}
		return '';
	},

	QueryInterface : function(aIID)
	{
		if(!aIID.equals(Components.interfaces.pIXMigemoFileAccess) &&
			!aIID.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};




var gModule = {
	_firstTime: true,

	registerSelf : function (aComponentManager, aFileSpec, aLocation, aType)
	{
		if (this._firstTime) {
			this._firstTime = false;
			throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
		}
		aComponentManager = aComponentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		for (var key in this._objects) {
			var obj = this._objects[key];
			aComponentManager.registerFactoryLocation(obj.CID, obj.className, obj.contractID, aFileSpec, aLocation, aType);
		}
	},

	getClassObject : function (aComponentManager, aCID, aIID)
	{
		if (!aIID.equals(Components.interfaces.nsIFactory))
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

		for (var key in this._objects) {
			if (aCID.equals(this._objects[key].CID))
				return this._objects[key].factory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	_objects : {
		manager : {
			CID        : pXMigemoFileAccess.prototype.classID,
			contractID : pXMigemoFileAccess.prototype.contractID,
			className  : pXMigemoFileAccess.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoFileAccess()).QueryInterface(aIID);
				}
			}
		}
	},

	canUnload : function (aComponentManager)
	{
		return true;
	}
};

function NSGetModule(compMgr, fileSpec)
{
	return gModule;
}
