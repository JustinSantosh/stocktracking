'use server';

import {getAuth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const auth = await getAuth();
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if(response) {
            await inngest.send({
                name: 'app/user.created',
                data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
            })
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign up failed', e)
        return { success: false, error: 'Could not reach the authentication database. Check MongoDB Atlas Network Access.' }
    }
}

export const sendSignUpEvent = async ({ email, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: Omit<SignUpFormData, 'password'>) => {
    try {
        await inngest.send({
            name: 'app/user.created',
            data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
        })

        return { success: true }
    } catch (e) {
        console.log('Sign up event failed', e)
        return { success: false, error: 'Account created, but the welcome email workflow could not be queued.' }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const auth = await getAuth();
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        return { success: false, error: 'Could not reach the authentication database. Check MongoDB Atlas Network Access.' }
    }
}

export const signOut = async () => {
    try {
        const auth = await getAuth();
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}
