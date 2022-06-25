/**
 * Gestione della persistenza legacy. 
 * Ora è tutto su PouchDB / CouchDB
 * 
 */

import PouchDB from 'pouchdb'
import PouchdbFind from 'pouchdb-find'
PouchDB.plugin(PouchdbFind)

import axios from 'axios'


var Album;
var AlbumCoin;
var Coin;
var LocalSetting;
var ChatMessage;
var RosterContact;
var rosterInstance;
let globalDB = null;

let DBNAME = 'sylloge_db-225632'; // async_list(Coin)

function async_list(entity) {
  return new Promise(function (resolve, reject) {
    entity.all().list(null, function (results) {
      resolve(results);
    });
  });
}

function createUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

let hexEncode = function (str) {
  var hex, i;
  var result = '';

  for (i = 0; i < str.length; i++) {
    hex = str.charCodeAt(i).toString(16); // result += ("000"+hex).slice(-4);

    result += hex;
  }

  return result;
}; // Spostare in un componente

function __is_def(f) {
  return (f != '' && typeof f !== 'undefined')
}

function coinToString(coin) {
  var d = '';
  if (__is_def(coin.code)) d += '#' + coin.code + '.';
  if (coin.ruler != '' && coin.ruler != null) d += ' ' + coin.ruler + '.';
  d += coin.coinType + '.';
  if (__is_def(coin.mint)) d += ' ' + coin.mint + '.';
  if (__is_def(coin.obverse)) d += ' Obv: ' + coin.obverse + '.';
  if (__is_def(coin.reverse)) d += ' Rev: ' + coin.reverse + '.';
  if (__is_def(coin.opus)) d += ' Opus: ' + coin.opus + '.';
  if (__is_def(coin.biblio)) d += ' ' + coin.biblio + '.';
  if (__is_def(coin.metal)) d += ' ' + coin.metal + '.';
  if (__is_def(coin.weight)) d += ' ' + coin.weight + '.';
  if (__is_def(coin.diameter)) d += ' ' + coin.diameter + '.';
  if (__is_def(coin.notes)) d += ' ' + coin.notes + '.';
  if (__is_def(coin.price)) d += ' ' + coin.price + '.';
  return d.trim();
}

let syncHandler = null;

function connectionURL(username, password) {
  const remoteURL = 'https://' + encodeURIComponent(username.toLowerCase()) + ':' + encodeURIComponent(password) + '@sylloge-app.com/db/userdb-' + hexEncode(username.toLowerCase())
  return remoteURL
}

function disableSync() {
  if (syncHandler != null) {
    syncHandler.cancel()
  }
}

function enableSync(server, username, password, db, handlers = {}) {
  const components = server.split('://')
  if (components.length != 2) {
    console.error('wrong server format')
    return
  }
  const remoteURL = components[0] + '://' + encodeURIComponent(username.toLowerCase()) + ':' + encodeURIComponent(password) + '@' + components[1] + db
  syncHandler = PouchDB.sync(DBNAME, remoteURL, {
    live: true,
    retry: true,
    batch_size: 2,
    batches_limit: 2
  }).on('change', function (info) {
    // handle change
    console.log({
      'change:': info
    });

    if (typeof handlers.change !== 'undefined') {
      handlers.change(info);
    }
  }).on('paused', function (err) {
    // replication paused (e.g. replication up to date, user went offline)
    console.log({
      'paused:': err
    });

    if (typeof handlers.paused !== 'undefined') {
      handlers.paused(err);
    }
  }).on('active', function () {
    // replicate resumed (e.g. new changes replicating, user went back online)
    console.log('active');

    if (typeof handlers.active !== 'undefined') {
      handlers.active();
    }
  }).on('denied', function (err) {
    // a document failed to replicate (e.g. due to permissions)
    console.log({
      'denied:': err
    });

    if (typeof handlers.denied !== 'undefined') {
      handlers.denied(err);
    }
  }).on('complete', function (info) {
    // handle complete
    console.log({
      'complete:': info
    });

    if (typeof handlers.complete !== 'undefined') {
      handlers.complete(info);
    }
  }).on('error', function (err) {
    // handle error
    console.log({
      'error:': err
    });

    if (typeof handlers.error !== 'undefined') {
      handlers.error(err);
    }
  });
}

