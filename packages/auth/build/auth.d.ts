import express, { Router } from 'express';
import { Request } from 'express-jwt';
import { OAuthProviderCallback } from './oauth';
import { JwtPayload } from './JWT';
export type MayHaveUpgradeToken = {
    upgradingToken?: JwtPayload;
};
export type RegisterWithEmailAndPasswordCallback<T = any> = (email: string, password: string, options: T & MayHaveUpgradeToken) => Promise<unknown>;
export type RegisterAnonymouslyCallback<T = any> = (options: T) => Promise<unknown>;
export type FindUserByEmailCallback = (email: string) => Promise<unknown & {
    password: string;
}>;
export type SendEmailConfirmationCallback = (email: string, html: string, confirmLink: string) => Promise<unknown>;
export type EmailConfirmedCallback = (email: string) => Promise<unknown>;
export type ForgotPasswordCallback = (email: string, html: string, resetLink: string) => Promise<boolean | unknown>;
export type ResetPasswordCallback = (email: string, password: string) => Promise<unknown>;
export type ParseTokenCallback = (token: JwtPayload) => Promise<unknown> | unknown;
export type GenerateTokenCallback = (userdata: unknown) => Promise<unknown>;
export type HashPasswordCallback = (password: string) => Promise<string>;
export interface AuthSettings {
    onFindUserByEmail: FindUserByEmailCallback;
    onRegisterWithEmailAndPassword: RegisterWithEmailAndPasswordCallback;
    onRegisterAnonymously: RegisterAnonymouslyCallback;
    onSendEmailConfirmation?: SendEmailConfirmationCallback;
    onEmailConfirmed?: EmailConfirmedCallback;
    onForgotPassword?: ForgotPasswordCallback;
    onResetPassword?: ResetPasswordCallback;
    onOAuthProviderCallback?: OAuthProviderCallback;
    onParseToken?: ParseTokenCallback;
    onGenerateToken?: GenerateTokenCallback;
    onHashPassword?: HashPasswordCallback;
}
export declare const auth: {
    /**
     * OAuth utilities
     */
    oauth: {
        defaults: Request & {
            prefix: never;
        };
        prefix: string;
        providers: { [providerId in import("./oauth").OAuthProviderName]: import("./oauth").OAuthProviderConfig; };
        addProvider: (providerId: import("./oauth").OAuthProviderName, config: import("./oauth").OAuthProviderConfig) => void;
        onCallback: (callback: OAuthProviderCallback) => void;
        routes: (callback?: OAuthProviderCallback) => express.Router;
        transformProfileData(raw: any): any;
    };
    settings: AuthSettings;
    prefix: string;
    middleware: (params?: Partial<Parameters<typeof Request>[0]>) => (req: any, res: any, next: any) => void;
    routes: (settings?: Partial<AuthSettings>) => Router;
};
