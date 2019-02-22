const fs = require('fs');
const Promise = require('bluebird');
// TODO: mingo lib

class FileModel {
    constructor(name, params) {
        this.storageParameters = params;
        if(this.storageParameters.location) {
            this.filepath = `${this.storageParameters.location}/${name}.json`
        } else {
            this.filepath = `./data/${name}.json`;
        }

        this.fileExists(this.filepath, )
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
        return new Promise( (resolve) => {
            const records = this.records.filter(record => {
                return Object.keys(query).every(c => {
                    return record[c] === query[c];
                });
            });
            resolve(records);
        });
    }

    addRecord(record) {
        return new Promise( (resolve, reject) => {
            if (this.records.find(s => s.id === record.id)) {
                reject({ message: `id ${record.id} already exists!` });
            } else {
                record.creationDate = new Date();
                record.modifiedDate = new Date();
                this.records.push(record);
                this.writeJSONFile(this.filepath, this.records);
                resolve(record);
            }
        });
    }

    updateRecord(key, record) {
        return new Promise( (resolve) => {
            const index = this._findRecordIndex(key);
            if (index && index >= 0) {
                record.creationDate = this.records[index].creationDate;
                record.modifiedDate = new Date();
                this.records[index] = record;
                this.writeJSONFile(this.filepath, this.records);
                resolve(this.records[index]);
            } else {
                this.addRecord(record)
                    .then(newRecord => {
                        resolve(newRecord);
                    });
            }
        });
    }

    deleteRecord(query) {
        return new Promise( (resolve) => {
            this.records = this._removeRecord(query);
            this.writeJSONFile(this.filepath, this.records);
            resolve();
        });
    }

    _findRecordIndex(query) {
        return this.records.findIndex(record => {
            return Object.keys(query).every(c => {
                return record[c] === query[c];
            });
        });
    }

    _removeRecord(query) {
        return this.records.filter(record =>{
            return Object.keys(query).every(c => {
                return record[c] !== query[c];
            });
        });
    }
}

module.exports = FileModel;