async function destroyDB () {
  await globalDB.destroy()
  globalDB = null
}

async function initDB(dbname = DBNAME) {
  if (globalDB != null) {
      return globalDB;
  }
  if (dbname == null) {
    throw 'dbname can not be null'
  }
  let db = null;
  DBNAME = dbname
  db = new PouchDB(DBNAME);
  globalDB = db

  try {
    await db.info();
  } catch (error) {
    console.error(error);
  }

  db.createIndex({
    index: {
      fields: ['type']
    }
  });
  return db;
}

const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {
    type: contentType
  });
  return blob;
};

async function importCoin(db, c) {
  console.log(c);
  let doc = await db.put({
    _id: c.id,
    type: 'Coin',
    code: c.code,
    ruler: c.ruler,
    mint: c.mint,
    coinType: c.type,
    obverse: c.obverse,
    reverse: c.reverse,
    biblio: c.biblio,
    diameter: c.diameter,
    weight: c.weight,
    metal: c.metal,
    // imgObv: "TEXT", /* data:image/jpeg;base64, */
    // imgRev: "TEXT", /* data:image/jpeg;base64, */
    notes: c.notes,
    price: c.price,
    creationDate: c.creationDate != null ? c.creationDate : new Date(),
    remoteID: c.remoteID
  });
  console.log(doc);
  if (c.imgObv !== '') doc = await db.putAttachment(doc.id, 'imgObv', doc.rev, b64toBlob(c.imgObv), 'image/jpeg');
  if (c.imgRev !== '') doc = await db.putAttachment(doc.id, 'imgRev', doc.rev, b64toBlob(c.imgRev), 'image/jpeg');
}

async function importAlbum(db, a) {
  AlbumCoin.all().prefetch('coin').filter('album', '=', a.id).order('order').list(async function (albumCoins) {
    let coins = [];
    let attachments = {};

    for (let i = 0; i < albumCoins.length; i++) {
      if (albumCoins[i].coin != null) {
        coins.push(albumCoins[i].coin.id);
      } else {
        let meta = {
          type: 'meta',
          text: albumCoins[i].notes
        };

        if (albumCoins[i].image !== '') {
          let uid = 'META-IMG-' + createUUID();
          attachments[uid] = {
            'content/type': 'image/jpeg',
            data: b64toBlob(albumCoins[i].image)
          };
          meta.imageID = uid;
        }

        coins.push(meta);
      }
    } // Risalvalo con tutte le info


    let doc = await db.put({
      _id: a.id,
      _attachments: attachments,
      type: 'Album',
      name: a.name,
      order: a.order,
      coins: coins,
      internalOrder: JSON.parse(a.internalOrder) // Array

    });
    console.log(doc);
  });
}

async function importAlbumCoin(db, a) {
  console.log(a)
  if (a.coin != null) {
    // Trova la moneta con questo id
    const coin = await db.get(a.coin.id)
    const album = await db.get(a.album.id)

    // Se non è associato all'album, aggiungilo e salva
    if (album.coins.indexOf(coin._id) < 0) {
      console.log(album.name + ' > ' + coin._id)
      album.coins.push([a.order, coin._id])
      let res = await db.put(album)
      album._rev = res.rev
    }

  }

  /*
  let doc = await db.put({
    _id: a.id,
    type: 'AlbumCoin',
    notes: a.notes,
    order: a.order
  });

  if (a.image !== '') {
    doc = await db.putAttachment(doc.id, 'image', doc.rev, b64toBlob(a.image), 'image/jpeg');
  }
  */
}

