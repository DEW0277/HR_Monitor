export declare const hikvisionConfig: {
    user: string;
    password: string;
    server: string;
    database: string;
    port: number;
    options: {
        encrypt: boolean;
        trustServerCertificate: boolean;
        debug: {
            packet: boolean;
            data: boolean;
            payload: boolean;
            token: boolean;
            log: boolean;
        };
    };
};
