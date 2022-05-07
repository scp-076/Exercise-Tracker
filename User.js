module.exports = class User {
    constructor(SQL3) {
        this.SQL3 = SQL3;
    }
    async getUsers() {
        return await this.SQL3.all('SELECT username, _id from users');
    }
    async getUser(prop, value) {
        return await this.SQL3.get(`SELECT username, _id FROM users WHERE ${prop}=?`, value);
    }
    async createUser(username) {
        await this.SQL3.run('INSERT INTO users (username) VALUES (?);', username);
        return await this.getUser('username', username);
    }
}