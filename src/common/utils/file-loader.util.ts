import { readFileSync } from 'fs';
import { join } from 'path';
import { AppError } from './error-handler.util';

/**
 * Loads a file from the specified path segments relative to the current working directory
 * @param filePath - Path segments to join together to form the complete file path
 * @returns The contents of the file as a string
 * @throws Error if the file cannot be read or doesn't exist
 */
export const loadFile = (...filePath: string[]): string => {
  try {
    // Construct the absolute file path from the provided segments
    const absoluteFilePath = join(process.cwd(), ...filePath);

    // Read and return the file contents
    const fileContents = readFileSync(absoluteFilePath, 'utf-8');
    return fileContents;
  } catch (error) {
    throw new AppError(
      `Failed to load file at path: ${join(...filePath)}. ${error.message}`,
    );
  }
};