async function importChatMessage(db, a) {
  let doc = await db.put({
    _id: a.id,
    type: 'ChatMessage',
    xmppID: a.xmppID,
    chat: a.chat,
    from: a.from,
    read: a.read === 1,
    to: a.to,
    body: a.body,
    ts: a.ts,
    sent: a.sent === 1,
    error: a.error === 1
  });
}

async function migrate2Pouch(bucketID, skipCheckOldDataPresence = false) {
  if (typeof persistence === 'undefined') {
    throw new Error('Undefined persistence.js')
  }

  await setupModels()
  try {
    await syncNowLegacy(bucketID)
  } catch (error) {
    throw error
  }
  
  if (true) {
  //if (typeof persistence.generatedTables.Coin !== 'undefined') {
    let coins = await async_list(Coin);

    if (coins.length == 0) {
      // Abbiamo vecchi dati da migrare
      alert('No old data to migrate.');
      return;
    }

    let doMig = skipCheckOldDataPresence || confirm('Old data detected. Do you want to migrate it?');

    if (!doMig) {
      return;
    }
  } else {
    alert('No previous data to be migrated.');
    return;
  } // Aprilo e distruggilo


  let dbName = DBNAME
  await destroyDB(); // Ricrealo

  globalDB = await initDB(dbName);
  globalDB.info().then(async () => {
    // The database exists.
    // Do something...
    let coins = await async_list(Coin);

    for (let i = 0; i < coins.length; i++) {
      let c = coins[i];
      await importCoin(globalDB, c);
    } // Importa Album


    let albums = await async_list(Album);

    for (let i = 0; i < albums.length; i++) {
      let a = albums[i];
      await importAlbum(globalDB, a);
    } // Importa AlbumCoin
    

    // Save album-coins associations in the format (order, coin_id)
    let albumcoins = await async_list(AlbumCoin)
    for (let i = 0; i < albumcoins.length; i++) {
      let a = albumcoins[i]
      await importAlbumCoin(globalDB, a)
    }
    // Restore for each album the list of coins as [coin_id]
    let allAlbums = await globalDB.find({
      selector: {
        type: 'Album'
      }
    })
    
    for (let i = 0; i < allAlbums.docs.length; i++) {
      let a = allAlbums.docs[i]
      let coins_list = a.coins
      coins_list = coins_list.sort()
      a.coins = []
      for (let j = 0; j < coins_list.length; j++) {
        a.coins.push(coins_list[j][1])
      }
      await globalDB.put(a)
    }

    let messages = await async_list(ChatMessage);

    for (let i = 0; i < messages.length; i++) {
      let m = messages[i];
      importChatMessage(globalDB, m);
    } 
    
    // Alla fine chiede se eliminare i dati vecchi persistencejs


    if (confirm('Do you want to delete the old data?')) {
      _modelsRemoveLocalData(); // Anche asincrono

    }
  }).catch(e => {
    // No database found and it was not created.
    // Do something else...
    console.error(e);
    alert('Error in newly created DB');
  });
} // ######### Gestione messaggi


let ChatMessageFromJSON = function (jsonString) {
  var obj = JSON.parse(jsonString);

  if (obj != null) {
    this.from = obj.from.split('@')[0];
    this.to = obj.to;
    this.body = obj.body;
    this.ts = obj.ts;
    this.sent = obj.sent;
    this.error = obj.error;
  }
};

let ChatMessageToJSON = function () {
  return JSON.stringify({
    from: this.from,
    to: this.to,
    body: this.body,
    ts: this.ts,
    sent: this.sent,
    error: this.error
  });
};

let RosterContactAddOfflineMessage = function (msg) {
  this.addUnreadMessage.add(msg);
};

let RosterContactMarkUnreadMessagesAsRead = function () {
  var self = this;
  return new Promise((resolve, reject) => {
    ChatMessage.all().filter('chat', '=', self.jid).list(results => {
      self._messages = [];

      for (var i = 0; i < results.length; i++) {
        results[i].read = 1;

        self._messages.push(results[i]);
      }

      self._unreadMessages = [];
      persistence.flush();
    });
  });
};

