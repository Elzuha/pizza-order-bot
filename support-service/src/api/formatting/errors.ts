import { ResponseError } from "../../types";

const errToStatus: { [key: string]: number } = {
  unauthorized: 401,
  user_with_id_does_not_exist: 400,
  wrong_password: 400,
  not_found: 404,
  wrong_request: 400,
};

const errToMessage: { [key: string]: string } = {
  unauthorized: "unauthorized",
  user_with_id_does_not_exist: "user_with_id_does_not_exist",
  wrong_password: "invalid_param_value",
  not_found: "not_found",
  wrong_request: "wrong_request_data",
};

export function normalizeError(err: Error): ResponseError {
  const normalizedMessage: string =
    errToMessage[err.message] || "unknown_error";
  const status: number = errToStatus[err.message] || 500;
  return { ...err, message: normalizedMessage, status };
}
