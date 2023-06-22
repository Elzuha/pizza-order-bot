import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import crypto from "crypto";

import { RequestWithToken, DB } from "../../types";
import { PASSWORD_SECRET, JWT_SECRET, JWT_EXPIRATION_TIME } from "../../config";
import getDB from "../../db";

let db: DB;
let jwtBlacklist: string[] = [];
(async () => {
  db = await getDB();
})();
async function computeHash(input: string, salt: string): Promise<string> {
  return new Promise((resolve) =>
    crypto.scrypt(
      input,
      salt,
      64,
      (err: Error | null, passHashBuf: Buffer | null) => {
        if (err) throw err;
        resolve(
          passHashBuf && passHashBuf.toString("hex")
            ? passHashBuf.toString("hex")
            : ""
        );
      }
    )
  );
}

async function makeJWT(username: string) {
  return new Promise((resolve) => {
    jwt.sign(
      { username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION_TIME },
      (err: Error | null, token: string | undefined) => {
        if (err) throw err;
        resolve(token);
      }
    );
  });
}

async function verifyJWT(token: string): Promise<{ username: string }> {
  return new Promise((resolve, reject) => {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    if (decoded && decoded.username) resolve(decoded);
    else reject();
  });
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const username = req.body.username,
      password = req.body.password;
    const refreshToken = crypto.randomBytes(64);
    const passHash: string = await computeHash(password, PASSWORD_SECRET);
    await db.createUser({
      username,
      passHash,
      refreshToken: refreshToken.toString("base64"),
    });
    res.json({
      refreshToken: refreshToken.toString("base64"),
      accessToken: await makeJWT(username),
    });
  } catch (e) {
    next(e);
  }
}

export async function signin(req: Request, res: Response, next: NextFunction) {
  try {
    const username = req.body.username,
      password = req.body.password;
    const user = await db.getUser({ username });
    if (!user) throw new Error("user_with_id_does_not_exist");
    const passHash: string = await computeHash(password, PASSWORD_SECRET);
    if (passHash !== user.passHash) throw new Error("wrong_password");
    res.json({ accessToken: await makeJWT(username) });
  } catch (e) {
    next(e);
  }
}

export async function issueAccessToken(
  req: RequestWithToken,
  res: Response,
  next: NextFunction
) {
  try {
    const token: string | undefined = req.token;
    if (!token) throw new Error("unauthorized");
    const refreshToken = Buffer.from(token, "base64");
    const user = await db.getUser({
      refreshToken: refreshToken.toString("base64"),
    });
    if (!user) throw new Error("unauthorized");
    res.json({ accessToken: await makeJWT(user.username) });
  } catch (e) {
    next(e);
  }
}

export function parseAuthHeader(
  req: RequestWithToken,
  res: Response,
  next: NextFunction
) {
  const header = req.get("authentication");
  if (!header || !header.split) throw new Error("unauthorized");
  const token = header.split(" ")[1] || "";
  if (!token || jwtBlacklist.includes(token)) throw new Error("unauthorized");
  req.token = token;
  next();
}

export async function authenticateAccessToken(
  req: RequestWithToken,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.token) throw new Error("unauthorized");
    const payload: { username: string } = await verifyJWT(req.token);
    if (!payload) throw new Error("unauthorized");
    next();
  } catch (e) {
    next(e);
  }
}

export async function maintainJwtBlacklist() {
  const jwtBlacklistExpired = await Promise.all(
    jwtBlacklist.map(async (token) => {
      (await verifyJWT(token)) === null;
    })
  );
  jwtBlacklist = jwtBlacklist.filter((token, i) => jwtBlacklistExpired[i]);
}