let RosterContactAddUnreadMessage = function (msg) {
  msg.read = 1;
  msg.chat = this.name;

  this._messages.push(msg);

  persistence.flush();
};
/**
* Carica tutte le associazioni
*/


let RosterContactLoad = function () {
  var self = this;
  return new Promise((resolve, reject) => {
    ChatMessage.all().filter('chat', '=', self.jid).list(results => {
      self._messages = [];
      self._unreadMessages = [];

      for (var i = 0; i < results.length; i++) {
        if (results[i].read == 1) {
          self._messages.push(results[i]);
        } else {
          self._unreadMessages.push(results[i]);
        }
      }

      resolve();
    });
  });
};

class Roster {
  constructor() {
    // Array di contatti, letto da persistence.js
    this.contacts = [];
  }
  /**
   * Crea o aggiungi un contatto
   * 
   * @param {string} jid il contatto da aggiungere
   * @returns {RosterContact} il contatto aggiunto oppure quello esistente
   */


  findOrAddContact(jid) {
    jid = jid.split('@')[0];

    for (var i = 0; i < this.contacts.length; i++) {
      var c = this.contacts[i];
      if (c.jid == jid) return c;
    }

    var c = new RosterContact();
    c.jid = jid;
    this.contacts.push(c);
    persistence.add(c);
    this.orderContacts();
    return c;
  }
  /*
  addMessageForJID(jid) {
    contact = this.findOrAddContact(jid);
    contact.addMessage();
  }
  */


  loadContacts() {
    var self = this;
    return new Promise((resolve, reject) => {
      RosterContact.all().list(results => {
        var allContactsLoadedPromise = [];

        for (var i = 0; i < results.length; i++) {
          allContactsLoadedPromise.push(results[i].load());
        }

        rosterInstance.contacts = results; // Dovrebbe essere inutile!

        this.contacts = results;
        Promise.all(allContactsLoadedPromise).then(function () {
          self.orderContacts();
          resolve();
        });
      }, error => {
        console.error("List error: " + e);
      });
    });
  }

  orderContacts() {
    if (this.contacts != null) {
      this.contacts = this.contacts.sort(function (a, b) {
        if (a._unreadMessages == undefined || b._unreadMessages == undefined) return 0;
        if (a._unreadMessages.length < b._unreadMessages.length) return 1;

        if (a._unreadMessages.length > b._unreadMessages.length) {
          return -1;
        }

        if (a.jid < b.jid) {
          return -1;
        } else {
          return 1;
        }
      });
    }
  }

}

rosterInstance = new Roster(); // ################### da qui, mi pare vecchia roba

function _setupORMData() {
  return new Promise(async (resolve, reject) => {
    console.log('initDB');
    globalDB = await initDB();
    persistence.schemaSync(null, function () {
      persistence.flush(function () {
        resolve();
      });
    });
  });
}

function _modelsRemoveLocalData() {
  return new Promise((resolve, reject) => {
    persistence.transaction(function (tx) {
      var tableArray = [];

      for (var p in persistence.generatedTables) {
        if (persistence.generatedTables.hasOwnProperty(p)) {
          tableArray.push(p);
        }
      }

      function dropOneTable() {
        var tableName = tableArray.pop();
        tx.executeSql("DROP TABLE IF EXISTS `" + tableName + "`", null, function () {
          if (tableArray.length > 0) {
            dropOneTable();
          } else {
            completed();
          }
        }, function (err) {
          reject(err);
        });
      }

      if (tableArray.length > 0) {
        dropOneTable();
      } else {
        completed();
      }

      function completed() {
        persistence.clean();
        persistence.generatedTables = {};
        resolve();
      }
    });
  });
}

function _modelsMarkAllDirty(callbackOK) {
  var completed = 0;

  function allOrNothing() {
    completed++;

    if (completed == 3) {
      callbackOK();
    }
  }

  Coin.all().list(null, function (results) {
    for (var i = 0; i < results.length; i++) {
      var r = results[i];

      for (var k in r._data) {
        if (k[0] != '_') {
          console.log(k);
          r.markDirty(k);
        }
      }
    }

    allOrNothing();
  });
  AlbumCoin.all().list(null, function (results) {
    for (var i = 0; i < results.length; i++) {
      var r = results[i];

      for (var k in r._data) {
        if (k[0] != '_') {
          console.log(k);
          r.markDirty(k);
        }
      }
    }

    allOrNothing();
  });
  Album.all().list(null, function (results) {
    for (var i = 0; i < results.length; i++) {
      var r = results[i];

      for (var k in r._data) {
        if (k[0] != '_') {
          console.log(k);
          r.markDirty(k);
        }
      }
    }

    allOrNothing();
  });
}

function setupModels() {
  return new Promise((resolve, reject) => {
    //persistence.store.websql.config(persistence, 'sylloge3', 'Sylloge data', 5 * 1024 * 1024);
    let oldInit = true;

    if (oldInit) {
        // Giusto per la migrazione, creiamo una database vecchio stile in memoria
        persistence.store.memory.config(persistence, 'sylloge_116_mig')
      /*
      persistence.store.cordovasql.config(persistence, 'sylloge_116', '1.0', // DB version
      'Sylloge data', // DB display name
      25 * 1024 * 1024, // DB size (WebSQL fallback only)
      0, // SQLitePlugin Background processing disabled
      0 // DB location (iOS only), 0 (default): Documents, 1: Library, 2: Library/LocalDatabase
      //   0: iTunes + iCloud, 1: NO iTunes + iCloud, 2: NO iTunes + NO iCloud
      //   More information at https://github.com/litehelpers/Cordova-sqlite-storage#opening-a-database
      );
      persistence.search.config(persistence, persistence.store.cordovasql.sqliteDialect);
      
      */
      Coin = persistence.define('Coin', {
        code: "TEXT",
        ruler: "TEXT",
        mint: "TEXT",
        type: "TEXT",
        obverse: "TEXT",
        reverse: "TEXT",
        biblio: "TEXT",
        diameter: "TEXT",
        weight: "TEXT",
        metal: "TEXT",
        imgObv: "TEXT",

        /* data:image/jpeg;base64, */
        imgRev: "TEXT",

        /* data:image/jpeg;base64, */
        notes: "TEXT",
        price: "TEXT",
        creationDate: "DATE",
        remoteID: "INT"
      });
      Coin.index('creationDate');
      /*
      Coin.textIndex('code');
      Coin.textIndex('type');
      Coin.textIndex('ruler');
      Coin.textIndex('mint');
      Coin.textIndex('obverse');
      Coin.textIndex('reverse');
      Coin.textIndex('biblio');
      Coin.textIndex('notes');
      */

      Coin.prototype.textDescription = function () {
        var d = '';
        if (this.ruler != '' && this.ruler != null) d += ' ' + this.ruler + '.';
        d += this.type + '.';
        if (this.mint != '') d += ' ' + this.mint + '.';
        if (this.obverse != '') d += ' Obv: ' + this.obverse + '.';
        if (this.reverse != '') d += ' Rev: ' + this.reverse + '.';
        if (this.biblio != '') d += ' ' + this.biblio + '.';
        if (this.metal != '') d += ' ' + this.metal + '.';
        if (this.weight != '') d += ' ' + this.weight + '.';
        if (this.diameter != '') d += ' ' + this.diameter + '.';
        if (this.notes != '') d += ' ' + this.notes + '.';
        if (this.price != '') d += ' ' + this.price + '.';
        return d.trim();
      };

      LocalSetting = persistence.define('LocalSetting', {
        key: 'TEXT',
        value: 'TEXT'
      });
      Album = persistence.define('Album', {
        name: "TEXT",
        order: "INT",
        internalOrder: "JSON"
      });
      AlbumCoin = persistence.define('AlbumCoin', {
        order: "INT",
        notes: "TEXT",
        image: "TEXT"
      });
      AlbumCoin.hasOne('coin', Coin);
      AlbumCoin.hasOne('album', Album);
      ChatMessage = persistence.define('ChatMessage', {
        xmppID: "TEXT",
        chat: "TEXT",
        // ID della chat (jid del conversante)
        from: "TEXT",
        read: "INT",
        to: "TEXT",
        body: "TEXT",
        ts: "DATETIME",
        sent: "INT",
        error: "INT"
      });
      ChatMessage.index('chat');
      ChatMessage.index('xmppID');

      ChatMessage.prototype.fromJSON = function (jsonString) {
        var obj = JSON.parse(jsonString);

        if (obj != null) {
          this.from = obj.from.split('@')[0];
          this.to = obj.to;
          this.body = obj.body;
          this.ts = obj.ts;
          this.sent = obj.sent;
          this.error = obj.error;
        }
      };

      ChatMessage.prototype.toJSON = function () {
        return JSON.stringify({
          from: this.from,
          to: this.to,
          body: this.body,
          ts: this.ts,
          sent: this.sent,
          error: this.error
        });
      };

      RosterContact = persistence.define('RosterContact', {
        jid: "TEXT",
        status: "TEXT",
        lastText: "TEXT",
        available: "INT"
      });
      /*
      ChatMessage.hasOne('rosterContact', RosterContact);
      RosterContact.hasMany('messages', ChatMessage);
      RosterContact.hasMany('unreadMessages', ChatMessage);
      */
    }
    /**
    * Aggiunge un messaggio (offline) all'elenco dei messaggi
    * @param {ChatMessage} msg message to add
    */


    RosterContact.prototype.addOfflineMessage = function (msg) {
      this.addUnreadMessage.add(msg);
    };

    RosterContact.prototype.markUnreadMessagesAsRead = function () {
      var self = this;
      return new Promise((resolve, reject) => {
        ChatMessage.all().filter('chat', '=', self.jid).list(results => {
          self._messages = [];

          for (var i = 0; i < results.length; i++) {
            results[i].read = 1;

            self._messages.push(results[i]);
          }

          self._unreadMessages = [];
          persistence.flush();
        });
      });
    };

    RosterContact.prototype.addUnreadMessage = function (msg) {
      msg.read = 1;
      msg.chat = this.name;

      this._messages.push(msg);

      persistence.flush();
    };
    /**
     * Carica tutte le associazioni
     */


    RosterContact.prototype.load = function () {
      var self = this;
      return new Promise((resolve, reject) => {
        ChatMessage.all().filter('chat', '=', self.jid).list(results => {
          self._messages = [];
          self._unreadMessages = [];

          for (var i = 0; i < results.length; i++) {
            if (results[i].read == 1) {
              self._messages.push(results[i]);
            } else {
              self._unreadMessages.push(results[i]);
            }
          }

          resolve();
        });
      });
    };

    class Roster {
      constructor() {
        // Array di contatti, letto da persistence.js
        this.contacts = [];
      }
      /**
       * Crea o aggiungi un contatto
       * 
       * @param {string} jid il contatto da aggiungere
       * @returns {RosterContact} il contatto aggiunto oppure quello esistente
       */


      findOrAddContact(jid) {
        jid = jid.split('@')[0];

        for (var i = 0; i < this.contacts.length; i++) {
          var c = this.contacts[i];
          if (c.jid == jid) return c;
        }

        var c = new RosterContact();
        c.jid = jid;
        this.contacts.push(c);
        persistence.add(c);
        this.orderContacts();
        return c;
      }
      /*
      addMessageForJID(jid) {
      	contact = this.findOrAddContact(jid);
      	contact.addMessage();
      }
      */


      loadContacts() {
        var self = this;
        return new Promise((resolve, reject) => {
          RosterContact.all().list(results => {
            var allContactsLoadedPromise = [];

            for (var i = 0; i < results.length; i++) {
              allContactsLoadedPromise.push(results[i].load());
            }

            rosterInstance.contacts = results; // Dovrebbe essere inutile!

            this.contacts = results;
            Promise.all(allContactsLoadedPromise).then(function () {
              self.orderContacts();
              resolve();
            });
          }, error => {
            console.error("List error: " + e);
          });
        });
      }

      orderContacts() {
        if (this.contacts != null) {
          this.contacts = this.contacts.sort(function (a, b) {
            if (a._unreadMessages == undefined || b._unreadMessages == undefined) return 0;
            if (a._unreadMessages.length < b._unreadMessages.length) return 1;

            if (a._unreadMessages.length > b._unreadMessages.length) {
              return -1;
            }

            if (a.jid < b.jid) {
              return -1;
            } else {
              return 1;
            }
          });
        }
      }

    }

    rosterInstance = new Roster();

    function migs() {
      return new Promise((resolve, reject) => {
        persistence.defineMigration(1, {
          up: function () {
            console.log('Up to v. 1');
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE Coin ADD COLUMN price TEXT');
            });
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE Coin ADD COLUMN notes TEXT');
            });
          }
        });
        persistence.defineMigration(2, {
          up: function () {
            _modelsMarkAllDirty(function () {
              console.log('All marked dirty');
            });

            console.log('Up to v. 2');
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE AlbumCoin ADD COLUMN notes TEXT');
            });
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE AlbumCoin ADD COLUMN image TEXT');
            });
          }
        });
        persistence.defineMigration(3, {
          up: function () {
            console.log('migration v3');
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE Coin ADD COLUMN creationDate DATE');
            });
          }
        });
        persistence.defineMigration(4, {
          up: function () {
            console.log('migration v4');
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE Coin ADD COLUMN ruler TEXT');
            });
          }
        });
        persistence.defineMigration(5, {
          up: function () {
            console.log('migration v5');
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE Coin ADD COLUMN mint TEXT');
            });
          }
        });
        persistence.defineMigration(6, {
          up: function () {
            console.log('migration v6');
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE Coin ADD COLUMN ruler TEXT');
            });
          }
        });
        persistence.defineMigration(7, {
          up: function () {
            console.log('migration v7');
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE Mint ADD COLUMN ruler TEXT');
            });
          }
        });
        persistence.defineMigration(8, {
          up: function () {
            console.log('migration v8');
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE Coin ADD COLUMN remoteID INT');
            });
          }
        });
        persistence.defineMigration(9, {
          up: function () {
            console.log('migration v9');
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE ChatMessage ADD COLUMN read INT');
            });
          }
        });
        persistence.defineMigration(10, {
          up: function () {
            console.log('migration v10');
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE ChatMessage ADD COLUMN xmppID TEXT');
            });
          }
        });
        persistence.defineMigration(11, {
          up: function () {
            console.log('migration v11');
            persistence.transaction(function (t) {
              t.executeSql('ALTER TABLE ChatMessage ADD COLUMN chat TEXT');
            });
          }
        });
        persistence.migrations.init(function () {
          console.log('migration init'); //persistence.migrate(0, function () { console.log('Back to DB v0'); });

          persistence.migrate(11, function () {
            console.log('Migration complete to latest version');
            resolve();
          });
        });
      });
    }

    ; // Sync

    Coin.enableSync('https://sylloge-app.com/sync/sync/coin');
    Album.enableSync('https://sylloge-app.com/sync/sync/album');
    AlbumCoin.enableSync('https://sylloge-app.com/sync/sync/album_coin');
    ChatMessage.enableSync('https://sylloge-app.com/sync/sync/chat_message'); // Ripristina tutti i settaggi e gestisci localStorage 
    // rendendolo persistente

    function handleNativeStorage() {
      return new Promise((resolve, reject) => {
        if (typeof NativeStorage !== 'undefined') {
          var _setItem = Storage.prototype.setItem;

          Storage.prototype.setItem = function (key, val) {
            if (this === window.localStorage) {
              //_setIem.apply(key, val);
              _setItem.apply(this, arguments);

              NativeStorage.setItem(key, val);
            } else {
              _setItem.apply(this, arguments);
            }
          };

          var keys = ['syncID', 'syncUsername', 'syncPWD', 'publicUsername', 'pagination_resultsPerPage'];
          keys.forEach(function (k, i, arr) {
            NativeStorage.getItem(k, function (v) {
              window.localStorage[k] = v;
            }, function (e) {
              console.error('NativeStorage error getting ' + k + ": " + e);
            });
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    handleNativeStorage().then(function () {
      _setupORMData().then(function () {
        migs().then(function () {
          rosterInstance.loadContacts().then(function () {
            resolve();
          });
        });
      });
    });
    resolve()
  });
}

function syncChats(bucket) {
  var params = new Object();
  params.bucket = bucket;
  return new Promise((resolve, reject) => {
    var syncChatsError = function (e) {
      console.error('Error synching chats:');
      console.error(e);
      reject(e);
    };

    ChatMessage.syncAll(persistence.sync.preferLocalConflictHandler, function () {
      resolve();
    }, syncChatsError, params);
  });
}

 /**
  * TODO: Legacy, per aggiornamento vecchi dati
  * @param {string} bucket 
  * @param {function} statusUpdateFunction 
  * @param {*} callbackOK 
  * @param {*} callbackError 
  */
 async function syncNowLegacy(bucket = null, statusUpdateFunction = null) {
     if (statusUpdateFunction == null) {
        statusUpdateFunction = msg => console.log(msg)
     }
     if (bucket == null) {
         throw new Error('pleas specify a bucket')
     }
    return new Promise(function (resolve, reject) {


        var params = new Object();
        params.bucket = bucket;

        var completed = 0;

        function allOrNothing() {
            completed++;
            if (completed == 3) {
                resolve();
            }
        }

        var currentEntitySync = 'Coins';

        function updateProgress(oEvent) {
            if (oEvent.lengthComputable) {
                var percentComplete = oEvent.loaded / oEvent.total;

                console.log(currentEntitySync + ' Sync: ' + parseInt(percentComplete * 100) + '% complete');
                statusUpdateFunction(currentEntitySync + ' Sync: ' + parseInt(percentComplete * 100) + '% complete');
            } else {
                // Unable to compute progress information since the total size is unknown
            }
        }

        statusUpdateFunction('Syncing coins');
        Coin.syncAll(persistence.sync.preferLocalConflictHandler, function () {
            console.log('coins sync complete');
            allOrNothing();
            statusUpdateFunction('Syncing albums');
            currentEntitySync = 'Albums';
            Album.syncAll(persistence.sync.preferLocalConflictHandler, function () {
                console.log('albums sync complete');
                allOrNothing();
                statusUpdateFunction('Syncing album/coins associations');
                currentEntitySync = 'Album/Coins associations';
                AlbumCoin.syncAll(persistence.sync.preferLocalConflictHandler, function () {
                    console.log('album_coins sync complete');
                    allOrNothing();
                }, function (e) {
                    console.log(e);
                    console.error('Error synching album_coins');
                    reject('album_coins');
                }, params, updateProgress);
            }, function (e) {
                console.log(e);
                console.error('Error synching albums');
                reject('albums');
            }, params, updateProgress);
        }, function (e) {
            console.log(e);
            console.error('Error synching coins');
            reject('coins');
        }, params, updateProgress);
    })
}

export default {
  connectionURL: connectionURL,
  enableSync: enableSync,
  disableSync: disableSync,
  coinToString: coinToString, 
  setupModels: setupModels,
  initDB: initDB,
  destroyDB: destroyDB,
  migrate2Pouch: migrate2Pouch,
  createUUID: createUUID
}