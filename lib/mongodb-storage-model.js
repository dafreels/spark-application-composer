const mongoClient = require('mongodb').MongoClient;
const Promise = require('bluebird');

class MongoDBModel {
    constructor(collectionName, params) {
        this.storageParameters = params;
        this.collectionName = collectionName;
        mongoClient.connect(this.buildConnectionUrl(), { useNewUrlParser: true }, (err, db) => {
            if (err) {
                console.log(err);
            }
            this.mongodb = db.db(this.storageParameters.get('databaseName'));
            this.collection = this.mongodb.collection(this.collectionName);
        });
    }

    buildConnectionUrl() {
        let loginInfo = '';
        if(this.storageParameters.get('databaseUser') && this.storageParameters.get('databasePassword')) {
            loginInfo = `${this.storageParameters.get('databaseUser')}:${this.storageParameters.get('databasePassword')}@`;
        }
        let protocol = 'mongodb';
        if (this.storageParameters.get('databaseSSL')) {
            protocol = 'mongodb+srv';
        }

        return `${protocol}://${loginInfo}${this.storageParameters.get('databaseServer')}/`;
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

    addRecord(key, record) {
        return new Promise( (resolve, reject) => {
            this.find(key)
                .then(exists => {
                    if(exists.length > 0) {
                        reject({ message: `record already exists!` });
                    }
                    else {
                        record.creationDate = new Date();
                        record.modifiedDate = new Date();
                        this.collection.insertOne(record)
                            .then(() => {
                                resolve(this.find(key));
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
