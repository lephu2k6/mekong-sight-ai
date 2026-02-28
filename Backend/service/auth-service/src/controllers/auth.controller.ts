// services/auth-service/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { AuthSchemas } from '@mekong/shared'

const authService = new AuthService()

export class AuthController {
    static async sendOtp(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone_number } = req.body

            const result = await authService.sendOtp(phone_number)

            res.json({
                success: true,
                message: 'OTP sent successfully',
                ...result
            })
        } catch (error) {
            next(error)
        }
    }

    static async verifyOtp(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone_number, otp } = req.body

            const result = await authService.verifyOtp(phone_number, otp)

            res.json({
                success: true,
                message: result.is_new_user ? 'Account created successfully' : 'Login successful',
                data: result
            })
        } catch (error) {
            next(error)
        }
    }

    static async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            // User ID từ auth middleware
            const userId = (req as any).user?.sub

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' })
            }

            const profile = await authService.getProfile(userId)

            res.json({
                success: true,
                data: profile
            })
        } catch (error) {
            next(error)
        }
    }

    static async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.sub

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' })
            }

            const updates = req.body
            const profile = await authService.updateProfile(userId, updates)

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: profile
            })
        } catch (error) {
            next(error)
        }
    }

    static async validateToken(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.headers.authorization?.split(' ')[1]

            if (!token) {
                return res.status(401).json({ error: 'No token provided' })
            }

            const decoded = await authService.validateToken(token)

            if (!decoded) {
                return res.status(401).json({ error: 'Invalid token' })
            }

            res.json({
                success: true,
                data: decoded
            })
        } catch (error) {
            next(error)
        }
    }

    static async listProfiles(req: Request, res: Response, next: NextFunction) {
        try {
            const profiles = await authService.getAllProfiles();
            res.json({
                success: true,
                data: profiles
            });
        } catch (error) {
            next(error);
        }
    }
}