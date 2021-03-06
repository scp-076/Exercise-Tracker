module.exports = class Exercises {
    constructor(SQL3, userClass) {
        this.SQL3 = SQL3;
        this.userClass = userClass;
    }
    async getExercises(id, from, to, limit) {
        if (from || to || limit) {
          const fromparsed = from.length && new Date(from).getTime();
          const toparsed = to.length && new Date(to).getTime();
          return await this.SQL3.all(`SELECT description, duration, date FROM exercises WHERE _id=? AND date >= ? AND date <= ? LIMIT ?`, id, fromparsed, toparsed, limit);
        }
        return await this.SQL3.all('SELECT description, duration, date FROM exercises WHERE _id=?', id);
    }
    async createExercise(id, description, duration, date) {
        try {
            await this.SQL3.run('INSERT INTO exercises (_id, description, duration, date) VALUES (?, ?, ?, ?);', id, description, duration,  new Date(date).getTime());
            const exercises = await this.getExercises(id);
            const user = await this.userClass.getUser('_id', id);
            if (user && exercises) {
                user.exercises = [...exercises];
                return user;
            } else return false;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
}