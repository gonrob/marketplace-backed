const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const dbs = ['sample_mflix', 'test'];
  for (const db of dbs) {
    const result = await mongoose.connection.getClient().db(db).collection('users').updateOne(
      {email: 'gonrobtor@gmail.com'},
      {'$set': {password: await bcryptjs.hash('Pichipichi1996', 10), emailVerificado: true}}
    );
    console.log(db, 'Modified:', result.modifiedCount);
  }
  process.exit();
});
