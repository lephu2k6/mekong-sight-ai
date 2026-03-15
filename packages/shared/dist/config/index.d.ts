export declare const config: {
    env: string;
    port: number;
    supabase: {
        url: string | undefined;
        key: string | undefined;
        serviceKey: string | undefined;
    };
    redis: {
        host: string | undefined;
        port: number;
        password: string | undefined;
    };
    jwt: {
        secret: string | undefined;
        expiresIn: string;
    };
};
