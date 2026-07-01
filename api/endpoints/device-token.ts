import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  DeleteDeviceTokenBody,
  DeleteDeviceTokenResponse,
  RegisterDeviceTokenBody,
  RegisterDeviceTokenResponse,
} from "@/api/types/notification";

export async function postDeviceToken(
  body: RegisterDeviceTokenBody,
): Promise<RegisterDeviceTokenResponse> {
  return api.post(apiPaths.usersDeviceToken, { json: body }).json<RegisterDeviceTokenResponse>();
}

export async function deleteDeviceToken(
  body: DeleteDeviceTokenBody,
): Promise<DeleteDeviceTokenResponse> {
  return api.delete(apiPaths.usersDeviceToken, { json: body }).json<DeleteDeviceTokenResponse>();
}
