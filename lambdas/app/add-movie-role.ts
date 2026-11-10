import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { actorKey, ddb, movieKey, type Role, tableName } from "../shared/db";
import { isResponse, parseJsonObject, response } from "../shared/http";

const isPositiveInteger = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) > 0;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const body = parseJsonObject(event);
  if (isResponse(body)) return body;




const movieId = body.movieId;
const actorId = body.actorId;
const roleName = body.roleName;
const roleDescription = body.roleDescription;

  if (!isPositiveInteger(movieId) || !isPositiveInteger(actorId)) {
    return response(400, {
      message: "movieId and actorId must be positive integers",
    });
  }
  if (!isNonEmptyString(roleName) || !isNonEmptyString(roleDescription)) {
    return response(400, {
      message: "roleName and roleDescription must be non empty strings",
    });
  }
  const role: Role = { movieId, actorId, roleName, roleDescription };

  try {
    //  TOD∏O - Add role if its IDs are valid
    return response(201, { message: "Role added", data: role });
  } catch (err) {
    console.error("DynamoDB error:", err);
    return response(500, {
      message: "Internal server error",
      error: err,
    });
  }
};
