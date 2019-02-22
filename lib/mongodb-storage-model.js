const mongoClient = require('mongodb').MongoClient;
const config = require('../config/config');
const Promise = require('bluebird');


class MongoDBModel {
    constructor(collectionName) {
        this.collectionName = collectionName;
        mongoClient.connect(this.buildConnectionUrl(), (err, db) => {
            this.mongodb = db.db(config.storage.database);
            this.collection = this.mongodb.collection(this.collectionName);
        });
    }

    buildConnectionUrl() {
        let loginInfo = '';
        if(config.storage.user && config.storage.password) {
            loginInfo = `${config.storage.user}:${config.storage.password}@`;
        }

        return `mongodb://${loginInfo}${config.storage.server}/`;
    }

    find(query) {
        return new Promise( (resolve, reject) => {
            this.collection.find(query).toArray()
                .then(results => {
                    resolve(results);
                })
                .catch(err => reject(err));
        });
    }

    addRecord(record) {
        return new Promise( (resolve, reject) => {
            this.find({ id: record.id})
                .then(exists => {
                    if(exists.length > 0) {
                        reject({ message: `id ${record.id} already exists!` });
                    }
                    else {
                        record.creationDate = new Date();
                        record.modifiedDate = new Date();
                        this.collection.insertOne(record)
                            .then(() => {
                                resolve(this.find({ id: record.id }));
                            })
                            .catch(err => reject(err));
                    }
                });
        });
    }

    updateRecord(key, record) {
        return new Promise( (resolve, reject) => {
            record.modifiedDate = new Date();
            this.collection.findOneAndUpdate(key, { $set: record }, { upsert: true, returnOriginal: false }, (err, doc) => {
                if(err) reject(err);
                resolve(doc.value);
            });
        });
    }

    deleteRecord(query) {
        return this.collection.findOneAndDelete(query);
    }

}

module.exports = MongoDBModel;
