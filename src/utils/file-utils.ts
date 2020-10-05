import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';

export abstract class FileUtils {
    public static getFullPath(shortPath: string): string {
        return path.join(__dirname, shortPath);
    }

    public static createIfNotExists(filePath: string, data: string): void {
        let folder = path.dirname(filePath);
        mkdirp.sync(folder);
        try {
            fs.writeFileSync(filePath, data, { flag: 'wx' });
        } catch (error) {
            // File exists, this is fine
            return;
        }
    }
}
