
class ApplicationsModel {
    constructor(applications) {
        this.applications = applications;
    }

    setApplications(applications) {
        this.applications = applications;
    }

    getApplication(id) {
        return cloneObject(_.find(this.applications, p => p.id === id));
    }

    getApplications() {
        return cloneObject(this.applications);
    }
}
