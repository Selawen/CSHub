// Copy this file to settings.ts, remove the interface from the file and export the Settings instead of creating a local const

export interface ISettings {
    LIVE: boolean;
    DATABASE: {
        HOST: string;
        USER: string;
        PASSWORD: string;
        NAME: string
    };
    USESSH: boolean;
    SSH: {
        HOST: string,
        USER: string,
        PORT: number,
        PRIVATEKEYLOCATION: string
    };
    ALLOWORIGIN: string;
    TOKENAGEMILLISECONDS: number;
    PASSWORDITERATIONS: number;

}

export const Settings: ISettings = {
    LIVE: true,
    DATABASE: {
        HOST: "",
        USER: "",
        PASSWORD: "",
        NAME: ""
    },
    USESSH: true,
    SSH: {
        HOST: "",
        USER: "",
        PORT: 1234,
        PRIVATEKEYLOCATION: ""
    },
    ALLOWORIGIN: "",
    TOKENAGEMILLISECONDS: 7200000,
    PASSWORDITERATIONS: 45000
};
