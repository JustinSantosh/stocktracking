import { authClient } from "@/lib/auth-client";

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    const response = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/",
    });

    if (response.error) {
        throw new Error(response.error.message || "Failed to sign in.");
    }

    return { success: true, data: response.data };
};

export const signUpWithEmail = async ({ fullName, email, password }: SignUpFormData) => {
    const response = await authClient.signUp.email({
        name: fullName,
        email,
        password,
        callbackURL: "/",
    });

    if (response.error) {
        throw new Error(response.error.message || "Failed to create account.");
    }

    return { success: true, data: response.data };
};
