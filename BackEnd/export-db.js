const { exec } = require('child_process');
const { DB_USER, DB_PASSWORD, DB_NAME } = require('../.env');

const dumpFile = '../database.sql';

// Command to export the database
const command = `mysqldump -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > ${dumpFile}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error exporting database:', error.message);
    return;
  }
  if (stderr) {
    console.error('❌ stderr:', stderr);
    return;
  }
  console.log('✅ Database exported successfully to', dumpFile);
});