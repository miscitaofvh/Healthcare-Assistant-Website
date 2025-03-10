const { exec } = require('child_process');
const { DB_USER, DB_PASSWORD, DB_NAME } = require('../.env');

const dumpFile = '../database.sql';

// Command to import the database
const command = `mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < ${dumpFile}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error importing database:', error.message);
    return;
  }
  if (stderr) {
    console.error('❌ stderr:', stderr);
    return;
  }
  console.log('✅ Database imported successfully from', dumpFile);
});