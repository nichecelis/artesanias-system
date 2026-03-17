interface LoginDto {
    correo: string;
    password: string;
}
interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class AuthService {
    login(dto: LoginDto): Promise<TokenPair & {
        usuario: {
            id: string;
            nombre: string;
            rol: string;
        };
    }>;
    refresh(refreshToken: string): Promise<TokenPair>;
    logout(userId: string, jti: string, accessTokenExp: number): Promise<void>;
    private generarTokens;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=auth.service.d.ts.map