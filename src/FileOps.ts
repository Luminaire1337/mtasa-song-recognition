export default abstract class FileOps {
  public static async fileExists(filePath: string): Promise<boolean> {
    try {
      const fileInfo = await Deno.stat(filePath);
      return fileInfo.isFile;
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return false;
      }
      throw err;
    }
  }

  public static async ensureDirectoryExists(folderPath: string): Promise<void> {
    try {
      const folderInfo = await Deno.stat(folderPath);
      if (!folderInfo.isDirectory) {
        throw new Error(`Path exists but is not a directory: ${folderPath}`);
      }
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        await Deno.mkdir(folderPath, { recursive: true });
      } else {
        throw err;
      }
    }
  }
}
