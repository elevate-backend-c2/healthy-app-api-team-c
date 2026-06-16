import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const localMulter = ({

  
    folder = 'public',
}: {
    validation?: string[];
    folder?: string;
    fileSize?: number;
}) => {
    return {
        storage: diskStorage({
            destination: (
                req: Request,
                file: Express.Multer.File,
                cb: (error: Error | null, destination: string) => void,
            ) => {
                const fullPath= resolve(`.uploads/${folder}`);
                if(existsSync(fullPath)) {
                    mkdirSync(fullPath,{recursive: true});
                }
                return cb(null, fullPath);
            },
            filename: (
                req: Request,
                file: Express.Multer.File,
                cb: (error: Error | null, destination: string) => void,
            ) => {
                const uniqueFileName = randomUUID() + ' ' + file.originalname;
                return cb(null, uniqueFileName);
            },
        }),
    };
};
