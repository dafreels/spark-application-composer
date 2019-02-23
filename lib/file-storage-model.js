const fs = require('fs');
const Promise = require('bluebird');
const mingo = require('mingo');

class FileModel {
    constructor(name, params) {
        this.storageParameters = params;
        this.filepath = `./data/${name}.json`;

        this.fileExists(this.filepath)
            .then( (res) => {
                if(res) {
                    // TODO: use file system
                    this.records = require(`../data/${name}.json`);
                } else {
                    // write an empty file if one doesn't exist
                    this.writeJSONFile(this.filepath, []);
                    this.records = require(`../data/${name}.json`);
                }
            });
    }

    writeJSONFile(filename, content) {
        fs.writeFileSync(filename, JSON.stringify(content), 'utf8');
    }

    fileExists(filepath) {
        return new Promise((resolve) => {
            fs.stat(filepath, (err) => {
                if (err) {
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        });
    }

    find(query) {
        return new Promise(resolve => {
            resolve(mingo.find(this.records, query).all());
        });
    }

    addRecord(key, record) {
        return new Promise((resolve, reject) => {
            this.find(key)
                .then(results => {
                    if(results.length > 0) {
                        reject({ message: `record already exists!` });
                    }
                    else {
                        record.creationDate = new Date();
                        record.modifiedDate = new Date();
                        this.records.push(record);
                        this.writeJSONFile(this.filepath, this.records);
                        resolve(record);
                    }
                })
                .catch(err => reject(err));
        });
    }

    updateRecord(key, record) {
        return new Promise((resolve, reject) => {
            this.find(key)
                .then(stored => {
                    if(stored.length === 0){ resolve(this.addRecord(key, record)); }
                    else if(stored.length === 1){
                        this.deleteRecord(key)
                            .then(() => {
                                record.modifiedDate = new Date();
                                record.creationDate = stored.creationDate;
                                this.records.push(record);
                                this.writeJSONFile(this.filepath, this.records);
                                resolve(record);
                            })
                            .catch(err => reject(err));
                    } else { reject('multiple records found while attempting to update'); }
                })
                .catch(err => reject(err));
        });
    }

    deleteRecord(query) {
        return new Promise(resolve => {
            this.records = mingo.remove(this.records, query);
            this.writeJSONFile(this.filepath, this.records);
            resolve();
        });
    }
}

module.exports = FileModel;
