const fs = require("fs");
const yaml = require("js-yaml");
const mysql = require("mysql2");

const config = yaml.load(fs.readFileSync("./src/config.yaml", "utf8")).database;
 

//console.log(`config `,config);

let my_connection = mysql.createConnection({
  host: config.hostname,
  port: config.port,
  user: config.username,
  password: config.password
});

function createDatabaseIfNotExists(connection, databaseName) {
  const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS ${databaseName}`;
  console.log(`createDatabaseQuery `,createDatabaseQuery);
  connection.query(createDatabaseQuery, (err, result) => {
    if (err) {
      console.error(`Error creating database: ${err.message}`);
    } else {
      console.log(`Database ${databaseName} created successfully.`);
    }
  });
  my_connection = mysql.createConnection({
    host: config.hostname,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
  });
}
createDatabaseIfNotExists(my_connection, config.database);

async function rawSQLCommand(connection, command, isDebug) {
  return new Promise((resolve, reject) => {
    try {
      connection.query(command, (err, result) => {
        if (isDebug)
          console.log(`SQL command excecute: `, `${command}`.input);
        if (err) {
          console.error(`Error : ${err.message}`);
          resolve(result);
        } else {
          const result_str = JSON.stringify(result);
          if (isDebug)
            console.log(
              `SQL command successfully.\n `,
              `${result_str}`.data
            );
          resolve(result);
        }
      });
    } catch (err) {
      reject(er);
    }
  });
}

const createTableIfNotExists = (connection, tableName, tableColumns, debug) => {
    const columnDefinitions = Object.keys(tableColumns)
      .map((columnName) => {
        const columnType = tableColumns[columnName];
        return `${columnName} ${columnType}`;
      })
      .join(", ");
  
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions})`;
    if (debug)
      console.log(`createTableIfNotExists createTableQuery`, createTableQuery);
    connection.query(createTableQuery, (err, result) => {
      if (err) {
        console.error(`Error creating table: ${err.message}`);
      } else {
        //
        if (result.affectedRows >= 1) {
          console.log(`Table ${tableName} created successfully.`);
        } else {
          if (result.affectedRows == 0) {
            console.log(`Table ${tableName} already exist.`);
          }
        }
      }
    });
  };

function insertIntoDB (connection, tableName, documents)  {
  //console.log("insertIntoDB", tableName,documents);
  const columnDefinitions = Object.keys(documents)
  .map((columnName) => {
    return `${columnName}`;
  })
  .join(", ");
      
      console.log("insertIntoDB columnDefinitions", columnDefinitions);

    const valueDefinitions = Object.keys(documents)
      .map((columnName) => {
        const columnValue =
          typeof documents[columnName] === "string"
            ? `'${documents[columnName]}'`
            : documents[columnName];
        return columnValue;
      })
      .join(", ");
  
    const createTableQuery = `INSERT INTO ${tableName} (${columnDefinitions}) VALUES (${valueDefinitions})`;
    console.log("insertIntoDB createTableQuery", createTableQuery);
  
    connection.query(createTableQuery, (err, result) => {
      if (err) {
        console.error(`Error inserting into table: ${err.message}`);
      } else {
        if (result.affectedRows >= 1) {
          console.log(`INSERT VALUE INTO ${tableName} successfully.`);
        }
      }
    });
  };


// Table name
const tb_hotel_info = 'tb_hotel_info';
const tb_hotel_info_test = 'tb_hotel_info_test';
const tb_device_data = 'tb_device_data';
const tb_device_data_test = 'tb_device_data_test';

// Create Table

createTableIfNotExists(my_connection, tb_hotel_info, {
    doc_id: "BIGINT AUTO_INCREMENT PRIMARY KEY",
    hotel_id: "VARCHAR(12) NOT NULL", 
    hotel_name: "VARCHAR(50) NOT NULL", 
    tax_id: "VARCHAR(30) NOT NULL",
    address: "VARCHAR(50) NOT NULL",
    phone: "VARCHAR(13) NOT NULL",  
    email: "VARCHAR(50) NOT NULL", 
    sysdatetime: "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    date: "DATE  AS (DATE(sysdatetime))",
    time: "TIME  AS (sysdatetime)",
  });

  createTableIfNotExists(my_connection, tb_device_data, {
    doc_id: "BIGINT AUTO_INCREMENT PRIMARY KEY",
    datetime: "DATETIME",
    device_id: "VARCHAR(30) NOT NULL", 
    hotel_id: "VARCHAR(12) NOT NULL", 
    room_name: "VARCHAR(50) NOT NULL", 
    floor: "VARCHAR(50) NOT NULL", 
    datapoint: "VARCHAR(30) NOT NULL",
    value: "VARCHAR(30) NOT NULL",  
    sysdatetime: "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    date: "DATE  AS (DATE(sysdatetime))",
    time: "TIME  AS (sysdatetime)",
  });


module.exports = {
    my_connection,
    rawSQLCommand,
    insertIntoDB,
    tb_device_data
  };
  