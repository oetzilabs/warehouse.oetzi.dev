import { User } from "@zomoetzidev/core/src/entities/users";
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2, APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { StatusCodes } from "http-status-codes";
import { createSessionBuilder, auth } from "sst/auth";

export const sessions = createSessionBuilder<{
  user: {
    id: string;
    email: string;
  };
}>();

export const getUser = async (token: string) => {
  const session = await sessions.verify(token);
  if (!session) throw new Error("No session found");
  if (session.type !== "user") {
    throw new Error("Invalid session type");
  }
  const { id } = session.properties;
  if (!id) throw new Error("Invalid UserID in session");
  const user = await User.findById(id);
  if (!user) throw new Error("No session found");
  return user;
};

export const json = (input: unknown, statusCode = StatusCodes.OK): APIGatewayProxyResultV2 => {
  return {
    statusCode,
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
  };
};

export const error = <T extends string | Record<string, any>>(
  error: T,
  statusCode = StatusCodes.BAD_REQUEST
): APIGatewayProxyResultV2 => {
  const payload = typeof error === "string" ? { error } : error;
  return {
    statusCode,
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  };
};
export const text = (input: string, statusCode = StatusCodes.OK): APIGatewayProxyResultV2 => {
  return {
    statusCode,
    body: input,
    headers: {
      "Content-Type": "text/plain",
    },
  };
};

export const image = (input: string | Buffer, statusCode = StatusCodes.OK): APIGatewayProxyResultV2 => {
  if (typeof input === "string") {
    // redirect to image url if string
    return {
      statusCode: 302,
      headers: {
        Location: input,
      },
    };
  }

  return {
    statusCode,
    body: input.toString("base64"),
    isBase64Encoded: true,
    headers: {
      "Content-Type": "image/jpeg",
    },
  };
};

export const binary = (input: string | Buffer, statusCode = StatusCodes.OK): APIGatewayProxyResultV2 => {
  if (typeof input === "string") {
    // create buffer from string
    input = Buffer.from(input);

    return {
      statusCode,
      body: input.toString("base64"),
      isBase64Encoded: true,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": input.length,
      },
    };
  }

  return {
    statusCode,
    body: input.toString("base64"),
    isBase64Encoded: true,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": input.length,
    },
  };
};

export const ApiHandler =
  <T extends any = any>(handler: APIGatewayProxyHandlerV2<T>) =>
  async (...args: Parameters<APIGatewayProxyHandlerV2<T>>) =>
    handler(...args);

export const WebSocketApiHandler =
  <T extends any = any>(handler: APIGatewayProxyWebsocketHandlerV2<T>) =>
  async (...args: Parameters<APIGatewayProxyWebsocketHandlerV2<T>>) =>
    handler(...args);

