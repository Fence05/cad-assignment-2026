import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { actorKey, ddb, movieKey, type Role, tableName } from "../shared/db";
import { isResponse, parseJsonObject, response } from "../shared/http";
import { logRequest } from "../shared/request-logger";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logRequest(event);

  const body = parseJsonObject(event);
  if (isResponse(body)) return body;

  const role: Role = {
    movieId: body.movieId as number,
    actorId: body.actorId as number,
    roleName: body.roleName as string,
    roleDescription: body.roleDescription as string,
  };

try {
    // Validate movieId and actorId
    const isMovieIdValid = await isValidId(movieKey, role.movieId);
    const isActorIdValid = await isValidId(actorKey, role.actorId);

    if (!isMovieIdValid || !isActorIdValid) {
      return response(400, { message: "Invalid movieId or actorId" });
    }

    // Add role to DynamoDB
    const params = {
      TransactItems: [
        {
          Put: {
            TableName: tableName,
            Item: {
              PK: `MOVIE#${role.movieId}`,
              SK: `ROLE#${role.actorId}`,
              RoleName: role.roleName,
              RoleDescription: role.roleDescription,
            },
          },
        },
      ],
    };

    await ddb.send(new TransactWriteCommand(params));

    // Return success response
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
