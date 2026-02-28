import Joi from 'joi';
export declare const AuthSchemas: {
    register: Joi.ObjectSchema<any>;
    login: Joi.ObjectSchema<any>;
    updateProfile: Joi.ObjectSchema<any>;
};
export declare const FarmSchemas: {
    create: Joi.ObjectSchema<any>;
    update: Joi.ObjectSchema<any>;
};
export declare const DeviceSchemas: {
    register: Joi.ObjectSchema<any>;
};
