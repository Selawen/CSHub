import mysql from "mysql2";
import {Settings} from "./settings";
import {Client} from "ssh2";
import fs from "fs";

const connectionconf = {
    host: Settings.DATABASE.HOST,
    user: Settings.DATABASE.USER,
    password: Settings.DATABASE.PASSWORD,
    database: Settings.DATABASE.NAME,
    multipleStatements: true
};

const sshClient = new Client();

let connection = null;

let connectionPromise = null;
if (Settings.USESSH) {
     connectionPromise = new Promise((resolve, reject) => {
        sshClient.on("ready", () => {
            sshClient.forwardOut(
                "127.0.0.1",
                12345,
                "localhost",
                3306,
                (err, stream) => {
                    if (err) {
                        throw err;
                    }

                    const currConnection = mysql.createConnection({
                        ...connectionconf,
                        stream
                    });

                    connection = currConnection;

                    currConnection.connect(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(currConnection);
                        }
                    });
                });
        }).connect({
            host: Settings.SSH.HOST,
            port: Settings.SSH.PORT,
            username: Settings.SSH.USER,
            privateKey: fs.readFileSync(Settings.SSH.PRIVATEKEYLOCATION)
        });

    });
}

const toExecuteQueries: {
    query: string,
    resolve: any,
    args: any[]
}[] = [];

connectionPromise.then((connection: any) => {
    if (toExecuteQueries.length > 0) {
        for (const queryobj of toExecuteQueries) {
            query(queryobj.query, queryobj.args).then((data: any) => {
                queryobj.resolve(data);
            });
        }
    }
});

export const query = (query: string, ...args: any[]) => {
    return new Promise<DatabaseResultSet>((resolve, reject) => {

        if (connection == null && Settings.USESSH) {
            toExecuteQueries.push({
                query,
                resolve,
                args
            });
        } else {
            connection.query(query, args, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(new DatabaseResultSet(rows));
            });
        }
    });
};

export class DatabaseResultSet {

    constructor(private rows: any[]) {}

    public static getStringFromDB(name: string, obj: any): string {

        if (Array.isArray(obj)) {
            obj = obj[0];
        }

        const currObj = obj[name.trim()];

        try {
            return currObj as string;
        } catch (err) {
            console.error(`Error getting value from database string, name: ${name}. Error: ${err}`);
            return null;
        }
    }

    public static getNumberFromDB(name: string, obj: any): number {

        if (Array.isArray(obj)) {
            obj = obj[0];
        }

        const currObj = obj[name.trim()];

        try {
            return currObj as number;
        } catch (err) {
            console.error(`Error getting value from database string, name: ${name}. Error: ${err}`);
            return null;
        }
    }

    public getStringFromDB(name: string, index: number = 0): string {
        return DatabaseResultSet.getStringFromDB(name, this.rows[index]);
    }

    public getNumberFromDB(name: string, index: number = 0): number {
        return DatabaseResultSet.getNumberFromDB(name, this.rows[index]);
    }

    public getRows(): any[] {
        return this.rows;
    }

    public convertRowsToResultObjects(): DatabaseResultRow[] {

        const convertedRows: DatabaseResultRow[] = [];

        for (const row of this.rows) {
            convertedRows.push(new DatabaseResultRow(row));
        }

        return convertedRows;
    }
}

export class DatabaseResultRow {

    constructor(private row: any) {}

    public getStringFromDB(name: string): string {
        return DatabaseResultSet.getStringFromDB(name, this.row);
    }

    public getNumberFromDB(name: string): number {
        return DatabaseResultSet.getNumberFromDB(name, this.row);
    }
}
