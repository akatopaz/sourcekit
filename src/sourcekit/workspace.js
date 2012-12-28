define('sourcekit/workspace', [
    'sourcekit/data/dropbox_store',
    'sourcekit/data/localStorage_store',
    'sourcekit/data/extension_store',
    'sourcekit/editor',
    'sourcekit/filelist'], function (DropboxStore, LocalStorageStore, ExtensionStore, Editor, FileList) {

var Workspace = function() {
    this.stores = { };
    this.fileLists = { };
    this.editor = new Editor();
};

Workspace.prototype.registerStore = function(store) {
    var storeName = store.getName();
    if (!(storeName in this.stores)) {
        this.stores[storeName] = store;
        this.fileLists[storeName] = new FileList(store, this.editor);
    }
};

Workspace.prototype.setupEditor = function() {
    this.editor.setupStores(this.stores);
};

Workspace.prototype.destroy = function() {
    // TODO
};

Workspace.getDropboxWorkspace = function(ws, callback) {
    var apiKey = "BmCnFlJ0hjA=|f4pXqjr1JZp6ewS37m0n0ihlQk9CWCc3LaJXFNXhHA==";
    var dropbox = new Dropbox.Client({key:apiKey,sandbox:false});
    dropbox.authDriver(new Dropbox.Drivers.Redirect({ rememberUser: true }));
    dropbox.authenticate((function(apiError, dropbox) {
        var store = new DropboxStore(dropbox);
        ws.registerStore(store);

        if (callback) {
            callback.call(this, ws);
        }
    }).bind(this),
    /* error callback */
    function() {
        if (callback) {
            callback.call(this, ws);
        }
    });

    return true;
};

Workspace.getLocalStorageWorkspace = function(ws, callback) {
    var store = new LocalStorageStore();
    ws.registerStore(store);
    if (callback) {
        callback.call(this, ws);
    }
  return true;
};

Workspace.getExtensionWorkspaces = function(ws, callback) {
  var bgPage = chrome.extension.getBackgroundPage();
  for (var id in bgPage._registeredStorageExtensions) {
    var store = new ExtensionStore(
      id, bgPage._registeredStorageExtensions[id]);
    ws.registerStore(store);
  }
  if (callback) {
    callback.call(this, ws);
  }
  return true;
};

Workspace.getAllWorkspace = function(callback) {
  var methods = [
    Workspace.getDropboxWorkspace,
//    Workspace.getLocalStorageWorkspace,
//    Workspace.getExtensionWorkspaces
  ];
  var retval = true;
  var ws = new Workspace();
  var method_counter = 0;
  var method_callback = function(ws) {
    if (callback) {
      callback.call(this, ws);
    }
    method_counter++;
    if (method_counter == methods.length) {
      ws.setupEditor();
    }
  };
  for (var i = 0; i < methods.length; ++i) {
    methods[i](ws, method_callback);
  }
  return retval;
};

return Workspace;

});

