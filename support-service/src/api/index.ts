import * as express from "express";
import { NextFunction, Request, Response } from "express";

import { authController, orderController } from "./controllers/index";
import { ResponseError, API, InteractionMessageSender } from "../types";
import { JWT_BLACKLIST_MAINTAIN_PAUSE } from "../config";
import { normalizeError } from "./formatting/errors";

const APP_PORT = process.env.SUPPORT_APP_PORT;
const app = express.default();
const router = express.Router();
let interactionMessageSender: InteractionMessageSender;

app.use(express.json());
router.use(
  [
    "/order/list",
    "/order/send-message",
    "/order/change-status",
    "/auth/issue-access-token",
  ],
  authController.parseAuthHeader
);
router.use(
  ["/order/list", "/order/send-message", "/order/change-status"],
  authController.authenticateAccessToken
);

router.post("/auth/signin", (req, res, next) => {
  authController.signin(req, res, next);
});
router.post("/auth/signup", (req, res, next) => {
  authController.signup(req, res, next);
});
router.get("/auth/issue-access-token", (req, res, next) => {
  authController.issueAccessToken(req, res, next);
});
router.get("/order/list", (req, res, next) => {
  orderController.list(req, res, next);
});
router.post("/order/send-message", (req, res, next) => {
  orderController.sendMessage(req, res, next, interactionMessageSender);
});
router.post("/order/change-status", (req, res, next) => {
  orderController.changeStatus(req, res, next, interactionMessageSender);
});
app.use(router);

app.use(function (req: Request, res: Response, next: NextFunction) {
  const err: ResponseError = new Error("not_found");
  next(err);
});

app.use(function (
  err: ResponseError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  next(normalizeError(err));
});

app.use(
  (err: ResponseError, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message,
      ok: false,
    });
  }
);

app.listen(APP_PORT, () => console.log(`App listening on port ${APP_PORT}`));

export async function ApiService(): Promise<API> {
  setInterval(
    authController.maintainJwtBlacklist,
    JWT_BLACKLIST_MAINTAIN_PAUSE
  );
  return {
    setInteractionMessageSender: (sender) => {
      interactionMessageSender = sender;
    },
  };
}
