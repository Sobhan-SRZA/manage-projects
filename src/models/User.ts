import {
    Schema,
    model,
    Model
} from 'mongoose';
import bcrypt from 'bcrypt';

// 1. Define the raw document interface
export interface IUser {
    name: string;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

// 2. Define methods available on instances (documents)
export interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// 3. Define the User Model type
type UserModel = Model<IUser, {}, IUserMethods>;

// 4. Create the schema with the interface and methods
const userSchema = new Schema<IUser, UserModel, IUserMethods>(
    {
        name: { type: String, required: true, trim: true },
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        password: { type: String, required: true, minlength: 6, select: false },
    },
    { timestamps: true }
);

// 5. Hash password before saving (Mongoose middleware)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
         return next();
        
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } 
    
    catch (err) {
        next(err as Error);
    }
});

// 6. Add instance method for password comparison
userSchema.method('comparePassword', async function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
});

// 7. Create and export the model
export const User = model<IUser, UserModel>('User', userSchema);

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */