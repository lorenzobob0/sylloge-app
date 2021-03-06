/**
 * @license
 * Copyright (c) 2010 Zef Hemel <zef@zef.me>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

if(!window.persistence) { // persistence.js not loaded!
    throw new Error("persistence.js should be loaded before persistence.sync.js");
}

persistence.sync = {};

persistence.sync.getJSON = function(uri, callback, errorCallback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", uri, true);
    xmlHttp.send();
    xmlHttp.onreadystatechange = function() {
        if(xmlHttp.readyState==4) {
            if(xmlHttp.status==200) {
                callback(JSON.parse(xmlHttp.responseText));
            } else if(typeof errorCallback === 'function') {
                errorCallback(xmlHttp);
            }
        }
    };
};

persistence.sync.postJSON = function(uri, data, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", uri, true);
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.send(data);
    xmlHttp.onreadystatechange = function() {
        if(xmlHttp.readyState==4 && xmlHttp.status==200) {
	        console.log(xmlHttp.responseText);
            callback(JSON.parse(xmlHttp.responseText));
        }
    };
};


(function() {

    var argspec = persistence.argspec;

    persistence.sync.Sync = persistence.define('_Sync', {
        entity: "VARCHAR(255)",
        localDate: "BIGINT",
        serverDate: "BIGINT",
        serverPushDate: "BIGINT"
    });

    persistence.sync.RemovedObject = persistence.define('_SyncRemovedObject', {
        entity: "VARCHAR(255)",
        objectId: "VARCHAR(32)"
    });


    function getEpoch(date) {
        return date.getTime();
    }

    function objectToQueryString(obj, append) {
        var str = [],
            queryString = '';

        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                str.push(encodeURIComponent(prop) + '=' + encodeURIComponent(obj[prop]));
            }
        }

        if (str.length > 0) {
            if (append) {
                queryString = '&' + str.join('&');
            }
            else {
                queryString = '?' + str.join('&');
            }
        }

        return queryString;
    }

    persistence.sync.preferLocalConflictHandler = function(conflicts, updatesToPush, callback) {
        conflicts.forEach(function(conflict) {
            var update = {id: conflict.local.id};
            conflict.properties.forEach(function(p) {
                update[p] = conflict.local._data[p];
            });
            updatesToPush.push(update);
        });
        callback();
    };

    persistence.sync.preferRemoteConflictHandler = function(conflicts, updatesToPush, callback) {
        conflicts.forEach(function(conflict) {
            conflict.properties.forEach(function(p) {
                conflict.local[p] = conflict.remote[p];
            });
        });
        persistence.flush(callback);
    };

    function encodeUrlObj(obj) {
        var parts = [];
        for(var k in obj) {
            if(obj.hasOwnProperty(k)) {
                parts.push(encodeURI(k)+"="+encodeURI(obj[k]));
            }
        }
        return "?" + parts.join("&");
    }

    /**
     * The main caching and updating function, would be nice to refactor this
     */
    function cacheAndFindUpdates(session, Entity, objects, lastLocalSyncTime, lastServerPushTime, conflictCallback, callback) {
        var ids = [];
        var lookupTbl = {};

        var conflicts = [];
        var updatesToPush = [];
        var meta = Entity.meta;
        var fieldSpec = meta.fields;

        var objectsToRemove = [];

        objects.forEach(function(item) {
            if(item._removed) { // special marker
                objectsToRemove.push(item.id);
            } else {
                ids.push(item.id);
                lookupTbl[item.id] = item;
            }
        });
        // Step 1: Look at local versions of remotely updated entities
        var existingItems = [], groupedIds = [];
        for (var i=0,l=Math.floor((ids.length/100)+1);i<l;i++) {
            groupedIds.push(ids.slice(i*100, i*100+100));
        }
        persistence.asyncForEach(groupedIds, function(idGroup, next) {
            Entity.all(session).filter('id', 'in', idGroup).list(function(groupOfExistingItems) {
                existingItems = existingItems.concat(groupOfExistingItems);
                next();
            });
        }, function() {
            existingItems.forEach(function(localItem) {
                var remoteItem = lookupTbl[localItem.id];
                delete remoteItem.id;
                delete lookupTbl[localItem.id];

                var localChangedSinceSync = lastLocalSyncTime < localItem._lastChange;
                var itemUpdatedFields = { id: localItem.id };
                var itemUpdated = false;
                var conflictingProperties = [];
                for(var p in remoteItem) {
                    if(remoteItem.hasOwnProperty(p) && p !== '_lastChange') {
                        if(localItem._data[p] !== remoteItem[p]) {
                            if(localChangedSinceSync && remoteItem._lastChange === lastServerPushTime) {
                                // Unchanged at server, but changed locally
                                itemUpdatedFields[p] = localItem._data[p];
                                itemUpdated = true;
                            } else if(localChangedSinceSync) { // Conflict!
                                conflictingProperties.push(p);
                            } else {
                                localItem[p] = persistence.jsonToEntityVal(remoteItem[p], fieldSpec[p]);
                            }
                        }
                    }
                }
                if(itemUpdated) {
                    updatesToPush.push(itemUpdatedFields);
                }
                if(conflictingProperties.length > 0) {
                    conflicts.push({local: localItem, remote: remoteItem, properties: conflictingProperties});
                }
            });
            // Step 2: Remove all remotely removed objects
            var groupedObjectsToRemove = [];
            for (var i=0,l=Math.floor((objectsToRemove.length/100)+1);i<l;i++) {
                groupedObjectsToRemove.push(objectsToRemove.slice(i*100, i*100+100));
            }

            persistence.asyncForEach(groupedObjectsToRemove, function(group, next) {
                Entity.all(session).filter('id', 'in', group).destroyAll(next);
            }, function() {
                // Step 3: store new remote items locally
                // NOTE: all that's left in lookupTbl is new, we deleted the existing items
                for(var id in lookupTbl) {
                    if(lookupTbl.hasOwnProperty(id)) {
                        var remoteItem = lookupTbl[id];
                        delete remoteItem.id;
                        var localItem = new Entity(remoteItem);
                        localItem.id = id;
                        session.add(localItem);
                    }
                }
                // Step 4: Find local new/updated/removed items (not part of the remote change set)
                if (lastLocalSyncTime <= 0) {
                    callback(updatesToPush);
                }
                else {
                    Entity.all(session).filter("_lastChange", ">", lastLocalSyncTime).list(function(allNewItems) {
                        var newItems = [];
                        for (var i=0,l=allNewItems.length;i<l;i++) {
                            if (ids.indexOf(allNewItems[i].id)===-1) {
                                newItems.push(allNewItems[i]);
                            }
                        }
                        console.log("New items: ", newItems);
                        newItems.forEach(function(newItem) {
                            var update = { id: newItem.id };
                            for(var p in fieldSpec) {
                                if(fieldSpec.hasOwnProperty(p) && p != '_lastChange') {
                                    update[p] = persistence.entityValToJson(newItem._data[p], fieldSpec[p]);
                                }
                            }
                            for(var p in meta.hasOne) {
                                if(meta.hasOne.hasOwnProperty(p)) {
                                    update[p] = persistence.entityValToJson(newItem._data[p], fieldSpec[p]);
                                }
                            }
                            updatesToPush.push(update);
                        });
                        var removedObjColl = persistence.sync.RemovedObject.all(session).filter("entity", "=", meta.name);
                        removedObjColl.list(function(objs) {
                            objs.forEach(function(obj) {
                                updatesToPush.push({id: obj.objectId, _removed: true});
                            });
                            function next() {
                                removedObjColl.destroyAll(function() {
                                    callback(updatesToPush);
                                });
                            }
                            if(conflicts.length > 0) {
                                conflictCallback(conflicts, updatesToPush, next);
                            } else {
                                next();
                            }
                        })
                    });
                }
            });
        });
    }

    persistence.sync.serviceSync = function(session, uri, args, conflictCallback, callback) {
        persistence.sync.Sync.findBy(session, 'service', uri, function(sync) {
            var lastServerSyncTime = sync ? persistence.get(sync, 'serverDate') : 0;
            var lastServerPushTime = sync ? persistence.get(sync, 'serverPushDate') : 0;
            var lastLocalSyncTime = sync ? persistence.get(sync, 'localDate') : 0;
            if(!sync) {
                sync = new persistence.sync.Sync(session, {service: uri});
                session.add(sync);
            }
            if(!args.since) args.since = lastServerSyncTime;
            persistence.sync.getJSON(uri + encodeUrlObj(args), function(result) {
                var allUpdates = [];
                cacheAndFindUpdates(session, Entity, result.updates, lastLocalSyncTime, lastServerPushTime, conflictCallback, function(updatesToPush) {
                    persistence.sync.postJSON(uri, JSON.stringify(updatesToPush), function(pushData) {
                        resetSyncTimesAndFlush(session, sync, result.now, pushData.now, callback);
                    });
                });
            });
        });
        session.flush(function() {
            persistence.sync.getJSON(uri + encodeUrlObj(args), function(result) {
            });
        });
    };

    function resetSyncTimesAndFlush(session, sync, serverDate, serverPushDate, callback){
        session.flush(function () {
            sync.localDate = getEpoch(new Date());
            sync.serverDate = serverDate;
            sync.serverPushDate = serverPushDate;
            session.flush(callback);
        });
    }

    function synchronize(session, uri, Entity, conflictCallback, callback, errorCallback, params) {
        persistence.sync.Sync.findBy(session, 'entity', Entity.meta.name, function(sync) {
            var lastServerSyncTime = sync ? persistence.get(sync, 'serverDate') : 0;
            var lastServerPushTime = sync ? persistence.get(sync, 'serverPushDate') : 0;
            var lastLocalSyncTime = sync ? persistence.get(sync, 'localDate') : 0;
            if(!sync) {
                sync = new persistence.sync.Sync(session, {entity: Entity.meta.name});
                session.add(sync);
            }
            var queryString = objectToQueryString(params, true);
            persistence.sync.getJSON(uri + '?since=' + lastServerSyncTime + queryString, function(result) {
                    cacheAndFindUpdates(session, Entity, result.updates, lastLocalSyncTime, lastServerPushTime, conflictCallback, function(updatesToPush) {
                        //TODO: Clean this up
                        if (updatesToPush.length > 0) {
                        	var queryString = objectToQueryString(params);
                            persistence.sync.postJSON(uri + queryString, JSON.stringify(updatesToPush), function (pushData) {
                                resetSyncTimesAndFlush(session, sync, result.now, pushData.now, callback);
                            });
                        }
                        else {
                            resetSyncTimesAndFlush(session, sync, result.now, result.now, callback);
                        }
                    });
                },
                errorCallback);
        });
    }

    persistence.entityDecoratorHooks.push(function(Entity) {
        /**
         * Declares an entity to be tracked for changes
         */
        Entity.enableSync = function(uri) {
            Entity.meta.enableSync = true;
            Entity.meta.syncUri = uri;
            Entity.meta.fields['_lastChange'] = 'BIGINT';
        };

        Entity.syncAll = function(session, uri, conflictCallback, callback, errorCallback, params) {
            var args = argspec.getArgs(arguments, [
                { name: 'session', optional: true, check: function(obj) { return obj && obj.flush; }, defaultValue: persistence },
                { name: 'uri', optional: true, check: argspec.hasType('string'), defaultValue: this.meta.syncUri },
                { name: 'conflictCallback', check: argspec.isCallback() },
                { name: 'callback', check: argspec.isCallback() },
                { name: 'errorCallback', optional: true, check: argspec.isCallback() },
                { name: 'params', optional: true, check: argspec.isPlainObject(), defaultValue: {} }
            ]);
            synchronize(args.session, args.uri, this, args.conflictCallback, args.callback, args.errorCallback, args.params);
        };
    });

    /**
     * Resets _lastChange property if the object has dirty project (i.e. the object has changed)
     */
    persistence.flushHooks.push(function(session, tx, callback) {
        var queries = [];
        for (var id in session.getTrackedObjects()) {
            if (session.getTrackedObjects().hasOwnProperty(id)) {
                var obj = session.getTrackedObjects()[id];
                var meta = persistence.getEntityMeta()[obj._type];
                if(meta.enableSync) {
                    var isDirty = obj._new;
                    for ( var p in obj._dirtyProperties) {
                        if (obj._dirtyProperties.hasOwnProperty(p)) {
                            isDirty = true;
                        }
                    }
                    if(isDirty) {
                        obj._lastChange = getEpoch(new Date());
                    }
                }
            }
        }
        session.objectsRemoved.forEach(function(rec) {
            var meta = session.getMeta(rec.entity);
            if(meta.enableSync) {
                session.add(new persistence.sync.RemovedObject({entity: rec.entity, objectId: rec.id}));
            }
        });
        session.objectsRemoved=[];
        callback();
    });

}());

