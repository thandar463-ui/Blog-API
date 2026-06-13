import jwt from "jsonwebtoken";

function getAccessTokenSecret(): string {
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
        throw new Error("ACCESS_TOKEN_SECRET missing");
    }

    return secret;
}

function getRefreshTokenSecret(): string {
    const secret = process.env.REFRESH_TOKEN_SECRET;

    if (!secret) {
        throw new Error("REFRESH_TOKEN_SECRET missing");
    }

    return secret;
}

export function signAccessToken(
    payload: object,
    expiresIn: string
): string {
    return jwt.sign(
        payload,
        getAccessTokenSecret(),
        { expiresIn } as jwt.SignOptions
    );
}

export function signRefreshToken(
    payload: object,
    expiresIn: string
): string {
    return jwt.sign(
        payload,
        getRefreshTokenSecret(),
        { expiresIn } as jwt.SignOptions
    );
}

export function verifyAccessToken(token: string) {
    return jwt.verify(token, getAccessTokenSecret());
}

export function verifyRefreshToken(token: string) {
    return jwt.verify(token, getRefreshTokenSecret());
}