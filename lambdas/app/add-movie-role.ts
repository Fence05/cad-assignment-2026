import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { actorKey, ddb, movieKey, type Role, tableName } from "../shared/db";
import { isResponse, parseJsonObject, response } from "../shared/http";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

//checks if value is a int, true of false and if its above 0
const isPositiveInteger = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) > 0;

//checks if value is string and not null
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
    //checks if movie exists to write role into
        const movieResult = await ddb.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: movieKey(movieId), SK: movieKey(movieId) },
      })
    );
    if (!movieResult.Item) {
      return response(404, { message: `Movie ${movieId} not found` });
    }

    //checks if actor exists to write role into
    const actorResult = await ddb.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: actorKey(actorId), SK: actorKey(actorId) },
      })
    );
    if (!actorResult.Item) {
      return response(404, { message: `Actor ${actorId} not found` });
    }


    //checks if the role already exists
    const roleResult = await ddb.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: movieKey(movieId), SK: actorKey(actorId) },
      })
    );
    if (roleResult.Item) {
      return response(409, {
        message: `Actor ${actorId} already has a role in movie ${movieId}`,
      });
    }


    
    //puts the role into the database
    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: { PK: movieKey(movieId), SK: actorKey(actorId), ...role },
      })
    );





    return response(201, { message: "Role added", data: role });
  } 
  
  catch (err) {
    console.error("DynamoDB error:", err);
    return response(500, {
      message: "Internal server error",
      error: err,
    });
  }
};

//AUTH UTILS FOR ERROR CODES