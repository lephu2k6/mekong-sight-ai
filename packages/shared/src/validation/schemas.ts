import Joi from 'joi';

export const AuthSchemas = {
    register: Joi.object({
        phone_number: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
        full_name: Joi.string().min(3).max(100).required(),
        role: Joi.string().valid('admin', 'farmer', 'expert').default('farmer')
    }),
    login: Joi.object({
        phone_number: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
        otp: Joi.string().length(6).required()
    }),
    updateProfile: Joi.object({
        full_name: Joi.string().min(3).max(100),
        avatar_url: Joi.string().uri().allow(null, '')
    })
};

export const FarmSchemas = {
    create: Joi.object({
        name: Joi.string().required(),
        location: Joi.object({
            latitude: Joi.number().required(),
            longitude: Joi.number().required()
        }).required(),
        size: Joi.number().positive().required(),
        type: Joi.string().valid('shrimp', 'rice', 'mixed').required()
    }),
    update: Joi.object({
        name: Joi.string(),
        size: Joi.number().positive(),
        status: Joi.string().valid('active', 'inactive')
    })
};

export const DeviceSchemas = {
    register: Joi.object({
        device_id: Joi.string().required(),
        type: Joi.string().valid('lorawan', 'wifi').required(),
        sensors: Joi.array().items(Joi.string()).min(1).required()
    })
};
