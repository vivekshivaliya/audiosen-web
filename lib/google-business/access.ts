import { GoogleConnectionStatus } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { refreshGoogleBusinessAccessToken } from "@/lib/google-business/oauth";
import { readGoogleBusinessRefreshToken } from "@/lib/google-business/token-vault";

export async function googleBusinessAccessToken(connectionId: string): Promise<string> {
  const connection = await getPrisma().googleConnection.findUnique({
    where: { id: connectionId },
  });
  if (!connection || connection.status !== GoogleConnectionStatus.ACTIVE) {
    throw new Error("The Google Business connection is not active.");
  }

  try {
    const refreshToken = await readGoogleBusinessRefreshToken(connection.encryptedRefreshToken);
    const token = await refreshGoogleBusinessAccessToken(refreshToken);
    await getPrisma().googleConnection.update({
      where: { id: connection.id },
      data: {
        lastUsedAt: new Date(),
        expiresAt: token.expires_in
          ? new Date(Date.now() + Math.max(token.expires_in - 60, 60) * 1000)
          : null,
      },
    });
    return token.access_token;
  } catch {
    await getPrisma().googleConnection.updateMany({
      where: { id: connection.id, status: GoogleConnectionStatus.ACTIVE },
      data: { status: GoogleConnectionStatus.NEEDS_REAUTH },
    });
    throw new Error("The Google Business connection needs owner reauthorization.");
  }
}
