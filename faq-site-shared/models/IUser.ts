export interface IUser extends IUserCensored {
    email: string;
    admin: boolean;
    blocked: number;
    verified: number;
}

export interface IUserCensored {
    id: number;
    firstname: string;
    lastname: string;
    avatar: string;
}