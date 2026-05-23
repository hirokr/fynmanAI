import prisma from '#src/config/database.ts';

export async function CreateGoogleUser(profile: any) {
  try {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();
    if (!email) {
      throw new Error('Google profile email is missing');
    }

    const displayName = profile.displayName?.trim() || email.split('@')[0];
    const avatarUrl = profile.photos?.[0]?.value || undefined;
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: existingUser.name || displayName,
            ...(avatarUrl ? { avatarUrl } : {}),
            passwordHash: existingUser.passwordHash?.trim()
              ? existingUser.passwordHash
              : null,
            emailVerified: true,
            isActive: true,
            oauthProvider: 'google',
            oauthId: profile.id,
          },
        })
      : await prisma.user.create({
          data: {
            email,
            name: displayName,
            ...(avatarUrl ? { avatarUrl } : {}),
            passwordHash: null,
            isActive: true,
            emailVerified: true,
            oauthProvider: 'google',
            oauthId: profile.id,
          },
        });

    return user;
  } catch (err) {
    console.error('Error in creating user:', err);
    throw err;
  }
}
