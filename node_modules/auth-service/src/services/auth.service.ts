import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getSupabaseAdminClient } from '@mekong/shared'
import { EventBus, EventType } from '@mekong/shared'

export class AuthService {
    private supabase = getSupabaseAdminClient()
    private eventBus = new EventBus()

    private normalizePhoneNumber(phone: string): string {
        // Remove spaces, dashes, etc.
        let cleaned = phone.replace(/[^0-9]/g, '');
        // If it starts with 0, replace with +84
        if (cleaned.startsWith('0')) {
            cleaned = '+84' + cleaned.substring(1);
        }
        // Ensure it starts with +
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        return cleaned;
    }

    async sendOtp(phoneNumber: string) {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        // Store OTP in database (temp table)
        const { error } = await this.supabase
            .from('otp_verifications')
            .upsert({
                phone_number: phoneNumber,
                otp_code: otp,
                expires_at: expiresAt.toISOString(),
                verified: false
            })

        if (error) {
            console.error('Supabase Error storing OTP:', JSON.stringify(error, null, 2));
            throw new Error('Failed to store OTP: ' + error.message)
        }

        // TODO: Integrate with SMS gateway (Twilio, Viettel, etc.)
        // For development, log OTP
        console.log(`OTP for ${phoneNumber}: ${otp}`)

        return { success: true }
    }

    async verifyOtp(phoneNumber: string, otp: string) {
        // Verify OTP
        console.log(`Verifying OTP for ${phoneNumber}: ${otp}`);
        const { data: otpRecord, error } = await this.supabase
            .from('otp_verifications')
            .select('*')
            .eq('phone_number', phoneNumber)
            .eq('otp_code', otp)
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .single()

        if (error || !otpRecord) {
            console.error('OTP Verification Query Result:', { error, otpRecord });
            // Check if record exists regardless of expiry or verified status for debugging
            const { data: debugRecord } = await this.supabase
                .from('otp_verifications')
                .select('*')
                .eq('phone_number', phoneNumber)
                .order('created_at', { ascending: false })
                .limit(1)
            console.log('Last OTP record for this phone:', debugRecord);

            throw new Error('Invalid or expired OTP')
        }

        // Mark OTP as verified
        await this.supabase
            .from('otp_verifications')
            .update({ verified: true })
            .eq('id', otpRecord.id)

        // Check if user exists in Supabase Auth
        let user: any;
        let isNewUser = false;

        try {
            // 1. Check if user exists in our user_profiles table first
            const { data: existingProfileData } = await this.supabase
                .from('user_profiles')
                .select('id')
                .eq('phone_number', phoneNumber)
                .single();

            if (existingProfileData) {
                const { data: authData, error: getError } = await this.supabase.auth.admin.getUserById(existingProfileData.id);
                if (getError) throw getError;
                user = authData.user;
                isNewUser = false;
            } else {
                // 2. If not in profile, try to list users to see if they exist in Auth but not profiles
                const { data: { users }, error: listError } = await this.supabase.auth.admin.listUsers();
                if (listError) throw listError;

                const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
                const existingAuthUser = users.find(u => u.phone === phoneNumber || u.phone === normalizedPhone);

                if (existingAuthUser) {
                    user = existingAuthUser;
                    isNewUser = false;
                } else {
                    // 3. Create new user in Supabase Auth
                    const { data: newData, error: createError } = await this.supabase.auth.admin.createUser({
                        phone: normalizedPhone,
                        phone_confirm: true
                    });

                    if (createError) throw createError;
                    user = newData.user;
                    isNewUser = true;
                }
            }

            // Create or update user profile
            const userProfile = await this.ensureUserProfile(user.id, phoneNumber)

            // Generate JWT token
            const token = this.generateToken(user.id, phoneNumber, userProfile?.role || 'farmer')

            // Publish user created event
            await this.eventBus.publish({
                type: EventType.USER_CREATED,
                data: {
                    user_id: user.id,
                    phone_number: phoneNumber,
                    created_at: new Date().toISOString()
                },
                source: 'auth-service'
            })

            return {
                user_id: user.id,
                phone_number: phoneNumber,
                token,
                role: userProfile?.role || 'farmer',
                is_new_user: isNewUser
            }

        } catch (error: any) {
            throw new Error(`Authentication failed: ${error.message}`)
        }
    }

    private async ensureUserProfile(userId: string, phoneNumber: string) {
        let { data: profile } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (!profile) {
            const { data: newProfile } = await this.supabase
                .from('user_profiles')
                .upsert({
                    id: userId,
                    phone_number: phoneNumber,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()
            profile = newProfile
        }
        return profile;
    }

    private generateToken(userId: string, phoneNumber: string, role: string = 'farmer') {
        return jwt.sign(
            {
                sub: userId,
                phone: phoneNumber,
                role: role,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
            },
            process.env.JWT_SECRET!,
            { algorithm: 'HS256' }
        )
    }

    async validateToken(token: string) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
            return decoded
        } catch (error) {
            return null
        }
    }

    async getProfile(userId: string) {
        const { data: profile, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) throw new Error('Profile not found')

        return profile
    }

    async updateProfile(userId: string, updates: any) {
        const { data: profile, error } = await this.supabase
            .from('user_profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) throw new Error('Failed to update profile')

        // Publish update event
        await this.eventBus.publish({
            type: EventType.USER_UPDATED,
            data: {
                user_id: userId,
                updates,
                updated_at: new Date().toISOString()
            },
            source: 'auth-service'
        })

        return profile
    }

    async getAllProfiles() {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
}