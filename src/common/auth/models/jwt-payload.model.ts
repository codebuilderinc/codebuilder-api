export interface JwtPayload extends JwtUserInfo {
    accessToken: string;
    refreshToken: string;
}

export interface JwtUserInfo {
    userId: number;
    username: string;
}
